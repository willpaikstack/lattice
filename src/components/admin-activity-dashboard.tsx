import Link from "next/link";

import type {
  AdminActionTone,
  AdminActivitySummary,
  AdminCriticalQuoteRequest,
} from "@/lib/admin-activity";
import type { RequestStatus } from "@/lib/request-model";

const statusLabels: Record<RequestStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_INFO: "Needs info",
  READY_FOR_SUPPLIER_RFQ: "Supplier ready",
  QUOTED: "Quote received",
  PURCHASED: "Purchased",
  CLOSED: "Closed",
};

const actionToneClasses: Record<AdminActionTone, string> = {
  critical: "border-[#ffd1d4] bg-[#fff1f2] text-[#FF5A5F]",
  warning: "border-[#ffd4c3] bg-[#fff0ea] text-[#FC642D]",
  success: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

const quotePipelineStatuses: RequestStatus[] = ["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED"];

function formatCurrency(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function formatDate(value: string) {
  if (!value) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function quoteAgeDays(request: AdminCriticalQuoteRequest) {
  const created = new Date(request.createdAt).getTime();
  const current = Date.now();

  if (Number.isNaN(created)) {
    return "Age unavailable";
  }

  const days = Math.max(0, Math.floor((current - created) / 86_400_000));
  return days === 1 ? "1 day open" : `${days} days open`;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-md border border-[#ffd1d4] bg-white p-4 shadow-[0_1px_0_rgba(72,72,72,0.04)]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#767676]">{label}</p>
      <p className="mt-3 text-[30px] font-semibold leading-none text-[#484848]">{value}</p>
      <p className="mt-2 text-[13px] leading-5 text-[#767676]">{detail}</p>
    </article>
  );
}

function SectionHeader({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#ffe1e3] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-[19px] font-semibold tracking-tight text-[#484848]">{title}</h2>
        {detail ? <p className="mt-1 text-[14px] leading-5 text-[#767676]">{detail}</p> : null}
      </div>
      {action}
    </div>
  );
}

function CriticalQueueItem({ request }: { request: AdminCriticalQuoteRequest }) {
  return (
    <Link className="block p-5 transition hover:bg-[#fff1f2]" href={request.href}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.74fr_0.48fr] xl:items-start">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${actionToneClasses[request.tone]}`}>
              {request.nextStep}
            </span>
            <span className="inline-flex rounded-full bg-[#fff1f2] px-2.5 py-1 text-[12px] font-semibold text-[#767676]">
              {statusLabels[request.status]}
            </span>
          </div>
          <h3 className="mt-3 text-[17px] font-semibold text-[#484848]">{request.title}</h3>
          <p className="mt-1 text-[14px] text-[#767676]">
            {request.buyerCompany} - {request.requesterName}
          </p>
          <p className="mt-3 text-[14px] leading-6 text-[#767676]">{request.reason}</p>
        </div>

        <div className="grid gap-2 text-[13px] text-[#767676] sm:grid-cols-2 xl:grid-cols-1">
          <span>
            <span className="font-semibold text-[#484848]">Part:</span> {request.primaryLineItem}
          </span>
          <span>
            <span className="font-semibold text-[#484848]">Process:</span> {request.process}
          </span>
          <span>
            <span className="font-semibold text-[#484848]">Owner:</span> {request.owner}
          </span>
          <span>
            <span className="font-semibold text-[#484848]">Shops:</span> {request.supplierQuotesReceived}/{request.supplierQuotesTotal} quoted
          </span>
        </div>

        <div className="grid gap-2 text-[13px] text-[#767676] sm:grid-cols-3 xl:grid-cols-1 xl:text-right">
          <span>
            <span className="font-semibold text-[#484848]">Due:</span> {formatDate(request.dueDate)}
          </span>
          <span>
            <span className="font-semibold text-[#484848]">Quote:</span> {formatCurrency(request.quoteValueCents)}
          </span>
          <span>{quoteAgeDays(request)}</span>
        </div>
      </div>
    </Link>
  );
}

export function AdminActivityDashboard({ summary }: { summary: AdminActivitySummary }) {
  return (
    <div className="mx-auto max-w-[1240px] space-y-5">
      <section className="rounded-md border border-[#ffd1d4] bg-[#fff1f2] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Admin</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#484848]">Quote request overview</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#767676]">
              Critical quote-request signals for intake, missing information, supplier outreach, and buyer decision follow-up.
            </p>
          </div>
          <Link className="rounded-md bg-[#FF5A5F] px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-[#484848]" href="/admin/quotes">
            Manage Quotes
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard detail="Submitted through quoted requests still moving toward a customer decision." label="Active quote requests" value={String(summary.metrics.activeQuoteRequests)} />
        <StatCard detail="New or blocked requests requiring immediate internal movement." label="Needs action" value={String(summary.metrics.needsAdminAction)} />
        <StatCard detail="Customer due dates already past on open quote requests." label="Overdue" value={String(summary.metrics.overdueRequests)} />
        <StatCard detail="Issued customer quote value still awaiting order conversion." label="Open quoted value" value={formatCurrency(summary.metrics.quotedValueCents)} />
      </section>

      <article className="rounded-md border border-[#ffd1d4] bg-white">
        <SectionHeader
          detail="Highest priority quote requests, ordered by operational risk."
          title="Critical quote queue"
        />

        {summary.criticalRequests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[15px] font-semibold text-[#484848]">No active quote requests</p>
            <p className="mt-2 text-[14px] text-[#767676]">Submitted RFQs will appear here once buyers request quotes.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#ffe1e3]">
            {summary.criticalRequests.slice(0, 5).map((request) => (
              <CriticalQueueItem key={request.requestId} request={request} />
            ))}
          </div>
        )}
      </article>

      <section className="grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <article className="rounded-md border border-[#ffd1d4] bg-white">
          <SectionHeader detail="Only active quote-request stages are counted here." title="Quote pipeline" />
          <div className="divide-y divide-[#ffe1e3]">
            {quotePipelineStatuses.map((status) => (
              <div className="flex items-center justify-between gap-4 px-5 py-4" key={status}>
                <span className="text-[14px] font-semibold text-[#484848]">{statusLabels[status]}</span>
                <span className="text-[24px] font-semibold leading-none text-[#FF5A5F]">{summary.statusCounts[status]}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#ffe1e3] bg-[#fff1f2] px-5 py-4 text-[13px] leading-5 text-[#767676]">
            <span className="font-semibold text-[#484848]">{summary.metrics.unassignedRequests}</span> unassigned,{" "}
            <span className="font-semibold text-[#484848]">{summary.metrics.supplierReady}</span> ready for shop outreach,{" "}
            <span className="font-semibold text-[#484848]">{summary.metrics.buyerDecisionPending}</span> waiting on buyer decisions.
          </div>
        </article>

        <article className="overflow-hidden rounded-md border border-[#ffd1d4] bg-white">
          <SectionHeader detail={`${summary.metrics.supplierQuotesReceived} received shop quotes across active requests.`} title="Recent quote requests" />
          <div className="grid grid-cols-[1.15fr_0.62fr_0.48fr_0.42fr] gap-4 border-b border-[#ffe1e3] bg-[#fff1f2] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#767676] max-lg:hidden">
            <span>Request</span>
            <span>Stage</span>
            <span>Owner</span>
            <span>Due</span>
          </div>
          <div className="divide-y divide-[#ffe1e3]">
            {summary.recentActivity.slice(0, 6).map((request) => (
              <Link className="grid gap-3 p-5 transition hover:bg-[#fff1f2] lg:grid-cols-[1.15fr_0.62fr_0.48fr_0.42fr] lg:items-center" href={`/operator/requests/${request.id}`} key={request.id}>
                <div>
                  <p className="text-[15px] font-semibold text-[#484848]">{request.title}</p>
                  <p className="mt-1 text-[13px] text-[#767676]">
                    {request.buyerCompany} - updated {formatUpdatedAt(request.updatedAt)}
                  </p>
                </div>
                <p className="text-[14px] font-semibold text-[#FF5A5F]">{statusLabels[request.status]}</p>
                <p className="text-[14px] text-[#767676]">{request.operatorReview.assignedOwner ?? "Unassigned"}</p>
                <p className="text-[14px] text-[#767676]">{formatDate(request.dueDate)}</p>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
