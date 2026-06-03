import Link from "next/link";
import { ArrowLeft, Download, FileText, Mail, Phone, User } from "lucide-react";

import type { LatticeRequest, RequestLineItem, RequestStatus } from "@/lib/request-model";

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
  const customerLine = request.customerQuotes.at(-1)?.lineItems.find((line) => line.description === item.partName || line.id === item.id);

  if (customerLine) {
    return Math.round(customerLine.unitPrice * customerLine.quantity * 100);
  }

  if (request.lineItems.length === 1) {
    return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  }

  return null;
}

function configurationText(request: LatticeRequest, item: RequestLineItem) {
  return [request.process, item.material, item.generalTolerance, item.surfaceFinish || "No finish (as machined)", ...(item.qualityDocumentation ?? [])].filter(Boolean).join(" / ");
}

function productionRegion(request: LatticeRequest) {
  if (request.quote.shippingMethod === "Domestic") {
    return "Domestic";
  }

  return "Overseas";
}

function reviewedFilesLabel(request: LatticeRequest) {
  const latestQuote = request.customerQuotes.at(-1);

  if (latestQuote?.filesReviewed) {
    return latestQuote.filesReviewed;
  }

  return request.files.map((file) => file.name).join(", ") || "No files attached";
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
  const selectedSupplierQuote = request.supplierQuotes.find((quote) => quote.isSelected || quote.status === "SELECTED");
  const subtotalCents = latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents;
  const shippingCents = request.quote.shippingCostCents;
  const taxCents = subtotalCents === null ? null : 0;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (taxCents ?? 0);
  const quoteId = latestCustomerQuote?.quoteNumber ?? quoteReference(request);

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

          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <button className="font-semibold text-[#2f73c8] transition hover:text-[#171717]" type="button">
              Select files or drag and drop here to upload
            </button>
            <span className="text-[#d5d8dd]">|</span>
            <button className="text-[#555b64] transition hover:text-[#171717]" type="button">
              Configure as drawing
            </button>
            <span className="text-[#d5d8dd]">|</span>
            <button className="text-[#555b64] transition hover:text-[#171717]" type="button">
              Select all
            </button>
          </div>

          <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 bg-[#f3f3f3] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-[20px] font-semibold uppercase tracking-normal text-[#111111]">Summary of order</h2>
              <p className="text-[20px] font-semibold uppercase tracking-normal text-[#111111]">Order total {formatPrice(totalCents)}</p>
            </div>

            <div className="hidden grid-cols-[56px_minmax(300px,1.7fr)_minmax(132px,0.65fr)_minmax(72px,0.35fr)_minmax(112px,0.55fr)_minmax(112px,0.55fr)] gap-5 border-b-4 border-[#111111] px-6 py-4 text-[13px] font-semibold text-[#111111] min-[1200px]:grid">
              <span>#</span>
              <span>Part details</span>
              <span>Production region</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Subtotal</span>
            </div>

            <div className="divide-y divide-[#b8b8b8]">
              {request.lineItems.map((item, index) => {
                const total = lineItemTotalCents(item, request);
                const unit = lineItemUnitCents(item, total);
                const file = request.files[index] ?? request.files[0];

                return (
                  <article className="grid gap-4 px-6 py-6 min-[1200px]:grid-cols-[56px_minmax(300px,1.7fr)_minmax(132px,0.65fr)_minmax(72px,0.35fr)_minmax(112px,0.55fr)_minmax(112px,0.55fr)] min-[1200px]:gap-5" key={item.id}>
                    <p className="text-[14px] text-[#111111]">
                      <span className="font-semibold min-[1200px]:hidden"># </span>
                      {index + 1}
                    </p>
                    <div className="min-w-0">
                      <p className="break-words text-[15px] font-semibold leading-5 text-[#111111]">{file?.name ? `[Rev 1] ${file.name}` : `[Rev 1] ${item.partName}`}</p>
                      <p className="mt-1 break-words text-[15px] font-semibold leading-5 text-[#111111]">{item.partName}</p>
                      <p className="mt-1 break-words text-[14px] leading-5 text-[#111111]">{configurationText(request, item)}</p>
                      {item.notes ? <p className="mt-1 text-[13px] font-semibold leading-5 text-[#111111]">{item.notes}</p> : null}
                    </div>
                    <p className="text-[14px] text-[#111111]">
                      <span className="font-semibold min-[1200px]:hidden">Production region: </span>
                      {productionRegion(request)}
                    </p>
                    <p className="text-[14px] text-[#111111] min-[1200px]:text-right">
                      <span className="font-semibold min-[1200px]:hidden">Qty: </span>
                      {item.quantity}
                    </p>
                    <p className="text-[14px] text-[#111111] min-[1200px]:text-right">
                      <span className="font-semibold min-[1200px]:hidden">Unit price: </span>
                      {formatPrice(unit)}
                    </p>
                    <p className="text-[14px] text-[#111111] min-[1200px]:text-right">
                      <span className="font-semibold min-[1200px]:hidden">Subtotal: </span>
                      {formatPrice(total)}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="files" className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">Files reviewed</p>
              <div className="mt-4 space-y-3">
                {request.files.map((file) => (
                  <div className="flex items-center gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={file.id}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-[#7b8088]">
                      <FileText aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-[#202020]">{file.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8f98]">{file.type || "CAD file"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">Quote basis</p>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Supplier basis</dt>
                  <dd className="text-right font-semibold text-[#202020]">{selectedSupplierQuote?.shopName ?? "Pending"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Files</dt>
                  <dd className="text-right font-semibold text-[#202020]">{reviewedFilesLabel(request)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Assumptions</dt>
                  <dd className="text-right font-semibold text-[#202020]">{latestCustomerQuote?.assumptions || request.operatorReview.supplierPackageNotes || "CAD is latest revision"}</dd>
                </div>
              </dl>
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
                  <dd className="font-semibold text-[#202020]">{formatPrice(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#202020]">
                    Shipping {request.quote.shippingMethod ? `(${request.quote.shippingMethod})` : ""}
                  </dt>
                  <dd className="font-semibold text-[#202020]">{shippingCents === null ? "Billed at actual" : formatPrice(shippingCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-[#202020]">Tax</dt>
                  <dd className="font-semibold text-[#202020]">{formatPrice(taxCents)}</dd>
                </div>
              </dl>
              <div className="border-t border-[#eeeeee] pt-4">
                <div className="flex justify-between gap-4">
                  <p className="text-[14px] font-semibold text-[#202020]">Total</p>
                  <p className="text-[22px] font-semibold text-[#171717]">{formatPrice(totalCents)}</p>
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
              <p className="mt-3 text-[13px] font-semibold text-[#202020]">{request.buyerCompany}</p>
              <p className="mt-1 text-[13px] leading-5 text-[#5f6670]">
                123 Main Street
                <br />
                Brooklyn, NY 11201
              </p>
              <button className="mt-3 text-[12px] font-semibold text-[#2f73c8] transition hover:text-[#171717]" type="button">
                Change
              </button>
            </div>

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Your dedicated account manager</p>
              <div className="mt-4 flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9fbf3] text-[#0f9d68]">
                  <User aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[#202020]">Erik Mast</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#6f737a]">Account manager, including quoting assistance and help.</p>
                  <div className="mt-2 space-y-1 text-[12px] text-[#2f73c8]">
                    <p className="flex items-center gap-2">
                      <Mail aria-hidden="true" className="h-3.5 w-3.5" />
                      erik.mast@latticeos.com
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                      415-237-8791
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">Quote activity</p>
            <div className="mt-4 space-y-3">
              {request.statusEvents.map((event) => (
                <div className="rounded-md bg-[#fafafa] p-3" key={event.id}>
                  <p className="text-[13px] font-semibold text-[#202020]">{quoteStatusCopy[event.to].label ?? quoteStatusCopy[event.to].requestTitle}</p>
                  <p className="mt-1 text-[12px] text-[#7b8088]">
                    {formatDate(event.at)} by {event.actor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
