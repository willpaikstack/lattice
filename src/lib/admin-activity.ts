import type { LatticeRequest, RequestStatus } from "./request-model";
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

export type AdminActivitySummary = {
  metrics: {
    totalRequests: number;
    needsAdminAction: number;
    supplierReady: number;
    ordersInFlight: number;
    quotedValueCents: number;
  };
  statusCounts: Record<RequestStatus, number>;
  nextActions: AdminNextAction[];
  recentActivity: LatticeRequest[];
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

  return null;
}

export function buildAdminActivitySummary(requests: LatticeRequest[]): AdminActivitySummary {
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

  return {
    metrics: {
      totalRequests: sortedRequests.length,
      needsAdminAction: statusCounts.SUBMITTED + statusCounts.NEEDS_INFO,
      supplierReady: statusCounts.READY_FOR_SUPPLIER_RFQ,
      ordersInFlight: statusCounts.PURCHASED,
      quotedValueCents: sortedRequests.reduce((sum, request) => sum + (request.quote.estimatedPriceCents ?? 0), 0),
    },
    statusCounts,
    nextActions,
    recentActivity: sortedRequests.slice(0, 8),
  };
}
