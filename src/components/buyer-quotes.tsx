"use client";

import Link from "next/link";
import { ChevronRight, Search, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { deleteBuyerQuoteAction } from "@/app/quotes/actions";
import { CadRenderThumbnail } from "@/components/cad-file-preview";
import type { LatticeRequest } from "@/lib/request-model";

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";
const deletedQuoteStorageKey = "lattice.deletedBuyerQuotes.v1";

const buyerStatusCopy: Record<LatticeRequest["status"], { description: string; nextAction: string; pillTone?: string; quoteStatus?: string }> = {
  DRAFT: {
    description: "CAD uploaded, but the RFQ has not been submitted yet.",
    nextAction: "Finish configuration before requesting a quote.",
    pillTone: "border-[#d8dde5] bg-[#f7f8fa] text-[#4f5660]",
    quoteStatus: "Draft",
  },
  SUBMITTED: {
    description: "Your RFQ was received and is waiting for internal review.",
    nextAction: "Lattice is reviewing the RFQ package.",
  },
  NEEDS_INFO: {
    description: "The operator team needs more buyer detail before supplier outreach.",
    nextAction: "Additional buyer detail is needed.",
  },
  READY_FOR_SUPPLIER_RFQ: {
    description: "Supplier is calculating costs.",
    nextAction: "Supplier pricing is in progress.",
  },
  QUOTED: {
    description: "Pricing is ready for buyer review and purchase decision.",
    nextAction: "Review price and lead time.",
    pillTone: "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
    quoteStatus: "Quote received",
  },
  PURCHASED: {
    description: "This quote has been converted into an order.",
    nextAction: "Track production in Orders.",
    pillTone: "border-[#d7d7d7] bg-[#f4f4f4] text-[#242424]",
    quoteStatus: "Ordered",
  },
  CLOSED: {
    description: "This quote was closed and is no longer active.",
    nextAction: "No buyer action is needed.",
    pillTone: "border-[#d7d7d7] bg-[#f4f4f4] text-[#242424]",
    quoteStatus: "Closed",
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

function sequentialQuoteReference(sequence: number) {
  return `LQ-${String(1000 + sequence).padStart(4, "0")}`;
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

function readDeletedQuoteIds() {
  if (typeof window === "undefined" || !window.localStorage?.getItem) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(deletedQuoteStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeDeletedQuoteIds(ids: string[]) {
  if (typeof window === "undefined" || !window.localStorage?.setItem) {
    return;
  }

  window.localStorage.setItem(deletedQuoteStorageKey, JSON.stringify(ids));
}

function deleteStoredQuoteId(id: string) {
  const nextIds = readDeletedQuoteIds().filter((storedId) => storedId !== id);
  writeDeletedQuoteIds(nextIds);
}

function removeLocalIncompleteRequest(id: string) {
  if (typeof window === "undefined" || !window.localStorage?.setItem) {
    return;
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(incompleteRfqStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) {
      return;
    }

    window.localStorage.setItem(
      incompleteRfqStorageKey,
      JSON.stringify(parsed.filter((draft) => draft?.id !== id && draft?.request?.id !== id)),
    );
  } catch {
    return;
  }
}

function sortRequestsNewestCreatedFirst(requests: LatticeRequest[]) {
  return [...requests].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function buildQuoteReferenceMap(requests: LatticeRequest[]) {
  const sortedRequests = [...requests].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime() ||
      left.id.localeCompare(right.id),
  );

  return new Map(sortedRequests.map((request, index) => [request.id, sequentialQuoteReference(index + 1)]));
}

function QuoteTable({
  deleteQuote,
  emptyMessage,
  footerNote,
  pendingDeleteId,
  quoteReferences,
  requests,
  title,
}: {
  deleteQuote: (request: LatticeRequest) => void;
  emptyMessage: string;
  footerNote: string;
  pendingDeleteId: string | null;
  quoteReferences: Map<string, string>;
  requests: LatticeRequest[];
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[#202020]">{title}</h2>
      </div>

      <div className="grid grid-cols-[2fr_0.95fr_0.8fr_1.15fr_72px] gap-5 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
        <span>RFQ details</span>
        <span>Process &amp; Qty</span>
        <span>Quote</span>
        <span>Quote Status &amp; Next Step</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {requests.map((request) => {
          const status = buyerStatusCopy[request.status];
          const primaryLine = request.lineItems[0];
          const material = primaryLine?.material ?? "Material pending";
          const primaryFile = request.files[0];
          const quoteReference = quoteReferences.get(request.id) ?? sequentialQuoteReference(1);

          return (
            <div
              className="grid gap-5 px-4 py-4 transition hover:bg-[#fbfbfb] xl:grid-cols-[2fr_0.95fr_0.8fr_1.15fr_72px] xl:items-center"
              key={request.id}
            >
              <Link
                aria-label={request.status === "DRAFT" ? `Edit incomplete quote for ${request.title}` : `Open quote detail for ${request.title}`}
                className="flex min-w-0 gap-4 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
                href={quoteRowHref(request)}
              >
                <CadRenderThumbnail file={primaryFile} label={primaryLine?.partName ?? request.title} />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference}</span>
                  <h3 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</h3>
                  <p className="mt-1 truncate text-[13px] text-[#69707a]">
                    {primaryLine?.partName ?? "No line item"} - {material}
                  </p>
                </div>
              </Link>

              <Link className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]" href={quoteRowHref(request)} tabIndex={-1}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Process &amp; Qty</p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.process}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">Qty {primaryLine?.quantity ?? "Pending"} - Due {formatDueDate(request.dueDate)}</p>
              </Link>

              <Link className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]" href={quoteRowHref(request)} tabIndex={-1}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Quote</p>
                <p className={`mt-1 text-[14px] font-semibold xl:mt-0 ${request.quote.estimatedPriceCents === null ? "italic text-[#777d86]" : "text-[#202020]"}`}>
                  {formatPrice(request.quote.estimatedPriceCents)}
                </p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days lead` : "Pending"}</p>
              </Link>

              <Link className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]" href={quoteRowHref(request)} tabIndex={-1}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Quote Status &amp; Next Step</p>
                {status.quoteStatus && status.pillTone ? (
                  <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[12px] font-semibold ${status.pillTone}`}>{status.quoteStatus}</span>
                ) : null}
                <p className="mt-2 text-[12px] font-semibold leading-5 text-[#30343a]">{status.nextAction}</p>
                <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[#747a83]">
                  {status.description} - {formatUpdatedAt(request.updatedAt)}
                </p>
              </Link>

              <div className="flex items-center justify-between gap-2 xl:justify-end">
                <ChevronRight aria-hidden="true" className="h-4 w-4 text-[#a4a9b0] xl:hidden" strokeWidth={1.8} />
                <button
                  aria-label={`Delete quote for ${request.title}`}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e2e2e2] bg-white text-[#8a3f3f] transition hover:border-[#d7b4b4] hover:bg-[#fff6f6] hover:text-[#7c2424] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={pendingDeleteId === request.id}
                  onClick={() => deleteQuote(request)}
                  title="Delete quote"
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          );
        })}

        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[14px] text-[#6f737a]">{emptyMessage}</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
        <span>
          Showing {requests.length} {requests.length === 1 ? "quote" : "quotes"}
        </span>
        <span>{footerNote}</span>
      </div>
    </section>
  );
}

export function BuyerQuotes({ requests }: { requests: LatticeRequest[] }) {
  const [query, setQuery] = useState("");
  const [localIncompleteRequests] = useState<LatticeRequest[]>(readLocalIncompleteRequests);
  const [deletedQuoteIds, setDeletedQuoteIds] = useState<string[]>(readDeletedQuoteIds);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleRequests = useMemo(() => {
    const localIds = new Set(localIncompleteRequests.map((request) => request.id));
    const deletedIds = new Set(deletedQuoteIds);

    return sortRequestsNewestCreatedFirst(
      [...localIncompleteRequests, ...requests.filter((request) => request.status !== "PURCHASED" && !localIds.has(request.id))],
    ).filter((request) => !deletedIds.has(request.id));
  }, [deletedQuoteIds, localIncompleteRequests, requests]);

  const quoteReferences = useMemo(() => buildQuoteReferenceMap(visibleRequests), [visibleRequests]);

  const searchedRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return visibleRequests.filter((request) => {
      const primaryLine = request.lineItems[0];
      const searchable = [
        request.title,
        request.process,
        request.buyerCompany,
        quoteReferences.get(request.id),
        primaryLine?.partName,
        primaryLine?.material,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [query, quoteReferences, visibleRequests]);

  const inProgressRequests = useMemo(() => searchedRequests.filter((request) => request.status !== "QUOTED" && request.status !== "CLOSED"), [searchedRequests]);
  const quotedRequests = useMemo(() => searchedRequests.filter((request) => request.status === "QUOTED" || request.status === "CLOSED"), [searchedRequests]);
  const activePendingDeleteId = isPending ? pendingDeleteId : null;

  function deleteQuote(request: LatticeRequest) {
    const confirmed = window.confirm(`Delete "${request.title}" from quotes?`);

    if (!confirmed) {
      return;
    }

    removeLocalIncompleteRequest(request.id);
    setDeletedQuoteIds((currentIds) => {
      const nextIds = Array.from(new Set([...currentIds, request.id]));
      writeDeletedQuoteIds(nextIds);
      return nextIds;
    });
    setPendingDeleteId(request.id);

    startTransition(async () => {
      try {
        await deleteBuyerQuoteAction(request.id);
      } catch {
        deleteStoredQuoteId(request.id);
        setDeletedQuoteIds((currentIds) => currentIds.filter((id) => id !== request.id));
        window.alert("This quote could not be deleted. Please try again.");
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

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
    <div className="space-y-5">
      <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
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
      </section>

      <QuoteTable
        deleteQuote={deleteQuote}
        emptyMessage="No in-progress quote requests match this view."
        footerNote="Draft rows remain editable until the buyer requests a quote"
        pendingDeleteId={activePendingDeleteId}
        quoteReferences={quoteReferences}
        requests={inProgressRequests}
        title="Quotes in progress"
      />
      <QuoteTable
        deleteQuote={deleteQuote}
        emptyMessage="No quoted requests match this view."
        footerNote="Quote received rows open the buyer quote detail"
        pendingDeleteId={activePendingDeleteId}
        quoteReferences={quoteReferences}
        requests={quotedRequests}
        title="Quote received"
      />
    </div>
  );
}
