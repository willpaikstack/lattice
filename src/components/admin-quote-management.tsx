"use client";

import { ClipboardCheck, FileText, PackageCheck, ReceiptText, Search, Truck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildCustomerQuoteInputFromRequest, buildCustomerQuoteInputFromVersion } from "@/lib/quote-file";
import type { LatticeRequest, SupplierQuoteStatus } from "@/lib/request-model";

import { CustomerQuoteBuilder } from "./customer-quote-builder";

const statusCopy: Record<LatticeRequest["status"], { label: string; tone: string; nextAction: string }> = {
  DRAFT: { label: "Draft", nextAction: "Review draft", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  SUBMITTED: { label: "Submitted", nextAction: "Assign owner and review intake", tone: "border-blue-100 bg-blue-50 text-blue-700" },
  NEEDS_INFO: { label: "Needs info", nextAction: "Recover buyer clarification", tone: "border-amber-100 bg-amber-50 text-amber-700" },
  READY_FOR_SUPPLIER_RFQ: { label: "Supplier ready", nextAction: "Send supplier RFQs", tone: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  QUOTED: { label: "Quoted", nextAction: "Follow buyer decision", tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
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
  { label: "Quoted", value: "QUOTED" },
  { label: "Closed", value: "CLOSED" },
];

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";

type AdminQuoteAction = (formData: FormData) => void | Promise<void>;

type StoredIncompleteRfq = {
  id: string;
  request?: LatticeRequest;
  updatedAt: string;
};

type PackageField = {
  label: string;
  value: string;
  isMissing?: boolean;
};

type PackageGroup = {
  title: string;
  fields: PackageField[];
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
  return cents === null ? "" : (cents / 100).toFixed(2);
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

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
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

function statusEventCopy(event: LatticeRequest["statusEvents"][number]) {
  const toLabel = statusCopy[event.to]?.label ?? event.to;
  const fromLabel = event.from ? (statusCopy[event.from]?.label ?? event.from) : "Created";

  if (event.from === event.to) {
    return `${toLabel} confirmed`;
  }

  return `${fromLabel} to ${toLabel}`;
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
  return request.files.filter((file) => /\.(step|stp|iges|igs|sldprt|x_t|x_b|sat|ipt)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type));
}

function drawingFiles(request: LatticeRequest) {
  return request.files.filter((file) => /\.(pdf|dwg|dxf|png|jpg|jpeg)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type));
}

function packageGroupsForRequest(request: LatticeRequest): PackageGroup[] {
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const selectedQuote = selectedSupplierQuote(request);
  const quoteValue = latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents;
  const leadTime = latestCustomerQuote?.leadTime || (request.quote.leadTimeDays ? `${request.quote.leadTimeDays} business days` : "");
  const hasShipping = Boolean(latestCustomerQuote?.shipping);
  const hasTax = Boolean(latestCustomerQuote?.tax);

  return [
    {
      title: "Quote identity",
      fields: [
        { label: "Quote number", value: quoteReference(request) },
        { label: "Quote date", value: latestCustomerQuote?.quoteDate ? formatDate(latestCustomerQuote.quoteDate) : "Set when issuing" },
        { label: "Valid until", value: latestCustomerQuote?.validUntil ? formatDate(latestCustomerQuote.validUntil) : "Set validity window", isMissing: !latestCustomerQuote },
        { label: "Prepared by", value: latestCustomerQuote?.preparedBy || "Lattice" },
      ],
    },
    {
      title: "Buyer and ship-to",
      fields: [
        { label: "Buyer", value: request.buyerCompany },
        { label: "Requester", value: request.requesterName },
        { label: "Ship-to address", value: "Collect at checkout or before issue", isMissing: true },
        { label: "Buyer contact", value: latestCustomerQuote?.customerContact || "Confirm email / phone", isMissing: !latestCustomerQuote?.customerContact },
      ],
    },
    {
      title: "Production and logistics",
      fields: [
        { label: "Production region", value: selectedQuote?.country || "Overseas supplier network", isMissing: !selectedQuote },
        { label: "Production speed", value: leadTime || "Lead time pending", isMissing: !leadTime },
        { label: "Ship-by / delivery", value: request.dueDate ? `Needed by ${formatDate(request.dueDate)}` : "Confirm target date", isMissing: !request.dueDate },
        { label: "Shipping terms", value: latestCustomerQuote?.shipping || "Billed at actual / confirm terms", isMissing: !hasShipping },
      ],
    },
    {
      title: "Commercials and terms",
      fields: [
        { label: "Part production", value: formatCurrency(quoteValue ?? null), isMissing: quoteValue === null },
        { label: "Shipping / tariffs", value: latestCustomerQuote?.shipping || "Confirm shipping and tariffs", isMissing: !hasShipping },
        { label: "Tax", value: latestCustomerQuote?.tax || "Confirm tax status", isMissing: !hasTax },
        { label: "DFM / customs notes", value: request.operatorReview.internalNotes || "Capture warnings, HTS/end-use, and terms", isMissing: !request.operatorReview.internalNotes },
      ],
    },
  ];
}

function readinessItems(request: LatticeRequest) {
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const selectedQuote = selectedSupplierQuote(request);
  const hasFiles = request.files.length > 0;
  const hasDrawings = drawingFiles(request).length > 0;
  const hasPricing = Boolean(latestCustomerQuote) || request.quote.estimatedPriceCents !== null;
  const hasLeadTime = Boolean(latestCustomerQuote?.leadTime) || request.quote.leadTimeDays !== null;
  const hasSupplierBasis = receivedSupplierQuotes(request).length > 0;

  return [
    { label: "CAD package", ready: hasFiles, detail: hasFiles ? `${request.files.length} file(s)` : "No files attached" },
    { label: "Drawing/specs", ready: hasDrawings, detail: hasDrawings ? `${drawingFiles(request).length} drawing file(s)` : "Confirm if drawing is required" },
    { label: "Supplier basis", ready: hasSupplierBasis, detail: selectedQuote ? selectedQuote.shopName : supplierSummary(request) },
    { label: "Price", ready: hasPricing, detail: hasPricing ? formatCurrency(latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents) : "Missing price" },
    { label: "Lead time", ready: hasLeadTime, detail: latestCustomerQuote?.leadTime || (request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Missing lead time") },
  ];
}

function PackageFieldList({ groups }: { groups: PackageGroup[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {groups.map((group) => (
        <article className="rounded-md border border-[#ead7c5] bg-[#fffaf6] p-4" key={group.title}>
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6f4529]">{group.title}</h4>
          <dl className="mt-3 space-y-2">
            {group.fields.map((field) => (
              <div className="grid gap-1 sm:grid-cols-[0.45fr_1fr]" key={`${group.title}-${field.label}`}>
                <dt className="text-[12px] font-semibold text-[#86644d]">{field.label}</dt>
                <dd className={`text-[13px] font-medium ${field.isMissing ? "text-[#a15c21]" : "text-[#24201d]"}`}>{field.value}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function ReadinessChecklist({ request }: { request: LatticeRequest }) {
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {readinessItems(request).map((item) => (
        <div className="rounded-md border border-[#eeeeee] bg-white px-3 py-2" key={item.label}>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${item.ready ? "bg-[#16a34a]" : "bg-[#d97706]"}`} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#737b86]">{item.label}</p>
          </div>
          <p className="mt-1 truncate text-[13px] font-medium text-[#30343a]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

function AdminQuoteDetailDrawer({
  isQuoteBuilderOpen,
  onClose,
  onQuoteBuilderOpenChange,
  request,
  saveQuoteAction,
  updateStatusAction,
}: {
  isQuoteBuilderOpen: boolean;
  onClose: () => void;
  onQuoteBuilderOpenChange: (isOpen: boolean) => void;
  request: LatticeRequest;
  saveQuoteAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const quoteInput = latestCustomerQuote ? buildCustomerQuoteInputFromVersion(latestCustomerQuote) : buildCustomerQuoteInputFromRequest(request);
  const status = statusCopy[request.status];
  const selectedQuote = selectedSupplierQuote(request);
  const packageGroups = packageGroupsForRequest(request);
  const requestCadFiles = cadFiles(request);
  const requestDrawingFiles = drawingFiles(request);

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-[#1f2937]/45 px-4 py-6" role="dialog">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-md border border-[#e2d6ca] bg-[#fff7f0] shadow-2xl">
        <div className="sticky top-0 z-10 border-b border-[#e8d2bf] bg-white">
          <div className="flex flex-col gap-4 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a4d2d]">RFQ command center</p>
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
              </div>
              <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#171717]">{request.title}</h2>
              <p className="mt-1 text-[14px] text-[#64748b]">
                {quoteReference(request)} - {request.buyerCompany} - {request.process}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {saveQuoteAction ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#4f3424] px-4 text-[13px] font-semibold text-white transition hover:bg-[#3a281d]"
                  onClick={() => onQuoteBuilderOpenChange(!isQuoteBuilderOpen)}
                  type="button"
                >
                  <ReceiptText aria-hidden="true" size={16} />
                  {isQuoteBuilderOpen ? "Hide package" : latestCustomerQuote ? "Revise quote" : "Issue quote"}
                </button>
              ) : null}
              <button
                aria-label="Close RFQ drawer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d7d7d7] bg-white text-[#262626] transition hover:bg-[#f8fafc]"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <section className="grid gap-3 md:grid-cols-4">
            <article className="rounded-md border border-[#ead7c5] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86644d]">Part production</p>
              <p className="mt-2 text-[24px] font-semibold text-[#171717]">{formatCurrency(latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents)}</p>
            </article>
            <article className="rounded-md border border-[#ead7c5] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86644d]">Lead time</p>
              <p className="mt-2 text-[24px] font-semibold text-[#171717]">{latestCustomerQuote?.leadTime || (request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Pending")}</p>
            </article>
            <article className="rounded-md border border-[#ead7c5] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86644d]">Supplier basis</p>
              <p className="mt-2 text-[16px] font-semibold text-[#171717]">{selectedQuote?.shopName ?? supplierSummary(request)}</p>
              <p className="mt-1 text-[12px] text-[#777d86]">{selectedQuote?.country ?? `${request.supplierQuotes.length} shop(s) contacted`}</p>
            </article>
            <article className="rounded-md border border-[#ead7c5] bg-white p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86644d]">Next step</p>
              <p className="mt-2 text-[16px] font-semibold text-[#171717]">{nextActionForRequest(request)}</p>
              <p className="mt-1 text-[12px] text-[#777d86]">Updated {formatDateTime(request.updatedAt)}</p>
            </article>
          </section>

          <section className="rounded-md border border-[#ead7c5] bg-[#fffdfb] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-[18px] font-semibold text-[#171717]">Quote package worksheet</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#64748b]">
                  Fields are organized around the quote packet information used in prior Fictiv orders: identity, buyer/ship-to, production logistics, pricing, and terms.
                </p>
              </div>
              <span className="w-fit rounded-md border border-[#ead7c5] bg-[#fff6ee] px-3 py-1 text-[12px] font-semibold text-[#6f4529]">Fictiv-style packet</span>
            </div>
            <div className="mt-4">
              <PackageFieldList groups={packageGroups} />
            </div>
          </section>

          <ReadinessChecklist request={request} />

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5">
              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[18px] font-semibold text-[#171717]">Review controls</h3>
                    <p className="mt-1 text-[13px] leading-5 text-[#64748b]">Set the RFQ state, owner, pricing basis, and supplier package notes.</p>
                  </div>
                  <span className="rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-1 text-[12px] font-semibold text-[#4b5563]">
                    {nextActionForRequest(request)}
                  </span>
                </div>

                <form action={updateStatusAction} className="mt-4 grid gap-4">
                  <input name="requestId" type="hidden" value={request.id} />
                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Status
                    <select
                      className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.status}
                      name="status"
                    >
                      <option value="SUBMITTED">Submitted</option>
                      <option value="NEEDS_INFO">Needs info</option>
                      <option value="READY_FOR_SUPPLIER_RFQ">Supplier ready</option>
                      <option value="QUOTED">Quoted</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </label>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Assigned owner
                      <input
                        className="h-10 rounded-md border border-[#d9d9d9] px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={request.operatorReview.assignedOwner ?? ""}
                        name="assignedOwner"
                        placeholder="Admin owner"
                      />
                    </label>
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Estimated price
                      <input
                        className="h-10 rounded-md border border-[#d9d9d9] px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={formatCurrencyInput(request.quote.estimatedPriceCents)}
                        inputMode="decimal"
                        name="estimatedPrice"
                        placeholder="0.00"
                      />
                    </label>
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Lead time days
                      <input
                        className="h-10 rounded-md border border-[#d9d9d9] px-3 text-[14px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={request.quote.leadTimeDays ?? ""}
                        inputMode="numeric"
                        name="leadTimeDays"
                        placeholder="15"
                      />
                    </label>
                  </div>

                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Customer quote summary
                    <textarea
                      className="min-h-20 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.quote.summary}
                      name="quoteSummary"
                      placeholder="Short customer-facing quote summary"
                    />
                  </label>

                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Supplier package notes
                    <textarea
                      className="min-h-20 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.operatorReview.supplierPackageNotes}
                      name="supplierPackageNotes"
                      placeholder="What suppliers need to quote cleanly"
                    />
                  </label>

                  <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                    Internal DFM / terms notes
                    <textarea
                      className="min-h-24 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                      defaultValue={request.operatorReview.internalNotes}
                      name="internalNotes"
                      placeholder="DFM warnings, buyer clarification, customs/end-use, tariff, HTS, or tolerance notes"
                    />
                  </label>

                  <button
                    className="h-10 w-fit rounded-md bg-[#262626] px-4 text-[13px] font-semibold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#b7c9ef]"
                    disabled={!updateStatusAction}
                    type="submit"
                  >
                    Save review decision
                  </button>
                </form>
              </section>

              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <h3 className="text-[18px] font-semibold text-[#171717]">Buyer intake</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Customer</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020]">{request.buyerCompany}</p>
                    <p className="mt-1 text-[13px] text-[#69707a]">{request.requesterName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Needed by</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020]">{formatDate(request.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Process</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020]">{request.process}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Submitted</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020]">{formatDateTime(request.createdAt)}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <div className="flex items-center gap-2">
                  <PackageCheck aria-hidden="true" className="text-[#6f4529]" size={18} />
                  <h3 className="text-[18px] font-semibold text-[#171717]">Line items</h3>
                </div>
                <div className="mt-4 space-y-3">
                  {request.lineItems.map((lineItem, index) => (
                    <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={`${lineItem.partName}-${index}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#202020]">{lineItem.partName}</p>
                        <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563]">Qty {lineItem.quantity}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-5 text-[#64748b]">
                        {request.process} - {lineItem.material} - {lineItem.generalTolerance || "Tolerance TBD"} - {lineItem.surfaceFinish || "Finish TBD"}
                      </p>
                      {(lineItem.qualityDocumentation?.length ?? 0) > 0 ? (
                        <p className="mt-2 text-[12px] font-semibold text-[#4b5563]">Quality docs: {lineItem.qualityDocumentation?.join(", ")}</p>
                      ) : null}
                      {lineItem.notes ? <p className="mt-2 text-[13px] leading-5 text-[#64748b]">{lineItem.notes}</p> : null}
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <div className="flex items-center gap-2">
                  <FileText aria-hidden="true" className="text-[#6f4529]" size={18} />
                  <h3 className="text-[18px] font-semibold text-[#171717]">Files and activity</h3>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">CAD files</p>
                    {(requestCadFiles.length ? requestCadFiles : request.files).map((file) => (
                      <div className="flex items-center justify-between gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2" key={file.id}>
                        <span className="truncate text-[13px] font-semibold text-[#30343a]">{file.name}</span>
                        <span className="shrink-0 text-[12px] text-[#8a8f98]">{formatFileSize(file.sizeBytes)}</span>
                      </div>
                    ))}
                    {requestDrawingFiles.length > 0 ? (
                      <>
                        <p className="pt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Drawings / specs</p>
                        {requestDrawingFiles.map((file) => (
                          <div className="flex items-center justify-between gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2" key={file.id}>
                            <span className="truncate text-[13px] font-semibold text-[#30343a]">{file.name}</span>
                            <span className="shrink-0 text-[12px] text-[#8a8f98]">{formatFileSize(file.sizeBytes)}</span>
                          </div>
                        ))}
                      </>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Status history</p>
                    {request.statusEvents.map((event) => (
                      <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2" key={event.id}>
                        <p className="text-[13px] font-semibold text-[#30343a]">{statusEventCopy(event)}</p>
                        <p className="mt-1 text-[12px] text-[#8a8f98]">
                          {event.actor} - {formatDateTime(event.at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[18px] font-semibold text-[#171717]">Customer quote packet</h3>
                    <p className="mt-1 text-[13px] leading-5 text-[#64748b]">
                      {latestCustomerQuote
                        ? `${latestCustomerQuote.quoteNumber} v${latestCustomerQuote.versionNumber} is saved for the buyer.`
                        : "Build the buyer-facing quote after price, lead time, files, shipping, tax, and terms are ready."}
                    </p>
                  </div>
                  {saveQuoteAction ? (
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d7d7d7] bg-white px-4 text-[13px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                      onClick={() => onQuoteBuilderOpenChange(!isQuoteBuilderOpen)}
                      type="button"
                    >
                      <ReceiptText aria-hidden="true" size={16} />
                      {isQuoteBuilderOpen ? "Hide package" : latestCustomerQuote ? "Revise quote" : "Issue quote"}
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Quote total</p>
                    <p className="mt-2 text-[20px] font-semibold text-[#202020]">{formatCurrency(latestCustomerQuote?.totalCents ?? request.quote.estimatedPriceCents)}</p>
                  </div>
                  <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Lead time</p>
                    <p className="mt-2 text-[20px] font-semibold text-[#202020]">
                      {latestCustomerQuote?.leadTime || (request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Pending")}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Buyer version</p>
                    <p className="mt-2 text-[20px] font-semibold text-[#202020]">{latestCustomerQuote ? `v${latestCustomerQuote.versionNumber}` : "None"}</p>
                  </div>
                </div>

                {request.quote.summary ? <p className="mt-4 text-[14px] leading-6 text-[#4b5563]">{request.quote.summary}</p> : null}
              </section>

              {isQuoteBuilderOpen ? <CustomerQuoteBuilder initialQuote={quoteInput} requestId={request.id} saveAction={saveQuoteAction} /> : null}

              <section className="rounded-md border border-[#e6e6e6] bg-white p-4">
                <div className="flex items-center gap-2">
                  <Truck aria-hidden="true" className="text-[#6f4529]" size={18} />
                  <h3 className="text-[18px] font-semibold text-[#171717]">Supplier quote basis</h3>
                </div>
                <p className="mt-1 text-[13px] leading-5 text-[#64748b]">{supplierSummary(request)}</p>
                <div className="mt-4 space-y-3">
                  {request.supplierQuotes.length > 0 ? (
                    request.supplierQuotes.map((quote) => (
                      <article className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={quote.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-[#202020]">{quote.shopName}</p>
                          <span className="rounded-md bg-white px-2 py-1 text-[12px] font-semibold text-[#4b5563]">{supplierQuoteLabels[quote.status]}</span>
                        </div>
                        <p className="mt-2 text-[13px] text-[#64748b]">
                          {quote.contactName} - {quote.country} - {formatCurrency(quote.priceCents)} - {quote.leadTimeDays ? `${quote.leadTimeDays} day lead time` : "Lead time pending"}
                        </p>
                        {quote.notes ? <p className="mt-2 text-[13px] leading-5 text-[#64748b]">{quote.notes}</p> : null}
                      </article>
                    ))
                  ) : (
                    <p className="rounded-md border border-dashed border-[#d9d9d9] bg-[#fafafa] p-4 text-[13px] text-[#64748b]">No supplier outreach has been recorded yet.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminQuoteManagement({
  requests,
  saveQuoteAction,
  updateStatusAction,
}: {
  requests: LatticeRequest[];
  saveQuoteAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("ALL");
  const [detailRequest, setDetailRequest] = useState<LatticeRequest | null>(null);
  const [isQuoteBuilderOpen, setIsQuoteBuilderOpen] = useState(false);
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

  function openDetail(request: LatticeRequest, showQuoteBuilder = false) {
    setDetailRequest(request);
    setIsQuoteBuilderOpen(showQuoteBuilder);
  }

  return (
    <div className="space-y-5">
      {detailRequest ? (
        <AdminQuoteDetailDrawer
          isQuoteBuilderOpen={isQuoteBuilderOpen}
          onClose={() => setDetailRequest(null)}
          onQuoteBuilderOpenChange={setIsQuoteBuilderOpen}
          request={detailRequest}
          saveQuoteAction={saveQuoteAction}
          updateStatusAction={updateStatusAction}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-md border border-[#e7d3c1] bg-white p-4">
          <div className="flex items-center gap-2 text-[#6f4529]">
            <ClipboardCheck aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Active submissions</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{activeQuoteRequests.length}</p>
        </article>
        <article className="rounded-md border border-[#e7d3c1] bg-white p-4">
          <div className="flex items-center gap-2 text-[#6f4529]">
            <Truck aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Shop quotes</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{activeSupplierQuotes}</p>
        </article>
        <article className="rounded-md border border-[#e7d3c1] bg-white p-4">
          <div className="flex items-center gap-2 text-[#6f4529]">
            <PackageCheck aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Ready to price</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{readyForIssueCount}</p>
        </article>
        <article className="rounded-md border border-[#e7d3c1] bg-white p-4">
          <div className="flex items-center gap-2 text-[#6f4529]">
            <ReceiptText aria-hidden="true" size={17} />
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em]">Quoted value</p>
          </div>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{formatCurrency(quotedValueCents)}</p>
          {blockedRequests > 0 ? <p className="mt-2 text-[12px] font-semibold text-[#a15c21]">{blockedRequests} blocked</p> : null}
        </article>
      </section>

      <section className="overflow-hidden rounded-md border border-[#e6d2bf] bg-white">
        <div className="flex flex-col gap-2 border-b border-[#eeeeee] bg-[#fffaf6] px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7a4d2d]">Customer drafts</p>
            <h2 className="mt-1 text-[20px] font-semibold text-[#171717]">Draft quotes not yet requested</h2>
          </div>
          <p className="text-[12px] text-[#777d86]">
            Showing {draftRequests.length} {draftRequests.length === 1 ? "draft" : "drafts"}
          </p>
        </div>

        {draftRequests.length > 0 ? (
          <>
            <div className="grid grid-cols-[1.1fr_0.72fr_0.72fr_0.54fr_0.58fr] gap-4 border-b border-[#eeeeee] bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
              <span>Draft quote</span>
              <span>Customer</span>
              <span>Part and process</span>
              <span>Updated</span>
              <span>Action</span>
            </div>

            <div className="divide-y divide-[#eeeeee]">
              {draftRequests.map((request) => {
                const primaryLine = request.lineItems[0];

                return (
                  <article
                    className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] xl:grid-cols-[1.1fr_0.72fr_0.72fr_0.54fr_0.58fr] xl:items-center"
                    key={request.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                        <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusCopy.DRAFT.tone}`}>Draft</span>
                      </div>
                      <p className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{request.title}</p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Customer</p>
                      <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.buyerCompany}</p>
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

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Action</p>
                      <Link
                        className="mt-1 inline-flex rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc] xl:mt-0"
                        href={draftEditHref(request)}
                      >
                        Open draft
                      </Link>
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
        <section className="overflow-hidden rounded-md border border-[#e6d2bf] bg-white">
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

          <div className="grid grid-cols-[1.14fr_0.68fr_0.74fr_0.72fr_0.62fr_0.76fr] gap-4 border-b border-[#eeeeee] bg-[#fffaf6] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80614d] max-xl:hidden">
            <span>RFQ package</span>
            <span>Customer</span>
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
                  className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f3424] xl:grid-cols-[1.14fr_0.68fr_0.74fr_0.72fr_0.62fr_0.76fr] xl:items-center"
                  key={request.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                    </div>
                    <button
                      className="mt-2 block max-w-full truncate text-left text-[15px] font-semibold text-[#202020] transition hover:text-[#4f3424]"
                      onClick={() => openDetail(request)}
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
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{request.buyerCompany}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{request.requesterName}</p>
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                        onClick={() => openDetail(request)}
                        type="button"
                      >
                        Open RFQ
                      </button>
                      {saveQuoteAction ? (
                        <button
                          className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                          onClick={() => openDetail(request, true)}
                          type="button"
                        >
                          {latestCustomerQuote ? "Revise quote" : "Issue quote"}
                        </button>
                      ) : null}
                    </div>
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

          <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fffaf6] px-4 py-3 text-[12px] text-[#777d86]">
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
