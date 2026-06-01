"use client";

import Link from "next/link";
import { ChevronRight, ImageIcon, Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { LatticeRequest } from "@/lib/request-model";

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";

const buyerStatusCopy: Record<LatticeRequest["status"], { description: string; nextAction: string; pillTone: string }> = {
  DRAFT: {
    description: "CAD uploaded, but the RFQ has not been submitted yet.",
    nextAction: "Configuring Quote",
    pillTone: "border-[#d8dde5] bg-[#f7f8fa] text-[#4f5660]",
  },
  SUBMITTED: {
    description: "Your RFQ was received and is waiting for internal review.",
    nextAction: "Configuring Quote",
    pillTone: "border-[#cfe0ff] bg-[#eff5ff] text-[#315f9b]",
  },
  NEEDS_INFO: {
    description: "The operator team needs more buyer detail before supplier outreach.",
    nextAction: "Configuring Quote",
    pillTone: "border-[#f1d8a5] bg-[#fff7e8] text-[#8a5b08]",
  },
  READY_FOR_SUPPLIER_RFQ: {
    description: "Supplier is calculating costs.",
    nextAction: "Configuring Quote",
    pillTone: "border-[#d5d9ff] bg-[#f1f2ff] text-[#4d55a8]",
  },
  QUOTED: {
    description: "Pricing is ready for buyer review and purchase decision.",
    nextAction: "Quote Received",
    pillTone: "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
  },
  PURCHASED: {
    description: "This quote has been converted into an order.",
    nextAction: "Quote Closed",
    pillTone: "border-[#d7d7d7] bg-[#f4f4f4] text-[#242424]",
  },
};

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

function formatDueDate(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function quoteReference(request: LatticeRequest) {
  return `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function quoteRowHref(request: LatticeRequest) {
  if (request.status === "DRAFT") {
    return `/requests/new?draft=${request.id}`;
  }

  return `/quotes/${request.id}`;
}

function readLocalIncompleteRequests() {
  if (typeof window === "undefined" || !window.localStorage?.getItem) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(incompleteRfqStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((draft) => draft?.request)
      .filter((request): request is LatticeRequest => Boolean(request?.id && request?.status === "DRAFT"));
  } catch {
    return [];
  }
}

export function BuyerQuotes({ requests }: { requests: LatticeRequest[] }) {
  const [query, setQuery] = useState("");
  const [localIncompleteRequests] = useState<LatticeRequest[]>(readLocalIncompleteRequests);

  const visibleRequests = useMemo(() => {
    const localIds = new Set(localIncompleteRequests.map((request) => request.id));

    return [...localIncompleteRequests, ...requests.filter((request) => !localIds.has(request.id))].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }, [localIncompleteRequests, requests]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleRequests.filter((request) => {
      const primaryLine = request.lineItems[0];
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

      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [query, visibleRequests]);

  if (visibleRequests.length === 0) {
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
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" strokeWidth={1.8} />
            <input
              className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search RFQ, part, or material..."
              type="search"
              value={query}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_0.95fr_0.8fr_1.15fr_24px] gap-5 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
        <span>RFQ details</span>
        <span>Process &amp; Qty</span>
        <span>Quote</span>
        <span>Status &amp; Next Step</span>
        <span />
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {filteredRequests.map((request) => {
          const status = buyerStatusCopy[request.status];
          const primaryLine = request.lineItems[0];
          const material = primaryLine?.material ?? "Material pending";

          return (
            <Link
              aria-label={request.status === "DRAFT" ? `Edit incomplete quote for ${request.title}` : `Open quote detail for ${request.title}`}
              className="grid gap-5 px-4 py-4 transition hover:bg-[#fbfbfb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#171717] xl:grid-cols-[2fr_0.95fr_0.8fr_1.15fr_24px] xl:items-center"
              href={quoteRowHref(request)}
              key={request.id}
            >
              <div className="flex min-w-0 gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e7e7e7] bg-[#f7f8fa] text-[#a2a8b0] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.8)]">
                  <ImageIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                  <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</h2>
                  <p className="mt-1 truncate text-[13px] text-[#69707a]">
                    {primaryLine?.partName ?? "No line item"} - {material}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Process &amp; Qty</p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.process}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">Qty {primaryLine?.quantity ?? "Pending"} - Due {formatDueDate(request.dueDate)}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Quote</p>
                <p className={`mt-1 text-[14px] font-semibold xl:mt-0 ${request.quote.estimatedPriceCents === null ? "italic text-[#777d86]" : "text-[#202020]"}`}>
                  {formatPrice(request.quote.estimatedPriceCents)}
                </p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days lead` : "Pending"}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Status &amp; Next Step</p>
                <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[12px] font-semibold ${status.pillTone}`}>{status.nextAction}</span>
                <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#747a83]">
                  {status.description} - {formatUpdatedAt(request.updatedAt)}
                </p>
              </div>

              <ChevronRight aria-hidden="true" className="hidden h-4 w-4 text-[#a4a9b0] xl:block" strokeWidth={1.8} />
            </Link>
          );
        })}

        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-[18px] font-semibold text-[#202020]">No quotes match this search.</h2>
            <p className="mt-2 text-[14px] text-[#6f737a]">Clear the search to return to the full quote list.</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
        <span>
          Showing {filteredRequests.length} of {visibleRequests.length} quotes
        </span>
        <span>Configuring Quote rows with uploaded CAD remain editable</span>
      </div>
    </section>
  );
}
