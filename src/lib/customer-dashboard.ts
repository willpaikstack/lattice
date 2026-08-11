import { buyerLifecycleTag, type BuyerLifecycleTag } from "./buyer-lifecycle";
import { buildCustomerActionWorkflows, type CustomerActionWorkflow } from "./customer-action-center";
import type { LatticeRequest, RequestStatus } from "./request-model";

export type CustomerDashboardMetric = {
  detail: string;
  href: string;
  key: "actions" | "activeRfqs" | "orders" | "shipped";
  label: string;
  tone?: "alert";
  value: string;
};

export type CustomerDashboardActivityRow = {
  amount: string;
  event: string;
  href: string;
  id: string;
  reference: string;
  sortAt: string;
  status: BuyerLifecycleTag;
  title: string;
  updatedLabel: string;
};

export type CustomerDashboardSummary = {
  actionWorkflows: CustomerActionWorkflow[];
  metrics: CustomerDashboardMetric[];
  quoteOrderActivity: CustomerDashboardActivityRow[];
};

const activeRfqStatuses = new Set<RequestStatus>(["DRAFT", "SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED"]);

function formatCurrency(cents: number | null | undefined) {
  if (cents === null || cents === undefined) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(cents / 100);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function latestStatusEvent(request: LatticeRequest, status = request.status) {
  return request.statusEvents
    .filter((event) => event.to === status)
    .sort((left, right) => Number(new Date(right.at)) - Number(new Date(left.at)))
    .at(0) ?? request.statusEvents.at(-1) ?? null;
}

function quoteAmount(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
}

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function buildQuoteOrderActivity(quotes: LatticeRequest[], orders: LatticeRequest[]) {
  const quoteRows = quotes.flatMap<CustomerDashboardActivityRow>((request) => {
    const latestQuote = request.customerQuotes.at(-1);

    if (!latestQuote) {
      return [];
    }

    return [
      {
        amount: formatCurrency(latestQuote.totalCents),
        event: "Quote received",
        href: `/quotes/${request.id}`,
        id: `quote:${request.id}:${latestQuote.id}`,
        reference: latestQuote.quoteNumber,
        sortAt: latestQuote.issuedAt,
        status: buyerLifecycleTag(request),
        title: request.title,
        updatedLabel: formatDateTime(latestQuote.issuedAt),
      },
    ];
  });
  const orderRows = orders.flatMap<CustomerDashboardActivityRow>((order) => {
    if (order.status !== "PURCHASED") {
      return [];
    }

    const purchaseEvent = latestStatusEvent(order, "PURCHASED");
    const sortAt = purchaseEvent?.at ?? order.updatedAt ?? order.createdAt;

    return [
      {
        amount: formatCurrency(quoteAmount(order)),
        event: "Order placed",
        href: `/orders/${order.id}`,
        id: `order:${order.id}:${purchaseEvent?.id ?? "current"}`,
        reference: orderReference(order),
        sortAt,
        status: buyerLifecycleTag(order),
        title: order.title,
        updatedLabel: formatDateTime(sortAt),
      },
    ];
  });

  return [...quoteRows, ...orderRows]
    .sort((left, right) => Number(new Date(right.sortAt)) - Number(new Date(left.sortAt)))
    .slice(0, 6);
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildCustomerDashboardSummary(quotes: LatticeRequest[], orders: LatticeRequest[], now = new Date()): CustomerDashboardSummary {
  const actionWorkflows = buildCustomerActionWorkflows({ now, orders, quotes });
  const customerActionCount = actionWorkflows.filter((workflow) => workflow.owner === "Customer").length;
  const priorityItemCount = actionWorkflows.filter((workflow) => workflow.priority !== "normal").length;
  const activeRfqs = quotes.filter((request) => activeRfqStatuses.has(request.status));
  const quotedRfqs = quotes.filter((request) => request.status === "QUOTED").length;
  const purchasedOrders = orders.filter((order) => order.status === "PURCHASED");
  const activeOrders = purchasedOrders.filter((order) => order.supplierOrder.status !== "DELIVERED").length;
  const shippedOrders = purchasedOrders.filter((order) => order.supplierOrder.status === "SHIPPED").length;
  return {
    metrics: [
      {
        detail: `${pluralize(quotedRfqs, "quote")} ready for review`,
        href: "/quotes",
        key: "activeRfqs",
        label: "Active RFQs",
        value: String(activeRfqs.length),
      },
      {
        detail: pluralize(activeOrders, "active order"),
        href: "/orders",
        key: "orders",
        label: "Orders",
        value: String(purchasedOrders.length),
      },
      {
        detail: `${pluralize(shippedOrders, "order")} in transit`,
        href: "/shipped",
        key: "shipped",
        label: "Shipped",
        value: String(shippedOrders),
      },
      {
        detail:
          actionWorkflows.length === 0
            ? "No open items"
            : customerActionCount > 0
              ? `${pluralize(customerActionCount, "item")} ${customerActionCount === 1 ? "requires" : "require"} your action`
              : priorityItemCount > 0
                ? `${pluralize(priorityItemCount, "priority item")} being tracked`
                : `${pluralize(actionWorkflows.length, "order update")} being monitored`,
        href: "/dashboard#action-center",
        key: "actions",
        label: "Open items",
        tone: customerActionCount > 0 || priorityItemCount > 0 ? "alert" : undefined,
        value: String(actionWorkflows.length),
      },
    ],
    actionWorkflows,
    quoteOrderActivity: buildQuoteOrderActivity(quotes, purchasedOrders),
  };
}
