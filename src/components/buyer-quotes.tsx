"use client";

import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { deleteBuyerQuoteAction } from "@/app/quotes/actions";
import { CadRenderThumbnail } from "@/components/cad-file-preview";
import { buyerLifecycleTag, type BuyerLifecycleTag } from "@/lib/buyer-lifecycle";
import type { LatticeRequest } from "@/lib/request-model";

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";
const deletedQuoteStorageKey = "lattice.deletedBuyerQuotes.v1";
const quoteTablePageSize = 3;

const buyerQuoteStatusTone: Record<BuyerLifecycleTag, string> = {
  Draft: "border-[#d8dde5] bg-[#f7f8fa] text-[#4f5660]",
  "Quote Requested": "border-[#c9ddff] bg-[#f2f7ff] text-[#2d5f9a]",
  "Quote Received": "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
  "Awaiting supplier acknowledgment": "border-[#c9ddff] bg-[#f2f7ff] text-[#2d5f9a]",
  "In production": "border-[#d8d0ff] bg-[#f4f1ff] text-[#5544a3]",
  "Quality review": "border-[#f1d8a5] bg-[#fff7e8] text-[#8a5b08]",
  "Quality documents ready": "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
  "Ready to ship": "border-[#bee6f4] bg-[#eefaff] text-[#166982]",
  Shipping: "border-[#bee6f4] bg-[#eefaff] text-[#166982]",
  Delivered: "border-[#bfdcc7] bg-[#f0faf2] text-[#2f6a3d]",
  Archived: "border-[#d7d7d7] bg-[#f4f4f4] text-[#4f5660]",
};

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

