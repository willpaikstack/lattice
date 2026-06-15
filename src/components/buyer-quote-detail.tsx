"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDownUp, ArrowLeft, Download, Info, Mail, Phone, Upload, User, X } from "lucide-react";

import { quotedLineForRequestItem, requestShipToLines, type LatticeRequest, type RequestLineItem, type RequestStatus } from "@/lib/request-model";
import { bundledFilesByLineItem } from "@/lib/document-line-item-details";

const quoteStatusCopy: Record<RequestStatus, { label?: string; tone?: string; buyerAction: string; requestTitle: string; requestCopy: string }> = {
  DRAFT: {
    buyerAction: "Submit the request before quote tracking begins.",
    label: "Draft",
    requestCopy: "This RFQ has not been submitted yet.",
    requestTitle: "Submit this RFQ package",
    tone: "border-[#d8dde5] bg-[#f7f8fa] text-[#4f5660]",
  },
  SUBMITTED: {
    buyerAction: "Lattice is checking the RFQ package before supplier outreach.",
    requestCopy: "Lattice is reviewing the uploaded files, material, quantity, and timing before routing this RFQ.",
    requestTitle: "Lattice review in progress",
  },
  NEEDS_INFO: {
    buyerAction: "Additional buyer detail is needed before suppliers can quote accurately.",
    requestCopy: "This information is required for us to determine accurate pricing and any import considerations.",
    requestTitle: "Are these parts for prototype or commercial use?",
  },
  READY_FOR_SUPPLIER_RFQ: {
    buyerAction: "The package is complete and supplier pricing is being collected.",
    requestCopy: "The supplier package is complete. Lattice is collecting pricing and capacity confirmation.",
    requestTitle: "Supplier pricing in progress",
  },
  QUOTED: {
    buyerAction: "Review the price, lead time, assumptions, and accept the quote when approved.",
    label: "Quote received",
    requestCopy: "Pricing is ready. Review the line items, production timing, assumptions, and total before accepting.",
    requestTitle: "Review quote and proceed to purchase",
    tone: "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
  },
  PURCHASED: {
    buyerAction: "This quote has been accepted and converted into an order.",
    label: "Ordered",
    requestCopy: "This quote has already been accepted. Continue to orders to track production.",
    requestTitle: "Order created",
    tone: "border-[#d7d7d7] bg-[#f4f4f4] text-[#242424]",
  },
  CLOSED: {
    buyerAction: "This quote is no longer active.",
    label: "Closed",
    requestCopy: "This quote was closed by the customer or Lattice and is no longer available for purchase.",
    requestTitle: "Quote closed",
    tone: "border-[#d7d7d7] bg-[#f4f4f4] text-[#242424]",
  },
};

function localDate(value: string | null) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return dateOnlyMatch ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])) : new Date(value);
}

function formatDate(value: string | null) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function formatSummaryPrice(cents: number | null) {
  return cents === null ? "-" : formatPrice(cents);
}

function actorLabel(actor: LatticeRequest["statusEvents"][number]["actor"]) {
  const labels: Record<LatticeRequest["statusEvents"][number]["actor"], string> = {
    buyer: "Buyer",
    operator: "Lattice",
    supplier: "Supplier",
    system: "System",
  };

  return labels[actor];
}

function activityEventTitle(event: LatticeRequest["statusEvents"][number]) {
  if (event.from === null && event.to === "DRAFT") {
    return "Draft created";
  }

  if (event.from === "DRAFT" && event.to === "SUBMITTED") {
    return "RFQ submitted for review";
  }

  if (event.to === "NEEDS_INFO") {
    return "More information requested";
  }

  if (event.to === "READY_FOR_SUPPLIER_RFQ") {
    return "Supplier pricing started";
  }

  if (event.to === "QUOTED") {
    return "Quote issued";
  }

  if (event.to === "PURCHASED") {
    return "Quote accepted";
  }

  if (event.to === "CLOSED") {
    return "Quote closed";
  }

  return quoteStatusCopy[event.to].label ?? quoteStatusCopy[event.to].requestTitle;
}

