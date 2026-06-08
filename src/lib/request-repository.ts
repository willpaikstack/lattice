import { deleteLocalRequest, getLocalRequestById, listLocalRequests, saveLocalRequest } from "./local-request-store";
import { getPrismaClient } from "./prisma";
import type { CustomerQuoteLineItemSnapshot, DraftRequestInput, OperatorStatusUpdateInput, SupplierOrderUpdateInput, UploadedFileInput } from "./request-model";
import { applyOperatorStatusUpdate, applySupplierOrderUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";
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

function isArtificialRequestId(id: string) {
  return id.startsWith("demo_") || id.startsWith("fixture_");
}

function realRequestsOnly<T extends { id: string }>(requests: T[]) {
  return requests.filter((request) => !isArtificialRequestId(request.id));
}

async function prisma() {
  return (await getPrismaClient()) as {
    request: {
      create: (args: unknown) => Promise<StoredRequest>;
      delete: (args: unknown) => Promise<StoredRequest>;
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

      return getOperatorQueueRequests(realRequestsOnly(storedRequests).map(mapStoredRequest));
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

      return realRequestsOnly(storedRequests).map(mapStoredRequest);
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

      return stored ? mapStoredRequest(stored) : null;
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

      return realRequestsOnly(storedRequests).map(mapStoredRequest);
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

export async function updateOperatorRequestStatus(id: string, input: OperatorStatusUpdateInput) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  const updated = applyOperatorStatusUpdate(current, input);
  let client: Awaited<ReturnType<typeof prisma>>;

  try {
    client = await prisma();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; saving operator request update locally.", error);
      return saveLocalRequest(updated);
    }

    throw error;
  }

  try {
    const stored = await client.request.update({
      where: { id },
      data: {
        status: updated.status,
        operatorCompleteness: updated.operatorReview.completeness,
        assignedOwner: updated.operatorReview.assignedOwner,
        internalNotes: updated.operatorReview.internalNotes,
        supplierPackageNotes: updated.operatorReview.supplierPackageNotes,
        estimatedPriceCents: updated.quote.estimatedPriceCents,
        leadTimeDays: updated.quote.leadTimeDays,
        shippingCostCents: updated.quote.shippingCostCents,
        shippingMethod: updated.quote.shippingMethod,
        shippingTerms: updated.quote.shippingTerms,
        estimatedDeliveryDate: optionalDate(updated.quote.estimatedDeliveryDate),
        quoteCreatedDate: optionalDate(updated.quote.quoteCreatedDate),
        quoteValidUntil: optionalDate(updated.quote.quoteValidUntil),
        quoteSummary: updated.quote.summary,
        ...(current.status === updated.status
          ? {}
          : {
              statusEvents: {
                create: {
                  from: current.status,
                  to: updated.status,
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
      console.warn("Prisma update is unavailable; saving operator request update locally.", error);
      return saveLocalRequest(updated);
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
  },
) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status === "DRAFT" || current.status === "PURCHASED" || current.status === "CLOSED") {
    throw new Error("Only active RFQs can receive customer quotes");
  }

  if (current.status === "QUOTED" && current.customerQuotes.length > 0) {
    throw new Error("Customer-submitted quotes are immutable");
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

export async function purchaseQuote(id: string, deliveryInput: PurchaseQuoteDeliveryInput = {}) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can be converted to orders");
  }

  const delivery = {
    shipToAddress1: cleanText(deliveryInput.shipToAddress1) || current.shipToAddress1,
    shipToAddress2: deliveryInput.shipToAddress2 === undefined ? current.shipToAddress2 : cleanText(deliveryInput.shipToAddress2),
    shipToCity: cleanText(deliveryInput.shipToCity) || current.shipToCity,
    shipToCompany: cleanText(deliveryInput.shipToCompany) || current.shipToCompany || current.buyerCompany,
    shipToName: cleanText(deliveryInput.shipToName) || current.shipToName || current.requesterName,
    shipToPhone: cleanText(deliveryInput.shipToPhone) || current.shipToPhone || current.requesterPhone,
    shipToState: cleanText(deliveryInput.shipToState) || current.shipToState,
    shipToZipCode: cleanText(deliveryInput.shipToZipCode) || current.shipToZipCode,
  };

  try {
    const client = await prisma();
    const stored = await client.request.update({
      where: { id },
      data: {
        ...delivery,
        status: "PURCHASED",
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
  const client = await prisma();

  const stored = await client.request.update({
    where: { id: requestId },
    data: {
      supplierOrderStatus: updated.supplierOrder.status,
      supplierShopName: updated.supplierOrder.shopName,
      supplierContactName: updated.supplierOrder.contactName,
      supplierNotes: updated.supplierOrder.notes,
      supplierTrackingNumber: updated.supplierOrder.trackingNumber,
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
            },
          }
        : undefined,
      statusEvents: {
        create: {
          from: current.status,
          to: current.status,
          actor: "supplier",
        },
      },
    },
    include: storedRequestInclude,
  });

  return mapStoredRequest(stored);
}
