import Link from "next/link";

import { buildCustomerActionWorkflows } from "@/lib/customer-action-center";
import { buildCustomerActivityFeed } from "@/lib/customer-notifications";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerOrders, listBuyerQuotes } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [quotes, orders] = await Promise.all([
    filterCustomerVisibleRequestsForCurrentSession(await listBuyerQuotes()),
    filterCustomerVisibleRequestsForCurrentSession(await listBuyerOrders()),
  ]);
  const notificationItems = buildCustomerActivityFeed({ orders: orders.map(customerSafeRequest), quotes: quotes.map(customerSafeRequest) });
  const actionWorkflows = buildCustomerActionWorkflows({ orders: orders.map(customerSafeRequest), quotes: quotes.map(customerSafeRequest) });

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <section className="border-b border-[#e6e6e6] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Customer activity</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Notifications</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              A chronological record of RFQ updates, order milestones, documents, and events that may also require action.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#303030]" href="/dashboard#action-center">
              Open Action Center
            </Link>
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dcdcdc] bg-white px-4 text-[14px] font-semibold text-[#3f444b] transition hover:bg-[#f8f8f8]" href="/dashboard">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Notification summary" className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-md border border-[#e8e8e8] bg-white p-4">
          <p className="text-[13px] font-medium text-[#686d75]">Open workflows</p>
          <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{actionWorkflows.length}</p>
          <p className="mt-2 text-[12px] text-[#8a8f98]">Tracked separately in the Action Center</p>
        </article>
        <article className="rounded-md border border-[#e8e8e8] bg-white p-4">
          <p className="text-[13px] font-medium text-[#686d75]">Notification history</p>
          <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{notificationItems.length}</p>
          <p className="mt-2 text-[12px] text-[#8a8f98]">Across RFQs, orders, and documents</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
        <div className="border-b border-[#eeeeee] px-5 py-4">
          <h2 className="text-[20px] font-semibold text-[#202020]">All notifications</h2>
          <p className="mt-1 text-[13px] text-[#737982]">Notifications explain what happened. Action workflows remain open until the underlying work is resolved.</p>
        </div>
        {notificationItems.length ? (
          <div className="divide-y divide-[#eeeeee]">
            {notificationItems.map((notification) => {
              return (
                <Link
                  className="grid gap-3 px-5 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#171717] sm:grid-cols-[auto_1fr_auto] sm:items-start"
                  href={notification.href}
                  key={notification.id}
                >
                  <span aria-label={notification.actionRequired ? "Needs attention" : "Informational update"} className={notification.actionRequired ? "mt-1 h-2.5 w-2.5 rounded-full bg-[#b45309]" : "mt-1 h-2.5 w-2.5 rounded-full bg-[#d8d8d8]"} />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">{notification.meta}</span>
                      <span className="text-[12px] text-[#a2a2a2]">{notification.time}</span>
                      {notification.actionRequired ? <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-[11px] font-semibold text-[#9a3412]">Needs attention</span> : null}
                    </span>
                    <span className="mt-1 block text-[15px] font-semibold text-[#202020]">{notification.title}</span>
                    <span className="mt-1 block text-[13px] leading-5 text-[#707070]">{notification.detail}</span>
                  </span>
                  <span className="hidden text-[18px] leading-none text-[#9a9a9a] sm:block" aria-hidden="true">
                    -&gt;
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <h2 className="text-[18px] font-semibold text-[#202020]">No updates yet.</h2>
            <p className="mx-auto mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              RFQ, quote, order, shipment, and quality-document events will appear here.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link className="text-[14px] font-semibold text-[#202020] hover:text-[#555]" href="/requests/new">
                Request Quote
              </Link>
              <Link className="text-[14px] font-semibold text-[#202020] hover:text-[#555]" href="/quotes">
                View Quotes
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
