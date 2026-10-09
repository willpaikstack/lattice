import { queueCustomerLifecycleEmail } from "./customer-lifecycle-email";
import { quoteValidUntil, assertQuoteCanBePurchased } from "./quote-validity";
import { deleteLocalRequest, getLocalRequestById, listLocalRequests, saveLocalRequest } from "./local-request-store";
import { getPrismaClient } from "./prisma";
import { isMockDataMode } from "./data-mode";
import type {
  CustomerQuoteLineItemSnapshot,
  DraftRequestInput,
  LatticeRequest,
  PurchasePaymentMethod,
  RequestStatus,
  SupplierQuoteLineItemSnapshot,
  SupplierOrderUpdateInput,
  UploadedFileInput,
} from "./request-model";
import { applySupplierOrderUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";
import { buildSubmittedRequestCreateInput, mapStoredRequest, storedRequestInclude, type StoredRequest } from "./request-persistence";
import { getOperatorQueueRequests, sortRequestsNewestFirst } from "./request-queue";

export type PurchaseQuoteDeliveryInput = {
  checkoutDetails?: Record<string, string>;
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToCompany?: string;
  shipToName?: string;
  shipToPhone?: string;
  shipToState?: string;
  shipToZipCode?: string;
};

export type RequestShippingAddressInput = {
  shipToAddress1: string;
  shipToAddress2: string;
  shipToCity: string;
  shipToCompany: string;
  shipToName: string;
  shipToState: string;
  shipToZipCode: string;
};

export type PurchaseQuoteInput = PurchaseQuoteDeliveryInput & {
  accountsPayableEmail?: string;
  buyerCheckoutNotes?: string;
  customerPoNumber?: string;
  paymentMethod?: "card" | "purchase-order";
  poAttachment?: UploadedFileInput | null;
  selectedCard?: {
    id?: string;
    brand?: string;
    last4?: string;
    holder?: string;
    expires?: string;
  } | null;
};

export type SelectedSupplierQuoteInput = {
  contactName: string;
  country: string;
  leadTimeDays: number | null;
  lineItems: SupplierQuoteLineItemSnapshot[];
  notes: string;
  priceCents: number | null;
  shopName: string;
};

export type AdminRfqDecisionInput = {
  customerNote: string;
  status: Extract<RequestStatus, "NEEDS_INFO" | "CLOSED">;
};

function isArtificialRequestId(id: string) {
  return id.startsWith("demo_") || id.startsWith("fixture_");
}

function realRequestsOnly<T extends { id: string }>(requests: T[]) {
  return requests.filter((request) => !isArtificialRequestId(request.id));
}

function requestsForDataMode<T extends { id: string }>(requests: T[]) {
  return isMockDataMode() ? requests : realRequestsOnly(requests);
}

async function includeLocalDevelopmentRequests(requests: LatticeRequest[]) {
  if (process.env.NODE_ENV !== "development") {
    return requests;
  }

  const seen = new Set(requests.map((request) => request.id));
  const localOnly = requestsForDataMode(await listLocalRequests()).filter((request) => !seen.has(request.id));

  return sortRequestsNewestFirst([...requests, ...localOnly]);
}

async function prisma() {
  return (await getPrismaClient()) as {
    request: {
      create: (args: unknown) => Promise<StoredRequest>;
      delete: (args: unknown) => Promise<StoredRequest>;
      findFirst: (args: unknown) => Promise<StoredRequest | null>;
      findMany: (args: unknown) => Promise<StoredRequest[]>;
      findUnique: (args: unknown) => Promise<StoredRequest | null>;
      update: (args: unknown) => Promise<StoredRequest>;
    };
    customerQuoteVersion: {
      count: (args: unknown) => Promise<number>;
    };
  };
}

function makeLocalId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function withDemoFallback<T>(operation: () => Promise<T>, fallback: () => T | Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using local request fallback data.", error);
    }
    return fallback();
  }
}

