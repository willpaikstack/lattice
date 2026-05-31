"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CustomerQuoteInput, CustomerQuoteLineItem } from "@/lib/quote-file";
import type { OperatorStatusUpdateInput } from "@/lib/request-model";
import { saveCustomerQuoteForRequest, updateOperatorRequestStatus } from "@/lib/request-repository";

const allowedStatuses = new Set<OperatorStatusUpdateInput["status"]>([
  "SUBMITTED",
  "NEEDS_INFO",
  "READY_FOR_SUPPLIER_RFQ",
  "QUOTED",
]);

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

export async function saveCustomerQuoteAction(formData: FormData) {
  const requestId = getString(formData, "requestId").trim();

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  const quoteMarkdown = getString(formData, "quoteMarkdown").trim();
  const quoteSummary = getString(formData, "quoteSummary").trim();
  const quote = parseQuotePayload(formData);

  await saveCustomerQuoteForRequest(requestId, {
    ...quote,
    estimatedPriceCents: getInteger(formData, "quoteTotalCents"),
    leadTimeDays: parseLeadTimeDays(getString(formData, "leadTime")),
    markdown: quoteMarkdown,
    quoteSummary: quoteSummary || quoteMarkdown,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/notifications");
  redirect("/admin/quotes");
}

export async function updateAdminQuoteStatusAction(formData: FormData) {
  const requestId = getString(formData, "requestId").trim();
  const status = getString(formData, "status") as OperatorStatusUpdateInput["status"];

  if (!requestId) {
    throw new Error("Request ID is required");
  }

  if (!allowedStatuses.has(status)) {
    throw new Error("Unsupported request status");
  }

  await updateOperatorRequestStatus(requestId, {
    status,
    assignedOwner: getString(formData, "assignedOwner"),
    internalNotes: getString(formData, "internalNotes"),
    supplierPackageNotes: getString(formData, "supplierPackageNotes"),
    estimatedPriceCents: getOptionalPriceCents(formData, "estimatedPrice"),
    leadTimeDays: getOptionalInteger(formData, "leadTimeDays"),
    quoteSummary: getString(formData, "quoteSummary"),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/operator/requests");
  revalidatePath(`/operator/requests/${requestId}`);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/notifications");
  redirect("/admin/quotes");
}
