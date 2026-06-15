"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createGuestQuoteAccess, guestQuoteHref, isGuestSimpleQuoteRequest } from "@/lib/guest-quote-access";
import { sendGuestQuoteReadyEmail } from "@/lib/guest-quote-email";
import { buildCustomerQuoteMarkdown, type CustomerQuoteInput, type CustomerQuoteLineItem } from "@/lib/quote-file";
import type { OperatorStatusUpdateInput } from "@/lib/request-model";
import { getRequestById, saveCustomerQuoteForRequest, updateGuestQuoteAccess, type SelectedSupplierQuoteInput } from "@/lib/request-repository";
import { requireActionRole } from "@/lib/route-authorization";

const allowedStatuses = new Set<OperatorStatusUpdateInput["status"]>([
  "SUBMITTED",
  "NEEDS_INFO",
  "READY_FOR_SUPPLIER_RFQ",
  "QUOTED",
  "CLOSED",
]);
const latticePaymentTerms = "100% Payment in Advance";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getInteger(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
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

function getOptionalPriceCentsFromDollars(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
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

function parseLeadTimeDays(value: string) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : null;
}

function stringFromRecord(record: Record<string, unknown>, key: keyof CustomerQuoteInput) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function parseLineItems(value: unknown): CustomerQuoteLineItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

    return {
      description: typeof record.description === "string" ? record.description : "",
      finish: typeof record.finish === "string" ? record.finish : "",
      id: typeof record.id === "string" ? record.id : `line-${index + 1}`,
      material: typeof record.material === "string" ? record.material : "",
      process: typeof record.process === "string" ? record.process : "",
      quantity: typeof record.quantity === "number" ? record.quantity : 0,
      unitPrice: typeof record.unitPrice === "number" ? record.unitPrice : 0,
    };
  });
}

function parseQuotePayload(formData: FormData): CustomerQuoteInput {
  const rawPayload = getString(formData, "quotePayload");
  const parsed = rawPayload ? JSON.parse(rawPayload) : {};
  const record = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};

  return {
    assumptions: stringFromRecord(record, "assumptions"),
    clarifications: stringFromRecord(record, "clarifications"),
    customerCompany: stringFromRecord(record, "customerCompany"),
    customerContact: stringFromRecord(record, "customerContact"),
    filesReviewed: stringFromRecord(record, "filesReviewed"),
    leadTime: stringFromRecord(record, "leadTime"),
    lineItems: parseLineItems(record.lineItems),
    notes: stringFromRecord(record, "notes"),
    preparedBy: stringFromRecord(record, "preparedBy"),
    projectName: stringFromRecord(record, "projectName"),
    quoteDate: stringFromRecord(record, "quoteDate"),
    quoteNumber: stringFromRecord(record, "quoteNumber"),
    shipping: stringFromRecord(record, "shipping"),
    tax: stringFromRecord(record, "tax"),
    validUntil: stringFromRecord(record, "validUntil"),
  };
}

async function sendGuestQuoteReadyLinkIfNeeded(request: Awaited<ReturnType<typeof saveCustomerQuoteForRequest>>) {
  if (!isGuestSimpleQuoteRequest(request)) {
    return;
  }

  const access = createGuestQuoteAccess();
  const updated = await updateGuestQuoteAccess(request.id, {
    expiresAt: access.expiresAt,
    tokenHash: access.tokenHash,
  });

  await sendGuestQuoteReadyEmail(updated, guestQuoteHref(updated.id, access.token));
  revalidatePath(`/simple-quote/${request.id}`);
}

export async function saveCustomerQuoteAction(formData: FormData) {
  await requireActionRole(["admin"]);
  const requestId = getString(formData, "requestId").trim();

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const quoteMarkdown = getString(formData, "quoteMarkdown").trim();
  const quoteSummary = getString(formData, "quoteSummary").trim();
  const quote = parseQuotePayload(formData);

  const savedQuoteRequest = await saveCustomerQuoteForRequest(requestId, {
    ...quote,
    estimatedPriceCents: getInteger(formData, "quoteTotalCents"),
    leadTimeDays: parseLeadTimeDays(getString(formData, "leadTime")),
    markdown: quoteMarkdown,
    quoteSummary: quoteSummary || quoteMarkdown,
  });
  await sendGuestQuoteReadyLinkIfNeeded(savedQuoteRequest);

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/notifications");
  redirect("/admin/quotes");
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
    drawingRevision: getString(formData, `supplierDrawingRevision:${item.id}`).trim() || "Released package",
    finish: item.surfaceFinish ?? "",
    inspection: (item.qualityDocumentation ?? []).join(", ") || "Standard inspection",
    leadTimeDays: getOptionalInteger(formData, `supplierLeadTimeDays:${item.id}`),
    material: item.material,
    process: current.process,
    quantity: item.quantity,
    supplierNotes: getString(formData, `supplierNotes:${item.id}`).trim(),
    unitPrice: getOptionalPriceDollars(formData, `supplierUnitPrice:${item.id}`),
  }));
  const supplierLineLeadTimes = supplierLineItems
    .map((item) => item.leadTimeDays)
    .filter((value): value is number => typeof value === "number");
  const selectedSupplierQuote: SelectedSupplierQuoteInput = {
    contactName: getString(formData, "supplierQuoteContact").trim(),
    country: getString(formData, "supplierQuoteCountry").trim() || "China",
    leadTimeDays: getOptionalInteger(formData, "supplierQuoteLeadTime") ?? (supplierLineLeadTimes.length ? Math.max(...supplierLineLeadTimes) : null),
    lineItems: supplierLineItems,
    notes: getString(formData, "supplierQuoteNotes").trim(),
    priceCents:
      getOptionalPriceCentsFromDollars(formData, "supplierQuoteTotal") ??
      supplierLineItems.reduce((sum, item) => sum + Math.round(item.unitPrice * item.quantity * 100), 0),
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

  const savedQuoteRequest = await saveCustomerQuoteForRequest(requestId, {
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
  await sendGuestQuoteReadyLinkIfNeeded(savedQuoteRequest);

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/operator/requests");
  revalidatePath(`/operator/requests/${requestId}`);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/notifications");
  redirect("/admin/quotes");
}