function optionalDate(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function cleanText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function checkoutAmountCents(request: LatticeRequest) {
  const subtotalCents = request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;

  if (subtotalCents === null) {
    throw new Error("This quote does not have a payable amount");
  }

  if (!Number.isInteger(subtotalCents) || subtotalCents < 0 || request.quote.shippingCostCents === null || !Number.isInteger(request.quote.shippingCostCents) || request.quote.shippingCostCents < 0) throw new Error("This quote needs final pricing and shipping before purchasing.");
  return subtotalCents + request.quote.shippingCostCents;
}

function normalizePaymentMethod(value: string | null | undefined): PurchasePaymentMethod {
  if (value === "card") {
    return "CARD";
  }

  if (value === "purchase-order") {
    return "PURCHASE_ORDER";
  }

  throw new Error("Choose a supported payment method");
}

export function quoteCheckoutAmountCents(request: LatticeRequest) {
  return checkoutAmountCents(request);
}

export async function updateRequestShippingAddress(id: string, input: RequestShippingAddressInput) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (!["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ"].includes(current.status)) {
    throw new Error("Shipping details can only be updated while an RFQ is under review");
  }

  const delivery = {
    shipToAddress1: cleanText(input.shipToAddress1),
    shipToAddress2: cleanText(input.shipToAddress2),
    shipToCity: cleanText(input.shipToCity),
    shipToCompany: cleanText(input.shipToCompany),
    shipToName: cleanText(input.shipToName),
    shipToState: cleanText(input.shipToState),
    shipToZipCode: cleanText(input.shipToZipCode),
  };

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id },
      data: delivery,
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma RFQ shipping update is unavailable; saving locally.", error);
      return saveLocalRequest({
        ...current,
        ...delivery,
        updatedAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

export async function createSubmittedRequest(input: DraftRequestInput, options?: { buyerCompanyId?: string }) {
  try {
    const client = await prisma();
    const stored = await client.request.create({
      data: buildSubmittedRequestCreateInput(input, options),
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; saving submitted request locally.", error);
      return saveLocalRequest({ ...submitDraftRequest(buildDraftRequest(input)), buyerCompanyId: options?.buyerCompanyId ?? null });
    }

    throw error;
  }
}

export async function listOperatorRequests() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          status: {
            in: ["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED", "CLOSED"],
          },
          NOT: [{ id: { startsWith: "demo_" } }, { id: { startsWith: "fixture_" } }],
        },
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return getOperatorQueueRequests(await includeLocalDevelopmentRequests(requestsForDataMode(storedRequests).map(mapStoredRequest)));
    },
    async () => getOperatorQueueRequests(sortRequestsNewestFirst(requestsForDataMode(await listLocalRequests()))),
  );
}

export async function listAdminRequests() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return includeLocalDevelopmentRequests(requestsForDataMode(storedRequests).map(mapStoredRequest));
    },
    async () => sortRequestsNewestFirst(requestsForDataMode(await listLocalRequests())),
  );
}

export async function getRequestById(id: string) {
  if (isArtificialRequestId(id) && !isMockDataMode()) {
    return null;
  }

  return withDemoFallback(
    async () => {
      const client = await prisma();
      const stored = await client.request.findUnique({
        where: { id },
        include: storedRequestInclude,
      });

      if (stored) {
        return mapStoredRequest(stored);
      }

      return process.env.NODE_ENV === "development" ? getLocalRequestById(id) : null;
    },
    async () => getLocalRequestById(id),
  );
}

export async function listBuyerQuotes() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          status: {
            in: ["DRAFT", "SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED", "CLOSED"],
          },
          NOT: [{ id: { startsWith: "demo_" } }, { id: { startsWith: "fixture_" } }],
        },
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      const requests = await includeLocalDevelopmentRequests(requestsForDataMode(storedRequests).map(mapStoredRequest));
      return requests.filter((request) => request.status !== "PURCHASED" && !request.isArchived);
    },
    async () =>
      sortRequestsNewestFirst(
        requestsForDataMode(await listLocalRequests()).filter((request) => request.status !== "PURCHASED" && !request.isArchived),
      ),
  );
}

export async function deleteBuyerQuote(id: string) {
  try {
    const client = await prisma();
    await client.request.delete({
      where: { id },
    });

    return true;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma delete is unavailable; deleting local fallback request if present.", error);
      return deleteLocalRequest(id);
    }

    throw error;
  }
}

