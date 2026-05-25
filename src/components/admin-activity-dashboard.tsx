import Link from "next/link";

import type { AdminActionTone, AdminActivitySummary } from "@/lib/admin-activity";
import type { RequestStatus } from "@/lib/request-model";

const statusLabels: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_INFO: "Needs info",
  READY_FOR_SUPPLIER_RFQ: "Ready for supplier RFQ",
  QUOTED: "Quoted",
  PURCHASED: "Purchased",
};

const actionToneClasses: Record<AdminActionTone, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function formatStatus(status: RequestStatus) {
  return statusLabels[status];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-[#e7e7e7] bg-white p-4">
      <p className="text-[13px] font-medium text-[#6b7280]">{label}</p>
      <p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-[#171717]">{value}</p>
      <p className="mt-2 text-[13px] leading-5 text-[#6b7280]">{detail}</p>
    </article>
  );
}

export function AdminActivityDashboard({ summary }: { summary: AdminActivitySummary }) {
  const statuses = Object.entries(summary.statusCounts) as Array<[RequestStatus, number]>;
  const maxStatusCount = Math.max(...statuses.map(([, count]) => count), 1);

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <section className="rounded-lg border border-[#e6e6e6] bg-[#f8fafc] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Internal operations</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Administrator control center</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Manage platform activity across buyer RFQs, supplier-readiness work, quote value, and order conversion.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" href="/operator/requests">
              Review RFQs
            </Link>
            <Link className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" href="/requests/new">
              New RFQ
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard detail="All buyer requests currently visible to the admin console." label="Total RFQs" value={String(summary.metrics.totalRequests)} />
        <StatCard detail="Submitted or blocked requests that need internal movement." label="Needs admin action" value={String(summary.metrics.needsAdminAction)} />
        <StatCard detail="Packages ready for trusted supplier outreach." label="Supplier ready" value={String(summary.metrics.supplierReady)} />
        <StatCard detail="Converted work being managed after buyer approval." label="Orders in flight" value={String(summary.metrics.ordersInFlight)} />
        <StatCard detail="Quoted buyer value currently tracked in Lattice OS." label="Quoted value" value={formatCurrency(summary.metrics.quotedValueCents)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.16fr_0.84fr]">
        <article className="rounded-lg border border-[#e6e6e6] bg-white">
          <div className="border-b border-[#eeeeee] px-5 py-4">
            <h2 className="text-[20px] font-semibold tracking-tight text-[#202020]">Admin action queue</h2>
            <p className="mt-1 text-[14px] text-[#707782]">The work that most needs administrator judgment or follow-through.</p>
          </div>

          {summary.nextActions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[15px] font-semibold text-[#202020]">No active admin actions</p>
              <p className="mt-2 text-[14px] text-[#707782]">Submitted RFQs, missing-info items, and supplier-ready packages will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#eeeeee]">
              {summary.nextActions.map((action) => (
                <Link className="block p-5 transition hover:bg-[#f8fafc]" href={action.href} key={`${action.requestId}-${action.label}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${actionToneClasses[action.tone]}`}>
                        {action.label}
                      </span>
                      <h3 className="mt-3 text-[17px] font-semibold text-[#202020]">{action.title}</h3>
                      <p className="mt-1 text-[14px] text-[#707782]">{action.buyerCompany}</p>
                    </div>
                    <p className="text-[13px] font-medium text-[#8a8f98]">{formatDate(action.updatedAt)}</p>
                  </div>
                  <p className="mt-3 text-[14px] leading-6 text-[#4b5563]">{action.detail}</p>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-lg border border-[#e6e6e6] bg-white p-5">
          <h2 className="text-[20px] font-semibold tracking-tight text-[#202020]">Activity by status</h2>
          <div className="mt-5 space-y-4">
            {statuses.map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between gap-4 text-[14px]">
                  <span className="font-medium text-[#30343a]">{formatStatus(status)}</span>
                  <span className="font-semibold text-[#171717]">{count}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#edf0f3]">
                  <div className="h-2 rounded-full bg-[#2f3237]" style={{ width: `${Math.max((count / maxStatusCount) * 100, count > 0 ? 8 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-[#e6e6e6] bg-white">
        <div className="border-b border-[#eeeeee] px-5 py-4">
          <h2 className="text-[20px] font-semibold tracking-tight text-[#202020]">Recent application activity</h2>
          <p className="mt-1 text-[14px] text-[#707782]">Latest RFQs and status movement across the platform.</p>
        </div>
        <div className="grid grid-cols-[1.25fr_0.75fr_0.7fr_0.65fr_0.55fr] gap-4 border-b border-[#eeeeee] bg-[#f8fafc] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86] max-lg:hidden">
          <span>Request</span>
          <span>Buyer</span>
          <span>Status</span>
          <span>Owner</span>
          <span>Quote</span>
        </div>
        <div className="divide-y divide-[#eeeeee]">
          {summary.recentActivity.map((request) => (
            <Link className="grid gap-3 p-5 transition hover:bg-[#f8fafc] lg:grid-cols-[1.25fr_0.75fr_0.7fr_0.65fr_0.55fr] lg:items-center" href={`/operator/requests/${request.id}`} key={request.id}>
              <div>
                <p className="text-[15px] font-semibold text-[#202020]">{request.title}</p>
                <p className="mt-1 text-[13px] text-[#707782]">
                  {request.process} · due {request.dueDate || "TBD"}
                </p>
              </div>
              <p className="text-[14px] text-[#4b5563]">{request.buyerCompany}</p>
              <p className="text-[14px] font-semibold text-[#30343a]">{formatStatus(request.status)}</p>
              <p className="text-[14px] text-[#4b5563]">{request.operatorReview.assignedOwner ?? "Unassigned"}</p>
              <p className="text-[14px] font-semibold text-[#202020]">
                {request.quote.estimatedPriceCents ? formatCurrency(request.quote.estimatedPriceCents) : "Unquoted"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
