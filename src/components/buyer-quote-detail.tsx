import Link from "next/link";
import { ArrowLeft, Download, FileText, ImageIcon, Mail, Phone, User } from "lucide-react";

import type { LatticeRequest, RequestLineItem, RequestStatus } from "@/lib/request-model";

const quoteStatusCopy: Record<RequestStatus, { label: string; tone: string; buyerAction: string; requestTitle: string; requestCopy: string }> = {
  DRAFT: {
    buyerAction: "Submit the request before quote tracking begins.",
    label: "Draft",
    requestCopy: "This RFQ has not been submitted yet.",
    requestTitle: "Submit this RFQ package",
    tone: "border-[#d8dde5] bg-[#f7f8fa] text-[#4f5660]",
  },
  SUBMITTED: {
    buyerAction: "Lattice is checking the RFQ package before supplier outreach.",
    label: "Awaiting review",
    requestCopy: "Lattice is reviewing the uploaded files, material, quantity, and timing before routing this RFQ.",
    requestTitle: "Lattice review in progress",
    tone: "border-[#cfe0ff] bg-[#eff5ff] text-[#315f9b]",
  },
  NEEDS_INFO: {
    buyerAction: "Additional buyer detail is needed before suppliers can quote accurately.",
    label: "Needs info",
    requestCopy: "This information is required for us to determine accurate pricing and any import considerations.",
    requestTitle: "Are these parts for prototype or commercial use?",
    tone: "border-[#f1d8a5] bg-[#fff7e8] text-[#8a5b08]",
  },
  READY_FOR_SUPPLIER_RFQ: {
    buyerAction: "The package is complete and supplier pricing is being collected.",
    label: "Awaiting supplier",
    requestCopy: "The supplier package is complete. Lattice is collecting pricing and capacity confirmation.",
    requestTitle: "Supplier pricing in progress",
    tone: "border-[#d5d9ff] bg-[#f1f2ff] text-[#4d55a8]",
  },
  QUOTED: {
    buyerAction: "Review the price, lead time, assumptions, and accept the quote when approved.",
    label: "Ready to accept",
    requestCopy: "Pricing is ready. Review the line items, production timing, assumptions, and total before accepting.",
    requestTitle: "Review quote and proceed to purchase",
    tone: "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
  },
  PURCHASED: {
    buyerAction: "This quote has been accepted and converted into an order.",
    label: "Purchased",
    requestCopy: "This quote has already been accepted. Continue to orders to track production.",
    requestTitle: "Order created",
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
    month: "2-digit",
    day: "2-digit",
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

function productionSpeed(request: LatticeRequest) {
  if (!request.quote.leadTimeDays) {
    return "Standard";
  }

  return `${request.quote.leadTimeDays} days (Standard)`;
}

function configurationText(request: LatticeRequest, item: RequestLineItem) {
  return [request.process, item.material, item.generalTolerance, item.surfaceFinish || "No finish (as machined)", ...(item.qualityDocumentation ?? [])].filter(Boolean).join(" / ");
}

function reviewedFilesLabel(request: LatticeRequest) {
  const latestQuote = request.customerQuotes.at(-1);

  if (latestQuote?.filesReviewed) {
    return latestQuote.filesReviewed;
  }

  return request.files.map((file) => file.name).join(", ") || "No files attached";
}

export function BuyerQuoteDetail({
  request,
  purchaseAction,
}: {
  request: LatticeRequest;
  purchaseAction?: () => void | Promise<void>;
}) {
  const canPurchase = request.status === "QUOTED";
  const status = quoteStatusCopy[request.status];
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const selectedSupplierQuote = request.supplierQuotes.find((quote) => quote.isSelected || quote.status === "SELECTED");
  const subtotalCents = latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents;
  const shippingCents = subtotalCents === null ? null : 3500;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0);
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
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${status.tone}`}>{status.label}</span>
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
            <div className="grid grid-cols-[2fr_2.5fr_1.5fr_1fr_0.8fr] gap-6 border-b border-[#eeeeee] bg-[#fafafa] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-lg:hidden">
              <span>Name</span>
              <span>Configuration</span>
              <span className="text-center">Production speed / quantity</span>
              <span className="text-right">Price</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-[#eeeeee]">
              {request.lineItems.map((item, index) => {
                const total = lineItemTotalCents(item, request);
                const unit = lineItemUnitCents(item, total);
                const file = request.files[index] ?? request.files[0];

                return (
                  <article className="grid gap-5 px-6 py-5 lg:grid-cols-[2fr_2.5fr_1.5fr_1fr_0.8fr] lg:items-start" key={item.id}>
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-[#e7e7e7] bg-[#f7f8fa] text-[#a2a8b0]">
                        <ImageIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-[14px] font-semibold leading-5 text-[#202020]">{item.partName}</h2>
                        <p className="mt-1 truncate text-[12px] font-medium text-[#2f73c8]">{file?.name ?? "File pending"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#7b8088]">
                          <Link className="transition hover:text-[#171717]" href="#files">
                            View files
                          </Link>
                          <span>-</span>
                          <Link className="inline-flex items-center gap-1 transition hover:text-[#171717]" href="#files">
                            <Download aria-hidden="true" className="h-3 w-3" />
                            Download
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Configuration</p>
                      <p className="mt-1 text-[13px] leading-5 text-[#30343a] lg:mt-0">{configurationText(request, item)}</p>
                      <button className="mt-2 rounded-full bg-[#f6f6f6] px-2.5 py-1 text-[11px] font-semibold text-[#2f73c8] transition hover:bg-[#eeeeee]" type="button">
                        No configuration
                      </button>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Production speed / quantity</p>
                      <div className="mt-1 flex flex-col gap-2 lg:mt-0 lg:items-center">
                        <select className="h-9 w-full rounded-md border border-[#dedede] bg-white px-2 text-[12px] font-medium text-[#30343a] outline-none lg:w-[132px]" defaultValue={productionSpeed(request)}>
                          <option>{productionSpeed(request)}</option>
                        </select>
                        <input className="h-9 w-full rounded-md border border-[#dedede] bg-white px-3 text-center text-[13px] font-medium text-[#30343a] outline-none lg:w-[72px]" readOnly type="number" value={item.quantity} />
                      </div>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Price</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#202020] lg:mt-0">{formatPrice(total)}</p>
                      <p className="mt-1 text-[11px] text-[#7b8088]">{unit === null ? "Unit price pending" : `${formatPrice(unit)} ea`}</p>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Actions</p>
                      <button className="mt-1 text-[12px] font-semibold text-[#2f73c8] transition hover:text-[#171717] lg:mt-0" type="button">
                        Remove
                      </button>
                    </div>
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
            <div className="space-y-4 px-6 py-5">
              <dl className="space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Subtotal</dt>
                  <dd className="font-semibold text-[#202020]">{formatPrice(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Estimated tax</dt>
                  <dd className="font-semibold text-[#202020]">Calculated at checkout</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Shipping</dt>
                  <dd className="font-semibold text-[#202020]">{formatPrice(shippingCents)}</dd>
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
              ) : (
                <form action={purchaseAction}>
                  <button
                    className="min-h-11 w-full rounded-md bg-[#0f9d68] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0b8558] disabled:cursor-not-allowed disabled:bg-[#d5d8dd]"
                    disabled={!canPurchase || !purchaseAction}
                    type="submit"
                  >
                    {canPurchase ? "Accept quote" : "Awaiting quote"}
                  </button>
                </form>
              )}
              <Link className="flex min-h-10 w-full items-center justify-center rounded-md border border-[#dedede] bg-white px-4 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href="/quotes">
                Back to quotes
              </Link>
            </div>

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Shipping address</p>
              <p className="mt-3 text-[13px] font-semibold text-[#202020]">{request.buyerCompany}</p>
              <p className="mt-1 text-[13px] leading-5 text-[#5f6670]">123 Main Street<br />Brooklyn, NY 11201</p>
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
                  <p className="text-[13px] font-semibold text-[#202020]">{quoteStatusCopy[event.to].label}</p>
                  <p className="mt-1 text-[12px] text-[#7b8088]">{formatDate(event.at)} by {event.actor}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