function activityEventDetail(event: LatticeRequest["statusEvents"][number]) {
  if (event.from === null) {
    return `${actorLabel(event.actor)} opened the RFQ workspace.`;
  }

  return `${actorLabel(event.actor)} moved the quote from ${quoteStatusCopy[event.from].label ?? quoteStatusCopy[event.from].requestTitle} to ${quoteStatusCopy[event.to].label ?? quoteStatusCopy[event.to].requestTitle}.`;
}

function quoteReference(request: LatticeRequest) {
  return `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function lineItemUnitCents(item: RequestLineItem, totalCents: number | null) {
  if (totalCents === null || item.quantity <= 0) {
    return null;
  }

  return Math.round(totalCents / item.quantity);
}

function lineItemTotalCents(item: RequestLineItem, request: LatticeRequest) {
  const customerLine = quotedLineForRequestItem(request.customerQuotes.at(-1)?.lineItems, item);

  if (customerLine) {
    return Math.round(customerLine.unitPrice * customerLine.quantity * 100);
  }

  if (request.lineItems.length === 1) {
    return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  }

  return null;
}

function CadRenderPreview({ file, index }: { file: LatticeRequest["files"][number] | undefined; index: number }) {
  const faceTone = index % 2 === 0 ? "bg-[#d8e5f3]" : "bg-[#dfe7dd]";
  const sideTone = index % 2 === 0 ? "bg-[#b8cbe1]" : "bg-[#c2d1bf]";
  const topTone = index % 2 === 0 ? "bg-[#edf3fa]" : "bg-[#eef4ec]";
  const thumbnailHref = file?.cadPreviewUrn
    ? `/api/cad-previews/thumbnail?urn=${encodeURIComponent(file.cadPreviewUrn)}&size=320`
    : null;

  return (
    <div className="w-20 shrink-0 overflow-hidden rounded-md border border-[#d9dde4] bg-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)]">
      <div className="relative h-16 bg-[linear-gradient(90deg,rgba(17,24,39,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(17,24,39,0.06)_1px,transparent_1px)] bg-[size:10px_10px]">
        {thumbnailHref ? (
          <Image
            alt={file?.name ? `CAD preview for ${file.name}` : "CAD preview"}
            className="h-full w-full object-cover"
            height={64}
            src={thumbnailHref}
            unoptimized
            width={80}
          />
        ) : (
          <>
            <div className={`absolute left-5 top-7 h-7 w-10 -skew-y-6 rounded-sm border border-[#8f9ba8] ${faceTone}`} />
            <div className={`absolute left-7 top-4 h-8 w-10 skew-y-[20deg] rounded-sm border border-[#9aa6b2] ${topTone}`} />
            <div className={`absolute left-[3.35rem] top-7 h-8 w-6 skew-y-[20deg] rounded-sm border border-[#8f9ba8] ${sideTone}`} />
            <span className="absolute bottom-1 left-1 rounded bg-white/85 px-1 py-0.5 text-[8px] font-semibold uppercase text-[#69717c]">Preview pending</span>
          </>
        )}
      </div>
      <p className="border-t border-[#e4e6ea] px-2 py-1 text-center text-[12px] font-semibold text-[#5f6670]">Rev 1</p>
    </div>
  );
}

function sortIndicator() {
  return <ArrowDownUp aria-hidden="true" className="ml-1 inline h-3.5 w-3.5 text-[#b7bcc4]" />;
}

function customerFacingFileName(fileName: string | undefined, fallback: string) {
  return fileName?.trim() || fallback;
}

function fileDownloadHref(file: LatticeRequest["files"][number] | undefined) {
  return file?.storageKey
    ? `/api/local-files/${file.storageKey}?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`
    : null;
}

function quoteShippingAddressLines(request: LatticeRequest) {
  const lines = requestShipToLines({
    shipToAddress1: request.shipToAddress1,
    shipToAddress2: request.shipToAddress2,
    shipToCity: request.shipToCity,
    shipToCompany: request.shipToCompany || request.buyerCompany,
    shipToName: request.shipToName,
    shipToPhone: request.shipToPhone,
    shipToState: request.shipToState,
    shipToZipCode: request.shipToZipCode,
  });

  return lines.length ? lines : [request.buyerCompany, "Shipping address pending"];
}

