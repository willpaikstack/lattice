import type { LatticeRequest, RequestStatus } from "./request-model";
import { sortRequestsNewestFirst } from "./request-queue";

export type AdminActionTone = "critical" | "warning" | "success" | "neutral";

export type AdminCriticalQuoteRequest = {
  requestId: string;
  title: string;
  buyerCompany: string;
  requesterName: string;
  status: RequestStatus;
  owner: string;
  process: string;
  primaryLineItem: string;
  dueDate: string;
  quoteValueCents: number | null;
  supplierQuotesReceived: number;
  supplierQuotesTotal: number;
  nextStep: string;
  reason: string;
  tone: AdminActionTone;
  href: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminActivitySummary = {
  metrics: {
    activeQuoteRequests: number;
    needsAdminAction: number;
    blockedRequests: number;
    unassignedRequests: number;
    supplierReady: number;
    quotedValueCents: number;
    overdueRequests: number;
    supplierQuotesReceived: number;
    buyerDecisionPending: number;
  };
  statusCounts: Record<RequestStatus, number>;
  criticalRequests: AdminCriticalQuoteRequest[];
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

const quoteRequestStatuses = new Set<RequestStatus>(["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED"]);

function isQuoteRequest(request: LatticeRequest) {
  return quoteRequestStatuses.has(request.status);
}

function receivedSupplierQuotes(request: LatticeRequest) {
  return request.supplierQuotes.filter((quote) => quote.status === "QUOTE_RECEIVED" || quote.status === "SELECTED").length;
}

function getCriticalQuoteRequest(request: LatticeRequest, now: Date): AdminCriticalQuoteRequest | null {
  if (!isQuoteRequest(request)) {
    return null;
  }

  const owner = request.operatorReview.assignedOwner ?? "Unassigned";
  const quoteValueCents = request.quote.estimatedPriceCents;
  const supplierQuotesReceived = receivedSupplierQuotes(request);
  const supplierQuotesTotal = request.supplierQuotes.length;
  const dueDate = parseDateOnly(request.dueDate);
  const overdue = Boolean(dueDate && dueDate.getTime() < startOfToday(now).getTime());
  const primaryLineItem = request.lineItems[0]?.partName ?? "Line item not captured";

  const base = {
    requestId: request.id,
    title: request.title,
    buyerCompany: request.buyerCompany,
    requesterName: request.requesterName,
    status: request.status,
    owner,
    process: request.process,
    primaryLineItem,
    dueDate: request.dueDate,
    quoteValueCents,
    supplierQuotesReceived,
    supplierQuotesTotal,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    href: `/operator/requests/${request.id}`,
  };

  if (request.status === "NEEDS_INFO") {
    return {
      ...base,
      nextStep: "Resolve missing buyer info",
      reason: request.operatorReview.internalNotes || "Quote work is blocked until the customer supplies missing details.",
      tone: "warning",
    };
  }

  if (overdue) {
    return {
      ...base,
      nextStep: "Recover overdue quote request",
      reason: "Customer requested due date has passed before quote completion.",
      tone: "critical",
    };
  }

  if (request.status === "SUBMITTED") {
    return {
      ...base,
      nextStep: owner === "Unassigned" ? "Assign owner and review" : "Complete internal review",
      reason: "New buyer RFQ needs triage, manufacturability review, and supplier-readiness check.",
      tone: owner === "Unassigned" ? "critical" : "neutral",
    };
  }

  if (request.status === "READY_FOR_SUPPLIER_RFQ") {
    return {
      ...base,
      nextStep: "Send supplier RFQ package",
      reason: request.operatorReview.supplierPackageNotes || "Supplier-ready package is waiting on shop outreach.",
      tone: "success",
    };
  }

  return {
    ...base,
    href: `/quotes/${request.id}`,
    nextStep: "Monitor buyer decision",
    reason: request.quote.summary || "Customer quote has been issued and is waiting for buyer response.",
    tone: "neutral",
  };
}

function parseDateOnly(value: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isRequestOverdue(request: LatticeRequest, now: Date) {
  if (!isQuoteRequest(request)) {
    return false;
  }

  const dueDate = parseDateOnly(request.dueDate);
  if (!dueDate) {
    return false;
  }

  return dueDate.getTime() < startOfToday(now).getTime();
}

export function buildAdminActivitySummary(requests: LatticeRequest[], now = new Date()): AdminActivitySummary {
  const sortedRequests = sortRequestsNewestFirst(requests);
  const quoteRequests = sortedRequests.filter(isQuoteRequest);
  const statusCounts = quoteRequests.reduce<Record<RequestStatus, number>>(
    (counts, request) => ({
      ...counts,
      [request.status]: counts[request.status] + 1,
    }),
    { ...initialStatusCounts },
  );
  const criticalRequests = quoteRequests
    .map((request) => getCriticalQuoteRequest(request, now))
    .filter((request): request is AdminCriticalQuoteRequest => request !== null)
    .sort((left, right) => {
      const priority: Record<AdminActionTone, number> = { critical: 0, warning: 1, success: 2, neutral: 3 };
      return priority[left.tone] - priority[right.tone] || new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

  return {
    metrics: {
      activeQuoteRequests: quoteRequests.length,
      needsAdminAction: statusCounts.SUBMITTED + statusCounts.NEEDS_INFO,
      blockedRequests: statusCounts.NEEDS_INFO,
      unassignedRequests: quoteRequests.filter((request) => !request.operatorReview.assignedOwner).length,
      supplierReady: statusCounts.READY_FOR_SUPPLIER_RFQ,
      quotedValueCents: quoteRequests.reduce((sum, request) => sum + (request.quote.estimatedPriceCents ?? 0), 0),
      overdueRequests: quoteRequests.filter((request) => isRequestOverdue(request, now)).length,
      supplierQuotesReceived: quoteRequests.reduce((count, request) => count + receivedSupplierQuotes(request), 0),
      buyerDecisionPending: statusCounts.QUOTED,
    },
    statusCounts,
    criticalRequests: criticalRequests.slice(0, 8),
    recentActivity: quoteRequests.slice(0, 10),
  };
}
