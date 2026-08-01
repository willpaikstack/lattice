import type { LatticeRequest } from "./request-model";
import { customerOrderStatusLabel, isOrderMilestoneLate, orderNextStep } from "./order-progress";

type CustomerActivityTone = "attention" | "documents" | "shipping" | "status";

export type CustomerActivityFeedItem = {
  actionRequired: boolean;
  detail: string;
  href: string;
  id: string;
  meta: string;
  occurredAt: string;
  time: string;
  title: string;
  tone: CustomerActivityTone;
};

const supplierStatusLabels = customerOrderStatusLabel;

const quoteStatusLabels: Record<LatticeRequest["status"], string> = {
  CLOSED: "Archived",
  DRAFT: "Draft",
  NEEDS_INFO: "More information needed",
  PURCHASED: "Order placed",
  QUOTED: "Quote received",
  READY_FOR_SUPPLIER_RFQ: "Supplier pricing",
  SUBMITTED: "Lattice review in progress",
};

function formatActivityTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    style: "currency",
  }).format(cents / 100);
}

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function actorLabel(actor: LatticeRequest["statusEvents"][number]["actor"]) {
  const labels: Record<LatticeRequest["statusEvents"][number]["actor"], string> = {
    buyer: "Buyer",
    operator: "Lattice",
    supplier: "Supplier",
    system: "System",
  };

  return labels[actor];
}

function quoteEventTitle(event: LatticeRequest["statusEvents"][number]) {
  if (event.from === null && event.to === "DRAFT") {
    return "Draft created";
  }

  if (event.from === "DRAFT" && event.to === "SUBMITTED") {
    return "RFQ submitted";
  }

  if (event.to === "NEEDS_INFO") {
    return "More information requested";
  }

  if (event.to === "QUOTED") {
    return "Quote ready for review";
  }

  if (event.to === "PURCHASED") {
    return "Order placed";
  }

  if (event.to === "CLOSED") {
    return "No quote";
  }

  return quoteStatusLabels[event.to];
}

function quoteEventDetail(request: LatticeRequest, event: LatticeRequest["statusEvents"][number]) {
  if (event.from === null) {
    return `${actorLabel(event.actor)} opened the RFQ workspace.`;
  }

  if ((event.to === "NEEDS_INFO" || event.to === "CLOSED") && request.operatorReview.internalNotes) {
    return request.operatorReview.internalNotes;
  }

  if (event.to === "SUBMITTED") {
    return "Lattice received your RFQ and is reviewing the files and requirements.";
  }

  if (event.to === "QUOTED") {
    return "Your quote is ready to review.";
  }

  if (event.to === "CLOSED") {
    return "This RFQ has been closed and archived.";
  }

  return `${actorLabel(event.actor)} moved the quote from ${quoteStatusLabels[event.from]} to ${quoteStatusLabels[event.to]}.`;
}

function quoteEventMeta(event: LatticeRequest["statusEvents"][number]) {
  if (event.to === "NEEDS_INFO") {
    return "Action needed";
  }

  if (event.to === "QUOTED") {
    return "RFQ Progress";
  }

  if (event.to === "PURCHASED") {
    return "Order progress";
  }

  return "RFQ status";
}

function quoteEventHref(request: LatticeRequest, event: LatticeRequest["statusEvents"][number]) {
  if (event.to === "DRAFT") {
    return `/requests/new?draft=${request.id}`;
  }

  return event.to === "PURCHASED" || request.status === "PURCHASED" ? `/orders/${request.id}` : `/quotes/${request.id}`;
}

function quoteStatusEventItems(request: LatticeRequest) {
  const statusEvents = request.statusEvents
    .filter((event) => event.to !== "READY_FOR_SUPPLIER_RFQ")
    .map<CustomerActivityFeedItem>((event) => ({
      actionRequired: event.to === "NEEDS_INFO" || event.to === "QUOTED",
      detail: quoteEventDetail(request, event),
      href: quoteEventHref(request, event),
      id: `status-event:${request.id}:${event.id}`,
      meta: quoteEventMeta(event),
      occurredAt: event.at,
      time: formatActivityTime(event.at),
      title: quoteEventTitle(event),
      tone: event.to === "NEEDS_INFO" || event.to === "QUOTED" ? "attention" : "status",
    }));
  const latestQuote = request.customerQuotes.at(-1);

  if (latestQuote && !request.statusEvents.some((event) => event.to === "QUOTED")) {
    statusEvents.push({
      actionRequired: request.status === "QUOTED",
      detail: `${request.title} is quoted at ${formatMoney(latestQuote.totalCents)} with ${latestQuote.leadTime || "lead time to confirm"}.`,
      href: `/quotes/${request.id}`,
      id: `quote:${request.id}:${latestQuote.id}`,
      meta: "RFQ Progress",
      occurredAt: latestQuote.issuedAt,
      time: formatActivityTime(latestQuote.issuedAt),
      title: "Quote ready for review",
      tone: request.status === "QUOTED" ? "attention" : "status",
    });
  }

  return statusEvents;
}

function orderStatusDetail(order: LatticeRequest, status: LatticeRequest["supplierOrder"]["status"]) {
  if (status === "SHIPPED") {
    return order.supplierOrder.trackingNumber ? `${orderReference(order)} shipped. Tracking ${order.supplierOrder.trackingNumber} is available.` : `${orderReference(order)} shipped. Tracking details are pending.`;
  }

  if (status === "DELIVERED") {
    return `${orderReference(order)} was marked delivered.`;
  }

  if (status === "DOCUMENTS_UPLOADED") {
    return "Quality records are ready for customer review.";
  }

  if (status === "IN_PRODUCTION") {
    return "Your order is in production.";
  }

  if (status === "QC_IN_PROGRESS") {
    return "Your order is in quality inspection.";
  }

  return `Supplier status changed to ${supplierStatusLabels[status].toLowerCase()}.`;
}

