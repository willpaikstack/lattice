import { deleteLocalRequest, getLocalRequestById, listLocalRequests, saveLocalRequest } from "./local-request-store";
import { getPrismaClient } from "./prisma";
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
  shipToAddress1?: string;
  shipToAddress2?: string;
  shipToCity?: string;
  shipToCompany?: string;
  shipToName?: string;
  shipToPhone?: string;
  shipToState?: string;
  shipToZipCode?: string;
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

async function includeLocalDevelopmentRequests(requests: LatticeRequest[]) {
  if (process.env.NODE_ENV !== "development") {
    return requests;
  }

  const seen = new Set(requests.map((request) => request.id));
  const localOnly = realRequestsOnly(await listLocalRequests()).filter((request) => !seen.has(request.id));

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

  return subtotalCents + (request.quote.shippingCostCents ?? 0);
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

export async function createSubmittedRequest(input: DraftRequestInput) {
  try {
    const client = await prisma();
    const stored = await client.request.create({
      data: buildSubmittedRequestCreateInput(input),
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; saving submitted request locally.", error);
      return saveLocalRequest(submitDraftRequest(buildDraftRequest(input)));
    }

    throw error;
  }
}

export async function updateGuestQuoteAccess(
  id: string,
  input: {
    expiresAt: string;
    tokenHash: string;
  },
) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.requestOrigin !== "GUEST_SIMPLE_QUOTE") {
    return current;
  }

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id },
      data: {
        guestAccessTokenExpiresAt: new Date(input.expiresAt),
        guestAccessTokenHash: input.tokenHash,
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma guest quote access update is unavailable; saving locally.", error);
      return saveLocalRequest({
        ...current,
        guestAccessTokenExpiresAt: input.expiresAt,
        guestAccessTokenHash: input.tokenHash,
        updatedAt: new Date().toISOString(),
      });
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

      return getOperatorQueueRequests(await includeLocalDevelopmentRequests(realRequestsOnly(storedRequests).map(mapStoredRequest)));
    },
    async () => getOperatorQueueRequests(sortRequestsNewestFirst(await listLocalRequests())),
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

      return includeLocalDevelopmentRequests(realRequestsOnly(storedRequests).map(mapStoredRequest));
    },
    async () => sortRequestsNewestFirst(await listLocalRequests()),
  );
}

export async function getRequestById(id: string) {
  if (isArtificialRequestId(id)) {
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

      const requests = await includeLocalDevelopmentRequests(realRequestsOnly(storedRequests).map(mapStoredRequest));
      return requests.filter((request) => request.status !== "PURCHASED");
    },
    async () =>
      sortRequestsNewestFirst(
        (await listLocalRequests()).filter((request) => request.status !== "PURCHASED"),
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

    return mapStoredRequest(stored);
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

    return mapStoredRequest(stored);
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

export async function recordStripeCheckoutSession(
  id: string,
  input: PurchaseQuoteDeliveryInput & {
    amountCents: number;
    checkoutSessionId: string;
    currency: string;
  },
) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can start card checkout");
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
    const client = await prisma();
    const stored = await client.request.update({
      where: { id },
      data: {
        ...delivery,
        purchasePaymentMethod: "CARD",
        purchasePaymentStatus: "PAYMENT_PENDING",
        stripeCheckoutSessionId: input.checkoutSessionId,
        stripeAmountCents: input.amountCents,
        stripeCurrency: input.currency,
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma Stripe checkout session save is unavailable; saving locally.", error);
      return saveLocalRequest({
        ...current,
        ...delivery,
        purchasePayment: {
          method: "CARD",
          status: "PAYMENT_PENDING",
          customerPoNumber: "",
          accountsPayableEmail: "",
          buyerCheckoutNotes: "",
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
    return current;
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can be finalized from Stripe checkout");
  }

  const expectedAmount = current.purchasePayment.stripe.amountCents ?? checkoutAmountCents(current);

  if (input.amountCents !== null && input.amountCents !== expectedAmount) {
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
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: input.requestId },
      data: {
        status: "PURCHASED",
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
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma Stripe paid checkout finalization is unavailable; saving locally.", error);
      return saveLocalRequest({
        ...current,
        status: "PURCHASED",
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
      where: { id: stored.id },
      data: {
        purchasePaymentStatus: "PAYMENT_FAILED",
      },
      include: storedRequestInclude,
    });

    return mapStoredRequest(updated);
  } catch (error) {
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

      return realRequestsOnly(storedRequests).map(mapStoredRequest);
    },
    async () => sortRequestsNewestFirst((await listLocalRequests()).filter((request) => request.status === "PURCHASED")),
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

      return realRequestsOnly(storedRequests).map(mapStoredRequest);
    },
    async () => sortRequestsNewestFirst((await listLocalRequests()).filter((request) => request.status === "PURCHASED" && !request.isArchived)),
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

      return realRequestsOnly(storedRequests).map(mapStoredRequest);
    },
    async () => sortRequestsNewestFirst((await listLocalRequests()).filter((request) => request.status === "PURCHASED")),
  );
}

export async function updateSupplierOrder(requestId: string, input: SupplierOrderUpdateInput) {
  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Order not found");
  }

  const updated = applySupplierOrderUpdate(current, input);
  const newUpdate = updated.supplierOrder.updates.at(-1);

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id: requestId },
      data: {
        supplierOrderStatus: updated.supplierOrder.status,
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

    return mapStoredRequest(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma order progress update is unavailable; saving locally.", error);
      return saveLocalRequest(updated);
    }

    throw error;
  }
}
