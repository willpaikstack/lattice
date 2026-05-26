import { getDemoRequests } from "./demo-requests";
import { getPrismaClient } from "./prisma";
import type { DraftRequestInput, OperatorStatusUpdateInput, SupplierOrderUpdateInput } from "./request-model";
import { applyOperatorStatusUpdate, applySupplierOrderUpdate } from "./request-model";
import { buildSubmittedRequestCreateInput, mapStoredRequest, storedRequestInclude, type StoredRequest } from "./request-persistence";
import { getOperatorQueueRequests, sortRequestsNewestFirst } from "./request-queue";

async function prisma() {
  return (await getPrismaClient()) as {
    request: {
      create: (args: unknown) => Promise<StoredRequest>;
      findMany: (args: unknown) => Promise<StoredRequest[]>;
      findUnique: (args: unknown) => Promise<StoredRequest | null>;
      update: (args: unknown) => Promise<StoredRequest>;
    };
  };
}

async function withDemoFallback<T>(operation: () => Promise<T>, fallback: () => T) {
  try {
    return await operation();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using demo request data.", error);
    }
    return fallback();
  }
}

export async function createSubmittedRequest(input: DraftRequestInput) {
  const client = await prisma();
  const stored = await client.request.create({
    data: buildSubmittedRequestCreateInput(input),
    include: storedRequestInclude,
  });

  return mapStoredRequest(stored);
}

export async function listOperatorRequests() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          status: {
            in: ["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED"],
          },
        },
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return getOperatorQueueRequests(storedRequests.map(mapStoredRequest));
    },
    () => getOperatorQueueRequests(getDemoRequests()),
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

      return storedRequests.map(mapStoredRequest);
    },
    () => sortRequestsNewestFirst(getDemoRequests()),
  );
}

export async function getRequestById(id: string) {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const stored = await client.request.findUnique({
        where: { id },
        include: storedRequestInclude,
      });

      return stored ? mapStoredRequest(stored) : null;
    },
    () => getDemoRequests().find((request) => request.id === id) ?? null,
  );
}

export async function listBuyerQuotes() {
  return withDemoFallback(
    async () => {
      const client = await prisma();
      const storedRequests = await client.request.findMany({
        where: {
          status: {
            in: ["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED", "PURCHASED"],
          },
        },
        include: storedRequestInclude,
        orderBy: {
          updatedAt: "desc",
        },
      });

      return storedRequests.map(mapStoredRequest);
    },
    () => sortRequestsNewestFirst(getDemoRequests().filter((request) => request.status !== "DRAFT")),
  );
}

export async function updateOperatorRequestStatus(id: string, input: OperatorStatusUpdateInput) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  const updated = applyOperatorStatusUpdate(current, input);
  const client = await prisma();

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
}

export async function purchaseQuote(id: string) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  if (current.status !== "QUOTED") {
    throw new Error("Only priced quotes can be converted to orders");
  }

  const client = await prisma();
  const stored = await client.request.update({
    where: { id },
    data: {
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

      return storedRequests.map(mapStoredRequest);
    },
    () => sortRequestsNewestFirst(getDemoRequests().filter((request) => request.status === "PURCHASED")),
  );
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

      return storedRequests.map(mapStoredRequest);
    },
    () => sortRequestsNewestFirst(getDemoRequests().filter((request) => request.status === "PURCHASED")),
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
