import type { CustomerRequest } from "@/lib/customer-request";
import { quoteWithDisplayAddresses } from "@/lib/quote-address-display";
import type { RequestBillingSnapshot } from "@/lib/request-billing";
import { localDateKey, partProductionDays, quoteDeliveryTiming } from "@/lib/quote-delivery-timing";
import { QuoteDeliveryTimingCard } from "./quote-delivery-timing-card";
import { RequestBillingAddress } from "./request-billing-address";
import Link from "next/link";
import { ArrowLeft, CircleDot, Download, Mail, Phone, User } from "lucide-react";

import type { AccountAddress } from "@/lib/account-settings-shared";
import { quotedLineForRequestItem, requestShipToLines, type RequestLineItem, type RequestStatus } from "@/lib/request-model";
import { bundledFilesByLineItem } from "@/lib/document-line-item-details";
import { quoteHasExpired } from "@/lib/quote-validity";
import { CadRenderThumbnail } from "./cad-file-preview";
import { processLabel } from "@/lib/rfq-manufacturing";

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
    requestCopy: "Lattice is gathering feedback from its supplier network to prepare accurate pricing and lead time for this order.",
    requestTitle: "Supplier network review in progress",
  },
  NEEDS_INFO: {
    buyerAction: "Additional buyer detail is needed before suppliers can quote accurately.",
    requestCopy: "This information is required for us to determine accurate pricing and any import considerations.",
    requestTitle: "More information requested",
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

function formatFileSize(bytes: number | undefined) {
  if (!bytes || bytes <= 0) {
    return "Size pending";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

function fileExtension(fileName: string | undefined) {
  const extension = fileName?.split(".").pop()?.trim();
  return extension ? extension.toUpperCase() : "CAD";
}

function activityEventTitle(request: CustomerRequest, event: CustomerRequest["statusEvents"][number]) {
  if (event.from === null && event.to === "DRAFT") {
    return "Draft created";
  }

  if (event.from === "DRAFT" && event.to === "SUBMITTED") {
    return "Request submitted";
  }

  if (event.to === "NEEDS_INFO") {
    return "More information needed";
  }

  if (event.to === "QUOTED") {
    return "Quote ready for review";
  }

  if (event.to === "PURCHASED") {
    return "Order placed";
  }

  if (event.to === "CLOSED") {
    return request.operatorReview.internalNotes ? "Unable to quote" : "Quote closed";
  }

  return quoteStatusCopy[event.to].label ?? quoteStatusCopy[event.to].requestTitle;
}

function activityEventDetail(request: CustomerRequest, event: CustomerRequest["statusEvents"][number]) {
  if (event.from === null) {
    const createdMessage = `${quoteReference(request)} was created.`;
    const hasBeenSubmitted = request.status !== "DRAFT" || request.statusEvents.some((statusEvent) => statusEvent.to === "SUBMITTED");
    return hasBeenSubmitted ? createdMessage : `${createdMessage} Add any remaining details and submit when ready.`;
  }

  if (event.to === "NEEDS_INFO") {
    return request.operatorReview.internalNotes || "Lattice needs a little more information before pricing can continue.";
  }

  if (event.to === "CLOSED" && request.operatorReview.internalNotes) {
    return request.operatorReview.internalNotes;
  }

  if (event.to === "SUBMITTED") {
    return "The request was submitted. Lattice is reviewing the files and requirements and collecting supplier pricing.";
  }

  if (event.to === "QUOTED") {
    return "The quote is ready for review, including price, lead time, and assumptions.";
  }

  if (event.to === "PURCHASED") {
    return "The quote was accepted, and the order is ready to track.";
  }

  if (event.to === "CLOSED") {
    return "Lattice closed this quote request.";
  }

  return `Lattice moved the request to ${quoteStatusCopy[event.to].label ?? quoteStatusCopy[event.to].requestTitle.toLowerCase()}.`;
}

function quoteReference(request: CustomerRequest) {
  return `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function quotedLineForItem(item: RequestLineItem, request: CustomerRequest) {
  return quotedLineForRequestItem(request.customerQuotes.at(-1)?.lineItems, item);
}

function lineItemUnitCents(item: RequestLineItem, totalCents: number | null) {
  if (totalCents === null || item.quantity <= 0) {
    return null;
  }

  return Math.round(totalCents / item.quantity);
}

function lineItemTotalCents(item: RequestLineItem, request: CustomerRequest) {
  const customerLine = quotedLineForItem(item, request);

  if (customerLine) {
    return Math.round(customerLine.unitPrice * customerLine.quantity * 100);
  }

  if (request.lineItems.length === 1) {
    return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  }

  return null;
}

function lineItemLeadTime(item: RequestLineItem, request: CustomerRequest) {
  const customerLine = quotedLineForItem(item, request);

  if (customerLine?.leadTimeDays) {
    return `${customerLine.leadTimeDays} business days`;
  }

  if (request.quote.leadTimeDays) {
    return `${request.quote.leadTimeDays} business days`;
  }

  return request.customerQuotes.at(-1)?.leadTime || "Pending";
}

function CadRenderPreview({ file }: { file: CustomerRequest["files"][number] | undefined }) {
  return (
    <div className="w-20 shrink-0 overflow-hidden rounded-md border border-[#d9dde4] bg-white">
      <CadRenderThumbnail className="h-16 w-full rounded-none border-0" file={file} label={file?.name || "Part"} />
      <p className="border-t border-[#e4e6ea] px-2 py-1 text-center text-[12px] font-semibold text-[#5f6670]">Rev 1</p>
    </div>
  );
}

function customerFacingFileName(fileName: string | undefined, fallback: string) {
  return fileName?.trim() || fallback;
}

function fileDownloadHref(file: CustomerRequest["files"][number] | undefined) {
  return file?.storageKey
    ? `/api/local-files/${file.storageKey}?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`
    : null;
}

function quoteShippingAddressLines(request: CustomerRequest, savedShippingAddress?: AccountAddress) {
  const hasCompleteSnapshot = Boolean(request.shipToAddress1 && request.shipToCity && request.shipToState && request.shipToZipCode);
  const shippingSource = request.status !== "DRAFT" || hasCompleteSnapshot || !savedShippingAddress
    ? {
        shipToAddress1: request.shipToAddress1,
        shipToAddress2: request.shipToAddress2,
        shipToCity: request.shipToCity,
        shipToCompany: request.shipToCompany || request.buyerCompany,
        shipToName: request.shipToName,
        shipToPhone: request.shipToPhone,
        shipToState: request.shipToState,
        shipToZipCode: request.shipToZipCode,
      }
    : {
        shipToAddress1: savedShippingAddress.address1,
        shipToAddress2: savedShippingAddress.address2,
        shipToCity: savedShippingAddress.city,
        shipToCompany: savedShippingAddress.company,
        shipToName: savedShippingAddress.name,
        shipToPhone: request.shipToPhone,
        shipToState: savedShippingAddress.state,
        shipToZipCode: savedShippingAddress.zipCode,
      };
  const lines = requestShipToLines({
    ...shippingSource,
  });

  return lines.length ? lines : [request.buyerCompany, "Shipping address pending"];
}

export function BuyerQuoteDetail({
  checkoutHref,
  request: savedRequest,
  savedShippingAddress,
  savedBillingSnapshot,
  timingLayout = process.env.LATTICE_QUOTE_TIMING_LAYOUT === "legacy" ? "legacy" : "sidebar",
  initialViewingDate = localDateKey(new Date()),
}: {
  checkoutHref?: string;
  request: CustomerRequest;
  savedShippingAddress?: AccountAddress;
  savedBillingSnapshot?: RequestBillingSnapshot;
  timingLayout?: "sidebar" | "legacy";
  initialViewingDate?: string;
}) {
  const request = quoteWithDisplayAddresses(savedRequest, savedShippingAddress, savedBillingSnapshot);
  const sidebarTiming = timingLayout === "sidebar" && request.status === "QUOTED";
  const deliveryTiming = quoteDeliveryTiming(request);
  const expired = request.status === "QUOTED" && quoteHasExpired(request);
  const canPurchase = request.status === "QUOTED" && !expired;
  const canDownloadQuote = request.status === "QUOTED" || request.status === "CLOSED";
  const status = quoteStatusCopy[request.status];
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const operatorCustomerNote = request.operatorReview.internalNotes.trim();
  const statusLabel = expired ? "Expired" : request.status === "CLOSED" && operatorCustomerNote ? "No quote" : status.label;
  const requestCalloutTitle = expired ? "Request renewed pricing before purchasing" : request.status === "CLOSED" && operatorCustomerNote ? "Unable to quote this RFQ" : status.requestTitle;
  const requestCalloutCopy = expired ? "This quote’s validity period has ended. Lattice needs to confirm current pricing and lead time before issuing an updated quote." : latestCustomerQuote?.notes || (operatorCustomerNote && (request.status === "NEEDS_INFO" || request.status === "CLOSED") ? operatorCustomerNote : status.requestCopy);
  const subtotalCents = latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents;
  const shippingCents = request.quote.shippingCostCents;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0);
  const quoteId = latestCustomerQuote?.quoteNumber ?? quoteReference(request);
  const shippingAddressLines = quoteShippingAddressLines(request, savedShippingAddress);
  const shippingAddressComplete = Boolean(request.shipToName && (request.shipToCompany || request.buyerCompany) && request.shipToAddress1 && request.shipToCity && request.shipToState && request.shipToZipCode);
  const lineItemFiles = bundledFilesByLineItem(request);
  const visibleStatusEvents = request.statusEvents.filter((event) => event.to !== "READY_FOR_SUPPLIER_RFQ");
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
            {statusLabel && status.tone ? (
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${status.tone}`}>{statusLabel}</span>
            ) : null}
            <span className="text-[13px] text-[#7b8088]">Last modified: {formatDate(request.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          <section className="rounded-md border border-[#dfe3e8] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[12px] font-semibold text-[#5f6670]">
                  <CircleDot aria-hidden="true" className="h-4 w-4 text-[#4f7cff]" />
                  Current status
                </div>
                <h2 className="mt-2 text-[18px] font-semibold text-[#202020]">{requestCalloutTitle}</h2>
                <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#5f6670]">{requestCalloutCopy}</p>
                {expired && latestCustomerQuote?.notes ? <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#5f6670]">{latestCustomerQuote.notes}</p> : null}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between border-b border-[#e2e5e9] bg-[#fbfbfc] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#262a30]">Parts and pricing</h2>
              <span className="text-[12px] font-medium text-[#7b8088]">{request.lineItems.length} {request.lineItems.length === 1 ? "part" : "parts"}</span>
            </div>

            <div className="overflow-x-auto" data-testid="quote-line-items-responsive">
              <table className="hidden min-w-[880px] w-full table-fixed border-collapse xl:table">
                <colgroup>
                  <col className="w-[39%]" />
                  <col className="w-[24%]" />
                  <col className="w-[6%]" />
                  <col className="w-[15%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[#e1e4e8] text-left text-[12px] font-semibold text-[#30343a]">
                    <th className="px-5 py-4 font-semibold">Part / File</th>
                    <th className="px-3 py-4 font-semibold">Specifications</th>
                    <th className="px-3 py-4 text-center font-semibold">Qty</th>
                    <th className="whitespace-nowrap px-3 py-4 text-right font-semibold">Line total</th>
                    <th className="whitespace-nowrap px-3 py-4 text-left font-semibold">{sidebarTiming ? "Production lead time" : "Lead time"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e4e8]">
                  {request.lineItems.map((item, index) => {
                    const total = lineItemTotalCents(item, request);
                    const unit = lineItemUnitCents(item, total);
                    const files = lineItemFiles[index];
                    const file = files?.cadFile ?? request.files[index] ?? request.files[0];
                    const drawingFile = files?.drawingFile;
                    const fileName = customerFacingFileName(file?.name, item.partName);
                    const downloadHref = fileDownloadHref(file);
                    const customerLine = quotedLineForItem(item, request);
                    const process = processLabel(customerLine?.process || item.manufacturingDetails?.process || request.process || "CNC");
                    const material = customerLine?.material || item.material;
                    const finish = customerLine?.finish || item.surfaceFinish || "As machined";
                    const tolerance = item.generalTolerance || "ISO 2768-m";
                    const inspection = (item.qualityDocumentation ?? []).length > 0 ? (item.qualityDocumentation ?? []).join(", ") : "Standard Inspection";
                    const notes = item.notes?.trim() || "";

                    return (
                      <tr className="align-top" key={item.id}>
                        <td className="px-5 py-6">
                          <div className="flex min-w-0 items-start gap-4">
                            <CadRenderPreview file={file} />
                            <div className="min-w-0 pt-1">
                              {downloadHref ? (
                                <a className="block truncate text-[14px] font-semibold text-[#3d6fe8] transition hover:text-[#244bc7] hover:underline" download={fileName} href={downloadHref}>
                                  {fileName}
                                </a>
                              ) : (
                                <p className="truncate text-[14px] font-semibold text-[#3d6fe8]">{fileName}</p>
                              )}
                              <p className="mt-2 text-[13px] font-medium leading-5 text-[#4f5660]">{item.partName}</p>
                              <p className="mt-3 text-[12px] font-medium text-[#7b8088]">{fileExtension(file?.name)} · {formatFileSize(file?.sizeBytes)} · Rev 1</p>
                              {drawingFile ? (
                                fileDownloadHref(drawingFile) ? (
                                  <a aria-label={`Download drawing ${drawingFile.name}`} className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-[#d9dde4] bg-[#fafafa] px-2 py-1 text-[12px] font-medium text-[#3d6fe8] hover:underline" download={drawingFile.name} href={fileDownloadHref(drawingFile)!}>
                                    <Download aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">Download drawing · {drawingFile.name}</span>
                                  </a>
                                ) : (
                                  <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-[#d9dde4] bg-[#fafafa] px-2 py-1 text-[12px] font-medium text-[#667085]">Drawing unavailable · {drawingFile.name}</span>
                                )
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-6 text-[13px] leading-5">
                          <dl className="space-y-3">
                            <div>
                              <dt className="font-semibold text-[#30343a]">Process</dt>
                              <dd className="mt-0.5 text-[#5f6670]">{process}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-[#30343a]">Material</dt>
                              <dd className="mt-0.5 text-[#5f6670]">{material}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-[#30343a]">Finish</dt>
                              <dd className="mt-0.5 text-[#5f6670]">{finish}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-[#30343a]">Tolerance</dt>
                              <dd className="mt-0.5 text-[#5f6670]">{tolerance}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-[#30343a]">Inspection</dt>
                              <dd className="mt-0.5 text-[#5f6670]">{inspection}</dd>
                            </div>
                            {notes ? (
                              <div>
                                <dt className="font-semibold text-[#30343a]">Notes</dt>
                                <dd className="mt-0.5 line-clamp-2 text-[#5f6670]">{notes}</dd>
                              </div>
                            ) : null}
                          </dl>
                        </td>
                        <td className="px-3 py-6 text-center text-[16px] font-semibold text-[#30343a]">{item.quantity}</td>
                        <td className="px-3 py-6 text-right tabular-nums">
                          <p className="text-[16px] font-semibold text-[#30343a]">{formatSummaryPrice(total)}</p>
                          <p className="mt-1 text-[12px] text-[#6f737a]">{unit === null ? "Unit price pending" : `${formatPrice(unit)} / ea`}</p>
                        </td>
                        <td className="px-3 py-6 text-[13px] leading-5">
                          {sidebarTiming ? <div><p className="text-[12px] font-semibold text-[#30343a]">{partProductionDays(request, item) === null ? "Pending" : `${partProductionDays(request, item)} business days`}</p></div> : <>
                          <p className="whitespace-nowrap text-[12px] font-semibold text-[#30343a]">{lineItemLeadTime(item, request)}</p>
                          <p className="mt-2 text-[#5f6670]">Estimated delivery by {formatDate(request.quote.estimatedDeliveryDate)}</p>
                          </>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {!sidebarTiming ? <tfoot>
                  <tr className="border-t border-[#d8dde5]">
                    <td className="px-5 py-5" colSpan={3} />
                    <th className="px-3 py-5 text-right text-[14px] font-semibold text-[#30343a]" scope="row">Subtotal <span className="text-[12px] font-semibold text-[#6f737a]">(USD)</span></th>
                    <td className="px-5 py-5 text-right text-[18px] font-semibold text-[#202020]">{formatSummaryPrice(subtotalCents)}</td>
                  </tr>
                </tfoot> : null}
              </table>

              <div className="divide-y divide-[#e1e4e8] xl:hidden">
                {request.lineItems.map((item, index) => {
                  const total = lineItemTotalCents(item, request);
                  const unit = lineItemUnitCents(item, total);
                  const files = lineItemFiles[index];
                  const file = files?.cadFile ?? request.files[index] ?? request.files[0];
                  const drawingFile = files?.drawingFile;
                  const fileName = customerFacingFileName(file?.name, item.partName);
                  const downloadHref = fileDownloadHref(file);
                  const customerLine = quotedLineForItem(item, request);
                  const process = processLabel(customerLine?.process || item.manufacturingDetails?.process || request.process || "CNC");
                  const material = customerLine?.material || item.material;
                  const finish = customerLine?.finish || item.surfaceFinish || "As machined";
                  const tolerance = item.generalTolerance || "ISO 2768-m";
                  const inspection = (item.qualityDocumentation ?? []).length > 0 ? (item.qualityDocumentation ?? []).join(", ") : "Standard Inspection";
                  const notes = item.notes?.trim() || "";

                  return (
                    <article className="px-5 py-5 sm:px-6" key={item.id}>
                      <div className="flex items-start gap-4">
                        <CadRenderPreview file={file} />
                        <div className="min-w-0 flex-1">
                          {downloadHref ? (
                            <a className="block break-words text-[15px] font-semibold text-[#3d6fe8] transition hover:text-[#244bc7] hover:underline" download={fileName} href={downloadHref}>
                              {fileName}
                            </a>
                          ) : (
                            <p className="break-words text-[15px] font-semibold text-[#3d6fe8]">{fileName}</p>
                          )}
                          <p className="mt-1 text-[13px] font-medium leading-5 text-[#4f5660]">{item.partName}</p>
                          <p className="mt-2 text-[12px] font-medium text-[#7b8088]">{fileExtension(file?.name)} · {formatFileSize(file?.sizeBytes)} · Rev 1</p>
                          {drawingFile ? (
                            fileDownloadHref(drawingFile) ? (
                              <a aria-label={`Download drawing ${drawingFile.name}`} className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-[#d9dde4] bg-[#fafafa] px-2 py-1 text-[12px] font-medium text-[#3d6fe8] hover:underline" download={drawingFile.name} href={fileDownloadHref(drawingFile)!}>
                                <Download aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                                <span className="break-words">Download drawing · {drawingFile.name}</span>
                              </a>
                            ) : (
                              <span className="mt-3 inline-flex max-w-full items-center gap-2 rounded-md border border-[#d9dde4] bg-[#fafafa] px-2 py-1 text-[12px] font-medium text-[#667085]">Drawing unavailable · {drawingFile.name}</span>
                            )
                          ) : null}
                        </div>
                      </div>
                      <dl className="mt-5 grid gap-4 text-[13px] leading-5 sm:grid-cols-2">
                        <div>
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Specifications</dt>
                          <dd className="mt-2 space-y-2 text-[#5f6670]">
                            <p><span className="font-semibold text-[#30343a]">Process</span><br />{process}</p>
                            <p><span className="font-semibold text-[#30343a]">Material</span><br />{material}</p>
                            <p><span className="font-semibold text-[#30343a]">Finish</span><br />{finish}</p>
                            <p><span className="font-semibold text-[#30343a]">Tolerance</span><br />{tolerance}</p>
                            <p><span className="font-semibold text-[#30343a]">Inspection</span><br />{inspection}</p>
                            {notes ? <p><span className="font-semibold text-[#30343a]">Notes</span><br />{notes}</p> : null}
                          </dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:block sm:space-y-4">
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Qty</dt>
                            <dd className="mt-1 text-[16px] font-semibold text-[#30343a]">{item.quantity}</dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Line total</dt>
                            <dd className="mt-1 tabular-nums">
                              <span className="block text-[18px] font-semibold text-[#30343a]">{formatSummaryPrice(total)}</span>
                              <span className="mt-1 block text-[12px] text-[#6f737a]">{unit === null ? "Unit price pending" : `${formatPrice(unit)} / ea`}</span>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">{sidebarTiming ? "Production lead time" : "Lead time"}</dt>
                            {sidebarTiming ? <dd className="mt-3"><div><p className="text-[12px] font-semibold text-[#30343a]">{partProductionDays(request, item) === null ? "Pending" : `${partProductionDays(request, item)} business days`}</p></div></dd> : <>
                            <dd className="mt-1 text-[13px] font-semibold text-[#30343a]">{lineItemLeadTime(item, request)}</dd>
                            <dd className="mt-1 text-[12px] text-[#5f6670]">Estimated delivery by {formatDate(request.quote.estimatedDeliveryDate)}</dd>
                            </>}
                          </div>
                        </div>
                      </dl>
                    </article>
                  );
                })}
                {!sidebarTiming ? <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6">
                  <p className="text-[14px] font-semibold text-[#30343a]">Subtotal <span className="text-[12px] font-semibold text-[#6f737a]">(USD)</span></p>
                  <p className="text-[18px] font-semibold text-[#202020]">{formatSummaryPrice(subtotalCents)}</p>
                </div> : null}
              </div>
            </div>
            {sidebarTiming ? <>
              <div className="flex items-center justify-end gap-8 border-t border-[#d8dde5] px-5 py-5 sm:px-6">
                <p className="text-[14px] font-semibold text-[#30343a]">Subtotal <span className="text-[12px] font-semibold text-[#6f737a]">(USD)</span></p>
                <p className="text-[18px] font-semibold text-[#202020]">{formatSummaryPrice(subtotalCents)}</p>
              </div>
            </> : null}
          </section>

          <section aria-labelledby="quote-activity-heading" className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4 border-b border-[#e2e5e9] bg-[#fbfbfc] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#262a30]" id="quote-activity-heading">Quote activity</h2>
            </div>
            <ol className="px-5 py-5 sm:px-6 sm:py-6">
              {visibleStatusEvents.map((event, index) => {
                const isLast = index === visibleStatusEvents.length - 1;

                return (
                  <li className="relative grid grid-cols-[18px_minmax(0,1fr)] gap-3 pb-6 last:pb-0 sm:gap-4" key={event.id}>
                    {!isLast ? <span className="absolute left-[8px] top-5 h-[calc(100%-1rem)] w-px bg-[#e2e8f0]" aria-hidden="true" /> : null}
                    <span aria-hidden="true" className="relative z-10 mt-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#b8cbff] bg-white">
                      <span className="h-2 w-2 rounded-full bg-[#4f7cff]" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                        <p className="text-[13px] font-semibold text-[#202020]">{activityEventTitle(request, event)}</p>
                        <time className="shrink-0 text-[11px] font-medium text-[#8a8f98]" dateTime={event.at}>{formatDateTime(event.at)}</time>
                      </div>
                      <p className="mt-1.5 max-w-3xl text-[13px] leading-6 text-[#5f6670]">{activityEventDetail(request, event)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </main>

        <aside className="space-y-5">
          {sidebarTiming ? <QuoteDeliveryTimingCard {...deliveryTiming} initialViewingDate={initialViewingDate} /> : null}
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
                  <dd className="font-semibold text-[#202020]">Calculated at checkout</dd>
                </div>
              </dl>
              <div className="border-t border-[#eeeeee] pt-4">
                <div className="flex justify-between gap-4">
                  <p className="text-[14px] font-semibold text-[#202020]">Total before tax</p>
                  <p className="text-[22px] font-semibold text-[#171717]">{formatSummaryPrice(totalCents)}</p>
                </div>
              </div>

              {request.status === "PURCHASED" ? (
                <Link className="flex min-h-11 w-full items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b]" href="/orders">
                  View order
                </Link>
              ) : expired ? (
                <Link className="flex min-h-11 w-full items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-white" href="#quote-renewal">Request renewed quote</Link>
              ) : canPurchase && checkoutHref ? (
                <form action={checkoutHref} method="get">
                  <button className="min-h-11 w-full rounded-md bg-[#0f9d68] px-4 text-[14px] font-semibold text-white transition hover:bg-[#0b8558]" type="submit">
                    Begin checkout
                  </button>
                </form>
              ) : null}
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
              {!shippingAddressComplete ? <p className="mt-3 text-[13px] text-[#7a5b18]">Shipping address has not been added to your account. You can add it during checkout or in account settings <Link className="font-semibold underline underline-offset-2" href="/account/settings?focus=shipping#shipping-address">here</Link></p> : <>
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
              </>}
            </div>

            <RequestBillingAddress request={request} showConfigurationPrompts />

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

        </aside>
      </div>
    </div>
  );
}
