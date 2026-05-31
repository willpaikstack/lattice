import type { LatticeRequest } from "./request-model";

export type CustomerNotification = {
  title: string;
  detail: string;
  meta: string;
  time: string;
  href: string;
  unread: boolean;
};

function formatNotificationTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function buildCustomerNotifications(requests: LatticeRequest[]): CustomerNotification[] {
  return requests
    .flatMap((request) => {
      const latestQuote = request.customerQuotes.at(-1);
      const notifications: Array<CustomerNotification & { sortAt: string }> = [];

      if (latestQuote) {
        notifications.push({
          title: `${latestQuote.quoteNumber} is ready for review`,
          detail: `${request.title} is quoted at ${new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(latestQuote.totalCents / 100)} with ${latestQuote.leadTime || "lead time to confirm"}.`,
          href: `/quotes/${request.id}`,
          meta: "RFQ status",
          sortAt: latestQuote.issuedAt,
          time: formatNotificationTime(latestQuote.issuedAt),
          unread: request.status === "QUOTED",
        });
      } else if (request.status === "NEEDS_INFO") {
        notifications.push({
          title: `${request.title} needs more information`,
          detail: request.operatorReview.internalNotes || "Lattice needs buyer clarification before supplier pricing can continue.",
          href: `/quotes/${request.id}`,
          meta: "Action needed",
          sortAt: request.updatedAt,
          time: formatNotificationTime(request.updatedAt),
          unread: true,
        });
      }

      return notifications;
    })
    .sort((left, right) => Number(new Date(right.sortAt)) - Number(new Date(left.sortAt)))
    .map((notification) => ({
      detail: notification.detail,
      href: notification.href,
      meta: notification.meta,
      time: notification.time,
      title: notification.title,
      unread: notification.unread,
    }));
}

export const customerNotifications: CustomerNotification[] = [
  {
    title: "Order PO-1042 moved to final inspection",
    detail: "CNC bracket set is awaiting dimensional report sign-off before packing.",
    meta: "Order status",
    time: "12 min ago",
    href: "/orders",
    unread: true,
  },
  {
    title: "RFQ RFQ-1187 is ready for review",
    detail: "Supplier quotes are in for the 6061-T6 housing revision B package.",
    meta: "RFQ status",
    time: "48 min ago",
    href: "/quotes",
    unread: true,
  },
  {
    title: "Quality documents uploaded",
    detail: "Material certs and inspection photos were added to order PO-1036.",
    meta: "Documents",
    time: "Today",
    href: "/orders",
    unread: false,
  },
  {
    title: "Drawing clarification requested",
    detail: "Operator needs confirmation on thread callout for the manifold fixture.",
    meta: "Action needed",
    time: "Yesterday",
    href: "/quotes",
    unread: false,
  },
];