function formatLastEdited(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
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

function requestEditedTime(request: LatticeRequest) {
  const value = request.updatedAt || request.createdAt;
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function sortRequestsNewestEditedFirst(requests: LatticeRequest[]) {
  return [...requests].sort(
    (left, right) => requestEditedTime(right) - requestEditedTime(left),
  );
}

function quoteTotalQuantity(request: LatticeRequest) {
  if (request.lineItems.length === 0) {
    return null;
  }

  return request.lineItems.reduce((total, lineItem) => total + lineItem.quantity, 0);
}

function QuotePartPreview({ request }: { request: LatticeRequest }) {
  const primaryLine = request.lineItems[0];
  const primaryFile = request.files[0];
  const partCount = Math.max(request.lineItems.length, 1);
  const additionalPartCount = Math.max(partCount - 1, 0);
  const label = primaryLine?.partName ?? primaryFile?.name ?? request.title;

  return (
    <div aria-label={`${partCount} ${partCount === 1 ? "part" : "parts"} in ${request.title}`} className="flex shrink-0 items-center gap-2" role="group">
      <CadRenderThumbnail className="h-[72px] w-[72px] border-[#cbd5df] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]" file={primaryFile} label={label} />
      {additionalPartCount > 0 ? (
        <span
          aria-label={`${additionalPartCount} additional ${additionalPartCount === 1 ? "part" : "parts"}`}
          className="inline-flex h-8 min-w-10 items-center justify-center rounded-full bg-[#eaf2ff] px-3 text-[14px] font-semibold text-[#0b6cf0]"
        >
          +{additionalPartCount}
        </span>
      ) : null}
    </div>
  );
}

function QuoteTable({
  deleteQuote,
  emptyMessage,
  pendingDeleteId,
  requests,
  title,
}: {
  deleteQuote: (request: LatticeRequest) => void;
  emptyMessage: string;
  pendingDeleteId: string | null;
  requests: LatticeRequest[];
  title: string;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(requests.length / quoteTablePageSize));
  const clampedPageIndex = Math.min(pageIndex, pageCount - 1);
  const firstVisibleIndex = clampedPageIndex * quoteTablePageSize;
  const visibleRequests = requests.slice(
    firstVisibleIndex,
    firstVisibleIndex + quoteTablePageSize,
  );
  const hasMultiplePages = requests.length > quoteTablePageSize;

  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-[#202020]">{title}</h2>
      </div>

      <div className="grid grid-cols-[2fr_0.95fr_0.8fr_1.15fr_72px] gap-5 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
        <span>RFQ details</span>
        <span>Process &amp; Qty</span>
        <span>Last edited</span>
        <span>Quote Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {visibleRequests.map((request) => {
          const statusTag = buyerLifecycleTag(request);
          const primaryLine = request.lineItems[0];
          const material = primaryLine?.material ?? "Material pending";
          const totalQuantity = quoteTotalQuantity(request);
          const quoteId = quoteReference(request);

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
                <QuotePartPreview request={request} />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteId}</span>
                  <h3 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</h3>
                  <p className="mt-1 truncate text-[13px] text-[#69707a]">
                    {primaryLine?.partName ?? "No line item"} - {material}
                  </p>
                </div>
              </Link>

              <Link className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]" href={quoteRowHref(request)} tabIndex={-1}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Process &amp; Qty</p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.process}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">Qty {totalQuantity ?? "Pending"} - Due {formatDueDate(request.dueDate)}</p>
              </Link>

              <Link className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]" href={quoteRowHref(request)} tabIndex={-1}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Last edited</p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">
                  {formatLastEdited(request.updatedAt || request.createdAt)}
                </p>
              </Link>

              <Link className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]" href={quoteRowHref(request)} tabIndex={-1}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Quote Status</p>
                <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[12px] font-semibold ${buyerQuoteStatusTone[statusTag]}`}>{statusTag}</span>
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
          {hasMultiplePages
            ? `Showing ${firstVisibleIndex + 1}-${Math.min(
                firstVisibleIndex + visibleRequests.length,
                requests.length,
              )} of ${requests.length} quotes`
            : `Showing ${requests.length} ${
                requests.length === 1 ? "quote" : "quotes"
              }`}
        </span>
        {hasMultiplePages ? (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#e2e2e2] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={clampedPageIndex === 0}
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="px-1 font-medium text-[#555b64]">
              Page {clampedPageIndex + 1} of {pageCount}
            </span>
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#e2e2e2] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={clampedPageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((current) => Math.min(pageCount - 1, current + 1))
              }
              type="button"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function BuyerQuotes({ requests }: { requests: LatticeRequest[] }) {
  const [localIncompleteRequests] = useState<LatticeRequest[]>(readLocalIncompleteRequests);
  const [deletedQuoteIds, setDeletedQuoteIds] = useState<string[]>(readDeletedQuoteIds);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleRequests = useMemo(() => {
    const localIds = new Set(localIncompleteRequests.map((request) => request.id));
    const deletedIds = new Set(deletedQuoteIds);

    return sortRequestsNewestEditedFirst(
      [...localIncompleteRequests, ...requests.filter((request) => request.status !== "PURCHASED" && !localIds.has(request.id))],
    ).filter((request) => !deletedIds.has(request.id));
  }, [deletedQuoteIds, localIncompleteRequests, requests]);

  const inProgressRequests = useMemo(() => visibleRequests.filter((request) => request.status !== "QUOTED" && request.status !== "CLOSED"), [visibleRequests]);
  const quotedRequests = useMemo(() => visibleRequests.filter((request) => request.status === "QUOTED" || request.status === "CLOSED"), [visibleRequests]);
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
      <QuoteTable
        deleteQuote={deleteQuote}
        emptyMessage="No in-progress quote requests match this view."
        pendingDeleteId={activePendingDeleteId}
        requests={inProgressRequests}
        title="Quotes in progress"
      />
      <QuoteTable
        deleteQuote={deleteQuote}
        emptyMessage="No quoted requests match this view."
        pendingDeleteId={activePendingDeleteId}
        requests={quotedRequests}
        title="Quote received"
      />
    </div>
  );
}
