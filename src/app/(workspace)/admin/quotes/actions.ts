"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildCustomerQuoteMarkdown } from "@/lib/quote-file";
import type { OperatorStatusUpdateInput } from "@/lib/request-model";
import { getRequestById, saveCustomerQuoteForRequest, updateAdminRfqDecision, type SelectedSupplierQuoteInput } from "@/lib/request-repository";
import { requireActionRole } from "@/lib/route-authorization";

const allowedStatuses = new Set<OperatorStatusUpdateInput["status"]>([
  "SUBMITTED",
  "NEEDS_INFO",
  "READY_FOR_SUPPLIER_RFQ",
  "QUOTED",
  "CLOSED",
]);
const allowedDecisionStatuses = new Set(["NEEDS_INFO", "CLOSED"]);
const latticePaymentTerms = "100% Payment in Advance";
const shippingDurationDaysByMethod: Record<string, number> = {
  Domestic: 2,
  International: 5,
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getOptionalInteger(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getOptionalPriceCents(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function getOptionalPriceDollars(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addDaysIso(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatShippingLabel(costCents: number | null, method: string, terms: string) {
  const pieces = [method, terms].filter(Boolean).join(" / ");
  const cost = costCents === null ? "Billed at actual" : `$${(costCents / 100).toFixed(2)}`;

  return pieces ? `${pieces} - ${cost}` : cost;
}

function shippingDurationDays(method: string) {
  return shippingDurationDaysByMethod[method] ?? 0;
}

export async function updateAdminQuoteStatusAction(formData: FormData) {
  await requireActionRole(["admin"]);
  const requestId = getString(formData, "requestId").trim();
  const status = getString(formData, "status") as OperatorStatusUpdateInput["status"];

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  if (!allowedStatuses.has(status)) {
    throw new Error("Unsupported request status");
  }

  if (status !== "QUOTED") {
    throw new Error("Quote submission must use quote received status");
  }

  const current = await getRequestById(requestId);

  if (!current) {
    throw new Error("Request not found");
  }

  const shippingCostCents = getOptionalPriceCents(formData, "shippingCost");
  const shippingMethod = getString(formData, "shippingMethod");
  const shippingTerms = getString(formData, "shippingTerms");
  const quoteCreatedDate = getString(formData, "quoteCreatedDate") || new Date().toISOString().slice(0, 10);
  const quoteValidUntil = getString(formData, "quoteValidUntil") || addDaysIso(quoteCreatedDate, 30);
  const quoteSummary = getString(formData, "quoteSummary").trim();
  const lineItems = current.lineItems.map((item) => ({
    description: item.partName,
    finish: item.surfaceFinish ?? "",
    id: item.id,
    material: item.material,
    process: current.process,
    quantity: item.quantity,
    leadTimeDays: getOptionalInteger(formData, `leadTimeDays:${item.id}`),
    unitPrice: getOptionalPriceDollars(formData, `unitPrice:${item.id}`),
  }));
  const supplierLineItems = current.lineItems.map((item) => ({
    id: item.id,
    description: item.partName,
    drawingRevision: "Released package",
    finish: item.surfaceFinish ?? "",
    inspection: (item.qualityDocumentation ?? []).join(", ") || "Standard inspection",
    leadTimeDays: getOptionalInteger(formData, `leadTimeDays:${item.id}`),
    material: item.material,
    process: current.process,
    quantity: item.quantity,
    supplierNotes: "",
    unitPrice: getOptionalPriceDollars(formData, `unitPrice:${item.id}`),
  }));
  const supplierLineLeadTimes = supplierLineItems
    .map((item) => item.leadTimeDays)
    .filter((value): value is number => typeof value === "number");
  const supplierLineTotalCents = supplierLineItems.reduce((sum, item) => sum + Math.round(item.unitPrice * item.quantity * 100), 0);
  const supplierLeadTimeDays = supplierLineLeadTimes.length ? Math.max(...supplierLineLeadTimes) + shippingDurationDays(shippingMethod) : null;
  const selectedSupplierQuote: SelectedSupplierQuoteInput = {
    contactName: "",
    country: getString(formData, "supplierQuoteCountry").trim() || "China",
    leadTimeDays: supplierLeadTimeDays,
    lineItems: supplierLineItems,
    notes: "",
    priceCents: supplierLineTotalCents + (shippingCostCents ?? 0),
    shopName: getString(formData, "supplierQuoteShop").trim() || current.supplierOrder.shopName || "China supplier team",
  };
  const lineLeadTimes = lineItems
    .map((item) => item.leadTimeDays)
    .filter((value): value is number => typeof value === "number");
  const leadTimeDays = lineLeadTimes.length ? Math.max(...lineLeadTimes) : null;
  const estimatedPriceCents = lineItems.reduce((sum, item) => sum + Math.round(item.unitPrice * item.quantity * 100), 0);
  const quote = {
    assumptions: [
      `${latticePaymentTerms}. Production begins after payment is received and final design release is complete.`,
      "Customer-supplied CAD and drawings are complete and represent the latest revision.",
      "Pricing is based on the uploaded RFQ package and listed manufacturing requirements.",
      "Standard dimensional inspection is included unless additional documentation is listed.",
    ].join("\n"),
    clarifications: getString(formData, "internalNotes"),
    customerCompany: current.buyerCompany,
    customerContact: current.requesterName,
    filesReviewed: current.files.map((file) => file.name).join("\n"),
    leadTime: leadTimeDays ? `${leadTimeDays} business days` : "",
    lineItems,
    notes: quoteSummary || "Pricing includes manufacturing coordination, production, and standard inspection for the listed line items.",
    preparedBy: "Lattice",
    projectName: current.title,
    quoteDate: quoteCreatedDate,
    quoteNumber: `LQ-${current.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`,
    shipping: formatShippingLabel(shippingCostCents, shippingMethod, shippingTerms),
    tax: "Tax, tariffs, import duties, customs brokerage, and special inspection documents are excluded unless explicitly listed.",
    validUntil: quoteValidUntil,
  };

  await saveCustomerQuoteForRequest(requestId, {
    ...quote,
    estimatedDeliveryDate: getString(formData, "estimatedDeliveryDate"),
    estimatedPriceCents,
    leadTimeDays,
    markdown: buildCustomerQuoteMarkdown(quote),
    quoteSummary,
    selectedSupplierQuote,
    shippingCostCents,
    shippingMethod,
    shippingTerms,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/notifications");
  redirect("/admin/quotes");
}

export async function updateAdminRfqDecisionAction(formData: FormData) {
  await requireActionRole(["admin"]);
  const requestId = getString(formData, "requestId").trim();
  const status = getString(formData, "status");
  const customerNote = getString(formData, "customerNote").trim();

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  if (!allowedDecisionStatuses.has(status)) {
    throw new Error("Unsupported RFQ decision");
  }

  if (!customerNote) {
    throw new Error("Customer-facing note is required");
  }

  await updateAdminRfqDecision(requestId, {
    customerNote,
    status: status as "NEEDS_INFO" | "CLOSED",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/dashboard");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/notifications");
  redirect(`/admin/quotes?requestId=${encodeURIComponent(requestId)}`);
}
