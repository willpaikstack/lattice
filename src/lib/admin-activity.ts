import type { LatticeRequest, RequestStatus, SupplierOrderStatus } from "./request-model";
import { sortRequestsNewestFirst } from "./request-queue";

export type AdminActionTone = "critical" | "warning" | "success" | "neutral";

export type AdminNextAction = {
  requestId: string;
  title: string;
  buyerCompany: string;
  label: string;
  detail: string;
  tone: AdminActionTone;
  href: string;
  updatedAt: string;
};

export type AdminOwnerWorkload = {
  owner: string;
  totalRequests: number;
  needsAction: number;
  quotedValueCents: number;
};

export type AdminSupplierMonitor = {
  requestId: string;
  title: string;
  buyerCompany: string;
  shopName: string;
  status: SupplierOrderStatus;
  documentsCount: number;
  trackingNumber: string;
  updatedAt: string;
  href: string;
};

export type AdminRecentEvent = {
  id: string;
  requestId: string;
  requestTitle: string;
  actor: string;
  from: RequestStatus | null;
  to: RequestStatus;
  at: string;
  href: string;
};

export type AdminActivitySummary = {
  metrics: {
    totalRequests: number;
    needsAdminAction: number;
    supplierReady: number;
    ordersInFlight: number;
    quotedValueCents: number;
    overdueRequests: number;
    unassignedRequests: number;
    averageQuoteCents: number;
    documentsUploaded: number;
  };
  statusCounts: Record<RequestStatus, number>;
  nextActions: AdminNextAction[];
  recentActivity: LatticeRequest[];
  ownerWorkloads: AdminOwnerWorkload[];
  supplierMonitors: AdminSupplierMonitor[];
  recentEvents: AdminRecentEvent[];
};

const initialStatusCounts: Record<RequestStatus, number> = {
  DRAFT: 0,
  SUBMITTED: 0,
  NEEDS_INFO: 0,
  READY_FOR_SUPPLIER_RFQ: 0,
  QUOTED: 0,
  PURCHASED: 0,
};

function getNextAction(request: LatticeRequest): AdminNextAction | null {
  const base = {
    requestId: request.id,
    title: request.title,
    buyerCompany: request.buyerCompany,
    href: `/operator/requests/${request.id}`,
    updatedAt: request.updatedAt,
  };

  if (request.status === "NEEDS_INFO") {
    return {
      ...base,
      label: "Resolve missing buyer info",
      detail: request.operatorReview.internalNotes || "Buyer intake is blocked until missing details are captured.",
      tone: "warning",
    };
  }

  if (request.status === "SUBMITTED") {
    return {
      ...base,
      label: request.operatorReview.assignedOwner ? "Complete internal review" : "Assign owner and review",
      detail: "New buyer RFQ needs triage, owner assignment, and supplier-readiness check.",
      tone: request.operatorReview.assignedOwner ? "neutral" : "critical",
    };
  }

  if (request.status === "READY_FOR_SUPPLIER_RFQ") {
    return {
      ...base,
      label: "Send supplier RFQ package",
      detail: request.operatorReview.supplierPackageNotes || "Supplier-ready request needs manual outreach package sent.",
      tone: "success",
    };
  }

  if (request.status === "QUOTED") {
    return {
      ...base,
      href: `/quotes/${request.id}`,
      label: "Monitor buyer decision",
      detail: request.quote.summary || "Priced quote is waiting for buyer review or purchase conversion.",
      tone: "neutral",
    };
  }

  return null;
}

