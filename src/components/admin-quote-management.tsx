"use client";

import { useMemo, useState } from "react";

import { buildCustomerQuoteInputFromRequest, buildCustomerQuoteInputFromVersion } from "@/lib/quote-file";
import type { LatticeRequest, SupplierQuoteStatus } from "@/lib/request-model";

import { CustomerQuoteBuilder } from "./customer-quote-builder";

const statusCopy: Record<LatticeRequest["status"], { label: string; tone: string; nextAction: string }> = {
  DRAFT: { label: "Draft", nextAction: "Review draft", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  SUBMITTED: { label: "Submitted", nextAction: "Assign owner and review intake", tone: "border-blue-100 bg-blue-50 text-blue-700" },
  NEEDS_INFO: { label: "Needs info", nextAction: "Recover buyer clarification", tone: "border-amber-100 bg-amber-50 text-amber-700" },
  READY_FOR_SUPPLIER_RFQ: { label: "Supplier ready", nextAction: "Send supplier RFQs", tone: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  QUOTED: { label: "Quoted", nextAction: "Issue customer quote", tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  PURCHASED: { label: "Purchased", nextAction: "Track order", tone: "border-slate-950 bg-slate-950 text-white" },
};

const supplierQuoteLabels: Record<SupplierQuoteStatus, string> = {
  INVITED: "Invited",
  QUOTE_RECEIVED: "Received",
  DECLINED: "Declined",
  SELECTED: "Selected",
};

const statusFilters: Array<{ label: string; value: "ALL" | LatticeRequest["status"] }> = [
  { label: "All", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Needs info", value: "NEEDS_INFO" },
  { label: "Supplier ready", value: "READY_FOR_SUPPLIER_RFQ" },
  { label: "Quoted", value: "QUOTED" },
];

type AdminQuoteAction = (formData: FormData) => void | Promise<void>;

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

function formatCurrencyInput(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function receivedSupplierQuotes(request: LatticeRequest) {
  return request.supplierQuotes.filter((quote) => quote.status === "QUOTE_RECEIVED" || quote.status === "SELECTED");
}

function supplierSummary(request: LatticeRequest) {
  if (request.supplierQuotes.length === 0) {
    return "No shop outreach";
  }

  const counts = request.supplierQuotes.reduce<Record<SupplierQuoteStatus, number>>(
    (summary, quote) => ({ ...summary, [quote.status]: summary[quote.status] + 1 }),
    { DECLINED: 0, INVITED: 0, QUOTE_RECEIVED: 0, SELECTED: 0 },
  );

  return (Object.entries(counts) as Array<[SupplierQuoteStatus, number]>)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${supplierQuoteLabels[status]}`)
    .join(" / ");
}

function nextActionForRequest(request: LatticeRequest) {
  if (request.status === "QUOTED" && request.customerQuotes.at(-1)) {
    return "Follow buyer decision";
  }

  return statusCopy[request.status].nextAction;
}

function statusEventCopy(event: LatticeRequest["statusEvents"][number]) {
  const toLabel = statusCopy[event.to]?.label ?? event.to;
  const fromLabel = event.from ? (statusCopy[event.from]?.label ?? event.from) : "Created";

  if (event.from === event.to) {
    return `${toLabel} confirmed`;
  }

  return `${fromLabel} to ${toLabel}`;
}

function AdminQuoteDetailDrawer({
  isQuoteBuilderOpen,
  onClose,
  onQuoteBuilderOpenChange,
  request,
  saveQuoteAction,
  updateStatusAction,
}: {
  isQuoteBuilderOpen: boolean;
  onClose: () => void;
  onQuoteBuilderOpenChange: (isOpen: boolean) => void;
  request: LatticeRequest;
  saveQuoteAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const quoteInput = latestCustomerQuote ? buildCustomerQuoteInputFromVersion(latestCustomerQuote) : buildCustomerQuoteInputFromRequest(request);
  const status = statusCopy[request.status];

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-[#1f2937]/45 px-4 py-6" role="dialog">
      <div className="mx-auto max-w-[1320px] rounded-md border border-[#e6e6e6] bg-[#f8fafc] shadow-2xl">
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-[#e6e6e6] bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">RFQ command center</p>
              <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#171717]">{request.title}</h2>
            <p className="mt-1 text-[14px] text-[#64748b]">
              {quoteReference(request)} · {request.buyerCompany} · {request.process}
            </p>
          </div>
          <button
            className="h-10 rounded-md border border-[#d7d7d7] bg-white px-4 text-sm font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#171717]">Review controls</h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#64748b]">Set the RFQ state, owner, pricing basis, and shop package notes.</p>
                </div>
                <span className="rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-1 text-[12px] font-semibold text-[#4b5563]">
                  {nextActionForRequest(request)}
                </span>
              </div>

              <form action={updateStatusAction} className="mt-4 grid gap-4">
                <input name="requestId" type="hidden" value={request.id} />
                <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                  Status
                  <select
                    className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none focus:border-[#9b9b9b]"
                    defaultValue={request.status}
                    name="status"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="NEEDS_INFO">Needs info</option>
                    <option value="READY_FOR_SUPPLIER_RFQ">Supplier ready</option>
                    <option value="QUOTED">Quoted</option>
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Assigned owner
                    <input
                      className="h-10 rounded-md border border-[#d9d9d9] px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.operatorReview.assignedOwner ?? ""}
                      name="assignedOwner"
                      placeholder="Admin owner"
                    />
                  </label>
                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Estimated price
                    <input
                      className="h-10 rounded-md border border-[#d9d9d9] px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={formatCurrencyInput(request.quote.estimatedPriceCents)}
                      inputMode="decimal"
                      name="estimatedPrice"
                      placeholder="0.00"
                    />
                  </label>
                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Lead time days
                    <input
                      className="h-10 rounded-md border border-[#d9d9d9] px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.quote.leadTimeDays ?? ""}
                      inputMode="numeric"
                      name="leadTimeDays"
                      placeholder="15"
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                  Customer quote summary
                  <textarea
                    className="min-h-20 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                    defaultValue={request.quote.summary}
                    name="quoteSummary"
                    placeholder="Short customer-facing quote summary"
                  />
                </label>

                <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                  Supplier package notes
                  <textarea
                    className="min-h-20 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                    defaultValue={request.operatorReview.supplierPackageNotes}
                    name="supplierPackageNotes"
                    placeholder="What suppliers need to quote cleanly"
                  />
                </label>

                <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                  Internal notes
                  <textarea
                    className="min-h-20 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                    defaultValue={request.operatorReview.internalNotes}
                    name="internalNotes"
                    placeholder="Admin-only notes"
                  />
                </label>

                <button
                  className="h-10 w-fit rounded-md bg-[#262626] px-4 text-[13px] font-semibold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#b7c9ef]"
                  disabled={!updateStatusAction}
                  type="submit"
                >
                  Save review decision
                </button>
              </form>
            </section>

            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <h3 className="text-[18px] font-semibold text-[#171717]">Buyer intake</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Customer</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#202020]">{request.buyerCompany}</p>
                  <p className="mt-1 text-[13px] text-[#69707a]">{request.requesterName}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Due date</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#202020]">{formatDate(request.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Process</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#202020]">{request.process}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Submitted</p>
                  <p className="mt-1 text-[14px] font-semibold text-[#202020]">{formatDateTime(request.createdAt)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <h3 className="text-[18px] font-semibold text-[#171717]">Line items</h3>
              <div className="mt-4 space-y-3">
                {request.lineItems.map((lineItem, index) => (
                  <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={`${lineItem.partName}-${index}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#202020]">{lineItem.partName}</p>
                      <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563]">Qty {lineItem.quantity}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-[#64748b]">
                      {lineItem.material} · {lineItem.generalTolerance} · {lineItem.surfaceFinish}
                    </p>
                    {(lineItem.qualityDocumentation?.length ?? 0) > 0 ? (
                      <p className="mt-2 text-[12px] font-semibold text-[#4b5563]">Quality docs: {lineItem.qualityDocumentation?.join(", ")}</p>
                    ) : null}
                    {lineItem.notes ? <p className="mt-2 text-[13px] leading-5 text-[#64748b]">{lineItem.notes}</p> : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <h3 className="text-[18px] font-semibold text-[#171717]">Files and activity</h3>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Uploaded files</p>
                  {request.files.map((file) => (
                    <div className="flex items-center justify-between gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2" key={file.name}>
                      <span className="truncate text-[13px] font-semibold text-[#30343a]">{file.name}</span>
                      <span className="shrink-0 text-[12px] text-[#8a8f98]">{formatFileSize(file.sizeBytes)}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Status history</p>
                  {request.statusEvents.map((event) => (
                    <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2" key={event.id}>
                      <p className="text-[13px] font-semibold text-[#30343a]">{statusEventCopy(event)}</p>
                      <p className="mt-1 text-[12px] text-[#8a8f98]">
                        {event.actor} · {formatDateTime(event.at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#171717]">Customer quote</h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#64748b]">
                    {latestCustomerQuote
                      ? `${latestCustomerQuote.quoteNumber} v${latestCustomerQuote.versionNumber} is saved for the buyer.`
                      : "Build the buyer-facing quote from this RFQ and save it back to the submission."}
                  </p>
                </div>
                {saveQuoteAction ? (
                  <button
                    className="h-10 rounded-md border border-[#d7d7d7] bg-white px-4 text-[13px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                    onClick={() => onQuoteBuilderOpenChange(!isQuoteBuilderOpen)}
                    type="button"
                  >
                    {isQuoteBuilderOpen ? "Hide builder" : latestCustomerQuote ? "Revise quote" : "Issue quote"}
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Quote value</p>
                  <p className="mt-2 text-[20px] font-semibold text-[#202020]">{formatCurrency(request.quote.estimatedPriceCents)}</p>
                </div>
                <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Lead time</p>
                  <p className="mt-2 text-[20px] font-semibold text-[#202020]">
                    {request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Pending"}
                  </p>
                </div>
                <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Buyer version</p>
                  <p className="mt-2 text-[20px] font-semibold text-[#202020]">{latestCustomerQuote ? `v${latestCustomerQuote.versionNumber}` : "None"}</p>
                </div>
              </div>

              {request.quote.summary ? <p className="mt-4 text-[14px] leading-6 text-[#4b5563]">{request.quote.summary}</p> : null}
            </section>

            {isQuoteBuilderOpen ? <CustomerQuoteBuilder initialQuote={quoteInput} requestId={request.id} saveAction={saveQuoteAction} /> : null}

            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <h3 className="text-[18px] font-semibold text-[#171717]">Supplier quote basis</h3>
              <p className="mt-1 text-[13px] leading-5 text-[#64748b]">{supplierSummary(request)}</p>
              <div className="mt-4 space-y-3">
                {request.supplierQuotes.length > 0 ? (
                  request.supplierQuotes.map((quote) => (
                    <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={quote.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#202020]">{quote.shopName}</p>
                        <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563]">{supplierQuoteLabels[quote.status]}</span>
                      </div>
                      <p className="mt-2 text-[13px] text-[#64748b]">
                        {quote.contactName} · {formatCurrency(quote.priceCents)} · {quote.leadTimeDays ? `${quote.leadTimeDays} day lead time` : "Lead time pending"}
                      </p>
                      {quote.notes ? <p className="mt-2 text-[13px] leading-5 text-[#64748b]">{quote.notes}</p> : null}
                    </article>
                  ))
                ) : (
                  <p className="rounded-md border border-dashed border-[#d9d9d9] bg-[#fafafa] p-4 text-[13px] text-[#64748b]">No supplier outreach has been recorded yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminQuoteManagement({
  requests,
  saveQuoteAction,
  updateStatusAction,
}: {
  requests: LatticeRequest[];
  saveQuoteAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("ALL");
  const [detailRequest, setDetailRequest] = useState<LatticeRequest | null>(null);
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);

  const quoteRequests = useMemo(() => requests.filter((request) => request.status !== "DRAFT" && request.status !== "PURCHASED"), [requests]);
  const activeSupplierQuotes = quoteRequests.reduce((count, request) => count + receivedSupplierQuotes(request).length, 0);
  const quotedValueCents = quoteRequests.reduce((sum, request) => sum + (request.quote.estimatedPriceCents ?? 0), 0);
  const blockedRequests = quoteRequests.filter((request) => request.status === "NEEDS_INFO").length;

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return quoteRequests.filter((request) => {
      const primaryLine = request.lineItems[0];
      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
      const searchable = [
        request.title,
        request.process,
        request.buyerCompany,
        request.requesterName,
        quoteReference(request),
        primaryLine?.partName,
        primaryLine?.material,
        ...request.supplierQuotes.map((quote) => quote.shopName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, quoteRequests, statusFilter]);

  function openDetail(request: LatticeRequest, showQuoteBuilder = false) {
    setDetailRequest(request);
    setIsQuoteBuilderOpen(showQuoteBuilder);
  }

  return (
    <div className="space-y-5">
      {detailRequest ? (
        <AdminQuoteDetailDrawer
          isQuoteBuilderOpen={isQuoteBuilderOpen}
          onClose={() => setDetailRequest(null)}
          onQuoteBuilderOpenChange={setIsQuoteBuilderOpen}
          request={detailRequest}
          saveQuoteAction={saveQuoteAction}
          updateStatusAction={updateStatusAction}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Active submissions</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{quoteRequests.length}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Shop quotes</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{activeSupplierQuotes}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Blocked</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{blockedRequests}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Quoted value</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{formatCurrency(quotedValueCents)}</p>
        </article>
      </section>

      {quoteRequests.length === 0 ? (
        <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
          <h2 className="text-[22px] font-semibold text-[#202020]">No active quote submissions</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">Submitted RFQs will appear here once customers request quotes.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
          <div className="border-b border-[#eeeeee] p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block xl:w-[360px]">
                <span className="sr-only">Search quote submissions</span>
                <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" fill="none" viewBox="0 0 20 20">
                  <path d="m14 14 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
                  <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <input
                  className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search RFQ, customer, shop..."
                  type="search"
                  value={query}
                />
              </label>
              <div aria-label="Admin quote status filters" className="flex gap-2 overflow-x-auto pb-1">
                {statusFilters.map((filter) => {
                  const isActive = statusFilter === filter.value;

                  return (
                    <button
                      className={`h-9 shrink-0 rounded-md border px-3 text-[13px] font-semibold transition ${
                        isActive ? "border-[#4f3424] bg-[#4f3424] text-white" : "border-[#e4c0a3] bg-white text-[#6b4a34] hover:bg-[#fff6ee]"
                      }`}
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1.16fr_0.72fr_0.76fr_0.56fr_0.56fr_0.78fr] gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
            <span>RFQ</span>
            <span>Customer</span>
            <span>Shop quotes</span>
            <span>Price</span>
            <span>Due</span>
            <span>Next step</span>
          </div>

          <div className="divide-y divide-[#eeeeee]">
            {filteredRequests.map((request) => {
              const primaryLine = request.lineItems[0];
              const status = statusCopy[request.status];
              const latestCustomerQuote = request.customerQuotes.at(-1);

              return (
                <article
                  aria-label={`Manage quote submission for ${request.title}`}
                  className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f3424] xl:grid-cols-[1.16fr_0.72fr_0.76fr_0.56fr_0.56fr_0.78fr] xl:items-center"
                  key={request.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                    </div>
                    <button
                      className="mt-2 block max-w-full truncate text-left text-[15px] font-semibold text-[#202020] transition hover:text-[#4f3424]"
                      onClick={() => openDetail(request)}
                      type="button"
                    >
                      {request.title}
                    </button>
                    <p className="mt-1 truncate text-[13px] text-[#69707a]">
                      {primaryLine?.partName ?? "No line item"} - {request.process}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Customer</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.buyerCompany}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{request.requesterName}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Shop quotes</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{supplierSummary(request)}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{request.supplierQuotes.length} shop(s) contacted</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Price</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{formatCurrency(request.quote.estimatedPriceCents)}</p>
                    {latestCustomerQuote ? <p className="mt-1 text-[12px] text-[#8a8f98]">Customer v{latestCustomerQuote.versionNumber} issued</p> : null}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Due</p>
                    <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{formatDate(request.dueDate)}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Next step</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{nextActionForRequest(request)}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} day lead time` : "Lead time pending"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                        onClick={() => openDetail(request)}
                        type="button"
                      >
                        Open RFQ
                      </button>
                      {saveQuoteAction ? (
                        <button
                          className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                          onClick={() => openDetail(request, true)}
                          type="button"
                        >
                          {latestCustomerQuote ? "Revise quote" : "Issue quote"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <h2 className="text-[18px] font-semibold text-[#202020]">No quote submissions match this view.</h2>
                <p className="mt-2 text-[14px] text-[#6f737a]">Clear the search or choose a different status filter.</p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
            <span>
              Showing {filteredRequests.length} of {quoteRequests.length} submissions
            </span>
            <span>Rows open the RFQ command drawer</span>
          </div>
        </section>
      )}
    </div>
  );
}