export async function saveCustomerQuoteForRequest(
  id: string,
  input: {
    quoteNumber: string;
    quoteDate: string;
    validUntil: string;
    customerCompany: string;
    customerContact: string;
    projectName: string;
    preparedBy: string;
    leadTime: string;
    shipping: string;
    tax: string;
    notes: string;
    assumptions: string;
    clarifications: string;
    filesReviewed: string;
    lineItems: CustomerQuoteLineItemSnapshot[];
    estimatedPriceCents: number;
    leadTimeDays: number | null;
    shippingCostCents?: number | null;
    shippingMethod?: string;
    shippingTerms?: string;
    estimatedDeliveryDate?: string;
    markdown: string;
    quoteSummary: string;
    selectedSupplierQuote?: SelectedSupplierQuoteInput | null;
  },
) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status === "DRAFT" || current.status === "PURCHASED" || current.status === "CLOSED") {
    throw new Error("Only active RFQs can receive customer quotes");
  }

  input = { ...input, validUntil: quoteValidUntil(input.quoteDate), notes: current.requiresQualityApproval && !input.notes.includes("Customer Admin quality approval is required before shipment.") ? `${input.notes.trim()}\nCustomer Admin quality approval is required before shipment.`.trim() : input.notes };

  const nextStatus = "QUOTED" as const;

  try {
    const client = await prisma();
    const versionNumber = (await client.customerQuoteVersion.count({ where: { requestId: id } })) + 1;
    const stored = await client.request.update({
      where: { id },
      data: {
        status: nextStatus,
        operatorCompleteness: "COMPLETE",
        estimatedPriceCents: input.estimatedPriceCents,
        leadTimeDays: input.leadTimeDays,
        shippingCostCents: input.shippingCostCents,
        shippingMethod: input.shippingMethod,
        shippingTerms: input.shippingTerms,
        estimatedDeliveryDate: optionalDate(input.estimatedDeliveryDate ?? ""),
        quoteCreatedDate: optionalDate(input.quoteDate),
        quoteValidUntil: optionalDate(input.validUntil),
        quoteSummary: input.quoteSummary.trim(),
        ...(input.selectedSupplierQuote?.shopName || input.selectedSupplierQuote?.lineItems.length
          ? {
              supplierShopName: input.selectedSupplierQuote.shopName.trim() || current.supplierOrder.shopName,
              supplierContactName: input.selectedSupplierQuote.contactName.trim() || current.supplierOrder.contactName,
              supplierQuotes: {
                deleteMany: {
                  isSelected: true,
                },
                create: {
                  shopName: input.selectedSupplierQuote.shopName.trim() || "Selected Chinese machine shop",
                  country: input.selectedSupplierQuote.country.trim() || "China",
                  contactName: input.selectedSupplierQuote.contactName.trim(),
                  status: "SELECTED",
                  priceCents: input.selectedSupplierQuote.priceCents,
                  leadTimeDays: input.selectedSupplierQuote.leadTimeDays,
                  notes: input.selectedSupplierQuote.notes.trim(),
                  lineItems: input.selectedSupplierQuote.lineItems,
                  quotedAt: new Date(),
                  isSelected: true,
                },
              },
            }
          : {}),
        customerQuotes: {
          create: {
            versionNumber,
            quoteNumber: input.quoteNumber.trim(),
            quoteDate: input.quoteDate ? new Date(`${input.quoteDate}T00:00:00.000Z`) : null,
            validUntil: input.validUntil ? new Date(`${input.validUntil}T00:00:00.000Z`) : null,
            customerCompany: input.customerCompany.trim(),
            customerContact: input.customerContact.trim(),
            projectName: input.projectName.trim(),
            preparedBy: input.preparedBy.trim() || "Lattice",
            leadTime: input.leadTime.trim(),
            shipping: input.shipping.trim(),
            tax: input.tax.trim(),
            notes: input.notes.trim(),
            assumptions: input.assumptions.trim(),
            clarifications: input.clarifications.trim(),
            filesReviewed: input.filesReviewed.trim(),
            lineItems: input.lineItems,
            totalCents: input.estimatedPriceCents,
            markdown: input.markdown,
          },
        },
        ...(current.status === nextStatus
          ? {}
          : {
              statusEvents: {
                create: {
                  from: current.status,
                  to: nextStatus,
                  actor: "operator",
                },
              },
            }),
      },
      include: storedRequestInclude,
    });

    const saved = mapStoredRequest(stored);
    if (true) await queueCustomerLifecycleEmail(saved, "QUOTE_ISSUED", saved.customerQuotes.at(-1)?.id ?? saved.updatedAt);
    return saved;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma quote save is unavailable; saving customer quote locally.", error);
      const timestamp = new Date().toISOString();
      const updated = {
        ...current,
        status: nextStatus,
        operatorReview: {
          ...current.operatorReview,
          completeness: "COMPLETE" as const,
        },
        quote: {
          ...current.quote,
          estimatedPriceCents: input.estimatedPriceCents,
          leadTimeDays: input.leadTimeDays,
          shippingCostCents: input.shippingCostCents ?? null,
          shippingMethod: input.shippingMethod ?? "",
          shippingTerms: input.shippingTerms ?? "",
          estimatedDeliveryDate: input.estimatedDeliveryDate ?? "",
          quoteCreatedDate: input.quoteDate,
          quoteValidUntil: input.validUntil,
          summary: input.quoteSummary.trim(),
        },
        ...(input.selectedSupplierQuote?.shopName || input.selectedSupplierQuote?.lineItems.length
          ? {
              supplierOrder: {
                ...current.supplierOrder,
                shopName: input.selectedSupplierQuote.shopName.trim() || current.supplierOrder.shopName,
                contactName: input.selectedSupplierQuote.contactName.trim() || current.supplierOrder.contactName,
              },
              supplierQuotes: [
                ...current.supplierQuotes.filter((quote) => !quote.isSelected),
                {
                  id: makeLocalId("supplier_quote"),
                  shopName: input.selectedSupplierQuote.shopName.trim() || "Selected Chinese machine shop",
                  country: input.selectedSupplierQuote.country.trim() || "China",
                  contactName: input.selectedSupplierQuote.contactName.trim(),
                  status: "SELECTED" as const,
                  priceCents: input.selectedSupplierQuote.priceCents,
                  leadTimeDays: input.selectedSupplierQuote.leadTimeDays,
                  notes: input.selectedSupplierQuote.notes.trim(),
                  lineItems: input.selectedSupplierQuote.lineItems,
                  quotedAt: timestamp,
                  isSelected: true,
                },
              ],
            }
          : {}),
        customerQuotes: [
          ...current.customerQuotes,
          {
            id: `customer_quote_${Date.now()}`,
            versionNumber: current.customerQuotes.length + 1,
            quoteNumber: input.quoteNumber.trim(),
            quoteDate: input.quoteDate,
            validUntil: input.validUntil,
            customerCompany: input.customerCompany.trim(),
            customerContact: input.customerContact.trim(),
            projectName: input.projectName.trim(),
            preparedBy: input.preparedBy.trim() || "Lattice",
            leadTime: input.leadTime.trim(),
            shipping: input.shipping.trim(),
            tax: input.tax.trim(),
            notes: input.notes.trim(),
            assumptions: input.assumptions.trim(),
            clarifications: input.clarifications.trim(),
            filesReviewed: input.filesReviewed.trim(),
            lineItems: input.lineItems,
            totalCents: input.estimatedPriceCents,
            markdown: input.markdown,
            issuedAt: timestamp,
          },
        ],
        statusEvents: current.status === nextStatus
          ? current.statusEvents
          : [
              ...current.statusEvents,
              {
                id: `event_${Date.now()}`,
                from: current.status,
                to: nextStatus,
                actor: "operator" as const,
                at: timestamp,
              },
            ],
        updatedAt: timestamp,
      };

      return saveLocalRequest(updated);
    }

    throw error;
  }
}

