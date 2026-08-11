import { NextResponse } from "next/server";

import { buildCustomerActivityFeed } from "@/lib/customer-notifications";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerOrders, listBuyerQuotes } from "@/lib/request-repository";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const accessDenied = await requireRouteRole(["admin", "customer"]);

  if (accessDenied) {
    return accessDenied;
  }

  const [quotes, orders] = await Promise.all([
    filterCustomerVisibleRequestsForCurrentSession(await listBuyerQuotes()),
    filterCustomerVisibleRequestsForCurrentSession(await listBuyerOrders()),
  ]);
  const notificationItems = buildCustomerActivityFeed({ orders, quotes });
  const items = notificationItems.slice(0, 12).map((item) => ({
    actionRequired: item.actionRequired,
    detail: item.detail,
    href: item.href,
    id: item.id,
    meta: item.meta,
    occurredAt: item.occurredAt,
    time: item.time,
    title: item.title,
  }));

  return NextResponse.json({
    attentionCount: notificationItems.filter((item) => item.actionRequired).length,
    items,
    totalCount: notificationItems.length,
  });
}
