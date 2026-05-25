import { prisma } from "./prisma";
import type { DraftRequestInput, OperatorStatusUpdateInput } from "./request-model";
import { applyOperatorStatusUpdate } from "./request-model";
import { buildSubmittedRequestCreateInput, mapStoredRequest, storedRequestInclude } from "./request-persistence";
import { getOperatorQueueRequests } from "./request-queue";

export async function createSubmittedRequest(input: DraftRequestInput) {
  const stored = await prisma.request.create({
    data: buildSubmittedRequestCreateInput(input),
    include: storedRequestInclude,
  });

  return mapStoredRequest(stored);
}

export async function listOperatorRequests() {
  const storedRequests = await prisma.request.findMany({
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
}

export async function getRequestById(id: string) {
  const stored = await prisma.request.findUnique({
    where: { id },
    include: storedRequestInclude,
  });

  return stored ? mapStoredRequest(stored) : null;
}

export async function listBuyerQuotes() {
  const storedRequests = await prisma.request.findMany({
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
}

export async function updateOperatorRequestStatus(id: string, input: OperatorStatusUpdateInput) {
  const current = await getRequestById(id);

  if (!current) {
    throw new Error("Request not found");
  }

  const updated = applyOperatorStatusUpdate(current, input);

  const stored = await prisma.request.update({
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

  const stored = await prisma.request.update({
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
  const storedRequests = await prisma.request.findMany({
    where: {
      status: "PURCHASED",
    },
    include: storedRequestInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return storedRequests.map(mapStoredRequest);
}
