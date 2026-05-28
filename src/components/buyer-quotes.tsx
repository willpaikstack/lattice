"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LatticeRequest } from "@/lib/request-model";

import { CadFilePreview } from "./cad-file-preview";

const buyerStatusCopy: Record<LatticeRequest["status"], { label: string; tone: string; description: string; nextAction: string }> = {
  DRAFT: {
    label: "Draft",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
    description: "Not submitted yet.",
    nextAction: "Submit RFQ",
  },
  SUBMITTED: {
    label: "Submitted",
    tone: "border-blue-100 bg-blue-50 text-blue-700",
    description: "Your RFQ was received and is waiting for internal review.",
    nextAction: "Awaiting review",
  },
  NEEDS_INFO: {
    label: "Needs info",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
    description: "The operator team needs more buyer detail before supplier outreach.",
    nextAction: "Add information",
  },
  READY_FOR_SUPPLIER_RFQ: {
    label: "Under supplier review",
    tone: "border-indigo-100 bg-indigo-50 text-indigo-700",
    description: "The package is complete and ready for supplier RFQ outreach.",
    nextAction: "Supplier pricing",
  },
  QUOTED: {
    label: "Priced",
    tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
    description: "Pricing is ready for buyer review and purchase decision.",
    nextAction: "Review quote",
  },
  PURCHASED: {
    label: "Purchased",
    tone: "border-slate-950 bg-slate-950 text-white",
    description: "This quote has been converted into an order.",
    nextAction: "View order",
  },
};

const statusFilters: Array<{ label: string; value: "ALL" | LatticeRequest["status"] }> = [
  { label: "All", value: "ALL" },
  { label: "Needs info", value: "NEEDS_INFO" },
  { label: "Supplier review", value: "READY_FOR_SUPPLIER_RFQ" },
  { label: "Quoted", value: "QUOTED" },
  { label: "Purchased", value: "PURCHASED" },
];

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function quoteReference(request: LatticeRequest) {
  return `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

export function BuyerQuotes({ requests }: { requests: LatticeRequest[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("ALL");

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const primaryLine = request.lineItems[0];
      const matchesStatus = statusFilter === "ALL" || request.status === statusFilter;
      const searchable = [
        request.title,
        request.process,
        request.buyerCompany,
        quoteReference(request),
        primaryLine?.partName,
        primaryLine?.material,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, requests, statusFilter]);

  if (requests.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
        <h2 className="text-[22px] font-semibold text-[#202020]">No submitted RFQs yet.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
          Submit a request quote package first. It will appear here as a buyer-facing quote tracker while operator review continues internally.
        </p>
        <Link className="mt-6 inline-flex min-h-10 items-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b]" href="/requests/new">
          Request Quote
        </Link>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-[360px]">
            <span className="sr-only">Search quotes</span>
            <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" fill="none" viewBox="0 0 20 20">
              <path d="m14 14 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
              <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <input
              className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search RFQ, part, material..."
              type="search"
              value={query}
            />
          </label>
          <div aria-label="Quote status filters" className="flex gap-2 overflow-x-auto pb-1">
            {statusFilters.map((filter) => {
              const isActive = statusFilter === filter.value;

              return (
                <button
                  className={`h-9 shrink-0 rounded-md border px-3 text-[13px] font-semibold transition ${
                    isActive ? "border-[#171717] bg-[#171717] text-white" : "border-[#dddddd] bg-white text-[#5f646c] hover:bg-[#f7f7f7]"
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

      <div className="grid grid-cols-[1.18fr_0.72fr_0.62fr_0.58fr_0.6fr_0.7fr_0.82fr] gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
        <span>RFQ</span>
        <span>Process</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Lead time</span>
        <span>Updated</span>
        <span>Next step</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {filteredRequests.map((request) => {
          const status = buyerStatusCopy[request.status];
          const primaryLine = request.lineItems[0];
          const material = primaryLine?.material ?? "Material pending";

          return (
            <Link
              aria-label={`Open quote detail for ${request.title}`}
              className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#171717] xl:grid-cols-[1.18fr_0.72fr_0.62fr_0.58fr_0.6fr_0.7fr_0.82fr] xl:items-center"
              href={`/quotes/${request.id}`}
              key={request.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                </div>
                <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</h2>
                <p className="mt-1 truncate text-[13px] text-[#69707a]">
                  {primaryLine?.partName ?? "No line item"} - {material}
                </p>
                <div className="mt-3 xl:hidden">{request.files[0] ? <CadFilePreview compact file={request.files[0]} /> : null}</div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Process</p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.process}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">{request.files.length} file(s)</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Qty</p>
                <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{primaryLine?.quantity ?? "Pending"}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">Due {request.dueDate}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Price</p>
                <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{formatPrice(request.quote.estimatedPriceCents)}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Lead time</p>
                <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Pending"}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Updated</p>
                <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{formatUpdatedAt(request.updatedAt)}</p>
              </div>

              <div>
                <p className="text-[14px] font-semibold text-[#202020]">{status.nextAction}</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#747a83]">{status.description}</p>
              </div>
            </Link>
          );
        })}

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-[18px] font-semibold text-[#202020]">No quotes match this view.</h2>
            <p className="mt-2 text-[14px] text-[#6f737a]">Clear the search or choose a different status filter.</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
        <span>
          Showing {filteredRequests.length} of {requests.length} quotes
        </span>
        <span>Rows open quote details</span>
      </div>
    </section>
  );
}
