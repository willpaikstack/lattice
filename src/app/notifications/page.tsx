import Link from "next/link";

import { buildCustomerNotifications, customerNotifications } from "@/lib/customer-notifications";
import { listBuyerQuotes } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const requestNotifications = buildCustomerNotifications(await listBuyerQuotes());
  const notifications = requestNotifications.length ? requestNotifications : customerNotifications;
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <section className="border-b border-[#e6e6e6] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Platform notifications</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Alerts</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              Review RFQ updates, order status changes, quality document uploads, and buyer action items in one place.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dcdcdc] bg-white px-4 text-[14px] font-semibold text-[#3f444b] transition hover:bg-[#f8f8f8]"
            href="/dashboard"
          >
            Back to Home
          </Link>
        </div>
      </section>

      <section aria-label="Notification summary" className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-md border border-[#e8e8e8] bg-white p-4">
          <p className="text-[13px] font-medium text-[#686d75]">Unread alerts</p>
          <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{unreadCount}</p>
          <p className="mt-2 text-[12px] text-[#8a8f98]">Need customer attention</p>
        </article>
        <article className="rounded-md border border-[#e8e8e8] bg-white p-4">
          <p className="text-[13px] font-medium text-[#686d75]">Total notifications</p>
          <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{notifications.length}</p>
          <p className="mt-2 text-[12px] text-[#8a8f98]">Across RFQs, orders, and documents</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
        <div className="border-b border-[#eeeeee] px-5 py-4">
          <h2 className="text-[20px] font-semibold text-[#202020]">Notification center</h2>
          <p className="mt-1 text-[13px] text-[#737982]">Rows open the related workspace area.</p>
        </div>

        <div className="divide-y divide-[#eeeeee]">
          {notifications.map((notification) => (
            <Link
              className="grid gap-3 px-5 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#171717] sm:grid-cols-[auto_1fr_auto] sm:items-start"
              href={notification.href}
              key={`${notification.title}-${notification.href}`}
            >
              <span
                aria-label={notification.unread ? "Unread notification" : "Read notification"}
                className={notification.unread ? "mt-1 h-2.5 w-2.5 rounded-full bg-[#171717]" : "mt-1 h-2.5 w-2.5 rounded-full bg-[#d8d8d8]"}
              />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#737373]">{notification.meta}</span>
                  <span className="text-[12px] text-[#a2a2a2]">{notification.time}</span>
                </span>
                <span className="mt-1 block text-[15px] font-semibold text-[#202020]">{notification.title}</span>
                <span className="mt-1 block text-[13px] leading-5 text-[#707070]">{notification.detail}</span>
              </span>
              <span className="hidden text-[18px] leading-none text-[#9a9a9a] sm:block" aria-hidden="true">
                -&gt;
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