export async function updateAdminRfqDecision(id: string, input: AdminRfqDecisionInput) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status === "DRAFT" || current.status === "PURCHASED" || current.status === "CLOSED") {
    throw new Error("Only active RFQs can receive a customer-facing decision");
  }

  const note = cleanText(input.customerNote);

  if (!note) {
    throw new Error("Customer-facing note is required");
  }

  const nextStatus = input.status;
  const operatorCompleteness = nextStatus === "NEEDS_INFO" ? "MISSING_INFO" : "COMPLETE";

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id },
      data: {
        status: nextStatus,
        operatorCompleteness,
        assignedOwner: current.operatorReview.assignedOwner,
        internalNotes: note,
        supplierPackageNotes: current.operatorReview.supplierPackageNotes,
        ...(current.status === nextStatus
          ? {}
          : {
              statusEvents: {
                create: {
                  from: current.status,
                  to: nextStatus,
                  actor: "operator",
                },
              },
            }),
      },
      include: storedRequestInclude,
    });

    const saved = mapStoredRequest(stored);
    if (saved.status === "NEEDS_INFO") await queueCustomerLifecycleEmail(saved, "CLARIFICATION_REQUESTED", saved.updatedAt);
    return saved;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma RFQ decision update is unavailable; saving decision locally.", error);
      const timestamp = new Date().toISOString();

      return saveLocalRequest({
        ...current,
        status: nextStatus,
        operatorReview: {
          ...current.operatorReview,
          completeness: operatorCompleteness,
          internalNotes: note,
        },
        statusEvents: current.status === nextStatus
          ? current.statusEvents
          : [
              ...current.statusEvents,
              {
                id: makeLocalId("event"),
                from: current.status,
                to: nextStatus,
                actor: "operator" as const,
                at: timestamp,
              },
            ],
        updatedAt: timestamp,
      });
    }

    throw error;
  }
}

export async function addSupplierQuoteFile(requestId: string, file: UploadedFileInput) {
  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status === "DRAFT" || current.status === "CLOSED") {
    throw new Error("Supplier quote files can only be attached to active RFQs or orders");
  }

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: requestId },
      data: {
        supplierQuoteFiles: {
          create: {
            name: file.name,
            sizeBytes: file.sizeBytes,
            type: file.type,
            storageKey: file.storageKey,
          },
        },
        statusEvents: {
          create: {
            from: current.status,
            to: current.status,
            actor: "operator",
          },
        },
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma supplier quote file save is unavailable; saving supplier quote file locally.", error);
      const timestamp = new Date().toISOString();
      return saveLocalRequest({
        ...current,
        supplierQuoteFiles: [
          ...(current.supplierQuoteFiles ?? []),
          {
            id: makeLocalId("supplier_quote_file"),
            name: file.name,
            sizeBytes: file.sizeBytes,
            type: file.type,
            storageKey: file.storageKey,
            uploadedAt: timestamp,
          },
        ],
        statusEvents: [
          ...current.statusEvents,
          {
            id: makeLocalId("event"),
            from: current.status,
            to: current.status,
            actor: "operator" as const,
            at: timestamp,
          },
        ],
        updatedAt: timestamp,
      });
    }

    throw error;
  }
}

export async function removeSupplierQuoteFile(requestId: string, fileId: string) {
  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status === "DRAFT" || current.status === "CLOSED") {
    throw new Error("Supplier quote files can only be removed from active RFQs or orders");
  }

  if (!current.supplierQuoteFiles.some((file) => file.id === fileId)) {
    throw new Error("Supplier quote file not found");
  }

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: requestId },
      data: {
        supplierQuoteFiles: {
          deleteMany: {
            id: fileId,
          },
        },
        statusEvents: {
          create: {
            from: current.status,
            to: current.status,
            actor: "operator",
          },
        },
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma supplier quote file removal is unavailable; removing supplier quote file locally.", error);
      const timestamp = new Date().toISOString();
      return saveLocalRequest({
        ...current,
        supplierQuoteFiles: current.supplierQuoteFiles.filter((file) => file.id !== fileId),
        statusEvents: [
          ...current.statusEvents,
          {
            id: makeLocalId("event"),
            from: current.status,
            to: current.status,
            actor: "operator" as const,
            at: timestamp,
          },
        ],
        updatedAt: timestamp,
      });
    }

    throw error;
  }
}

