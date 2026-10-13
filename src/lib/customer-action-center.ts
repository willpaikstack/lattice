import type { LatticeRequest } from "./request-model";
import { isOrderMilestoneLate, orderNextStep } from "./order-progress";

export type CustomerActionWorkflowType =
  | "customer_requirement"
  | "order_delay"
  | "order_milestone"
  | "quote_expiring"
  | "quote_review"
  | "supplier_question";

export type CustomerActionStep = {
  id: string;
  label: string;
  state: "complete" | "current" | "upcoming";
};

export type CustomerActionWorkflow = {
  completedSteps: number;
  ctaLabel: string;
  detail: string;
  dueLabel: string;
  href: string;
  id: string;
  occurredAt: string;
  owner: string;
  priority: "critical" | "high" | "normal";
  reference: string;
  steps: CustomerActionStep[];
  title: string;
  type: CustomerActionWorkflowType;
};

const priorityRank: Record<CustomerActionWorkflow["priority"], number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

function parseDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calendarDaysBetween(value: string, now: Date) {
  const date = parseDateOnly(value);

  if (!date) {
    return null;
  }

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((date.getTime() - today) / 86_400_000);
}

function relativeDateLabel(value: string, now: Date, futureVerb: string) {
  const days = calendarDaysBetween(value, now);

  if (days === null) {
    return "Date to confirm";
  }

  if (days === 0) {
    return `${futureVerb} today`;
  }

  if (days > 0) {
    return `${futureVerb} in ${days} ${days === 1 ? "day" : "days"}`;
  }

  const overdueDays = Math.abs(days);
  return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
}

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").toUpperCase()}`;
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function buildSupplierQuestionWorkflow(request: LatticeRequest): CustomerActionWorkflow | null {
  if (request.status !== "NEEDS_INFO") {
    return null;
  }

  return {
    completedSteps: 1,
    ctaLabel: "Reply to Lattice",
    detail: request.operatorReview.internalNotes || "Lattice needs additional information before supplier pricing can continue.",
    dueLabel: "Customer response needed",
    href: `/quotes/${request.id}#clarification`,
    id: `supplier-question:${request.id}`,
    occurredAt: request.updatedAt,
    owner: "Customer",
    priority: "high",
    reference: quoteReference(request),
    steps: [
      { id: "submitted", label: "RFQ submitted", state: "complete" },
      { id: "review", label: "Review Lattice's question", state: "current" },
      { id: "respond", label: "Provide the requested information", state: "upcoming" },
    ],
    title: "Supplier clarification required",
    type: "supplier_question",
  };
}

function buildQuoteWorkflow(request: LatticeRequest, now: Date, renewalRequested: boolean): CustomerActionWorkflow | null {
  if (request.status !== "QUOTED") {
    return null;
  }

  const quote = request.customerQuotes.at(-1);
  const validUntil = quote?.validUntil || request.quote.quoteValidUntil;
  const daysRemaining = validUntil ? calendarDaysBetween(validUntil, now) : null;
  const isExpiring = daysRemaining !== null && daysRemaining <= 7;
  const isExpired = !validUntil || (daysRemaining !== null && daysRemaining < 0);
  const isUrgent = daysRemaining !== null && daysRemaining <= 2;
  const awaitingRenewal = isExpired && renewalRequested;

  return {
    completedSteps: 1,
    ctaLabel: awaitingRenewal ? "View renewal status" : isExpired ? "Request renewed quote" : "Review and accept quote",
    detail: awaitingRenewal ? "Your request is saved. Lattice is reviewing current pricing and lead time; review the new quote once it is issued." : isExpired
      ? "Request updated pricing and lead time. Lattice must issue a renewed quote before you can purchase."
      : "Review pricing, lead time, assumptions, and checkout options before making a purchasing decision.",
    dueLabel: awaitingRenewal ? "Waiting for Lattice" : validUntil ? relativeDateLabel(validUntil, now, "Expires") : "Validity needs confirmation",
    href: `/quotes/${request.id}${isExpired ? "#quote-renewal" : ""}`,
    id: `${isExpiring ? "quote-expiring" : "quote-review"}:${request.id}`,
    occurredAt: quote?.issuedAt ?? request.updatedAt,
    owner: awaitingRenewal ? "Lattice" : "Customer",
    priority: awaitingRenewal ? "normal" : isExpired ? "critical" : isUrgent ? "high" : "normal",
    reference: quoteReference(request),
    steps: [
      { id: "received", label: "Supplier pricing received", state: "complete" },
      { id: "review", label: isExpired ? "Request renewed pricing and lead time" : "Review price, timing, and assumptions", state: "current" },
      {
        id: "decision",
        label: isExpired ? "Lattice reissues the quote; review and accept it" : "Accept the quote or request support",
        state: "upcoming",
      },
    ],
    title: awaitingRenewal ? "Quote renewal requested" : isExpired ? "Quote needs renewal" : isExpiring ? "Quote expires soon" : "Quote ready for review",
    type: isExpiring ? "quote_expiring" : "quote_review",
  };
}