export function BuyerQuoteDetail({
  checkoutHref,
  request,
}: {
  checkoutHref?: string;
  request: LatticeRequest;
}) {
  const canPurchase = request.status === "QUOTED";
  const canDownloadQuote = request.status === "QUOTED" || request.status === "CLOSED";
  const status = quoteStatusCopy[request.status];
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const subtotalCents = latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents;
  const shippingCents = request.quote.shippingCostCents;
  const taxCents = subtotalCents === null ? null : 0;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (taxCents ?? 0);
  const quoteId = latestCustomerQuote?.quoteNumber ?? quoteReference(request);
  const reviseHref = `/requests/new?revise=${request.id}`;
  const shippingAddressLines = quoteShippingAddressLines(request);
  const lineItemFiles = bundledFilesByLineItem(request);
  const lineItemIds = useMemo(() => request.lineItems.map((item) => item.id), [request.lineItems]);
  const [selectedLineItemIds, setSelectedLineItemIds] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const selectedCount = selectedLineItemIds.size;
  const allLineItemsSelected = lineItemIds.length > 0 && selectedCount === lineItemIds.length;
  const someLineItemsSelected = selectedCount > 0 && !allLineItemsSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someLineItemsSelected;
    }
  }, [someLineItemsSelected]);

  function toggleAllLineItems(checked: boolean) {
    setSelectedLineItemIds(checked ? new Set(lineItemIds) : new Set());
  }

  function toggleLineItem(lineItemId: string, checked: boolean) {
    setSelectedLineItemIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(lineItemId);
      } else {
        next.delete(lineItemId);
      }

      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-2 pb-10">
      <div className="mb-7">
        <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6f737a] transition hover:text-[#171717]" href="/quotes">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
          Back to Quotes
        </Link>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-semibold leading-tight tracking-normal text-[#171717]">{quoteId}</h1>
            {status.label && status.tone ? (
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${status.tone}`}>{status.label}</span>
            ) : null}
            <span className="text-[13px] text-[#7b8088]">Last modified: {formatDate(request.updatedAt)}</span>
          </div>
          <p className="text-[13px] text-[#7b8088]">{request.title}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <main className="space-y-5 xl:col-span-8">
          <section className="rounded-md border border-[#e7e7e7] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex gap-2 text-[13px] leading-6 text-[#4f5660]">
              <span className="font-semibold text-[#171717]">Request:</span>
              <div>
                <p className="font-medium text-[#262a30]">{status.requestTitle}</p>
                <p className="mt-1 text-[#6f737a]">{latestCustomerQuote?.notes || request.operatorReview.internalNotes || status.requestCopy}</p>
              </div>
            </div>
          </section>

          {request.revisionNumber > 1 || request.revisionChangeLog.length > 0 ? (
            <section className="rounded-md border border-[#e7e7e7] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">Revision history</p>
                  <h2 className="mt-1 text-[18px] font-semibold text-[#202020]">Revision {request.revisionNumber}</h2>
                </div>
                {request.revisionOfRequestId ? <span className="text-[12px] font-medium text-[#6f737a]">Original: {request.revisionOfRequestId}</span> : null}
              </div>
              <ul className="mt-4 space-y-2 text-[13px] leading-6 text-[#4f5660]">
                {(request.revisionChangeLog.length ? request.revisionChangeLog : ["Revision submitted for updated review."]).map((change) => (
                  <li className="rounded-md bg-[#fafafa] px-3 py-2" key={change}>{change}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="border-b border-[#d8dce2] px-5 py-4">
              <div className="flex flex-wrap gap-3">
                <Link className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d5d9df] bg-white px-4 text-[14px] font-medium text-[#30343a] transition hover:border-[#aeb6c2] hover:bg-[#f8fafc]" href={reviseHref}>
                  <Upload aria-hidden="true" className="h-4 w-4" />
                  Select files or drag and drop here to upload
                </Link>
              </div>
              <h2 className="sr-only">Summary of order</h2>
            </div>

            <div className="overflow-x-auto" data-testid="quote-line-items-scroll">
              <div className="min-w-[1044px]">
                <div className="grid grid-cols-[40px_minmax(360px,1.45fr)_minmax(250px,1fr)_120px_126px] items-center gap-5 bg-[#fbfbfc] py-4 pl-5 pr-12 text-[15px] font-semibold text-[#262a30] shadow-[inset_0_-1px_0_#d8dce2]">
                  <span className="flex justify-start">
                    <input
                      aria-label="Select all line items"
                      checked={allLineItemsSelected}
                      className="h-5 w-5 rounded border-[#d2d7de]"
                      onChange={(event) => toggleAllLineItems(event.currentTarget.checked)}
                      ref={selectAllRef}
                      type="checkbox"
                    />
                  </span>
                  <span>Name {sortIndicator()}</span>
                  <span>Configuration {sortIndicator()}</span>
                  <span className="flex items-center justify-end gap-1">
                    Quantity
                    <Info aria-hidden="true" className="h-4 w-4 text-[#5d86ff]" />
                    {sortIndicator()}
                  </span>
                  <span className="text-right">Price {sortIndicator()}</span>
                </div>

                <div className="divide-y divide-[#e2e5e9]">
                  {request.lineItems.map((item, index) => {
                    const total = lineItemTotalCents(item, request);
                    const unit = lineItemUnitCents(item, total);
                    const files = lineItemFiles[index];
                    const file = files?.cadFile ?? request.files[index] ?? request.files[0];
                    const drawingFile = files?.drawingFile;
                    const fileName = customerFacingFileName(file?.name, item.partName);
                    const downloadHref = fileDownloadHref(file);

                    return (
                      <article className="grid grid-cols-[40px_minmax(360px,1.45fr)_minmax(250px,1fr)_120px_126px] items-start gap-5 py-7 pl-5 pr-12" key={item.id}>
                        <div className="flex justify-start">
                          <input
                            aria-label={`Select ${item.partName}`}
                            checked={selectedLineItemIds.has(item.id)}
                            className="mt-1 h-5 w-5 rounded border-[#d2d7de]"
                            onChange={(event) => toggleLineItem(item.id, event.currentTarget.checked)}
                            type="checkbox"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-start gap-4">
                            <CadRenderPreview file={file} index={index} />
                            <div className="min-w-0">
                              {downloadHref ? (
                                <a className="block truncate text-[15px] font-semibold text-[#4f7cff] transition hover:text-[#244bc7] hover:underline" download={fileName} href={downloadHref}>
                                  {fileName}
                                </a>
                              ) : (
                                <p className="truncate text-[15px] font-semibold text-[#4f7cff]">{fileName}</p>
                              )}
                              {drawingFile ? (
                                <span className="mt-2 inline-flex max-w-full items-center gap-2 rounded-md border border-[#d9dde4] bg-[#fafafa] px-2 py-1 text-[13px] font-medium text-[#4f7cff]">
                                  <span className="truncate">{drawingFile.name}</span>
                                  <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8a9099]" />
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="text-[14px] leading-5 text-[#30343a]">
                          <p className="font-semibold">{request.process || "CNC"}</p>
                          <p className="font-semibold text-[#5f6670]">{item.material}</p>
                          <p className="text-[#5f6670]">{item.surfaceFinish || "No finish (As machined)"}</p>
                          {(item.qualityDocumentation ?? []).length > 0 ? (
                            <p className="text-[#5f6670]">{(item.qualityDocumentation ?? []).join(", ")}</p>
                          ) : null}
                          <Link className="mt-2 inline-flex font-semibold text-[#4f7cff] transition hover:text-[#244bc7]" href={reviseHref}>
                            Edit configuration
                          </Link>
                        </div>
                        <div className="flex min-h-11 items-center px-4 text-[16px] font-semibold text-[#262a30]" aria-label={`Quantity for ${item.partName}`}>
                          {item.quantity}
                        </div>
                        <div className="text-right">
                          <p className="text-[18px] font-semibold text-[#262a30]">{formatSummaryPrice(total)}</p>
                          <p className="mt-1 text-[14px] text-[#5f6670]">{unit === null ? "-" : `${formatPrice(unit)}/ea`}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

        </main>

        <aside className="space-y-5 xl:col-span-4">
          <section className="rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:sticky xl:top-6">
            <div className="border-b border-[#eeeeee] px-6 py-5">
              <h2 className="text-[16px] font-semibold text-[#202020]">Summary</h2>
            </div>
            <div className="cursor-pointer space-y-4 px-6 py-5">
              <dl className="space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#202020]">Part production</dt>
                  <dd className="font-semibold text-[#202020]">{formatSummaryPrice(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#202020]">
                    Shipping {request.quote.shippingMethod ? `(${request.quote.shippingMethod})` : ""}
                  </dt>
                  <dd className="font-semibold text-[#202020]">{formatSummaryPrice(shippingCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#202020]">Tax</dt>
                  <dd className="font-semibold text-[#202020]">{formatSummaryPrice(taxCents)}</dd>
                </div>
              </dl>
              <div className="border-t border-[#eeeeee] pt-4">
                <div className="flex justify-between gap-4">
                  <p className="text-[14px] font-semibold text-[#202020]">Total</p>
                  <p className="text-[22px] font-semibold text-[#171717]">{formatSummaryPrice(totalCents)}</p>
                </div>
              </div>

              {request.status === "PURCHASED" ? (
                <Link className="flex min-h-11 w-full items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b]" href="/orders">
                  View order
                </Link>
              ) : canPurchase && checkoutHref ? (
                <form action={checkoutHref} method="get">
                  <button className="min-h-11 w-full rounded-md bg-[#0f9d68] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0b8558]" type="submit">
                    Accept quote
                  </button>
                </form>
              ) : (
                <button
                  className="min-h-11 w-full rounded-md bg-[#d5d8dd] px-4 text-[14px] font-semibold text-white disabled:cursor-not-allowed"
                  disabled
                  type="button"
                >
                  {canPurchase ? "Accept quote" : status.buyerAction}
                </button>
              )}
              {canDownloadQuote ? (
                <a
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-4 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]"
                  download={`${quoteId.toLowerCase()}-quote.pdf`}
                  href={`/quotes/${request.id}/quote.pdf`}
                >
                  <Download aria-hidden="true" className="h-3.5 w-3.5" />
                  Download quote PDF
                </a>
              ) : null}
            </div>

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Shipping address</p>
              <p className="mt-3 text-[13px] font-semibold text-[#202020]">{shippingAddressLines[0]}</p>
              {shippingAddressLines.length > 1 ? (
                <p className="mt-1 text-[13px] leading-5 text-[#5f6670]">
                  {shippingAddressLines.slice(1).map((line) => (
                    <span className="block" key={line}>
                      {line}
                    </span>
                  ))}
                </p>
              ) : null}
              <Link className="mt-3 inline-flex text-[12px] font-semibold text-[#2f73c8] transition hover:text-[#171717]" href="/account/settings?edit=shipping">
                Change
              </Link>
            </div>

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Your dedicated account manager</p>
              <div className="mt-4 flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9fbf3] text-[#0f9d68]">
                  <User aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[#202020]">William Paik</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#6f737a]">Account manager, including quoting assistance and help.</p>
                  <div className="mt-2 space-y-1 text-[12px] text-[#2f73c8]">
                    <p className="flex items-center gap-2">
                      <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                      will@latticeos.co
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                      +1 (929) 585-9892
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">Quote activity</p>
                <p className="mt-1 text-[12px] leading-5 text-[#6f737a]">Event log for this RFQ.</p>
              </div>
              <span className="rounded-full bg-[#f4f6f8] px-2 py-1 text-[11px] font-semibold text-[#6f737a]">{request.statusEvents.length}</span>
            </div>
            <div className="mt-5">
              {request.statusEvents.map((event, index) => {
                const isLast = index === request.statusEvents.length - 1;

                return (
                  <div className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-5 last:pb-0" key={event.id}>
                    {!isLast ? <span className="absolute left-[8px] top-5 h-[calc(100%-1rem)] w-px bg-[#dfe3e8]" aria-hidden="true" /> : null}
                    <span className="relative z-10 mt-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#9fb8ff] bg-white">
                      <span className="h-2 w-2 rounded-full bg-[#4f7cff]" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-[13px] font-semibold text-[#202020]">{activityEventTitle(event)}</p>
                        <time className="text-[11px] font-medium text-[#8a8f98]" dateTime={event.at}>{formatDateTime(event.at)}</time>
                      </div>
                      <p className="mt-1 text-[12px] leading-5 text-[#5f6670]">{activityEventDetail(event)}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9aa0a9]">{actorLabel(event.actor)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