export async function purchaseQuote(id: string, input: PurchaseQuoteInput = {}) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can be converted to orders");
  }

  assertQuoteCanBePurchased(current);
  if (input.paymentMethod === "purchase-order") throw new Error("Purchase-order payment is not available. Purchase your quote by credit card.");

  const delivery = {
    shipToAddress1: cleanText(input.shipToAddress1) || current.shipToAddress1,
    shipToAddress2: input.shipToAddress2 === undefined ? current.shipToAddress2 : cleanText(input.shipToAddress2),
    shipToCity: cleanText(input.shipToCity) || current.shipToCity,
    shipToCompany: cleanText(input.shipToCompany) || current.shipToCompany || current.buyerCompany,
    shipToName: cleanText(input.shipToName) || current.shipToName || current.requesterName,
    shipToPhone: cleanText(input.shipToPhone) || current.shipToPhone || current.requesterPhone,
    shipToState: cleanText(input.shipToState) || current.shipToState,
    shipToZipCode: cleanText(input.shipToZipCode) || current.shipToZipCode,
  };
  const paymentMethod = normalizePaymentMethod(input.paymentMethod);

  if (paymentMethod === "CARD") {
    throw new Error("Card checkout must be completed through Stripe.");
  }

  const customerPoNumber = cleanText(input.customerPoNumber);
  const accountsPayableEmail = cleanText(input.accountsPayableEmail);
  const buyerCheckoutNotes = cleanText(input.buyerCheckoutNotes);
  const cardSnapshot = null;

  if (paymentMethod === "PURCHASE_ORDER") {
    if (!customerPoNumber) {
      throw new Error("PO number is required for purchase order checkout");
    }

    if (!accountsPayableEmail) {
      throw new Error("Accounts payable email is required for purchase order checkout");
    }

    if (!input.poAttachment?.name || !input.poAttachment.sizeBytes) {
      throw new Error("Upload the purchase order file before placing the order");
    }
  }

  const purchasePayment = {
    method: paymentMethod,
    status: "PENDING_REVIEW" as const,
    customerPoNumber: paymentMethod === "PURCHASE_ORDER" ? customerPoNumber : "",
    accountsPayableEmail: paymentMethod === "PURCHASE_ORDER" ? accountsPayableEmail : "",
    buyerCheckoutNotes,
    card: cardSnapshot,
    stripe: {
      amountCents: null,
      checkoutSessionId: "",
      currency: "",
      paidAt: null,
      paymentIntentId: "",
    },
  };

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id },
      data: {
        ...delivery,
        status: "PURCHASED",
        purchasePaymentMethod: purchasePayment.method,
        purchasePaymentStatus: purchasePayment.status,
        customerPoNumber: purchasePayment.customerPoNumber,
        accountsPayableEmail: purchasePayment.accountsPayableEmail,
        buyerCheckoutNotes: purchasePayment.buyerCheckoutNotes,
        purchaseCardId: "",
        purchaseCardBrand: "",
        purchaseCardLast4: "",
        purchaseCardHolder: "",
        purchaseCardExpires: "",
        ...(paymentMethod === "PURCHASE_ORDER" && input.poAttachment
          ? {
              customerPurchaseOrderAttachment: {
                create: {
                  name: input.poAttachment.name,
                  sizeBytes: input.poAttachment.sizeBytes,
                  type: input.poAttachment.type,
                  storageKey: input.poAttachment.storageKey,
                },
              },
            }
          : {}),
        statusEvents: {
          create: {
            from: current.status,
            to: "PURCHASED",
            actor: "buyer",
          },
        },
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma purchase is unavailable; saving purchased request locally.", error);
      const timestamp = new Date().toISOString();
      return saveLocalRequest({
        ...current,
        ...delivery,
        status: "PURCHASED",
        purchasePayment,
        customerPurchaseOrderAttachment: paymentMethod === "PURCHASE_ORDER" && input.poAttachment
          ? {
              id: makeLocalId("customer_po_file"),
              name: input.poAttachment.name,
              sizeBytes: input.poAttachment.sizeBytes,
              type: input.poAttachment.type,
              storageKey: input.poAttachment.storageKey,
              uploadedAt: timestamp,
            }
          : null,
        statusEvents: [
          ...current.statusEvents,
          {
            id: `event_${Date.now()}`,
            from: current.status,
            to: "PURCHASED",
            actor: "buyer" as const,
            at: timestamp,
          },
        ],
        updatedAt: timestamp,
      });
    }

    throw error;
  }
}

async function requireStoredMockStripeRequest(id: string) {
  if (process.env.NODE_ENV !== "development" || !isMockDataMode() || !isArtificialRequestId(id)) return;
  const client = await prisma();
  if (!await client.request.findUnique({ where: { id }, include: storedRequestInclude })) {
    // Synthetic requests live only in the isolated development mock store.
    throw new Error("Mock Stripe checkout uses the local request store.");
  }
}

