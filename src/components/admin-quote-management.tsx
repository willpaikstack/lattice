"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LatticeRequest, SupplierQuoteStatus } from "@/lib/request-model";

const statusCopy: Record<LatticeRequest["status"], { label: string; tone: string; nextAction: string }> = {
  DRAFT: { label: "Draft", nextAction: "Review draft", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  SUBMITTED: { label: "Submitted", nextAction: "Assign owner", tone: "border-blue-100 bg-blue-50 text-blue-700" },
  NEEDS_INFO: { label: "Needs info", nextAction: "Recover missing info", tone: "border-amber-100 bg-amber-50 text-amber-700" },
  READY_FOR_SUPPLIER_RFQ: { label: "Supplier ready", nextAction: "Send shop RFQs", tone: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  QUOTED: { label: "Quoted", nextAction: "Follow buyer decision", tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
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

function quoteReference(request: LatticeRequest) {
  return `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
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

export function AdminQuoteManagement({ requests }: { requests: LatticeRequest[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("ALL");

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

  return (
    <div className="space-y-5">
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

              return (
                <Link
                  aria-label={`Manage quote submission for ${request.title}`}
                  className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f3424] xl:grid-cols-[1.16fr_0.72fr_0.76fr_0.56fr_0.56fr_0.78fr] xl:items-center"
                  href={`/operator/requests/${request.id}`}
                  key={request.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                    </div>
                    <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</h2>
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
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Due</p>
                    <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{formatDate(request.dueDate)}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Next step</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{status.nextAction}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} day lead time` : "Lead time pending"}</p>
                  </div>
                </Link>
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
            <span>Rows open operator review</span>
          </div>
        </section>
      )}
    </div>
  );
}
