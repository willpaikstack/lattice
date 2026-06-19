"use client";

import { ExternalLink, FileText, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import type { OverseasVendor } from "@/lib/admin-vendors";
import { quotedLineForRequestItem, type LatticeRequest } from "@/lib/request-model";
import { SupplierQuoteFiles } from "./supplier-quote-files";

const statusCopy: Record<LatticeRequest["status"], { label: string; tone: string; nextAction: string }> = {
  DRAFT: { label: "Draft", nextAction: "Review draft", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  SUBMITTED: { label: "Submitted", nextAction: "Assign owner and review intake", tone: "border-[#ffd1d4] bg-[#fff1f2] text-[#FF5A5F]" },
  NEEDS_INFO: { label: "Needs info", nextAction: "Recover buyer clarification", tone: "border-[#ffd4c3] bg-[#fff0ea] text-[#FC642D]" },
  READY_FOR_SUPPLIER_RFQ: { label: "Supplier ready", nextAction: "Send supplier RFQs", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  QUOTED: { label: "Quote received", nextAction: "Follow buyer decision", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  PURCHASED: { label: "Purchased", nextAction: "Track order", tone: "border-slate-950 bg-slate-950 text-white" },
  CLOSED: { label: "Closed", nextAction: "No active quote work", tone: "border-slate-200 bg-slate-50 text-slate-700" },
};

type AdminQuoteStatusGroup = "QUOTE_REQUESTED" | "QUOTE_RECEIVED" | "ARCHIVED";
type AdminQuoteStatusFilter = "ALL" | AdminQuoteStatusGroup;
type RfqDecisionStatus = "NEEDS_INFO" | "CLOSED";

const customerQuoteStatusCopy: Record<AdminQuoteStatusGroup, { label: string; tone: string }> = {
  QUOTE_REQUESTED: { label: "Quote Requested", tone: "border-[#b8d4ff] bg-[#eef5ff] text-[#0f5fb8]" },
  QUOTE_RECEIVED: { label: "Quote Received", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  ARCHIVED: { label: "Archived", tone: "border-slate-200 bg-slate-50 text-slate-700" },
};

const statusFilters: Array<{ label: string; value: AdminQuoteStatusFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Quote Requested", value: "QUOTE_REQUESTED" },
  { label: "Quote Received", value: "QUOTE_RECEIVED" },
  { label: "Archived", value: "ARCHIVED" },
];

const statusGroupOrder: AdminQuoteStatusGroup[] = ["QUOTE_REQUESTED", "QUOTE_RECEIVED", "ARCHIVED"];

const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";

type AdminQuoteAction = (formData: FormData) => void | Promise<void>;

const rfqDecisionCopy: Record<RfqDecisionStatus, { actionLabel: string; body: string; submitLabel: string; title: string }> = {
  CLOSED: {
    actionLabel: "No quote",
    body: "Close this RFQ and show the customer why Lattice is unable to quote it.",
    submitLabel: "Send no quote",
    title: "No quote this RFQ",
  },
  NEEDS_INFO: {
    actionLabel: "Request information",
    body: "Ask the customer for the clarification needed before quoting can continue.",
    submitLabel: "Send request",
    title: "Request additional information",
  },
};

type StoredIncompleteRfq = {
  id: string;
  request?: LatticeRequest;
  updatedAt: string;
};

function formatCurrencyPrecise(cents: number | null | undefined) {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function formatDollarAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function formatCurrencyInput(cents: number | null) {
  return cents === null || !Number.isFinite(cents) ? "" : (cents / 100).toFixed(2);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Pending";
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
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

function selectedSupplierQuote(request: LatticeRequest) {
  return request.supplierQuotes.find((quote) => quote.isSelected) ?? request.supplierQuotes.find((quote) => quote.status === "SELECTED") ?? null;
}

function adminQuoteStatusGroup(request: LatticeRequest): AdminQuoteStatusGroup {
  if (request.isArchived || request.status === "CLOSED") {
    return "ARCHIVED";
  }

  if (request.status === "QUOTED") {
    return "QUOTE_RECEIVED";
  }

  return "QUOTE_REQUESTED";
}

function adminQuoteStatusNote(request: LatticeRequest) {
  if (request.status === "NEEDS_INFO" || request.status === "READY_FOR_SUPPLIER_RFQ") {
    return statusCopy[request.status].label;
  }

  return null;
}

function draftEditHref(request: LatticeRequest) {
  return `/requests/new?draft=${encodeURIComponent(request.id)}`;
}

function quoteDetailHref(request: LatticeRequest) {
  return `/admin/quotes?requestId=${encodeURIComponent(request.id)}`;
}

function quoteDecisionHref(request: LatticeRequest, decision: RfqDecisionStatus) {
  return `${quoteDetailHref(request)}&decision=${encodeURIComponent(decision)}`;
}

function parsedRfqDecision(value: string | null) {
  return value === "NEEDS_INFO" || value === "CLOSED" ? value : null;
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
      className="pointer-events-auto relative z-20 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#ffd1d4] bg-white text-[#767676] transition hover:border-[#FF5A5F] hover:bg-[#fff1f2] hover:text-[#FF5A5F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5A5F]"
      href={customerProfileHref(companyName, customerProfileHrefs)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
      title={`Open customer page for ${companyName}`}
    >
      <ExternalLink aria-hidden="true" size={14} />
    </Link>
  );
}

function DrawerMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-[#eeeeee] bg-[#fafafa] px-2.5 py-1 text-[12px]">
      <dt className="font-semibold uppercase tracking-[0.14em] text-[#8a8f98]">{label}</dt>
      <dd className="font-semibold text-[#30343a]">{value}</dd>
    </div>
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

function lineItemUnitPriceDisplay(request: LatticeRequest, lineItem: LatticeRequest["lineItems"][number]) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = quotedLineForRequestItem(latestQuote?.lineItems, lineItem);

  if (quotedLine) {
    return formatDollarAmount(quotedLine.unitPrice);
  }

  if (request.lineItems.length === 1 && request.quote.estimatedPriceCents !== null && lineItem.quantity > 0) {
    return formatDollarAmount(request.quote.estimatedPriceCents / 100 / lineItem.quantity);
  }

  return "Pending";
}

function lineItemLeadTimeInput(request: LatticeRequest, lineItem: LatticeRequest["lineItems"][number]) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = quotedLineForRequestItem(latestQuote?.lineItems, lineItem);

  return quotedLine?.leadTimeDays ?? request.quote.leadTimeDays ?? "";
}

function lineItemLeadTimeDisplay(request: LatticeRequest, lineItem: LatticeRequest["lineItems"][number]) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = quotedLineForRequestItem(latestQuote?.lineItems, lineItem);
  const leadTimeDays = quotedLine?.leadTimeDays ?? request.quote.leadTimeDays;

  return leadTimeDays ? `${leadTimeDays} business days` : "Pending";
}

const supplierCountryOptions = ["China", "Vietnam", "India"];
const defaultShippingMethod = "International";
const shippingDurationDaysByMethod: Record<string, number> = {
  Domestic: 2,
  International: 5,
};

function supplierCountryValue(country: string | null | undefined) {
  return country && supplierCountryOptions.includes(country) ? country : "China";
}

function shippingDurationDays(method: string) {
  return shippingDurationDaysByMethod[method] ?? 0;
}

function integerInputValue(value: string | number | null | undefined) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function calculatedSupplierLeadTimeDays(leadTimeValues: string[], shippingMethod: string) {
  const leadTimes = leadTimeValues.map(integerInputValue).filter((value): value is number => typeof value === "number");

  return leadTimes.length ? Math.max(...leadTimes) + shippingDurationDays(shippingMethod) : null;
}

function vendorShopOptions(vendors: OverseasVendor[], currentShopName: string) {
  const options = vendors.map((vendor) => ({
    label: vendor.name,
    value: vendor.name,
  }));

  if (currentShopName && !options.some((option) => option.value === currentShopName)) {
    options.unshift({
      label: currentShopName,
      value: currentShopName,
    });
  }

  return options;
}

function selectedShopNameFromRequest(request: LatticeRequest) {
  const selectedShop = selectedSupplierQuote(request)?.shopName.trim();

  if (selectedShop) {
    return selectedShop;
  }

  const orderShop = request.supplierOrder.shopName.trim();
  return orderShop && orderShop !== "China supplier team" ? orderShop : "";
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a8f98]">{label}</p>
      <p className="min-h-11 rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-3 text-[14px] font-semibold text-[#202020]">{value || "Pending"}</p>
    </div>
  );
}

function StepHeading({ children, number, summary }: { children: string; number: number; summary?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff1f2] text-[13px] font-semibold text-[#FF5A5F]">
        {number}
      </span>
      <div>
        <h3 className="text-[16px] font-semibold text-[#171717]">{children}</h3>
        {summary ? <p className="mt-1 text-[13px] leading-5 text-[#6f737a]">{summary}</p> : null}
      </div>
    </div>
  );
}

function DownloadFileLink({ file }: { file: LatticeRequest["files"][number] }) {
  const href = fileDownloadHref(file);

  if (!href) {
    return (
      <span className="inline-flex min-w-0 items-center text-[12px] font-medium text-[#9a5a2f]" title={`${fileKindLabel(file)} unavailable`}>
        <span className="truncate">{file.name} unavailable</span>
      </span>
    );
  }

  return (
    <a
      className="inline-flex min-w-0 items-center text-[13px] font-semibold text-[#315a94] underline-offset-2 hover:underline"
      download={file.name}
      href={href}
      title={`${fileKindLabel(file)}: ${file.name}`}
    >
      <span className="truncate">{file.name}</span>
    </a>
  );
}

function AdminQuoteDetailDrawer({
  initialDecision,
  onClose,
  overseasVendors,
  request,
  updateDecisionAction,
  updateStatusAction,
}: {
  initialDecision?: RfqDecisionStatus | null;
  onClose: () => void;
  overseasVendors: OverseasVendor[];
  request: LatticeRequest;
  updateDecisionAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const status = statusCopy[request.status];
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const selectedShopQuote = selectedSupplierQuote(request);
  const isIssuedQuote = request.status === "QUOTED" && Boolean(latestCustomerQuote);
  const [isEditingIssuedQuote, setIsEditingIssuedQuote] = useState(false);
  const [activeDecision, setActiveDecision] = useState<RfqDecisionStatus | null>(initialDecision ?? null);
  const [decisionNote, setDecisionNote] = useState("");
  const isReadOnlyIssuedQuote = isIssuedQuote && !isEditingIssuedQuote;
  const { bundles, unassignedFiles } = bundledFilesByPart(request);
  const quoteCreatedDate = defaultQuoteCreatedDate(request);
  const [quoteValidUntil, setQuoteValidUntil] = useState(defaultQuoteValidUntil(request, quoteCreatedDate));
  const currentShopName = selectedShopNameFromRequest(request) || overseasVendors[0]?.name || "China supplier team";
  const shopOptions = vendorShopOptions(overseasVendors, currentShopName);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(request.quote.shippingMethod || defaultShippingMethod);
  const [quoteLineLeadTimeValues, setQuoteLineLeadTimeValues] = useState(() =>
    Object.fromEntries(request.lineItems.map((lineItem) => [lineItem.id, String(lineItemLeadTimeInput(request, lineItem) ?? "")])),
  );
  const overallSupplierLeadTimeDays = calculatedSupplierLeadTimeDays(Object.values(quoteLineLeadTimeValues), selectedShippingMethod);
  const quoteResponseFormId = `quote-response-${request.id}`;
  const canSendRfqDecision = Boolean(updateDecisionAction) && request.status !== "CLOSED" && request.status !== "PURCHASED" && !isReadOnlyIssuedQuote;
  const activeDecisionCopy = activeDecision ? rfqDecisionCopy[activeDecision] : null;
  const decisionNoteIsReady = decisionNote.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1f2937]/45 px-4 py-6" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="mx-auto max-w-[1120px] overflow-hidden rounded-md bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 z-10 border-b border-[#eeeeee] bg-white">
          <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">RFQ response</p>
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
              </div>
              <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#171717]">{request.title}</h2>
              <dl aria-label="RFQ summary" className="mt-3 flex flex-wrap gap-2">
                <DrawerMetaItem label="Quote" value={quoteReference(request)} />
                <DrawerMetaItem label="Customer" value={request.buyerCompany} />
                <DrawerMetaItem label="Process" value={request.process} />
              </dl>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canSendRfqDecision ? (
                <>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                    href={quoteDecisionHref(request, "NEEDS_INFO")}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveDecision("NEEDS_INFO");
                      setDecisionNote("");
                    }}
                    role="button"
                  >
                    Request information
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#ffd1d4] bg-white px-3 text-[12px] font-semibold text-[#c23b40] transition hover:bg-[#fff7f7]"
                    href={quoteDecisionHref(request, "CLOSED")}
                    onClick={(event) => {
                      event.preventDefault();
                      setActiveDecision("CLOSED");
                      setDecisionNote("");
                    }}
                    role="button"
                  >
                    No quote
                  </Link>
                </>
              ) : null}
              {isIssuedQuote ? (
                <button
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                  onClick={() => setIsEditingIssuedQuote((current) => !current)}
                  type="button"
                >
                  {isEditingIssuedQuote ? "Cancel edit" : "Edit quote"}
                </button>
              ) : null}
              {latestCustomerQuote ? (
                <a
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                  href={`/admin/quotes/${request.id}/quote.pdf`}
                  rel="noreferrer"
                  target="_blank"
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

        <div className="px-6 py-6">
          {activeDecision && activeDecisionCopy ? (
            <section aria-label={activeDecisionCopy.title} className="mb-6 rounded-md border border-[#ffd1d4] bg-[#fff7f7] p-4" role="region">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#767676]">Customer-facing outcome</p>
                  <h3 className="mt-1 text-[18px] font-semibold text-[#202020]">{activeDecisionCopy.title}</h3>
                  <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#6f737a]">{activeDecisionCopy.body}</p>
                </div>
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md px-3 text-[12px] font-semibold text-[#484848] transition hover:bg-white"
                  href={quoteDetailHref(request)}
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveDecision(null);
                    setDecisionNote("");
                  }}
                  role="button"
                >
                  Cancel
                </Link>
              </div>
              <form action={updateDecisionAction} className="mt-4 grid gap-3">
                <input name="requestId" type="hidden" value={request.id} />
                <input name="status" type="hidden" value={activeDecision} />
                <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                  Customer note
                  <textarea
                    className="min-h-28 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                    name="customerNote"
                    onChange={(event) => setDecisionNote(event.currentTarget.value)}
                    placeholder={
                      activeDecision === "NEEDS_INFO"
                        ? "Example: Please upload the latest drawing with threaded-hole callouts before we can quote accurately."
                        : "Example: We are unable to quote this RFQ because the required process is outside our current supplier network."
                    }
                    required
                    value={decisionNote}
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    className={`h-10 rounded-md px-4 text-[13px] font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#d6d6d6] ${
                      activeDecision === "CLOSED" ? "bg-[#c23b40] hover:bg-[#9f2f34]" : "bg-[#262626] hover:bg-[#171717]"
                    }`}
                    disabled={!decisionNoteIsReady}
                    type="submit"
                  >
                    {activeDecisionCopy.submitLabel}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
          <SupplierQuoteFiles
            readOnly={isReadOnlyIssuedQuote}
            removeHref={isReadOnlyIssuedQuote ? undefined : "/api/supplier-quote-files/remove"}
            request={request}
            returnTo={`/admin/quotes?requestId=${encodeURIComponent(request.id)}`}
            stepNumber={1}
            uploadHref={isReadOnlyIssuedQuote ? undefined : "/api/supplier-quote-files"}
            variant="admin"
          >
            <div className="grid gap-4 lg:grid-cols-4">
              <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                Shop name
                <select
                  className="h-11 rounded-md border border-[#d9d9d9] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                  defaultValue={currentShopName}
                  form={quoteResponseFormId}
                  name="supplierQuoteShop"
                >
                  {shopOptions.map((vendor) => (
                    <option key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                Country
                <select
                  className="h-11 rounded-md border border-[#d9d9d9] bg-white px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                  defaultValue={supplierCountryValue(selectedShopQuote?.country)}
                  form={quoteResponseFormId}
                  name="supplierQuoteCountry"
                >
                  {supplierCountryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                Overall lead time days
                <input
                  className="h-11 rounded-md border border-[#d9d9d9] bg-[#fafafa] px-3 text-[15px] font-semibold text-[#202020] outline-none"
                  form={quoteResponseFormId}
                  inputMode="numeric"
                  name="supplierQuoteLeadTime"
                  placeholder="Calculated"
                  readOnly
                  value={overallSupplierLeadTimeDays ?? ""}
                />
              </label>
            </div>
          </SupplierQuoteFiles>
          <form action={updateStatusAction} id={quoteResponseFormId}>
            <input name="requestId" type="hidden" value={request.id} />
            <input name="status" type="hidden" value="QUOTED" />
            <input name="assignedOwner" type="hidden" value={request.operatorReview.assignedOwner ?? ""} />
            <input name="supplierPackageNotes" type="hidden" value={request.operatorReview.supplierPackageNotes} />
            <input name="internalNotes" type="hidden" value={request.operatorReview.internalNotes} />
            <input name="quoteCreatedDate" type="hidden" value={quoteCreatedDate} />

            <section className="border-t border-[#eeeeee] py-6">
              <StepHeading
                number={2}
                summary={isReadOnlyIssuedQuote ? "Saved part pricing and lead times from the issued customer quote." : "Review each part package, then enter the supplier-backed price and lead time."}
              >
                {isReadOnlyIssuedQuote ? "Issued pricing and lead time" : "Enter pricing and lead time"}
              </StepHeading>
              {isReadOnlyIssuedQuote ? (
                <p className="mt-3 rounded-md bg-[#f4fbfa] px-3 py-2 text-[13px] leading-5 text-[#315a94]">
                  This quote has already been issued to the customer. Values below show the latest saved customer quote version.
                </p>
              ) : isIssuedQuote ? (
                <p className="mt-3 rounded-md bg-[#fff7f7] px-3 py-2 text-[13px] leading-5 text-[#8a3a3d]">
                  Editing this issued quote will save a new customer quote version and update the buyer-facing quote.
                </p>
              ) : null}
              <div className="mt-4 overflow-x-auto rounded-md border border-[#e6e6e6]">
                <div className="min-w-[1080px]">
                  <div className="grid grid-cols-[minmax(150px,0.55fr)_minmax(250px,1fr)_minmax(190px,0.78fr)_56px_150px_150px] items-center gap-2 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b8088]">
                    <span>Part</span>
                    <span>Specs</span>
                    <span>Uploaded files</span>
                    <span className="text-center">Qty</span>
                    <span>Unit price</span>
                    <span>Lead time</span>
                  </div>
                  <div className="divide-y divide-[#eeeeee]">
                    {bundles.map(({ files, lineItem }) => (
                      <div className="grid grid-cols-[minmax(150px,0.55fr)_minmax(250px,1fr)_minmax(190px,0.78fr)_56px_150px_150px] items-center gap-2 px-4 py-4 text-[13px] text-[#30343a]" key={lineItem.id}>
                        <p className="min-w-0 truncate font-semibold text-[#202020]">{lineItem.partName}</p>
                        <dl className="grid gap-1.5 text-[12px] leading-5 text-[#64748b]">
                          <div>
                            <dt className="inline font-semibold text-[#30343a]">Material: </dt>
                            <dd className="inline">{lineItem.material}</dd>
                          </div>
                          <div>
                            <dt className="inline font-semibold text-[#30343a]">Finish: </dt>
                            <dd className="inline">{lineItem.surfaceFinish || "Not specified"}</dd>
                          </div>
                          <div>
                            <dt className="inline font-semibold text-[#30343a]">Tolerance: </dt>
                            <dd className="inline">{lineItem.generalTolerance || "Not specified"}</dd>
                          </div>
                        </dl>
                        <div className="grid min-w-0 content-start gap-2">
                          {files.length ? (
                            files.map((file) => <DownloadFileLink file={file} key={file.id} />)
                          ) : (
                            <span className="text-[12px] font-medium text-[#9ca3af]">No matched files</span>
                          )}
                        </div>
                        <p className="text-center text-[14px] font-medium text-[#6f737a]">{lineItem.quantity}</p>
                        {isReadOnlyIssuedQuote ? (
                          <>
                            <p className="rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2 text-[14px] font-semibold text-[#202020]">{lineItemUnitPriceDisplay(request, lineItem)}</p>
                            <p className="rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2 text-[14px] font-semibold text-[#202020]">{lineItemLeadTimeDisplay(request, lineItem)}</p>
                          </>
                        ) : (
                          <>
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
                                onChange={(event) => {
                                  const nextLeadTime = event.currentTarget.value;
                                  setQuoteLineLeadTimeValues((current) => ({
                                    ...current,
                                    [lineItem.id]: nextLeadTime,
                                  }));
                                }}
                                placeholder="Days"
                              />
                            </label>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {unassignedFiles.length ? (
                <div className="mt-3 flex flex-wrap gap-2 text-[12px]">
                  <span className="font-semibold text-[#30343a]">Other files:</span>
                  {unassignedFiles.map((file) => (
                    <DownloadFileLink file={file} key={file.id} />
                  ))}
                </div>
              ) : null}
            </section>

            <section className="border-t border-[#eeeeee] pt-6">
              <StepHeading
                number={3}
                summary={isReadOnlyIssuedQuote ? "Saved shipping, validity, and customer-facing note from the issued quote." : "Set shipping and quote validity, then send the customer-facing quote."}
              >
                {isReadOnlyIssuedQuote ? "Issued customer quote" : "Issue customer quote"}
              </StepHeading>
              {isReadOnlyIssuedQuote ? (
                <p className="mt-3 rounded-md bg-[#f4fbfa] px-3 py-2 text-[13px] leading-5 text-[#315a94]">
                  Latest saved version: customer quote v{latestCustomerQuote?.versionNumber}.
                </p>
              ) : isIssuedQuote ? (
                <p className="mt-3 rounded-md bg-[#fff7f7] px-3 py-2 text-[13px] leading-5 text-[#8a3a3d]">
                  Latest saved version: customer quote v{latestCustomerQuote?.versionNumber}. Saving creates v{(latestCustomerQuote?.versionNumber ?? 0) + 1}.
                </p>
              ) : null}
              {isReadOnlyIssuedQuote ? (
                <div className="mt-4 grid gap-4">
                  <StaticField label="Shipping cost" value={formatCurrencyPrecise(request.quote.shippingCostCents)} />
                  <StaticField label="Shipping speed" value={request.quote.shippingMethod || "Pending"} />
                  <StaticField label="Shipping terms" value={request.quote.shippingTerms || "Pending"} />
                  <StaticField label="Estimated delivery date" value={formatDate(request.quote.estimatedDeliveryDate)} />
                  <StaticField label="Quote valid until" value={formatDate(latestCustomerQuote?.validUntil ?? request.quote.quoteValidUntil)} />
                  <div className="grid gap-1">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8a8f98]">Customer note</p>
                    <p className="min-h-28 rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-3 text-[14px] leading-6 text-[#202020]">
                      {latestCustomerQuote?.notes || request.quote.summary || "Pending"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
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
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Shipping speed
                      <select
                        className="h-11 rounded-md border border-[#d9d9d9] bg-white px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        name="shippingMethod"
                        onChange={(event) => setSelectedShippingMethod(event.currentTarget.value)}
                        value={selectedShippingMethod}
                      >
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
                      Quote valid until
                      <input
                        className="h-11 rounded-md border border-[#d9d9d9] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        name="quoteValidUntil"
                        onChange={(event) => setQuoteValidUntil(event.target.value)}
                        type="date"
                        value={quoteValidUntil}
                      />
                    </label>
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Customer note
                      <textarea
                        className="min-h-28 rounded-md border border-[#d9d9d9] px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                        defaultValue={latestCustomerQuote?.notes || request.quote.summary}
                        name="quoteSummary"
                        placeholder="Add exclusions, assumptions, shipping notes, or pricing context."
                      />
                    </label>
                  </div>
                  <div className="mt-5 flex justify-end">
                    <button
                      className="h-11 rounded-md bg-[#262626] px-5 text-[13px] font-semibold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#b7c9ef]"
                      disabled={!updateStatusAction}
                      type="submit"
                    >
                      {isIssuedQuote ? "Save updated quote" : "Issue customer quote"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}

export function AdminQuoteManagement({
  customerProfileHrefs = {},
  overseasVendors = [],
  requests,
  updateDecisionAction,
  updateStatusAction,
}: {
  customerProfileHrefs?: Record<string, string>;
  overseasVendors?: OverseasVendor[];
  requests: LatticeRequest[];
  updateDecisionAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkedRequestId = searchParams.get("requestId");
  const deepLinkedDecision = parsedRfqDecision(searchParams.get("decision"));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AdminQuoteStatusFilter>("ALL");
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
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!deepLinkedRequestId) {
        setDetailRequest(null);
        return;
      }

      const matchingRequest = quoteRequests.find((request) => request.id === deepLinkedRequestId) ?? null;

      setDetailRequest(matchingRequest);

      if (!matchingRequest) {
        router.replace("/admin/quotes", { scroll: false });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [deepLinkedRequestId, quoteRequests, router]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByUpdatedAtNewest(quoteRequests.filter((request) => {
      const primaryLine = request.lineItems[0];
      const statusGroup = adminQuoteStatusGroup(request);
      const matchesStatus = statusFilter === "ALL" ? statusGroup !== "ARCHIVED" : statusGroup === statusFilter;
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
    }));
  }, [query, quoteRequests, statusFilter]);

  const groupedRequests = useMemo(() => {
    const visibleGroups = statusGroupOrder.filter((group) => (statusFilter === "ALL" ? group !== "ARCHIVED" : group === statusFilter));

    return visibleGroups
      .map((group) => ({
        group,
        requests: filteredRequests.filter((request) => adminQuoteStatusGroup(request) === group),
      }))
      .filter(({ requests }) => requests.length > 0);
  }, [filteredRequests, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLocalDraftRequests(readLocalDraftRequests());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && window.location.pathname === "/admin/quotes") {
        window.location.reload();
      }
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  function closeDetail() {
    setDetailRequest(null);

    if (deepLinkedRequestId) {
      router.replace("/admin/quotes", { scroll: false });
    }
  }

  function openDetail(event: MouseEvent<HTMLAnchorElement>, request: LatticeRequest) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    setDetailRequest(request);

    if (deepLinkedRequestId !== request.id) {
      router.push(quoteDetailHref(request), { scroll: false });
    }
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
          key={`${detailRequest.id}:${deepLinkedDecision ?? "quote"}`}
          initialDecision={deepLinkedDecision}
          onClose={closeDetail}
          overseasVendors={overseasVendors}
          request={detailRequest}
          updateDecisionAction={updateDecisionAction}
          updateStatusAction={updateStatusAction}
        />
      ) : null}

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

          <div className="divide-y divide-[#eeeeee]">
            {groupedRequests.map(({ group, requests: groupRequests }) => {
              const groupCopy = customerQuoteStatusCopy[group];

              return (
                <div key={group}>
                  <div className="flex flex-col gap-1 border-b border-[#eeeeee] bg-[#fff7f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-[14px] font-semibold text-[#202020]">{groupCopy.label}</h3>
                    <p className="text-[12px] text-[#777d86]">
                      {groupRequests.length} {groupRequests.length === 1 ? "quote" : "quotes"}
                    </p>
                  </div>

                  <div className="grid grid-cols-[1.25fr_0.72fr_0.78fr_0.92fr_0.72fr] gap-4 border-b border-[#eeeeee] bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#767676] max-xl:hidden">
                    <span>RFQ details</span>
                    <span>Customer</span>
                    <span>Last edited</span>
                    <span>Package</span>
                    <span>Quote status</span>
                  </div>

                  <div className="divide-y divide-[#eeeeee]">
                    {groupRequests.map((request) => {
                      const primaryLine = request.lineItems[0];
                      const requestCadFiles = cadFiles(request);
                      const requestDrawingFiles = drawingFiles(request);
                      const totalQuantity = request.lineItems.reduce((sum, item) => sum + item.quantity, 0);
                      const statusGroup = adminQuoteStatusGroup(request);
                      const status = customerQuoteStatusCopy[statusGroup];
                      const statusNote = adminQuoteStatusNote(request);
                      const detailHref = quoteDetailHref(request);

                      return (
                        <article
                          className="group relative grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] xl:grid-cols-[1.25fr_0.72fr_0.78fr_0.92fr_0.72fr] xl:items-center"
                          key={request.id}
                        >
                          <Link
                            aria-label={`Manage quote submission for ${request.title}`}
                            className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A5F]"
                            href={detailHref}
                            onClick={(event) => openDetail(event, request)}
                            scroll={false}
                          />
                          <div className="pointer-events-none relative z-10 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{quoteReference(request)}</span>
                            </div>
                            <p className="mt-2 block max-w-full truncate text-left text-[15px] font-semibold text-[#202020] transition group-hover:text-[#FF5A5F]">
                              {request.title}
                            </p>
                            <p className="mt-1 truncate text-[13px] text-[#69707a]">
                              {primaryLine?.partName ?? "No line item"} - {request.process}
                            </p>
                          </div>

                          <div className="pointer-events-none relative z-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Customer</p>
                            <div className="mt-1 flex min-w-0 items-center gap-2 xl:mt-0">
                              <p className="min-w-0 truncate text-[14px] font-medium text-[#30343a]">{request.buyerCompany}</p>
                              <CustomerProfileShortcut companyName={request.buyerCompany} customerProfileHrefs={customerProfileHrefs} />
                            </div>
                            <p className="mt-1 text-[12px] text-[#8a8f98]">{request.requesterName}</p>
                          </div>

                          <div className="pointer-events-none relative z-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Last edited</p>
                            <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{formatDateTime(request.updatedAt)}</p>
                          </div>

                          <div className="pointer-events-none relative z-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Package</p>
                            <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">
                              {request.lineItems.length} part{request.lineItems.length === 1 ? "" : "s"} / Qty {totalQuantity || "Pending"}
                            </p>
                            <p className="mt-1 text-[12px] text-[#8a8f98]">
                              {request.files.length} file{request.files.length === 1 ? "" : "s"} - {requestCadFiles.length} CAD / {requestDrawingFiles.length} drawing
                            </p>
                          </div>

                          <div className="pointer-events-none relative z-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Quote status</p>
                            <span className={`mt-1 inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold xl:mt-0 ${status.tone}`}>{status.label}</span>
                            {statusNote ? <p className="mt-1 text-[12px] text-[#8a8f98]">{statusNote}</p> : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {groupedRequests.length === 0 ? (
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
