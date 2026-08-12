import Link from "next/link";
import { ArrowUpRight, Box, CheckCircle2, FileText, ListChecks, ReceiptText } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { CustomerActionWorkflow } from "@/lib/customer-action-center";
import {
  buildCustomerDashboardSummary,
  type CustomerDashboardActivityRow,
  type CustomerDashboardMetric,
} from "@/lib/customer-dashboard";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { filterCustomerVisibleRequests } from "@/lib/request-access-policy";
import { listBuyerOrders, listBuyerQuotes } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";
import {
  customerDashboardScenarioNames,
  getCustomerDashboardScenario,
  isCustomerDashboardScenario,
  type CustomerDashboardScenario,
} from "@/lib/customer-dashboard-scenarios";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{ scenario?: string }>;
};

const metricIcons: Record<CustomerDashboardMetric["key"], LucideIcon> = {
  actions: ListChecks,
  activeRfqs: FileText,
  orders: ReceiptText,
  shipped: Box,
};

function MetricCard({ detail, href, label, metricKey, tone, value }: Omit<CustomerDashboardMetric, "key"> & { metricKey: CustomerDashboardMetric["key"] }) {
  const isAlert = tone === "alert";
  const Icon = metricIcons[metricKey];

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

function SectionHeader({ detail, meta, title }: { detail?: string; meta?: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-stone-950">{title}</h2>
        {detail ? <p className="mt-1 text-sm leading-5 text-stone-500">{detail}</p> : null}
      </div>
      {meta ? <p className="shrink-0 text-sm text-stone-500">{meta}</p> : null}
    </div>
  );
}

function WorkflowRow({ workflow }: { workflow: CustomerActionWorkflow }) {
  const isMonitoring = workflow.type === "order_milestone";
  const statusDotClass = isMonitoring
    ? "border-sky-300 bg-sky-100"
    : workflow.priority === "critical"
      ? "border-red-300 bg-red-100"
      : workflow.priority === "high"
        ? "border-amber-300 bg-amber-100"
        : "border-stone-300 bg-stone-100";
  const rowLabel = isMonitoring ? workflow.dueLabel : workflow.title;

  return (
    <Link
      aria-label={`View ${workflow.reference}: ${rowLabel}`}
      className="group -mx-2 grid gap-3 rounded-md px-2 py-3 transition hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      href={workflow.href}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span aria-label={rowLabel} className={`h-2.5 w-2.5 shrink-0 rounded-full border ${statusDotClass}`} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">{workflow.reference}</p>
          <h3 className="mt-0.5 truncate text-sm font-medium text-stone-950">{rowLabel}</h3>
        </div>
      </div>
      <ArrowUpRight aria-hidden="true" className={`hidden h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block ${isMonitoring ? "text-stone-400" : "text-stone-700"}`} strokeWidth={1.8} />
    </Link>
  );
}

function actionCenterSummary(workflows: CustomerActionWorkflow[]) {
  if (workflows.every((workflow) => workflow.type === "order_milestone")) {
    return `Lattice is confirming schedules for ${workflows.length} ${workflows.length === 1 ? "order" : "orders"}.`;
  }

  const customerActionCount = workflows.filter((workflow) => workflow.owner === "Customer").length;

  if (customerActionCount > 0) {
    return `${customerActionCount} ${customerActionCount === 1 ? "item needs" : "items need"} your attention.`;
  }

  return `Lattice is monitoring ${workflows.length} ${workflows.length === 1 ? "open item" : "open items"}.`;
}

function StatusPill({ status }: { status: string }) {
  const isComplete = ["Delivered", "In production", "Quote Received", "Shipping", "Quality documents ready"].includes(status);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${isComplete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}>
      <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />
      {status}
    </span>
  );
}

function EmptyTableRow({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 border-t border-stone-200 px-1 py-4 text-sm text-stone-500 sm:px-0">
      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-stone-400" strokeWidth={1.7} />
      <span>{label}</span>
    </div>
  );
}

function ScenarioLinks({ activeScenario }: { activeScenario: CustomerDashboardScenario }) {
  return (
    <nav aria-label="Dashboard preview scenarios" className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold uppercase tracking-[0.12em] text-stone-400">Preview data</span>
      {customerDashboardScenarioNames.map((scenario) => (
        <Link
          className={`rounded-md border px-2.5 py-1.5 transition ${scenario === activeScenario ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-950"}`}
          href={`/dashboard?scenario=${scenario}`}
          key={scenario}
        >
          {scenario}
        </Link>
      ))}
      <Link className="px-1.5 py-1.5 text-stone-500 underline-offset-2 hover:text-stone-950 hover:underline" href="/dashboard">
        live data
      </Link>
    </nav>
  );
}

function QuoteOrderActivityTable({ items }: { items: CustomerDashboardActivityRow[] }) {
  if (items.length === 0) {
    return (
      <div className="px-6 pb-5">
        <EmptyTableRow icon={FileText} label="No quote or order activity yet." />
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

export default async function Home({ searchParams }: DashboardPageProps = {}) {
  const requestedScenario = (await searchParams)?.scenario;
  const scenario = process.env.NODE_ENV !== "production" && isCustomerDashboardScenario(requestedScenario) ? requestedScenario : null;
  const [liveQuotes, liveOrders, session] = await Promise.all([listBuyerQuotes(), listBuyerOrders(), getCurrentSession()]);
  const scenarioData = scenario ? getCustomerDashboardScenario(scenario) : null;
  const quotes = (scenarioData?.quotes ?? liveQuotes).map(customerSafeRequest);
  const orders = (scenarioData?.orders ?? liveOrders).map(customerSafeRequest);
  const dashboard = buildCustomerDashboardSummary(filterCustomerVisibleRequests(quotes, session), filterCustomerVisibleRequests(orders, session));
  const userName = session?.user.name || "there";
  const actionWorkflows = dashboard.actionWorkflows.slice(0, 5);

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

      {scenario ? <ScenarioLinks activeScenario={scenario} /> : null}

      <section className="space-y-6">
        <section aria-label="Operational summary" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboard.metrics.map(({ key: metricKey, ...metric }) => (
            <MetricCard key={metricKey} metricKey={metricKey} {...metric} />
          ))}
        </section>

        <article className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-200/30 sm:p-6" id="action-center">
          <SectionHeader
            detail={actionWorkflows.length ? actionCenterSummary(actionWorkflows) : undefined}
            meta={actionWorkflows.length ? undefined : "0 open"}
            title="Action Center"
          />
          {actionWorkflows.length ? (
            <div className="mt-3 divide-y divide-stone-100">
              {actionWorkflows.map((workflow) => <WorkflowRow key={workflow.id} workflow={workflow} />)}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyTableRow icon={CheckCircle2} label="No action items require attention." />
            </div>
          )}
        </article>

        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm shadow-stone-200/30">
          <div className="px-6 pt-5">
            <SectionHeader
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
