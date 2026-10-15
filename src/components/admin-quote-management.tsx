"use client";
import { processLabel, readTargetDeliveryDate } from "@/lib/rfq-manufacturing";

import { quoteValidUntil as calculateQuoteValidUntil } from "@/lib/quote-validity";

import { ChevronDown, Clock3, ExternalLink, FileCheck2, FileText, Inbox, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./admin-quotes.module.css";

import { groupAdminRfqFiles } from "@/lib/admin-rfq-package";
import { adminSubmissionDate } from "@/lib/admin-rfq-submission";
import type { OverseasVendor } from "@/lib/admin-vendors";
import { quotedLineForRequestItem, type LatticeRequest } from "@/lib/request-model";
import adminStyles from "./admin-workspace.module.css";
import { SupplierQuoteFiles } from "./supplier-quote-files";
import { TargetDatePicker } from "./target-date-picker";
import { CustomSelect } from "./custom-select";

const statusCopy: Record<LatticeRequest["status"], { label: string; tone: string; nextAction: string }> = {
  DRAFT: { label: "Draft", nextAction: "Review draft", tone: "border-slate-200 bg-slate-50 text-slate-700" },
  SUBMITTED: { label: "Submitted", nextAction: "Assign owner and review intake", tone: "border-[#ffd1d4] bg-[#fff1f2] text-[#FF5A5F]" },
  NEEDS_INFO: { label: "Needs information", nextAction: "Recover buyer clarification", tone: "border-[#ffd4c3] bg-[#fff0ea] text-[#FC642D]" },
  READY_FOR_SUPPLIER_RFQ: { label: "Supplier ready", nextAction: "Send supplier RFQs", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  QUOTED: { label: "Customer quote issued", nextAction: "Follow buyer decision", tone: "border-[#b8eee8] bg-[#e6f8f6] text-[#007a70]" },
  PURCHASED: { label: "Purchased", nextAction: "Track order", tone: "border-slate-950 bg-slate-950 text-white" },
  CLOSED: { label: "Closed", nextAction: "No active quote work", tone: "border-slate-200 bg-slate-50 text-slate-700" },
};

type AdminQuoteStatusGroup = "QUOTE_REQUESTED" | "QUOTE_RECEIVED" | "ARCHIVED";
type QueueView = "ACTIVE" | "DRAFTS" | "ARCHIVED";
type RfqDecisionStatus = "NEEDS_INFO" | "CLOSED";


type AdminQuoteActionResult = { error: string } | { success: true };
type AdminQuoteAction = (formData: FormData) => void | AdminQuoteActionResult | Promise<void | AdminQuoteActionResult>;

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

  return calculateQuoteValidUntil(quoteCreatedDate);
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
  return request.customerQuotes.at(-1)?.quoteNumber ?? `RFQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
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
  if (!customerProfileHrefs[companyName]) return null;
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

function sortByUpdatedAtNewest(requests: LatticeRequest[]) {
  return [...requests].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function bundledFilesByPart(request: LatticeRequest) {
  const { parts, unassignedFiles } = groupAdminRfqFiles(request);
  return { bundles: parts, unassignedFiles };
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

function AdminQuoteWorkbench({
  initialDecision,
  onClose,
  overseasVendors,
  request,
  updateDecisionAction,
  updateStatusAction,
  onDirty,
}: {
  onDirty: (dirty?: boolean) => void;
  initialDecision?: RfqDecisionStatus | null;
  onClose: () => void;
  overseasVendors: OverseasVendor[];
  request: LatticeRequest;
  updateDecisionAction?: AdminQuoteAction;
  updateStatusAction?: AdminQuoteAction;
}) {
  const router = useRouter();
  const saveInFlight = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [decisionPending, setDecisionPending] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const status = statusCopy[request.status];
  const latestCustomerQuote = request.customerQuotes.at(-1);
  const selectedShopQuote = selectedSupplierQuote(request);
  const isIssuedQuote = request.status === "QUOTED" && Boolean(latestCustomerQuote);
  const [isEditingIssuedQuote, setIsEditingIssuedQuote] = useState(false);
  const [activeDecision, setActiveDecision] = useState<RfqDecisionStatus | null>(initialDecision ?? null);
  const [decisionNote, setDecisionNote] = useState("");
  const isReadOnlyIssuedQuote = isIssuedQuote && !isEditingIssuedQuote;
  const { bundles, unassignedFiles } = bundledFilesByPart(request);
  const quoteCreatedDate = isEditingIssuedQuote ? todayIsoDate() : defaultQuoteCreatedDate(request);
  const [quoteValidUntil, setQuoteValidUntil] = useState(defaultQuoteValidUntil(request, quoteCreatedDate));
  const currentShopName = selectedShopNameFromRequest(request) || overseasVendors[0]?.name || "China supplier team";
  const shopOptions = vendorShopOptions(overseasVendors, currentShopName);
  const [shippingTerms, setShippingTerms] = useState(request.quote.shippingTerms || "");
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(request.quote.estimatedDeliveryDate || "");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(request.quote.shippingMethod || defaultShippingMethod);
  const [quoteLinePrices, setQuoteLinePrices] = useState(() => Object.fromEntries(request.lineItems.map((item) => [item.id, lineItemUnitPriceInput(request, item)])));
  const [shippingPrice, setShippingPrice] = useState(formatCurrencyInput(request.quote.shippingCostCents));
  const [quoteLineLeadTimeValues, setQuoteLineLeadTimeValues] = useState(() =>
    Object.fromEntries(request.lineItems.map((lineItem) => [lineItem.id, String(lineItemLeadTimeInput(request, lineItem) ?? "")])),
  );
  const overallSupplierLeadTimeDays = calculatedSupplierLeadTimeDays(Object.values(quoteLineLeadTimeValues), selectedShippingMethod);
  const quoteResponseFormId = `quote-response-${request.id}`;
  const canSendRfqDecision = !isSaving && !decisionPending && Boolean(updateDecisionAction) && request.status !== "CLOSED" && request.status !== "PURCHASED" && !isReadOnlyIssuedQuote;
  const activeDecisionCopy = activeDecision ? rfqDecisionCopy[activeDecision] : null;
  const decisionNoteIsReady = decisionNote.trim().length > 0;

  const hasCompletePricing = request.lineItems.length > 0 && request.lineItems.every((item) => quoteLinePrices[item.id]?.trim() && Number.isFinite(Number(quoteLinePrices[item.id])) && Number(quoteLinePrices[item.id]) >= 0);
  const partsTotal = request.lineItems.reduce((sum, item) => sum + Math.round((Number(quoteLinePrices[item.id]) || 0) * item.quantity * 100), 0);
  const shippingCents = shippingPrice.trim() && Number.isFinite(Number(shippingPrice)) ? Math.round(Number(shippingPrice) * 100) : null;

  const isInactive = request.status === "CLOSED" || request.status === "PURCHASED" || request.status === "DRAFT" || request.isArchived;
  if (isInactive) return (
    <section className={styles.inspector} aria-label="Archived RFQ details">
      <button className={styles.textButton} type="button" onClick={onClose}>← Review queue</button>
      <h2>{request.title}</h2>
      <p className={styles.muted}>This RFQ is {request.isArchived ? "archived" : status.label.toLowerCase()} and cannot receive a customer quote.</p>
      <p>{request.buyerCompany}</p>
      <p>Submitted by {request.requesterName?.trim() || "Name not recorded"}</p>
      {request.operatorReview.internalNotes ? <p>{request.operatorReview.internalNotes}</p> : null}
      <section><h3>RFQ package</h3>{request.lineItems.map((item) => <div className={styles.partCard} key={item.id}><strong>{item.partName} · Qty {item.quantity}</strong><PartManufacturingSummary item={item} fallbackProcess={request.process} /><p>{item.material}</p></div>)}
        <div className={styles.fileList}>{request.files.map((file) => <DownloadFileLink key={file.id} file={file} />)}</div>
      </section>
      <SupplierQuoteFiles readOnly request={request} returnTo={quoteDetailHref(request)} variant="admin" />
      <QuoteHistory request={request} />
    </section>
  );

  return (
    <div className={styles.workbench}>
      <div className={styles.workbenchSurface}>
        <div className="sticky top-0 z-10 border-b border-[#eeeeee] bg-white">
          <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button className={styles.textButton} disabled={isSaving || decisionPending} onClick={onClose} type="button">← Review queue</button>
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
              </div>
              <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#171717]">{request.title}</h2>
              <dl aria-label="RFQ summary" className="mt-3 flex flex-wrap gap-2">
                <DrawerMetaItem label="Reference" value={quoteReference(request)} />
                <DrawerMetaItem label="Customer" value={request.buyerCompany} />
                <DrawerMetaItem label="Submitted by" value={request.requesterName?.trim() || "Name not recorded"} />
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
                <button disabled={isSaving || decisionPending}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px] font-semibold text-[#262626] transition hover:bg-[#f8fafc]"
                  onClick={() => {
                    if (isEditingIssuedQuote) {
                      setQuoteLinePrices(Object.fromEntries(request.lineItems.map((item) => [item.id, lineItemUnitPriceInput(request, item)])));
                      setQuoteLineLeadTimeValues(Object.fromEntries(request.lineItems.map((item) => [item.id, String(lineItemLeadTimeInput(request, item) ?? "")])));
                      setShippingPrice(formatCurrencyInput(request.quote.shippingCostCents));
                      setShippingTerms(request.quote.shippingTerms || "");
                      setEstimatedDeliveryDate(request.quote.estimatedDeliveryDate || "");
                      setSelectedShippingMethod(request.quote.shippingMethod || defaultShippingMethod);
                      setQuoteValidUntil(isEditingIssuedQuote ? defaultQuoteValidUntil(request, quoteCreatedDate) : calculateQuoteValidUntil(todayIsoDate()));
                      onDirty(false);
                    }
                    if (!isEditingIssuedQuote) setQuoteValidUntil(calculateQuoteValidUntil(todayIsoDate()));
                    setIsEditingIssuedQuote((current) => !current);
                  }}
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
                aria-label="Back to review queue"
                disabled={isSaving || decisionPending}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#262626] transition hover:bg-[#f8fafc]"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className={styles.workbenchBody}><div className={styles.editor} onChange={(event) => { if ((event.target as HTMLInputElement).type !== "file") onDirty(); }}>
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
              <form onSubmit={async (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                if (!updateDecisionAction || saveInFlight.current) return;
                saveInFlight.current = true;
                setDecisionPending(true);
                setDecisionError("");
                try {
                  const result = await updateDecisionAction(formData);
                  if (result && "error" in result) { setDecisionError(result.error); return; }
                  onDirty(false);
                  setActiveDecision(null);
                  setDecisionNote("");
                  router.replace(quoteDetailHref(request), { scroll: false });
                  router.refresh();
                } catch {
                  setDecisionError("Unable to save this decision. Your note is retained; please try again.");
                } finally { saveInFlight.current = false; setDecisionPending(false); }
              }} className="mt-4 grid gap-3">
                {decisionError ? <p role="alert" className="text-sm text-red-700">{decisionError}</p> : null}
                <input name="requestId" type="hidden" value={request.id} />
                <input name="status" type="hidden" value={activeDecision} />
                <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                  Customer note
                  <textarea
                    className="min-h-28 rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none focus:border-[#9b9b9b]"
                    name="customerNote"
                    disabled={decisionPending || isSaving}
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
                    disabled={!decisionNoteIsReady || decisionPending || isSaving}
                    type="submit"
                  >
                    {decisionPending ? "Saving decision…" : activeDecisionCopy.submitLabel}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
          <SupplierQuoteFiles
            readOnly={isReadOnlyIssuedQuote || isSaving || decisionPending}
            removeHref={isReadOnlyIssuedQuote ? undefined : "/api/supplier-quote-files/remove"}
            request={request}
            returnTo={`/admin/quotes?requestId=${encodeURIComponent(request.id)}&view=quote`}
            stepNumber={1}
            uploadHref={isReadOnlyIssuedQuote ? undefined : "/api/supplier-quote-files"}
            variant="admin"
          >
            <fieldset key={String(isReadOnlyIssuedQuote)} className="grid gap-4 lg:grid-cols-3" disabled={isReadOnlyIssuedQuote || isSaving || decisionPending}>
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
            </fieldset>
          </SupplierQuoteFiles>
          <form onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            if (!updateStatusAction || saveInFlight.current) return;
            saveInFlight.current = true;
            setIsSaving(true);
            setSaveError("");
            setSaveMessage("");
            try {
              const result = await updateStatusAction(formData);
              if (result && "error" in result) { setSaveError(result.error); return; }
              onDirty(false);
              setIsEditingIssuedQuote(false);
              setSaveMessage("Customer quote saved and available in the customer workspace.");
              router.replace(`${quoteDetailHref(request)}&view=quote`, { scroll: false });
              router.refresh();
            } catch {
              setSaveError("Unable to save the quote. Your edits are retained; please try again.");
            } finally { saveInFlight.current = false; setIsSaving(false); }
          }} id={quoteResponseFormId}>
            <fieldset disabled={isSaving || decisionPending} className={styles.quoteFields}>
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
                  Saving this edit creates a new customer quote version and updates the buyer-facing quote.
                </p>
              ) : null}
              <div className="mt-4 overflow-x-auto rounded-md border border-[#e6e6e6]">
                <div className={styles.partsTable}>
                  <div className="grid grid-cols-[minmax(130px,0.8fr)_minmax(170px,1fr)_55px_100px_110px] items-center gap-2 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b8088]">
                    <span>Part</span>
                    <span>Specs</span>
                    <span className="text-center">Qty</span>
                    <span>Unit price</span>
                    <span>Lead time</span>
                  </div>
                  <div className="divide-y divide-[#eeeeee]">
                    {bundles.map(({ lineItem, files }) => (
                      <div className="grid grid-cols-[minmax(130px,0.8fr)_minmax(170px,1fr)_55px_100px_110px] items-center gap-2 px-4 py-4 text-[13px] text-[#30343a]" key={lineItem.id}>
                        <div className="min-w-0"><p className="font-semibold text-[#202020]">{lineItem.partName}</p><div className="mt-2 grid gap-2">{files.map(file => <DownloadFileLink key={file.id} file={file} />)}</div></div>
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
                          <div><dt className="sr-only">Manufacturing details</dt><dd><PartManufacturingSummary item={lineItem} fallbackProcess={request.process} /></dd></div>
                          {lineItem.qualityDocumentation?.length ? <div><dt className="inline font-semibold">Quality: </dt><dd className="inline">{lineItem.qualityDocumentation.join(", ")}</dd></div> : null}
                          {lineItem.notes ? <div><dt className="inline font-semibold">Notes: </dt><dd className="inline">{lineItem.notes}</dd></div> : null}
                        </dl>
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
                                value={quoteLinePrices[lineItem.id]}
                                onChange={(event) => setQuoteLinePrices((current) => ({ ...current, [lineItem.id]: event.target.value }))}
                                inputMode="decimal"
                                type="number" min="0" step="0.01" required
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
                                type="number" min="1" step="1"
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
                  <span className="font-semibold text-[#30343a]">RFQ files (shared package):</span>
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
                <div className={styles.commercialFields}>
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
                  <div className={styles.commercialFields}>
                    <label className="grid gap-1 text-[13px] font-semibold text-[#30343a]">
                      Shipping cost
                      <input
                        className="h-11 rounded-md border border-[#d9d9d9] px-3 text-[15px] text-[#202020] outline-none focus:border-[#9b9b9b]"
                        value={shippingPrice}
                        onChange={(event) => setShippingPrice(event.target.value)}
                        inputMode="decimal"
                        type="number" min="0" step="0.01"
                        name="shippingCost"
                        placeholder="Billed at actual or 125.00"
                      />
                    </label>
                    <div>
                      <input type="hidden" name="shippingMethod" value={selectedShippingMethod} />
                      <CustomSelect label="Shipping speed" value={selectedShippingMethod} options={[
                        { value: "International", label: "International" },
                        { value: "Domestic", label: "Domestic" },
                      ]} onChange={(value) => { setSelectedShippingMethod(value); onDirty(); }} />
                    </div>
                    <div>
                      <input type="hidden" name="shippingTerms" value={shippingTerms} />
                      <CustomSelect label="Shipping terms" value={shippingTerms} placeholder="Select terms" options={[
                        { value: "", label: "Select terms" },
                        ...["EXW", "DDP", "Determined at Checkout", "DAP", "FOB"].map((value) => ({ value, label: value })),
                      ]} onChange={(value) => { setShippingTerms(value); onDirty(); }} />
                    </div>
                    <TargetDatePicker label="Estimated delivery date" description={null} name="estimatedDeliveryDate" value={estimatedDeliveryDate}
                      onChange={(value) => { setEstimatedDeliveryDate(value); onDirty(); }} />
                    <TargetDatePicker label="Quote valid until" description="Defaults to 15 business days after the quote issue date. Adjust as needed."
                      name="quoteValidUntil" value={quoteValidUntil} allowClear={false}
                      onChange={(value) => { setQuoteValidUntil(value); onDirty(); }} />
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
                </>
              )}
            </section>
            </fieldset>
          </form>
          </div>
          <aside className={styles.quoteSummary} aria-label="Customer quote summary">
            <section><strong>Customer intended use</strong><p>{request.intakeDeclaration?.endUse || "Not declared (legacy RFQ)"}</p>{request.intakeDeclaration?.endUseNotes ? <p>{request.intakeDeclaration.endUseNotes}</p> : null}<p>Restrictions: {request.intakeDeclaration?.restrictionStatus || "Not declared"}</p></section>
            <p className={styles.eyebrow}>Customer quote</p>
            <h3>{isIssuedQuote ? latestCustomerQuote?.quoteNumber : "Prepare for review"}</h3>
            <span className={styles.pill}>{isReadOnlyIssuedQuote ? `Issued · v${latestCustomerQuote?.versionNumber}` : isIssuedQuote ? "Editing issued quote" : "Not yet issued"}</span>
            <dl className={styles.totals}>
              <div><dt>Parts ({request.lineItems.length})</dt><dd>{hasCompletePricing ? formatCurrencyPrecise(partsTotal) : "Pricing incomplete"}</dd></div>
              <div><dt>Shipping</dt><dd>{shippingCents === null ? "Billed at actual" : formatCurrencyPrecise(shippingCents)}</dd></div>
              <div className={styles.total}><dt>{shippingCents === null ? "Quoted subtotal" : "Total (USD)"}</dt><dd>{hasCompletePricing ? formatCurrencyPrecise(partsTotal + (shippingCents ?? 0)) : "—"}</dd></div>
              <div><dt>Overall lead time</dt><dd>{overallSupplierLeadTimeDays ? `${overallSupplierLeadTimeDays} days` : "Not specified"}</dd></div>
              <div><dt>Valid until</dt><dd>{formatDate(quoteValidUntil)}</dd></div>
            </dl>
            {shippingCents === null ? <p className={styles.muted}>Shipping will be billed at actual cost and is excluded from this subtotal.</p> : null}
            <div className={styles.documentPreview}>
              <p className={styles.eyebrow}>Quote summary</p><strong>{request.buyerCompany}</strong><p>{request.title}</p>
              {request.lineItems.map((item) => <div key={item.id}><span>{item.partName}</span><span>Qty {item.quantity}</span></div>)}
            </div>
            {saveError ? <p role="alert" className="mt-4 text-sm text-red-700">{saveError}</p> : null}
            {saveMessage ? <p role="status" className="mt-4 text-sm text-emerald-700">{saveMessage}</p> : null}
            {!isReadOnlyIssuedQuote ? <QuoteSubmit pending={isSaving} disabled={!hasCompletePricing || decisionPending} action={updateStatusAction} formId={quoteResponseFormId} label={isIssuedQuote ? "Save updated quote" : "Issue customer quote"} /> : null}
            {!isReadOnlyIssuedQuote ? <p className={styles.muted}>Issuing saves the quote and makes it available in the customer workspace. Unsent edits are not saved.</p> : null}
            <QuoteHistory request={request} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function QuoteSubmit({ formId, action, label, pending, disabled }: { formId: string; action?: AdminQuoteAction; label: string; pending: boolean; disabled: boolean }) {
  return <button className={styles.primaryButton} disabled={!action || pending || disabled} form={formId} type="submit">{pending ? "Saving quote…" : label}</button>;
}

function QuoteHistory({ request }: { request: LatticeRequest }) {
  return <details className={styles.history}><summary>Quote versions ({request.customerQuotes.length})</summary>
    {request.customerQuotes.length ? [...request.customerQuotes].reverse().map((quote) => <div key={quote.id}><strong>{quote.quoteNumber} · v{quote.versionNumber}</strong><p>{formatCurrencyPrecise(quote.totalCents)} · Issued {formatDate(quote.issuedAt)}</p></div>) : <p>No customer quote has been issued.</p>}
  </details>;
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
  const deepLinkedWorkbench = searchParams.get("view") === "quote";
  const [query, setQuery] = useState("");
  const [view, setView] = useState<QueueView>("ACTIVE");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState("ALL");
  const [isWorkbench, setIsWorkbench] = useState(false);
  const [hasUnsentEdits, setHasUnsentEdits] = useState(false);
  const [detailRequest, setDetailRequest] = useState<LatticeRequest | null>(null);

  const quoteRequests = useMemo(() => requests.filter((request) => request.status !== "DRAFT" && request.status !== "PURCHASED"), [requests]);
  const draftRequests = useMemo(() => sortByUpdatedAtNewest(requests.filter(request => request.status === "DRAFT")), [requests]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!deepLinkedRequestId) {
        setDetailRequest(null);
        setIsWorkbench(false);
        setHasUnsentEdits(false);
        return;
      }

      const matchingRequest = quoteRequests.find((request) => request.id === deepLinkedRequestId) ?? null;

      setDetailRequest(matchingRequest);
      setIsWorkbench(Boolean(deepLinkedDecision) || deepLinkedWorkbench);

      if (!matchingRequest) {
        router.replace("/admin/quotes", { scroll: false });
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [deepLinkedRequestId, deepLinkedDecision, deepLinkedWorkbench, quoteRequests, router]);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortByUpdatedAtNewest(quoteRequests.filter((request) => {
      const statusGroup = adminQuoteStatusGroup(request);
      const matchesStatus = (view === "ARCHIVED" ? statusGroup === "ARCHIVED" : statusGroup !== "ARCHIVED") && (stageFilter === "ALL" || request.status === stageFilter) && (ownerFilter === "ALL" || (request.operatorReview.assignedOwner || "UNASSIGNED") === ownerFilter);
      const searchable = [
        request.title,
        request.process,
        request.buyerCompany,
        request.requesterName,
        quoteReference(request),
        ...request.lineItems.flatMap((item) => [item.partName, item.material]),
        request.operatorReview.assignedOwner,
        ...request.files.map((file) => file.name),
        ...request.supplierQuotes.map((quote) => quote.shopName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    }));
  }, [query, quoteRequests, view, stageFilter, ownerFilter]);

  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted && window.location.pathname === "/admin/quotes") {
        window.location.reload();
      }
    }

    window.addEventListener("pageshow", handlePageShow);

    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (!hasUnsentEdits) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsentEdits]);

  useEffect(() => {
    if (hasUnsentEdits || isWorkbench) return;
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [hasUnsentEdits, isWorkbench, router]);

  function closeDetail() {
    if (hasUnsentEdits && !window.confirm("Leave this RFQ? Your unsent quote edits will be discarded.")) return;
    setHasUnsentEdits(false);
    setDetailRequest(null);
    setIsWorkbench(false);

    if (deepLinkedRequestId) {
      router.replace("/admin/quotes", { scroll: false });
    }
  }

  function openDraftFromKey(event: KeyboardEvent<HTMLElement>, request: LatticeRequest) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    router.push(draftEditHref(request));
  }

  const activeRequests = quoteRequests.filter((request) => adminQuoteStatusGroup(request) !== "ARCHIVED");
  const owners = [...new Set(quoteRequests.map((request) => request.operatorReview.assignedOwner).filter((owner): owner is string => Boolean(owner)))].sort();
  const summaryCards = [
    { label: "Active RFQs", count: activeRequests.length, detail: "Submitted requests in review", icon: Inbox },
    { label: "Needs information", count: activeRequests.filter((r) => r.status === "NEEDS_INFO").length, detail: "Waiting on customer clarification", icon: Clock3 },
    { label: "Supplier ready", count: activeRequests.filter((r) => r.status === "READY_FOR_SUPPLIER_RFQ").length, detail: "Ready to send to suppliers", icon: FileText },
    { label: "Customer quote issued", count: activeRequests.filter((r) => r.status === "QUOTED").length, detail: "Awaiting a customer decision", icon: FileCheck2 },
  ];
  function prepareQuote(request: LatticeRequest, decision?: RfqDecisionStatus) {
    setDetailRequest(request);
    setHasUnsentEdits(false);
    setIsWorkbench(true);
    router.push(`${decision ? quoteDecisionHref(request, decision) : quoteDetailHref(request)}&view=quote`, { scroll: false });
  }
  if (isWorkbench && detailRequest) {
    return <div className={styles.workbenchLayout}>
      <nav className={styles.workbenchQueue} aria-label="RFQ queue"><button className={styles.textButton} type="button" onClick={closeDetail}>← Review queue</button><h2>Active RFQs</h2>
        {activeRequests.map((request) => <button key={request.id} aria-current={request.id === detailRequest.id ? "true" : undefined} type="button" onClick={() => {
          if (request.id !== detailRequest.id && (!hasUnsentEdits || window.confirm("Switch RFQs? Your unsent quote edits will be discarded."))) prepareQuote(request);
        }}><strong>{request.title}</strong><span>{request.buyerCompany}</span><small>{statusCopy[request.status].label}</small></button>)}
      </nav>
      <AdminQuoteWorkbench onDirty={(dirty = true) => setHasUnsentEdits(dirty)} key={`${detailRequest.id}:${deepLinkedDecision ?? "quote"}`} initialDecision={deepLinkedDecision} onClose={closeDetail} overseasVendors={overseasVendors} request={detailRequest} updateDecisionAction={updateDecisionAction} updateStatusAction={updateStatusAction} />
    </div>;
  }

  return (
    <div className="space-y-5">
      <section aria-label="Quote operations summary" className={adminStyles.metrics}>
        {summaryCards.map(({ label, count, detail, icon: Icon }) => (
          <article className={adminStyles.metric} key={label}>
            <span className={adminStyles.metricIcon}><Icon aria-hidden="true" size={20} strokeWidth={1.7} /></span>
            <div><p>{label}</p><strong>{count}</strong><span>{detail}</span></div>
          </article>
        ))}
      </section>
      <div className={styles.toolbar}>
        <div className={styles.viewTabs} aria-label="Quote queue views">
          {(["ACTIVE", "DRAFTS", "ARCHIVED"] as const).map((tab) => <button type="button" key={tab} aria-pressed={view === tab} onClick={() => { setView(tab); setStageFilter("ALL"); setOwnerFilter("ALL"); closeDetail(); }}>{tab === "ACTIVE" ? `Active (${activeRequests.length})` : tab === "DRAFTS" ? `Drafts (${draftRequests.length})` : `Archive (${quoteRequests.length - activeRequests.length})`}</button>)}
        </div>
        {view !== "DRAFTS" ? <div className={styles.filters}>
          <label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Search quote submissions</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search RFQs, customers, parts…" /></label>
          <label><span className="sr-only">RFQ stage</span><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="ALL">All stages</option>{["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED", "CLOSED"].map((stage) => <option key={stage} value={stage}>{statusCopy[stage as LatticeRequest["status"]].label}</option>)}</select></label>
          <label><span className="sr-only">Assigned owner</span><select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="ALL">All owners</option><option value="UNASSIGNED">Unassigned</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select></label>
        </div> : null}
      </div>
      {view !== "DRAFTS" ? <div>
        <section className={styles.queue} aria-label="RFQ review queue">
          <div className={styles.tableScroll}><table className={styles.queueTable}>
            <thead><tr><th>RFQ & customer</th><th>Stage</th><th>Package</th><th>Submission date</th><th>Submitted by</th></tr></thead>
            <tbody>{filteredRequests.map((request) => {
              return <tr key={request.id}>
                <td><Link className={styles.rowLink} aria-label={`Manage quote submission for ${request.title}`} href={`/admin/quotes/${encodeURIComponent(request.id)}`} scroll={false}>{request.title}</Link><div className={styles.companyCell}><span>{request.buyerCompanyId ? request.buyerCompany : "Unassigned company"}</span><CustomerProfileShortcut companyName={request.buyerCompany} customerProfileHrefs={customerProfileHrefs} /></div><small>{quoteReference(request)}</small></td>
                <td><span className={`${styles.stage} ${statusCopy[request.status].tone}`}>{statusCopy[request.status].label}</span>{request.isArchived ? <small>Archived</small> : null}<small>{request.supplierQuoteFiles.length ? "Supplier evidence attached" : request.supplierQuotes.some((q) => q.status === "QUOTE_RECEIVED" || q.status === "SELECTED") ? "Supplier quote received" : "No supplier evidence"}</small></td>
                <td><strong>{request.lineItems.length} {request.lineItems.length === 1 ? "part" : "parts"} · {request.lineItems.reduce((sum, item) => sum + item.quantity, 0)} units</strong><small>{request.files.length} {request.files.length === 1 ? "file" : "files"} · {request.process}</small></td>
                <td><strong>{adminSubmissionDate(request)}</strong></td>
                <td><strong>{request.requesterName || "Name not recorded"}</strong></td>
              </tr>;
            })}</tbody>
          </table></div>
          {!filteredRequests.length ? <div className={styles.empty}><h2>No RFQs match this view</h2><p>Choose another stage or clear the search and owner filters.</p><button className={styles.textButton} onClick={() => { setQuery(""); setStageFilter("ALL"); setOwnerFilter("ALL"); }} type="button">Clear filters</button></div> : null}
          <footer>{filteredRequests.length} submissions · Click an RFQ to open its details</footer>
        </section>
      </div> : null}
      {view === "DRAFTS" ? <details open className={adminStyles.drafts}>
        <summary className={adminStyles.draftSummary}>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#767676]">Customer drafts</p>
            <h2 className="mt-1 text-[15px] font-semibold text-[#171717]">Draft quotes not yet requested</h2>
          </div>
          <p className="text-[12px] text-[#777d86]">
            {draftRequests.length} {draftRequests.length === 1 ? "draft" : "drafts"}
          </p>
          <ChevronDown aria-hidden="true" className={adminStyles.draftChevron} size={16} />
        </summary>

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
      </details> : null}

    </div>
  );
}

function PartManufacturingSummary({ item, fallbackProcess }: { item: LatticeRequest["lineItems"][number]; fallbackProcess: string }) {
  const details = item.manufacturingDetails;
  return <div className="text-sm"><p>Process: {processLabel(details?.process || fallbackProcess)}</p>{details ? <>
    <p>Part #: {details.customerPartNumber || "Not specified"} · CAD rev: {details.cadRevision || "Not specified"} · Drawing rev: {details.drawingRevision || "Not specified"}</p>
    {readTargetDeliveryDate(details) ? <p>Target delivery date: {readTargetDeliveryDate(details)} (customer preference)</p> : null}
    {details.cadMetadata ? <p>CAD envelope (mm): {details.cadMetadata.dimensionsMm.map(value => value.toFixed(2)).join(" × ")} · Model units: {details.cadMetadata.sourceUnit}</p> : null}
  </> : null}</div>;
}