function parseDateOnly(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isRequestOverdue(request: LatticeRequest, now: Date) {
  if (request.status === "PURCHASED") {
    return false;
  }

  const dueDate = parseDateOnly(request.dueDate);
  if (!dueDate) {
    return false;
  }

  return dueDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function buildOwnerWorkloads(requests: LatticeRequest[]) {
  const workloads = new Map<string, AdminOwnerWorkload>();

  requests.forEach((request) => {
    const owner = request.operatorReview.assignedOwner || "Unassigned";
    const current = workloads.get(owner) ?? {
      owner,
      totalRequests: 0,
      needsAction: 0,
      quotedValueCents: 0,
    };

    current.totalRequests += 1;
    if (request.status === "SUBMITTED" || request.status === "NEEDS_INFO" || request.status === "READY_FOR_SUPPLIER_RFQ") {
      current.needsAction += 1;
    }
    current.quotedValueCents += request.quote.estimatedPriceCents ?? 0;
    workloads.set(owner, current);
  });

  return [...workloads.values()].sort(
    (left, right) => right.needsAction - left.needsAction || right.totalRequests - left.totalRequests || left.owner.localeCompare(right.owner),
  );
}

function buildSupplierMonitors(requests: LatticeRequest[]) {
  return requests
    .filter((request) => request.status === "PURCHASED")
    .map((request) => ({
      requestId: request.id,
      title: request.title,
      buyerCompany: request.buyerCompany,
      shopName: request.supplierOrder.shopName,
      status: request.supplierOrder.status,
      documentsCount: request.supplierOrder.documents.length,
      trackingNumber: request.supplierOrder.trackingNumber,
      updatedAt: request.updatedAt,
      href: `/supplier/orders/${request.id}`,
    }))
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 6);
}

function buildRecentEvents(requests: LatticeRequest[]) {
  return requests
    .flatMap((request) =>
      request.statusEvents.map((event) => ({
        id: event.id,
        requestId: request.id,
        requestTitle: request.title,
        actor: event.actor,
        from: event.from,
        to: event.to,
        at: event.at,
        href: request.status === "PURCHASED" ? `/supplier/orders/${request.id}` : `/operator/requests/${request.id}`,
      })),
    )
    .sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime())
    .slice(0, 8);
}

export function buildAdminActivitySummary(requests: LatticeRequest[], now = new Date()): AdminActivitySummary {
  const sortedRequests = sortRequestsNewestFirst(requests);
  const statusCounts = sortedRequests.reduce<Record<RequestStatus, number>>(
    (counts, request) => ({
      ...counts,
      [request.status]: counts[request.status] + 1,
    }),
    { ...initialStatusCounts },
  );
  const nextActions = sortedRequests
    .map(getNextAction)
    .filter((action): action is AdminNextAction => action !== null)
    .sort((left, right) => {
      const priority: Record<AdminActionTone, number> = { warning: 0, critical: 1, success: 2, neutral: 3 };
      return priority[left.tone] - priority[right.tone] || new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  const quotedRequests = sortedRequests.filter((request) => request.quote.estimatedPriceCents !== null);

  return {
    metrics: {
      totalRequests: sortedRequests.length,
      needsAdminAction: statusCounts.SUBMITTED + statusCounts.NEEDS_INFO,
      supplierReady: statusCounts.READY_FOR_SUPPLIER_RFQ,
      ordersInFlight: statusCounts.PURCHASED,
      quotedValueCents: sortedRequests.reduce((sum, request) => sum + (request.quote.estimatedPriceCents ?? 0), 0),
      overdueRequests: sortedRequests.filter((request) => isRequestOverdue(request, now)).length,
      unassignedRequests: sortedRequests.filter((request) => !request.operatorReview.assignedOwner && request.status !== "DRAFT").length,
      averageQuoteCents: quotedRequests.length
        ? Math.round(quotedRequests.reduce((sum, request) => sum + (request.quote.estimatedPriceCents ?? 0), 0) / quotedRequests.length)
        : 0,
      documentsUploaded: sortedRequests.reduce((count, request) => count + request.files.length + request.supplierOrder.documents.length, 0),
    },
    statusCounts,
    nextActions: nextActions.slice(0, 8),
    recentActivity: sortedRequests.slice(0, 10),
    ownerWorkloads: buildOwnerWorkloads(sortedRequests),
    supplierMonitors: buildSupplierMonitors(sortedRequests),
    recentEvents: buildRecentEvents(sortedRequests),
  };
}
