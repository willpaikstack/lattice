"use client";

import { ClipboardCheck, ExternalLink, FileText, PackageCheck, ReceiptText, Search, Truck, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { quotedLineForRequestItem, type LatticeRequest, type SupplierQuoteStatus } from "@/lib/request-model";

const statusCopy: Record<LatticeRequest["status"], { label: string; tone: string; nextAction: string }> = {
  DRAFT: { label: "Draft", nextAction: "Review draft", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  SUBMITTED: { label: "Submitted", nextAction: "Assign owner and review intake", tone: "border-[#ffd1d4] bg-[#fff1f2] text-[#FF5A5F]" },
  NEEDS_INFO: { label: "Needs info", nextAction: "Recover buyer clarification", tone: "border-[#ffd4c3] bg-[#fff0ea] text-[#FC642D]" },
  READY_FOR_SUPPLIER_RFQ: { label: "Supplier ready", nextAction: "Send supplier RFQs", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  QUOTED: { label: "Quote received", nextAction: "Follow buyer decision", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  PURCHASED: { label: "Purchased", nextAction: "Track order", tone: "border-slate-950 bg-slate-950 text-white" },
  CLOSED: { label: "Closed", nextAction: "No active quote work", tone: "border-slate-200 bg-slate-50 text-slate-700" },
};

const supplierQuoteLabels: Record<SupplierQuoteStatus, string> = {
  DECLINED: "Declined",
  INVITED: "Invited",
  QUOTE_RECEIVED: "Received",
  SELECTED: "Selected",
};

const statusFilters: Array<{ label: string; value: "ALL" | LatticeRequest["status"] }> = [
  { label: "All", value: "ALL" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Needs info", value: "NEEDS_INFO" },
  { label: "Supplier ready", value: "READY_FOR_SUPPLIER_RFQ" },
  { label: "Quote received", value: "QUOTED" },
  { label: "Closed", value: "CLOSED" },
];

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";

type AdminQuoteAction = (formData: FormData) => void | Promise<void>;

type StoredIncompleteRfq = {
  id: string;
  request?: LatticeRequest;
  updatedAt: string;
};

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
  return cents === null || !Number.isFinite(cents) ? "" : (cents / 100).toFixed(2);
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function defaultQuoteCreatedDate(request: LatticeRequest) {
  if (request.status === "QUOTED") {
    return request.quote.quoteCreatedDate || request.customerQuotes.at(-1)?.quoteDate || todayIsoDate();
  }

  return todayIsoDate();
}

function defaultQuoteValidUntil(request: LatticeRequest, quoteCreatedDate: string) {
  if (request.status === "QUOTED" && request.quote.quoteValidUntil) {
    return request.quote.quoteValidUntil;
  }

  return addDaysIso(quoteCreatedDate, 30);
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

function fileDownloadHref(file: LatticeRequest["files"][number]) {
  return file.storageKey
    ? `/api/local-files/${file.storageKey}?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`
    : null;
}

function isDrawingFile(file: LatticeRequest["files"][number]) {
  return /\.(pdf|dwg|dxf|png|jpg|jpeg)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type);
}

function isCadFile(file: LatticeRequest["files"][number]) {
  return /\.(step|stp|iges|igs|sldprt|x_t|x_b|sat|ipt)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type);
}

function fileKindLabel(file: LatticeRequest["files"][number]) {
  if (isDrawingFile(file)) {
    return "Drawing";
  }

  if (isCadFile(file)) {
    return "CAD file";
  }

  return "File";
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function receivedSupplierQuotes(request: LatticeRequest) {
  return request.supplierQuotes.filter((quote) => quote.status === "QUOTE_RECEIVED" || quote.status === "SELECTED");
}

function selectedSupplierQuote(request: LatticeRequest) {
  return request.supplierQuotes.find((quote) => quote.status === "SELECTED") ?? receivedSupplierQuotes(request).at(-1) ?? null;
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

function draftEditHref(request: LatticeRequest) {
  return `/requests/new?draft=${encodeURIComponent(request.id)}`;
}

function customerProfileHref(companyName: string, customerProfileHrefs: Record<string, string>) {
  return customerProfileHrefs[companyName] ?? `/admin/customers/${encodeURIComponent(companyName)}`;
}

function CustomerProfileShortcut({
  companyName,
  customerProfileHrefs,
}: {
  companyName: string;
  customerProfileHrefs: Record<string, string>;
}) {
  return (
    <Link
      aria-label={`Open customer page for ${companyName}`}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#ffd1d4] bg-white text-[#767676] transition hover:border-[#FF5A5F] hover:bg-[#fff1f2] hover:text-[#FF5A5F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A5F]"
      href={customerProfileHref(companyName, customerProfileHrefs)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      title={`Open customer page for ${companyName}`}
    >
      <ExternalLink aria-hidden="true" size={14} />
    </Link>
  );
}

function readLocalDraftRequests() {
  if (typeof window === "undefined" || !window.localStorage?.getItem) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(incompleteRfqStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) {
      return [];
    }

    return (parsed as StoredIncompleteRfq[])
      .map((draft) => draft.request)
      .filter((request): request is LatticeRequest => Boolean(request?.id && request.status === "DRAFT"));
  } catch {
    return [];
  }
}

function sortByUpdatedAtNewest(requests: LatticeRequest[]) {
  return [...requests].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function cadFiles(request: LatticeRequest) {
  return request.files.filter(isCadFile);
}

function drawingFiles(request: LatticeRequest) {
  return request.files.filter(isDrawingFile);
}

function bundledFilesByPart(request: LatticeRequest) {
  const cad = cadFiles(request);
  const drawings = drawingFiles(request);
  const bundledIds = new Set<string>();
  const bundles = request.lineItems.map((lineItem, index) => {
    const files = [cad[index], drawings[index]].filter((file): file is LatticeRequest["files"][number] => Boolean(file));
    files.forEach((file) => bundledIds.add(file.id));

    return {
      files,
      lineItem,
    };
  });
  const unassignedFiles = request.files.filter((file) => !bundledIds.has(file.id));

  return { bundles, unassignedFiles };
}

function lineItemUnitPriceInput(request: LatticeRequest, lineItem: LatticeRequest["lineItems"][number]) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = quotedLineForRequestItem(latestQuote?.lineItems, lineItem);

  if (quotedLine) {
    return quotedLine.unitPrice.toFixed(2);
  }

  if (request.lineItems.length === 1 && request.quote.estimatedPriceCents !== null && lineItem.quantity > 0) {
    return (request.quote.estimatedPriceCents / 100 / lineItem.quantity).toFixed(2);
  }

  return "";
}

function lineItemLeadTimeInput(request: LatticeRequest, lineItem: LatticeRequest["lineItems"][number]) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = quotedLineForRequestItem(latestQuote?.lineItems, lineItem);

  return quotedLine?.leadTimeDays ?? request.quote.leadTimeDays ?? "";
}

function AdminQuoteDetailDrawer({
  onClose,
  request,
  updateStatusAction,
}: {
  onClose: () => void;
  request: LatticeRequest;
  updateStatusAction?: AdminQuoteAction;
}) {
  const status = statusCopy[request.status];
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const { bundles, unassignedFiles } = bundledFilesByPart(request);
  const quoteCreatedDate = defaultQuoteCreatedDate(request);
  const [quoteValidUntil, setQuoteValidUntil] = useState(defaultQuoteValidUntil(request, quoteCreatedDate));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1f2937]/45 px-4 py-6" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="mx-auto max-w-[1180px] overflow-hidden rounded-md border border-[#e2d6ca] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 z-10 border-b border-[#e8d2bf] bg-white">
          <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Quote review</p>
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
              </div>
              <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#171717]">{request.title}</h2>
              <p className="mt-1 text-[14px] text-[#64748b]">
                {quoteReference(request)} - {request.buyerCompany} - {request.process}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {latestCustomerQuote ? (
                <a
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                  href={`/admin/quotes/${request.id}/quote.pdf`}
                  title="Opens the last saved customer quote PDF for review."
                >
                  <FileText aria-hidden="true" size={16} />
                  View quote PDF
                </a>
              ) : null}
              <button
                aria-label="Close RFQ drawer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#262626] transition hover:bg-[#f8fafc]"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <form action={updateStatusAction} className="space-y-5">
            <input name="requestId" type="hidden" value={request.id} />
            <input name="status" type="hidden" value="QUOTED" />
            <input name="assignedOwner" type="hidden" value={request.operatorReview.assignedOwner ?? ""} />
            <input name="supplierPackageNotes" type="hidden" value={request.operatorReview.supplierPackageNotes} />
            <input name="internalNotes" type="hidden" value={request.operatorReview.internalNotes} />

            <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
              <h3 className="text-[18px] font-semibold text-[#171717]">Quote line items</h3>
              <div className="mt-4 overflow-x-auto rounded-md border border-[#e6e6e6]">
                <div className="min-w-[980px]">
                  <div className="grid grid-cols-[minmax(190px,0.9fr)_minmax(320px,1.35fr)_64px_150px_150px] items-center gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b8088]">
                    <span>Part name</span>
                    <span>Files</span>
                    <span className="text-center">Qty</span>
                    <span>Unit price</span>
                    <span>Lead time</span>
                  </div>
                  <div className="divide-y divide-[#eeeeee]">
                    {bundles.map(({ files, lineItem }) => {
                      const cadFile = files.find(isCadFile);
                      const drawingFile = files.find(isDrawingFile);
                      const cadHref = cadFile ? fileDownloadHref(cadFile) : null;
                      const drawingHref = drawingFile ? fileDownloadHref(drawingFile) : null;

                      return (
                        <div className="grid grid-cols-[minmax(190px,0.9fr)_minmax(320px,1.35fr)_64px_150px_150px] items-center gap-4 px-4 py-4 text-[13px] text-[#30343a]" key={lineItem.id}>
                          <p className="min-w-0 break-words font-semibold text-[#202020]">{lineItem.partName}</p>
                          <div className="grid min-w-0 gap-2">
                            {cadFile && cadHref ? (
                              <a
                                className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#315a94] underline-offset-2 hover:underline"
                                download={cadFile.name}
                                href={cadHref}
                                title={`Download ${cadFile.name}`}
                              >
                                <span className="shrink-0 rounded-md border border-[#ffd1d4] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#767676]">CAD</span>
                                <span className="min-w-0 truncate">{cadFile.name}</span>
                              </a>
                            ) : (
                              <span
                                aria-label={`CAD file unavailable for ${lineItem.partName}`}
                                className="text-[12px] font-medium text-[#9ca3af]"
                                title="CAD file unavailable"
                              >
                                CAD file unavailable
                              </span>
                            )}
                            {drawingFile && drawingHref ? (
                              <a
                                className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#315a94] underline-offset-2 hover:underline"
                                download={drawingFile.name}
                                href={drawingHref}
                                title={`Download ${drawingFile.name}`}
                              >
                                <span className="shrink-0 rounded-md border border-[#ffd1d4] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#767676]">Drawing</span>
                                <span className="min-w-0 truncate">{drawingFile.name}</span>
                              </a>
                            ) : (
                              <span
                                aria-label={`Drawing unavailable for ${lineItem.partName}`}
                                className="text-[12px] font-medium text-[#9ca3af]"
                                title="Drawing unavailable"
                              >
                                Drawing unavailable
                              </span>
                            )}
                          </div>
                          <p className="text-center text-[14px] font-medium text-[#6f737a]">{lineItem.quantity}</p>
                          <label className="grid gap-1">
                            <span className="sr-only">Unit price - {lineItem.partName}</span>
                            <input
                              className="h-10 w-full min-w-0 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                              defaultValue={lineItemUnitPriceInput(request, lineItem)}
                              inputMode="decimal"
                              name={`unitPrice:${lineItem.id}`}
                              placeholder="0.00"
                            />
                          </label>
                          <label className="grid gap-1">
                            <span className="sr-only">Lead time days - {lineItem.partName}</span>
                            <input
                              className="h-10 w-full min-w-0 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                              defaultValue={lineItemLeadTimeInput(request, lineItem)}
                              inputMode="numeric"
                              name={`leadTimeDays:${lineItem.id}`}
                              placeholder="Days"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 xl:grid-cols-[1fr_0.72fr]">
              <div className="space-y-5">
                <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                  <div className="flex items-center gap-2">
                    <FileText aria-hidden="true" className="text-[#767676]" size={18} />
                    <h3 className="text-[18px] font-semibold text-[#171717]">Uploaded files</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {bundles.map(({ files, lineItem }) => (
                      <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={lineItem.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-[14px] font-semibold text-[#202020]">Files for {lineItem.partName}</h4>
                          <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563]">Qty {lineItem.quantity}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          {files.length > 0 ? (
                            files.map((file) => {
                              const href = fileDownloadHref(file);

                            return (
                              <div className="flex flex-col gap-3 rounded-md border border-[#e6e6e6] bg-white p-3 sm:flex-row sm:items-center sm:justify-between" key={file.id}>
                                <div className="min-w-0">
                                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                                    <span className="rounded-md border border-[#ffd1d4] bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#767676]">
                                      {fileKindLabel(file)}
                                    </span>
                                    <p className="truncate text-[14px] font-semibold text-[#202020]">{file.name}</p>
                                  </div>
                                  <p className="mt-1 text-[12px] text-[#8a8f98]">
                                    {file.type || "Uploaded file"} - {formatFileSize(file.sizeBytes)}
                                  </p>
                                </div>
                                {href ? (
                                  <a className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]" href={href}>
                                    Download
                                  </a>
                                ) : (
                                  <span className="text-[12px] font-medium text-[#9a5a2f]">Reference only - ask buyer to re-upload</span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="rounded-md border border-dashed border-[#d7d7d7] bg-white p-3 text-[12px] text-[#7b8088]">No uploaded files matched to this part.</p>
                        )}
                      </div>
                    </article>
                  ))}
                  {unassignedFiles.length > 0 ? (
                    <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                      <h4 className="text-[14px] font-semibold text-[#202020]">Unassigned files</h4>
                      <div className="mt-3 space-y-2">
                        {unassignedFiles.map((file) => {
                          const href = fileDownloadHref(file);

                          return (
                            <div className="flex flex-col gap-3 rounded-md border border-[#e6e6e6] bg-white p-3 sm:flex-row sm:items-center sm:justify-between" key={file.id}>
                              <div className="min-w-0">
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  <span className="rounded-md border border-[#ffd1d4] bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#767676]">
                                    {fileKindLabel(file)}
                                  </span>
                                  <p className="truncate text-[14px] font-semibold text-[#202020]">{file.name}</p>
                                </div>
                                <p className="mt-1 text-[12px] text-[#8a8f98]">
                                  {file.type || "Uploaded file"} - {formatFileSize(file.sizeBytes)}
                                </p>
                              </div>
                              {href ? (
                                <a className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]" href={href}>
                                  Download
                                </a>
                              ) : (
                                <span className="text-[12px] font-medium text-[#9a5a2f]">Reference only - ask buyer to re-upload</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ) : null}
                </div>
              </section>

              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <div className="flex items-center gap-2">
                  <PackageCheck aria-hidden="true" className="text-[#767676]" size={18} />
                  <h3 className="text-[18px] font-semibold text-[#171717]">Configured parts</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {request.lineItems.map((lineItem, index) => (
                    <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={`${lineItem.partName}-${index}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#202020]">{lineItem.partName}</p>
                        <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563]">Qty {lineItem.quantity}</span>
                      </div>
                      <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-[#6f737a]">Material</dt>
                          <dd className="mt-1 text-[#202020]">{lineItem.material}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#6f737a]">Process</dt>
                          <dd className="mt-1 text-[#202020]">{request.process}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#6f737a]">Tolerance</dt>
                          <dd className="mt-1 text-[#202020]">{lineItem.generalTolerance || "Not specified"}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-[#6f737a]">Finish</dt>
                          <dd className="mt-1 text-[#202020]">{lineItem.surfaceFinish || "Not specified"}</dd>
                        </div>
                      </dl>
                      {(lineItem.qualityDocumentation?.length ?? 0) > 0 ? (
                        <p className="mt-3 text-[12px] font-semibold text-[#4b5563]">Quality docs: {lineItem.qualityDocumentation?.join(", ")}</p>
                      ) : null}
                      {lineItem.notes ? <p className="mt-3 text-[13px] leading-5 text-[#64748b]">{lineItem.notes}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <h3 className="text-[18px] font-semibold text-[#171717]">Quote feedback</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#64748b]">Enter the critical numbers needed to respond to the customer.</p>

                <div className="mt-4 grid gap-4">
                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Shipping cost
                    <input
                      className="h-11 rounded-md border border-[#d9d9d9] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={formatCurrencyInput(request.quote.shippingCostCents)}
                      inputMode="decimal"
                      name="shippingCost"
                      placeholder="Billed at actual or 125.00"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Shipping method
                      <select
                        className="h-11 rounded-md border border-[#d9d9d9] bg-white px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={request.quote.shippingMethod}
                        name="shippingMethod"
                      >
                        <option value="">Select method</option>
                        <option value="International">International</option>
                        <option value="Domestic">Domestic</option>
                      </select>
                    </label>

                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Shipping terms
                      <select
                        className="h-11 rounded-md border border-[#d9d9d9] bg-white px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={request.quote.shippingTerms}
                        name="shippingTerms"
                      >
                        <option value="">Select terms</option>
                        <option value="EXW">EXW</option>
                        <option value="DDP">DDP</option>
                        <option value="Determined at Checkout">Determined at Checkout</option>
                        <option value="DAP">DAP</option>
                        <option value="FOB">FOB</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Estimated delivery date
                      <input
                        className="h-11 rounded-md border border-[#d9d9d9] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={request.quote.estimatedDeliveryDate}
                        name="estimatedDeliveryDate"
                        type="date"
                      />
                    </label>

                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Quote Created Date
                      <input
                        className="h-11 rounded-md border border-[#d9d9d9] bg-[#f8fafc] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        name="quoteCreatedDate"
                        readOnly
                        type="date"
                        value={quoteCreatedDate}
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Quote Valid Until
                    <input
                      className="h-11 rounded-md border border-[#d9d9d9] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                      name="quoteValidUntil"
                      onChange={(event) => setQuoteValidUntil(event.target.value)}
                      type="date"
                      value={quoteValidUntil}
                    />
                  </label>

                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Quote notes
                    <textarea
                      className="min-h-28 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.quote.summary}
                      name="quoteSummary"
                      placeholder="What should the customer know about price, lead time, shipping, exclusions, or assumptions?"
                    />
                  </label>

                  <button
                    className="h-10 rounded-md bg-[#262626] px-4 text-[13px] font-semibold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#b7c9ef]"
                    disabled={!updateStatusAction}
                    type="submit"
                  >
                    Submit Quote to Customer
                  </button>
                </div>
              </section>
            </div>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminQuoteManagement({
  customerProfileHrefs = {},
  requests,
  updateStatusAction,
}: {
  customerProfileHrefs?: Record<string, string>;
  requests: LatticeRequest[];
  updateStatusAction?: AdminQuoteAction;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkedRequestId = searchParams.get("requestId");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("ALL");
  const [detailRequest, setDetailRequest] = useState<LatticeRequest | null>(null);
  const [localDraftRequests, setLocalDraftRequests] = useState<LatticeRequest[]>([]);

  const quoteRequests = useMemo(() => requests.filter((request) => request.status !== "DRAFT" && request.status !== "PURCHASED"), [requests]);
  const draftRequests = useMemo(() => {
    const merged = new Map<string, LatticeRequest>();

    requests
      .filter((request) => request.status === "DRAFT")
      .forEach((request) => merged.set(request.id, request));

    localDraftRequests.forEach((request) => merged.set(request.id, request));

    return sortByUpdatedAtNewest([...merged.values()]);
  }, [localDraftRequests, requests]);
  const activeQuoteRequests = quoteRequests.filter((request) => request.status !== "CLOSED");
  const activeSupplierQuotes = activeQuoteRequests.reduce((count, request) => count + receivedSupplierQuotes(request).length, 0);
  const quotedValueCents = activeQuoteRequests.reduce((sum, request) => sum + (request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents ?? 0), 0);
  const blockedRequests = quoteRequests.filter((request) => request.status === "NEEDS_INFO").length;
  const readyForIssueCount = activeQuoteRequests.filter((request) => request.status === "QUOTED" || request.quote.estimatedPriceCents !== null).length;

  useEffect(() => {
    if (!deepLinkedRequestId) {
      setDetailRequest(null);
      return;
    }

    setDetailRequest(quoteRequests.find((request) => request.id === deepLinkedRequestId) ?? null);
  }, [deepLinkedRequestId, quoteRequests]);

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
        ...request.files.map((file) => file.name),
        ...request.supplierQuotes.map((quote) => quote.shopName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [query, quoteRequests, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocalDraftRequests(readLocalDraftRequests());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function openDetail(request: LatticeRequest) {
    setDetailRequest(request);

    if (deepLinkedRequestId !== request.id) {
      router.push(`/admin/quotes?requestId=${encodeURIComponent(request.id)}`, { scroll: false });
    }
  }

  function closeDetail() {
    setDetailRequest(null);

    if (deepLinkedRequestId) {
      router.replace("/admin/quotes", { scroll: false });
    }
  }

  function openDetailFromKey(event: KeyboardEvent<HTMLElement>, request: LatticeRequest) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openDetail(request);
  }

  function openDraftFromKey(event: KeyboardEvent<HTMLElement>, request: LatticeRequest) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    router.push(draftEditHref(request));
  }

  return (
    <div className="space-y-5">
      {detailRequest ? (
        <AdminQuoteDetailDrawer
          key={detailRequest.id}
          onClose={closeDetail}
          request={detailRequest}
          updateStatusAction={updateStatusAction}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-md border border-[#ffd1d4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#767676]">
            <ClipboardCheck aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Active submissions</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{activeQuoteRequests.length}</p>
        </article>
        <article className="rounded-md border border-[#ffd1d4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#767676]">
            <Truck aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Shop quotes</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{activeSupplierQuotes}</p>
        </article>
        <article className="rounded-md border border-[#ffd1d4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#767676]">
            <PackageCheck aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Ready to price</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{readyForIssueCount}</p>
        </article>
        <article className="rounded-md border border-[#ffd1d4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#767676]">
            <ReceiptText aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Quoted value</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{formatCurrency(quotedValueCents)}</p>
          {blockedRequests > 0 ? <p className="mt-2 text-[12px] font-semibold text-[#FC642D]">{blockedRequests} blocked</p> : null}
        </article>
      </section>

      <section className="overflow-hidden rounded-md border border-[#ffd1d4] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#eeeeee] bg-[#fff7f7] px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#767676]">Customer drafts</p>
            <h2 className="mt-1 text-[20px] font-semibold text-[#171717]">Draft quotes not yet requested</h2>
          </div>
          <p className="text-[12px] text-[#777d86]">
            Showing {draftRequests.length} {draftRequests.length === 1 ? "draft" : "drafts"}
          </p>
        </div>

        {draftRequests.length > 0 ? (
          <>
            <div className="grid grid-cols-[1.1fr_0.72fr_0.72fr_0.54fr] gap-4 border-b border-[#eeeeee] bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
              <span>Draft quote</span>
              <span>Customer</span>
              <span>Part and process</span>
              <span>Updated</span>
            </div>

            <div className="divide-y divide-[#eeeeee]">
              {draftRequests.map((request) => {
                const primaryLine = request.lineItems[0];

                return (
                  <article
                    aria-label={`Open draft for ${request.title}`}
                    className="grid cursor-pointer gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A5F] xl:grid-cols-[1.1fr_0.72fr_0.72fr_0.54fr] xl:items-center"
                    key={request.id}
                    onClick={() => router.push(draftEditHref(request))}
                    onKeyDown={(event) => openDraftFromKey(event, request)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                      </div>
                      <p className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Customer</p>
                      <div className="mt-1 flex min-w-0 items-center gap-2 xl:mt-0">
                        <p className="min-w-0 truncate text-[14px] font-medium text-[#30343a]">{request.buyerCompany}</p>
                        <CustomerProfileShortcut companyName={request.buyerCompany} customerProfileHrefs={customerProfileHrefs} />
                      </div>
                      <p className="mt-1 text-[12px] text-[#8a8f98]">{request.requesterName}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Part and process</p>
                      <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{primaryLine?.partName ?? "No line item"}</p>
                      <p className="mt-1 text-[12px] text-[#8a8f98]">
                        {request.process} {primaryLine?.material ? `- ${primaryLine.material}` : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Updated</p>
                      <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{formatDateTime(request.updatedAt)}</p>
                    </div>

                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-6 text-[14px] text-[#6f737a]">No customer draft quotes are visible yet.</div>
        )}
      </section>

      {quoteRequests.length === 0 ? (
        <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
          <h2 className="text-[22px] font-semibold text-[#202020]">No active quote submissions</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">Submitted RFQs will appear here once customers request quotes.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-md border border-[#ffd1d4] bg-white">
          <div className="border-b border-[#eeeeee] p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block xl:w-[420px]">
                <span className="sr-only">Search quote submissions</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" />
                <input
                  className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search RFQ, customer, file, shop..."
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
                        isActive ? "border-[#FF5A5F] bg-[#FF5A5F] text-white" : "border-[#ffd1d4] bg-white text-[#767676] hover:bg-[#fff1f2]"
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

          <div className="grid grid-cols-[1.1fr_0.66fr_0.64fr_0.72fr_0.7fr_0.6fr_0.72fr] gap-4 border-b border-[#eeeeee] bg-[#fff7f7] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#767676] max-xl:hidden">
            <span>RFQ package</span>
            <span>Customer</span>
            <span>Requested</span>
            <span>Files and parts</span>
            <span>Supplier basis</span>
            <span>Commercials</span>
            <span>Next step</span>
          </div>

          <div className="divide-y divide-[#eeeeee]">
            {filteredRequests.map((request) => {
              const primaryLine = request.lineItems[0];
              const status = statusCopy[request.status];
              const latestCustomerQuote = request.customerQuotes.at(-1);
              const selectedQuote = selectedSupplierQuote(request);
              const requestCadFiles = cadFiles(request);
              const requestDrawingFiles = drawingFiles(request);

              return (
                <article
                  aria-label={`Manage quote submission for ${request.title}`}
                  className="grid cursor-pointer gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A5F] xl:grid-cols-[1.1fr_0.66fr_0.64fr_0.72fr_0.7fr_0.6fr_0.72fr] xl:items-center"
                  key={request.id}
                  onClick={() => openDetail(request)}
                  onKeyDown={(event) => openDetailFromKey(event, request)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                    </div>
                    <button
                      className="mt-2 block max-w-full truncate text-left text-[15px] font-semibold text-[#202020] transition hover:text-[#FF5A5F]"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetail(request);
                      }}
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
                    <div className="mt-1 flex min-w-0 items-center gap-2 xl:mt-0">
                      <p className="min-w-0 truncate text-[14px] font-medium text-[#30343a]">{request.buyerCompany}</p>
                      <CustomerProfileShortcut companyName={request.buyerCompany} customerProfileHrefs={customerProfileHrefs} />
                    </div>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{request.requesterName}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Requested</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{formatDateTime(request.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Files and parts</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">
                      {request.lineItems.length} part(s), {request.files.length} file(s)
                    </p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">
                      {requestCadFiles.length} CAD / {requestDrawingFiles.length} drawing
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Supplier basis</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{selectedQuote?.shopName ?? supplierSummary(request)}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">
                      {selectedQuote ? `${formatCurrency(selectedQuote.priceCents)} / ${selectedQuote.leadTimeDays ?? "?"} days` : `${request.supplierQuotes.length} shop(s) contacted`}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Commercials</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{formatCurrency(latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents)}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">
                      {latestCustomerQuote ? `Customer v${latestCustomerQuote.versionNumber}` : request.quote.leadTimeDays ? `${request.quote.leadTimeDays} day lead time` : "Lead time pending"}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Next step</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{nextActionForRequest(request)}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{formatDate(request.dueDate)}</p>
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

          <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fff7f7] px-4 py-3 text-[12px] text-[#777d86]">
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