function orderProgressTitle(status: LatticeRequest["supplierOrder"]["status"]) {
  if (status === "IN_PRODUCTION") {
    return "In Production";
  }

  if (status === "QC_IN_PROGRESS") {
    return "Inspection In Progress";
  }

  return null;
}

function orderStatusTone(status: LatticeRequest["supplierOrder"]["status"]): CustomerActivityTone {
  if (status === "DOCUMENTS_UPLOADED") {
    return "documents";
  }

  if (status === "SHIPPED") {
    return "shipping";
  }

  return "status";
}

export function buildCustomerActivityFeed({
  orders = [],
  quotes = [],
}: {
  orders?: LatticeRequest[];
  quotes?: LatticeRequest[];
}): CustomerActivityFeedItem[] {
  const quoteItems = quotes.flatMap((request) => {
    const items = quoteStatusEventItems(request);

    if (request.status === "NEEDS_INFO") {
      const hasNeedsInfoEvent = items.some((item) => item.id.startsWith(`status-event:${request.id}:`) && item.meta === "Action needed");

      if (!hasNeedsInfoEvent) {
        items.push({
          actionRequired: true,
          detail: request.operatorReview.internalNotes || "Lattice needs buyer clarification before supplier pricing can continue.",
          href: `/quotes/${request.id}`,
          id: `needs-info:${request.id}`,
          meta: "Action needed",
          occurredAt: request.updatedAt,
          time: formatActivityTime(request.updatedAt),
          title: `${request.title} needs more information`,
          tone: "attention",
        });
      }
    }

    return items;
  });

  const orderItems = orders.flatMap((order) => {
    const reference = orderReference(order);
    const orderStatusEvents = quoteStatusEventItems(order).filter((item) => item.meta === "Order progress");
    const documents = order.supplierOrder.documents
      .filter((document) => document.category !== "PHOTO")
      .map<CustomerActivityFeedItem>((document) => ({
        actionRequired: true,
        detail: `${document.name} was added to ${reference}.`,
        href: `/orders/${order.id}`,
        id: `supplier-document:${order.id}:${document.id}`,
        meta: "Documents uploaded",
        occurredAt: document.uploadedAt,
        time: formatActivityTime(document.uploadedAt),
        title: document.category === "PACKING_SLIP" ? "Packing slip uploaded" : "Quality documents uploaded",
        tone: "documents",
      }));
    const hasDocumentRows = documents.length > 0;
    const updates = order.supplierOrder.updates.flatMap<CustomerActivityFeedItem>((update) => {
      if (update.status === "DOCUMENTS_UPLOADED" && hasDocumentRows) {
        return [];
      }

      const isShipment = update.status === "SHIPPED";
      const progressTitle = orderProgressTitle(update.status);
      const isManualLatticeUpdate = update.actor === "operator";

      if (!isShipment && update.status !== "DOCUMENTS_UPLOADED" && !progressTitle && !isManualLatticeUpdate) {
        return [];
      }

      return [
        {
          actionRequired: update.status === "DOCUMENTS_UPLOADED",
          detail: update.note || orderStatusDetail(order, update.status),
          href: `/orders/${order.id}`,
          id: `${isShipment ? "shipment" : "supplier-update"}:${order.id}:${update.id}`,
          meta: isShipment ? "Shipping" : update.status === "DOCUMENTS_UPLOADED" ? "Documents uploaded" : "Order progress",
          occurredAt: update.createdAt,
          time: formatActivityTime(update.createdAt),
          title: isShipment ? "Order shipped" : progressTitle ?? `${reference} updated: ${supplierStatusLabels[update.status]}`,
          tone: orderStatusTone(update.status),
        },
      ];
    });
    const hasShippedUpdate = order.supplierOrder.updates.some((update) => update.status === "SHIPPED");
    const currentShipment =
      order.supplierOrder.status === "SHIPPED" && !hasShippedUpdate
        ? [
            {
              actionRequired: false,
              detail: orderStatusDetail(order, "SHIPPED"),
              href: `/orders/${order.id}`,
              id: `shipment:${order.id}:current`,
              meta: "Shipping",
              occurredAt: order.updatedAt,
              time: formatActivityTime(order.updatedAt),
              title: "Order shipped",
              tone: "shipping" as const,
            },
          ]
        : [];

    const overdueMilestone = isOrderMilestoneLate(order)
      ? [
          {
            actionRequired: true,
            detail: `${orderNextStep(order)} is past its expected date. Lattice is following up and will post the next update here.`,
            href: `/orders/${order.id}`,
            id: `late-milestone:${order.id}:${order.supplierOrder.nextMilestoneDate}`,
            meta: "Order attention",
            occurredAt: order.updatedAt,
            time: formatActivityTime(order.updatedAt),
            title: `${reference} milestone overdue`,
            tone: "attention" as const,
          },
        ]
      : [];

    return [...orderStatusEvents, ...documents, ...updates, ...currentShipment, ...overdueMilestone];
  });

  return [...quoteItems, ...orderItems].sort((left, right) => {
    const byDate = Number(new Date(right.occurredAt)) - Number(new Date(left.occurredAt));
    return byDate || left.id.localeCompare(right.id);
  });
}