export async function recordStripeCheckoutSession(
  id: string,
  input: PurchaseQuoteDeliveryInput & {
    amountCents: number;
    checkoutSessionId: string;
    currency: string;
    expectedUpdatedAt?: string;
  },
) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can start card checkout");
  }
  if (input.expectedUpdatedAt && current.updatedAt !== input.expectedUpdatedAt) {
    if (current.purchasePayment.stripe.checkoutSessionId === input.checkoutSessionId) return current;
    throw new Error("This quote changed while checkout was starting. Refresh and try again.");
  }

  const delivery = {
    shipToAddress1: cleanText(input.shipToAddress1) || current.shipToAddress1,
    shipToAddress2: input.shipToAddress2 === undefined ? current.shipToAddress2 : cleanText(input.shipToAddress2),
    shipToCity: cleanText(input.shipToCity) || current.shipToCity,
    shipToCompany: cleanText(input.shipToCompany) || current.shipToCompany || current.buyerCompany,
    shipToName: cleanText(input.shipToName) || current.shipToName || current.requesterName,
    shipToPhone: cleanText(input.shipToPhone) || current.shipToPhone || current.requesterPhone,
    shipToState: cleanText(input.shipToState) || current.shipToState,
    shipToZipCode: cleanText(input.shipToZipCode) || current.shipToZipCode,
  };

  try {
    await requireStoredMockStripeRequest(id);
    const client = await prisma();
    const stored = await client.request.update({
      where: { id, ...(input.expectedUpdatedAt ? { updatedAt: new Date(input.expectedUpdatedAt), status: "QUOTED" } : {}) },
      data: {
        ...delivery,
        purchasePaymentMethod: "CARD",
        purchasePaymentStatus: "PAYMENT_PENDING",
        stripeCheckoutSessionId: input.checkoutSessionId,
        ...(input.checkoutDetails ? { checkoutDetails: input.checkoutDetails, buyerCheckoutNotes: input.checkoutDetails.buyerNotes || "", complianceReviewRequired: input.checkoutDetails.exportControlStatus === "needs-review" } : {}),
        stripeAmountCents: input.amountCents,
        stripeCurrency: input.currency,
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      const latest = await getRequestById(id);
      if (latest?.purchasePayment.stripe.checkoutSessionId === input.checkoutSessionId) return latest;
      throw new Error("This quote changed while checkout was starting. Refresh and try again.");
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma Stripe checkout session save is unavailable; saving locally.", error);
      return saveLocalRequest({
        ...current,
        ...delivery,
        checkoutDetails: input.checkoutDetails ?? current.checkoutDetails,
        complianceReviewRequired: input.checkoutDetails?.exportControlStatus === "needs-review" || current.complianceReviewRequired,
        purchasePayment: {
          method: "CARD",
          status: "PAYMENT_PENDING",
          customerPoNumber: "",
          accountsPayableEmail: "",
          buyerCheckoutNotes: input.checkoutDetails?.buyerNotes || "",
          card: null,
          stripe: {
            amountCents: input.amountCents,
            checkoutSessionId: input.checkoutSessionId,
            currency: input.currency,
            paidAt: null,
            paymentIntentId: "",
          },
        },
        updatedAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

export async function finalizeStripePaidQuote(input: {
  amountCents: number | null;
  taxCents?: number;
  shippingCents?: number;
  card: NonNullable<LatticeRequest["purchasePayment"]["card"]> | null;
  checkoutSessionId: string;
  currency: string;
  paidAt: string;
  paymentIntentId: string;
  requestId: string;
}) {
  const current = await getRequestById(input.requestId);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status === "PURCHASED") {
    if (current.purchasePayment.stripe.checkoutSessionId !== input.checkoutSessionId) throw new Error("Stripe session does not match this order.");
    return current;
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can be finalized from Stripe checkout");
  }

  if (current.purchasePayment.stripe.checkoutSessionId !== input.checkoutSessionId) throw new Error("Stripe session does not match this quote.");
  if (input.currency.toLowerCase() !== "usd") throw new Error("Stripe currency does not match this quote.");
  const taxCents = input.taxCents ?? 0;
  if (!Number.isInteger(taxCents) || taxCents < 0) throw new Error("Invalid Stripe tax amount.");
  if (input.shippingCents !== undefined && input.shippingCents !== current.quote.shippingCostCents) throw new Error("Stripe shipping does not match this quote.");
  const savedQuoteVersion = current.checkoutDetails?.checkoutQuoteVersion;
  if (savedQuoteVersion && savedQuoteVersion !== (current.customerQuotes.at(-1)?.id ?? "")) throw new Error("This quote was revised after checkout started.");
  const expectedAmount = checkoutAmountCents(current) + taxCents;
  const checkoutDetails = { ...current.checkoutDetails, taxCents: String(taxCents) };

  if (input.amountCents !== expectedAmount) {
    throw new Error("Stripe amount does not match accepted quote total");
  }

  const timestamp = input.paidAt || new Date().toISOString();
  const card = input.card;
  const purchasePayment = {
    method: "CARD" as const,
    status: "PAID" as const,
    customerPoNumber: "",
    accountsPayableEmail: "",
    buyerCheckoutNotes: current.purchasePayment.buyerCheckoutNotes,
    card,
    stripe: {
      amountCents: expectedAmount,
      checkoutSessionId: input.checkoutSessionId,
      currency: input.currency,
      paidAt: timestamp,
      paymentIntentId: input.paymentIntentId,
    },
  };

  try {
    await requireStoredMockStripeRequest(input.requestId);
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: input.requestId, status: "QUOTED", stripeCheckoutSessionId: input.checkoutSessionId, updatedAt: new Date(current.updatedAt) },
      data: {
        status: "PURCHASED",
        checkoutDetails,
        purchasePaymentMethod: "CARD",
        purchasePaymentStatus: "PAID",
        purchaseCardId: card?.id ?? "",
        purchaseCardBrand: card?.brand ?? "",
        purchaseCardLast4: card?.last4 ?? "",
        purchaseCardHolder: card?.holder ?? "",
        purchaseCardExpires: card?.expires ?? "",
        stripeCheckoutSessionId: input.checkoutSessionId,
        stripePaymentIntentId: input.paymentIntentId,
        stripeAmountCents: expectedAmount,
        stripeCurrency: input.currency,
        stripePaidAt: new Date(timestamp),
        statusEvents: {
          create: {
            from: current.status,
            to: "PURCHASED",
            actor: "buyer",
          },
        },
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      const latest = await getRequestById(input.requestId);
      if (latest?.status === "PURCHASED" && latest.purchasePayment.stripe.checkoutSessionId === input.checkoutSessionId) return latest;
      throw new Error("This quote changed while payment was finalizing. Contact Lattice support.");
    }
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma Stripe paid checkout finalization is unavailable; saving locally.", error);
      return saveLocalRequest({
        ...current,
        status: "PURCHASED",
        checkoutDetails,
        purchasePayment,
        statusEvents: [
          ...current.statusEvents,
          {
            id: `event_${Date.now()}`,
            from: current.status,
            to: "PURCHASED",
            actor: "buyer" as const,
            at: timestamp,
          },
        ],
        updatedAt: timestamp,
      });
    }

    throw error;
  }
}

/** Refunds adjust the payment ledger, never the accepted order or original invoice. */
export async function recordStripeRefund(input: {
  requestId: string; paymentIntentId: string; checkoutSessionId: string;
  chargeId: string; amountCents: number; refundedAmountCents: number; currency: string;
  pendingRefundAmountCents?: number; failedRefundAmountCents?: number;
}) {
  const current = await getRequestById(input.requestId);
  if (!current || current.status !== "PURCHASED") throw new Error("Refund order is not finalized yet.");
  const payment = current.purchasePayment.stripe;
  if (payment.paymentIntentId !== input.paymentIntentId || payment.checkoutSessionId !== input.checkoutSessionId) {
    throw new Error("Stripe refund does not match this order.");
  }
  if (input.currency.toLowerCase() !== payment.currency.toLowerCase() || input.amountCents !== payment.amountCents ||
      !Number.isInteger(input.refundedAmountCents) || input.refundedAmountCents < 0 || input.refundedAmountCents > input.amountCents) {
    throw new Error("Stripe refund totals do not match this order.");
  }
  const pending = input.pendingRefundAmountCents || 0;
  const failed = input.failedRefundAmountCents || 0;
  if (!Number.isInteger(pending) || pending < 0 || pending + input.refundedAmountCents > input.amountCents ||
      !Number.isInteger(failed) || failed < 0) throw new Error("Stripe refund totals do not match this order.");
  // Current Stripe refund objects may reverse a previously successful refund after failure.
  if (Number(current.checkoutDetails?.refundedAmountCents || 0) === input.refundedAmountCents &&
      Number(current.checkoutDetails?.pendingRefundAmountCents || 0) === pending &&
      Number(current.checkoutDetails?.failedRefundAmountCents || 0) === failed) return current;
  const checkoutDetails = { ...current.checkoutDetails,
    refundedAmountCents: String(input.refundedAmountCents), refundChargeId: input.chargeId,
    pendingRefundAmountCents: String(pending), failedRefundAmountCents: String(failed),
    refundSyncedAt: new Date().toISOString(),
  };
  try {
    await requireStoredMockStripeRequest(input.requestId);
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: input.requestId, status: "PURCHASED", stripePaymentIntentId: input.paymentIntentId, updatedAt: new Date(current.updatedAt) },
      data: { checkoutDetails }, include: storedRequestInclude,
    });
    return mapStoredRequest(stored);
  } catch (error) {
    // Retry a conflicting webhook rather than overwriting a newer order snapshot.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") throw error;
    if (process.env.NODE_ENV === "development") {
      return saveLocalRequest({ ...current, checkoutDetails, updatedAt: new Date().toISOString() });
    }
    throw error;
  }
}