function buildOrderDelayWorkflow(order: LatticeRequest, now: Date): CustomerActionWorkflow | null {
  if (order.status !== "PURCHASED" || !isOrderMilestoneLate(order, now)) {
    return null;
  }

  const milestoneDate = order.supplierOrder.nextMilestoneDate || order.quote.estimatedDeliveryDate;
  const overdueDays = milestoneDate ? calendarDaysBetween(milestoneDate, now) : null;

  return {
    completedSteps: 0,
    ctaLabel: "Review delay",
    detail: `${orderNextStep(order)} is past its expected date. Lattice owns the schedule update; review order activity or use Order help to request an update.`,
    dueLabel: milestoneDate ? relativeDateLabel(milestoneDate, now, "Due") : "Milestone overdue",
    href: `/orders/${order.id}#order-activity`,
    id: `order-delay:${order.id}:${milestoneDate}`,
    occurredAt: order.updatedAt,
    owner: order.supplierOrder.responsibleParty || "Lattice",
    priority: overdueDays !== null && overdueDays < -3 ? "critical" : "high",
    reference: orderReference(order),
    steps: [
      { id: "review", label: "Review the delayed milestone", state: "current" },
      { id: "update", label: "Check Lattice's latest update", state: "upcoming" },
      { id: "track", label: "Track the revised milestone", state: "upcoming" },
    ],
    title: "Order milestone overdue",
    type: "order_delay",
  };
}

function buildOrderMilestoneWorkflow(order: LatticeRequest): CustomerActionWorkflow | null {
  if (
    order.status !== "PURCHASED" ||
    order.supplierOrder.status === "DELIVERED" ||
    order.supplierOrder.nextMilestoneDate ||
    order.quote.estimatedDeliveryDate
  ) {
    return null;
  }

  return {
    completedSteps: 1,
    ctaLabel: "View order",
    detail: "Lattice is confirming the next supplier milestone and date. No action is needed from you right now.",
    dueLabel: "Schedule confirmation pending",
    href: `/orders/${order.id}`,
    id: `order-milestone:${order.id}`,
    occurredAt: order.updatedAt,
    owner: "Lattice",
    priority: "normal",
    reference: orderReference(order),
    steps: [
      { id: "placed", label: "Order placed", state: "complete" },
      { id: "confirm", label: "Lattice confirms schedule", state: "current" },
      { id: "track", label: "Production tracking begins", state: "upcoming" },
    ],
    title: "Next milestone being confirmed",
    type: "order_milestone",
  };
}

function buildCustomerRequirementWorkflow(order: LatticeRequest): CustomerActionWorkflow | null {
  const documents = order.supplierOrder.documents.filter((document) => document.category !== "PHOTO");

  if (order.status !== "PURCHASED" || !order.requiresQualityApproval || order.qualityApprovedAt || documents.length === 0) {
    return null;
  }

  const latestDocument = [...documents].sort((left, right) => Number(new Date(right.uploadedAt)) - Number(new Date(left.uploadedAt)))[0];

  return {
    completedSteps: 1,
    ctaLabel: "Review documents",
    detail: `Review ${documents.length} ${documents.length === 1 ? "document" : "documents"}. Your company’s Customer Admin must approve the current package to clear the shipment hold.`,
    dueLabel: "Review requested",
    href: `/orders/${order.id}#quality-documents`,
    id: `customer-requirement:${order.id}:documents`,
    occurredAt: latestDocument?.uploadedAt ?? order.updatedAt,
    owner: "Customer",
    priority: "normal",
    reference: orderReference(order),
    steps: [
      { id: "uploaded", label: "Production documents uploaded", state: "complete" },
      { id: "review", label: "Review the available files", state: "current" },
      { id: "retain", label: "Customer Admin approves the current document package", state: "upcoming" },
    ],
    title: "Order documents need review",
    type: "customer_requirement",
  };
}

export function buildCustomerActionWorkflows({
  now = new Date(),
  orders = [],
  quotes = [],
  pendingRenewalIds = new Set<string>(),
}: {
  now?: Date;
  orders?: LatticeRequest[];
  quotes?: LatticeRequest[];
  pendingRenewalIds?: ReadonlySet<string>;
}): CustomerActionWorkflow[] {
  const quoteWorkflows = quotes.flatMap((request) => {
    const workflows = [buildSupplierQuestionWorkflow(request), buildQuoteWorkflow(request, now, pendingRenewalIds.has(request.id))];
    return workflows.filter((workflow): workflow is CustomerActionWorkflow => workflow !== null);
  });
  const orderWorkflows = orders.flatMap((order) => {
    const workflows = [buildOrderDelayWorkflow(order, now), buildOrderMilestoneWorkflow(order), buildCustomerRequirementWorkflow(order)];
    return workflows.filter((workflow): workflow is CustomerActionWorkflow => workflow !== null);
  });

  return [...quoteWorkflows, ...orderWorkflows].sort((left, right) => {
    const byPriority = priorityRank[left.priority] - priorityRank[right.priority];
    return byPriority || Number(new Date(right.occurredAt)) - Number(new Date(left.occurredAt)) || left.id.localeCompare(right.id);
  });
}
