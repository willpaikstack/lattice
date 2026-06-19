import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Box, CheckCircle2, FileText, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  buildCustomerDashboardSummary,
  type CustomerDashboardActivityRow,
  type CustomerDashboardMetric,
} from "@/lib/customer-dashboard";
import type { CustomerActivityFeedItem } from "@/lib/customer-notifications";
import { filterCustomerVisibleRequests } from "@/lib/request-access-policy";
import { listBuyerOrders, listBuyerQuotes } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const metricIcons: Record<CustomerDashboardMetric["label"], LucideIcon> = {
  "Active RFQs": FileText,
  Alerts: AlertTriangle,
  Orders: ReceiptText,
  Shipped: Box,
};

function MetricCard({ detail, href, label, tone, value }: Omit<CustomerDashboardMetric, "key">) {
  const isAlert = tone === "alert";
  const Icon = metricIcons[label];

  return (
    <Link
      aria-label={`View ${label}`}
      className={`group block rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
        isAlert ? "border-amber-200 bg-amber-50/80" : "border-stone-200 bg-white"
      }`}
      href={href}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-stone-700">{label}</p>
        <Icon aria-hidden="true" className={isAlert ? "h-4 w-4 text-amber-700" : "h-4 w-4 text-stone-500"} strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-3xl font-semibold leading-none tracking-tight text-stone-950">{value}</p>
      <p className={isAlert ? "mt-2 text-sm text-amber-800" : "mt-2 text-sm text-stone-500"}>{detail}</p>
    </Link>
  );
}

function SectionHeader({
  action,
  detail,
  title,
}: {
  action?: ReactNode;
  detail: string;
  title: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-stone-950">{title}</h2>
        <p className="mt-1 text-sm leading-5 text-stone-500">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/70 p-5 text-sm leading-6 text-stone-500">{children}</div>;
}

function NotificationRow({ item }: { item: CustomerActivityFeedItem }) {
  return (
    <Link
      className="grid gap-3 rounded-xl py-4 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 sm:grid-cols-[auto_1fr_auto] sm:items-start sm:px-3"
      href={item.href}
    >
      <span aria-label={item.actionRequired ? "Needs attention" : "Informational update"} className={item.actionRequired ? "mt-1.5 h-2.5 w-2.5 rounded-full bg-amber-700" : "mt-1.5 h-2.5 w-2.5 rounded-full bg-stone-300"} />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">{item.meta}</span>
          <span className="text-xs text-stone-400">{item.time}</span>
          {item.actionRequired ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Needs attention</span> : null}
        </span>
        <span className="mt-1 block text-sm font-semibold text-stone-950">{item.title}</span>
        <span className="mt-1 block text-sm leading-5 text-stone-600">{item.detail}</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="hidden h-4 w-4 text-stone-300 sm:block" strokeWidth={1.8} />
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const isComplete = ["Delivered", "In Production", "Quote Received", "Shipping"].includes(status);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isComplete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}>
      <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
      {status}
    </span>
  );
}

function QuoteOrderActivityTable({ items }: { items: CustomerDashboardActivityRow[] }) {
  if (items.length === 0) {
    return (
      <div className="p-6">
        <EmptyState>Quotes received and placed orders will appear here.</EmptyState>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
          <tr>
            <th className="px-6 py-3">Record</th>
            <th className="px-6 py-3">Amount</th>
            <th className="px-6 py-3 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 bg-white">
          {items.map((item) => (
            <tr className="transition hover:bg-stone-50" key={item.id}>
              <td className="px-6 py-4">
                <Link className="block rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950" href={item.href}>
                  <p className="text-sm font-medium text-stone-950">{item.reference}</p>
                  <p className="mt-1 text-xs text-stone-500">{item.title}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {item.event} - {item.updatedLabel}
                  </p>
                </Link>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-stone-950">{item.amount}</td>
              <td className="px-6 py-4 text-right">
                <StatusPill status={item.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Home() {
  const [quotes, orders, session] = await Promise.all([listBuyerQuotes(), listBuyerOrders(), getCurrentSession()]);
  const dashboard = buildCustomerDashboardSummary(filterCustomerVisibleRequests(quotes, session), filterCustomerVisibleRequests(orders, session));
  const userName = session?.user.name || "there";
  const inboxItems = dashboard.dashboardInbox.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Home</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-stone-950">Hi {userName}</h1>
        </div>
        <Link
          className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
          href="/requests/new"
        >
          Request Quote
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map(({ key: metricKey, ...metric }) => (
          <MetricCard key={metricKey} {...metric} />
        ))}
      </section>

      <section className="space-y-6">
        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm shadow-stone-200/30">
          <SectionHeader detail="Customer updates across RFQs, orders, and quality documentation" title="Inbox" />
          <div className="mt-5 divide-y divide-stone-100">
            {inboxItems.length ? (
              inboxItems.map((item) => <NotificationRow item={item} key={item.id} />)
            ) : (
              <EmptyState>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-stone-700">No updates yet.</p>
                    <p className="mt-1">RFQ, quote, order, shipment, and quality-document events will appear here when they exist.</p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <Link className="font-semibold text-stone-950 hover:text-stone-600" href="/requests/new">
                      Request Quote
                    </Link>
                    <Link className="font-semibold text-stone-950 hover:text-stone-600" href="/quotes">
                      View Quotes
                    </Link>
                  </div>
                </div>
              </EmptyState>
            )}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/30">
          <div className="border-b border-stone-200 px-6 py-5">
            <SectionHeader
              action={
                <Link className="inline-flex h-10 items-center gap-2 rounded-xl bg-stone-950 px-4 text-sm font-semibold text-white transition hover:bg-stone-800" href="/notifications">
                  View All
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                </Link>
              }
              detail="Quotes received by customers and orders placed by customers"
              title="Quote and Order Activity"
            />
          </div>
          <QuoteOrderActivityTable items={dashboard.quoteOrderActivity} />
        </article>
      </section>
    </div>
  );
}