export async function markStripeCheckoutSessionFailed(checkoutSessionId: string) {
  try {
    const client = await prisma();
    const stored = await client.request.findFirst({
      where: { stripeCheckoutSessionId: checkoutSessionId },
      include: storedRequestInclude,
    });

    if (!stored || stored.status === "PURCHASED") {
      return stored ? mapStoredRequest(stored) : null;
    }

    const updated = await client.request.update({
      where: { id: stored.id, status: "QUOTED", stripeCheckoutSessionId: checkoutSessionId },
      data: {
        purchasePaymentStatus: "PAYMENT_FAILED",
      },
      include: storedRequestInclude,
    });
    return mapStoredRequest(updated);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") return null;
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma Stripe failed checkout update is unavailable; saving locally.", error);
      const request = (await listLocalRequests()).find((candidate) => candidate.purchasePayment.stripe.checkoutSessionId === checkoutSessionId) ?? null;

      if (!request || request.status === "PURCHASED") {
        return request;
      }

      return saveLocalRequest({
        ...request,
        purchasePayment: {
          ...request.purchasePayment,
          status: "PAYMENT_FAILED",
        },
        updatedAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

export async function listBuyerOrders() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          status: "PURCHASED",
        },
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return requestsForDataMode(storedRequests).map(mapStoredRequest);
    },
    async () => sortRequestsNewestFirst(requestsForDataMode(await listLocalRequests()).filter((request) => request.status === "PURCHASED")),
  );
}

export async function listAdminOrders() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          isArchived: false,
          status: "PURCHASED",
        },
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return requestsForDataMode(storedRequests).map(mapStoredRequest);
    },
    async () => sortRequestsNewestFirst(requestsForDataMode(await listLocalRequests()).filter((request) => request.status === "PURCHASED" && !request.isArchived)),
  );
}

export async function archiveOrder(requestId: string) {
  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Order not found");
  }

  if (current.status !== "PURCHASED") {
    throw new Error("Only placed orders can be archived");
  }

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: requestId },
      data: {
        isArchived: true,
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma order archive is unavailable; archiving order locally.", error);
      return saveLocalRequest({
        ...current,
        isArchived: true,
        updatedAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

export async function archiveDraftRequest(requestId: string, reason = "") {
  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Draft request not found");
  }

  if (current.status !== "DRAFT") {
    throw new Error("Only draft requests can be archived");
  }

  const note = reason.trim();
  const internalNotes = note
    ? [current.operatorReview.internalNotes.trim(), `Archived draft reason: ${note}`]
        .filter(Boolean)
        .join("\n\n")
    : current.operatorReview.internalNotes;

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: requestId },
      data: {
        internalNotes,
        isArchived: true,
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma draft archive is unavailable; archiving draft locally.", error);
      return saveLocalRequest({
        ...current,
        isArchived: true,
        operatorReview: {
          ...current.operatorReview,
          internalNotes,
        },
        updatedAt: new Date().toISOString(),
      });
    }

    throw error;
  }
}

export async function listSupplierOrders() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          status: "PURCHASED",
        },
        include: storedRequestInclude,
        orderBy: [
          {
            supplierOrderStatus: "asc",
          },
          {
            updatedAt: "desc",
          },
        ],
      });

      return requestsForDataMode(storedRequests).map(mapStoredRequest);
    },
    async () => sortRequestsNewestFirst(requestsForDataMode(await listLocalRequests()).filter((request) => request.status === "PURCHASED")),
  );
}

export async function updateSupplierOrder(requestId: string, input: SupplierOrderUpdateInput) {
  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Order not found");
  }

  if (current.complianceReviewRequired && !current.complianceReviewedAt && ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(input.status)) throw new Error("Lattice compliance review is required before shipment.");
  if (current.requiresQualityApproval && !current.qualityApprovedAt && ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(input.status)) throw new Error("Customer Admin quality approval is required before shipment.");
  if (input.documents?.length && current.requiresQualityApproval && ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(input.status)) throw new Error("Upload the revised quality documents before requesting a new Customer Admin approval.");

  const updated = applySupplierOrderUpdate(current, input);
  const newUpdate = updated.supplierOrder.updates.at(-1);

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: requestId, ...((current.requiresQualityApproval || current.complianceReviewRequired) && ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(input.status) ? { updatedAt: new Date(current.updatedAt) } : {}) },
      data: {
        supplierOrderStatus: updated.supplierOrder.status,
        ...(input.documents?.length ? { qualityApprovedAt: null, qualityApprovedBy: null } : {}),
        supplierShopName: updated.supplierOrder.shopName,
        supplierContactName: updated.supplierOrder.contactName,
        supplierNotes: updated.supplierOrder.notes,
        supplierTrackingNumber: updated.supplierOrder.trackingNumber,
        orderNextMilestone: updated.supplierOrder.nextMilestone,
        orderNextMilestoneDate: optionalDate(updated.supplierOrder.nextMilestoneDate),
        orderResponsibleParty: updated.supplierOrder.responsibleParty,
        assignedOwner: updated.operatorReview.assignedOwner,
        supplierDocuments: input.documents?.length
          ? {
              create: input.documents.map((document) => ({
                name: document.name,
                sizeBytes: document.sizeBytes,
                type: document.type,
                category: document.category,
              })),
            }
          : undefined,
        supplierUpdates: newUpdate
          ? {
              create: {
                status: newUpdate.status,
                note: newUpdate.note,
                trackingNumber: newUpdate.trackingNumber,
                actor: newUpdate.actor,
              },
            }
          : undefined,
        statusEvents: {
          create: {
            from: current.status,
            to: current.status,
            actor: input.actor ?? "supplier",
          },
        },
      },
      include: storedRequestInclude,
    });

    const saved = mapStoredRequest(stored);
    if (saved.supplierOrder.status === "SHIPPED" && current.supplierOrder.status !== "SHIPPED") await queueCustomerLifecycleEmail(saved, "SHIPPED", saved.supplierOrder.updates.at(-1)?.id ?? saved.updatedAt);
    return saved;
  } catch (error) {
    if ((current.requiresQualityApproval || current.complianceReviewRequired) && ["READY_TO_SHIP", "SHIPPED", "DELIVERED"].includes(input.status)) throw error;
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma order progress update is unavailable; saving locally.", error);
      return saveLocalRequest(updated);
    }

    throw error;
  }
}
