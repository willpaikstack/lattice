"use server";
import { quotePreparationErrors } from "@/lib/quote-preparation-validation";
import { processLabel } from "@/lib/rfq-manufacturing";
import { resolveQuoteValidUntil, quoteValidUntil as calculateQuoteValidUntil } from "@/lib/quote-validity";

import { revalidatePath } from "next/cache";

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

class QuoteValidationError extends Error {}

function getOptionalInteger(formData: FormData, key: string) {
  const value = getString(formData, key).trim();
  if (!value) return null;
  const parsed = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(parsed) || parsed < 1 || parsed > 2_147_483_647) {
    throw new QuoteValidationError("Lead times must be positive whole numbers.");
  }
  return parsed;
}

function getPriceCents(formData: FormData, key: string, required = false) {
  const value = getString(formData, key).trim();
  if (!value && !required) return null;
  const cents = Math.round(Number(value) * 100);
  if (!/^\d+(?:\.\d{1,2})?$/.test(value) || !Number.isSafeInteger(cents) || cents > 2_147_483_647) {
    throw new QuoteValidationError(required
      ? "Enter a non-negative unit price with up to two decimal places for every part."
      : "Shipping cost must be a non-negative amount with up to two decimal places.");
  }
  return cents;
}

function actionError(error: unknown) {
  return { error: error instanceof QuoteValidationError ? error.message : "Unable to save this RFQ. Your edits are retained; please try again." };
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
  try {
    const requestId = getString(formData, "requestId").trim();
    const status = getString(formData, "status") as OperatorStatusUpdateInput["status"];

    if (!requestId) {
      throw new QuoteValidationError("Request ID is required");
    }

    if (!allowedStatuses.has(status)) {
      throw new QuoteValidationError("Unsupported request status");
    }

    if (status !== "QUOTED") {
      throw new QuoteValidationError("Quote submission must use quote received status");
    }

    const current = await getRequestById(requestId, { requireDatabase: true });

    if (!current) {
      throw new QuoteValidationError("Request not found");
    }

    if (["DRAFT", "PURCHASED", "CLOSED"].includes(current.status) || current.isArchived) {
      throw new QuoteValidationError("Only active RFQs can receive customer quotes.");
    }
    if (!current.lineItems.length) throw new QuoteValidationError("This RFQ has no parts to quote.");

    const preparationErrors = quotePreparationErrors({
      lineItems: current.lineItems.map((item) => ({ partName: item.partName, unitPrice: getString(formData, `unitPrice:${item.id}`), leadTimeDays: getString(formData, `leadTimeDays:${item.id}`) })),
      shippingCost: getString(formData, "shippingCost"), shippingMethod: getString(formData, "shippingMethod"), shippingTerms: getString(formData, "shippingTerms"),
      estimatedDeliveryDate: getString(formData, "estimatedDeliveryDate"),
      quoteCreatedDate: getString(formData, "quoteCreatedDate") || new Date().toISOString().slice(0, 10),
      quoteValidUntil: getString(formData, "quoteValidUntil"), customerNote: getString(formData, "quoteSummary"),
    });
    if (preparationErrors.length) throw new QuoteValidationError(preparationErrors.join(" "));
    const shippingCostCents = getPriceCents(formData, "shippingCost");
    const shippingMethod = getString(formData, "shippingMethod");
    const shippingTerms = getString(formData, "shippingTerms");
    if (!["Domestic", "International"].includes(shippingMethod)) throw new QuoteValidationError("Select a valid shipping speed.");
    if (!["", "EXW", "DDP", "Determined at Checkout", "DAP", "FOB"].includes(shippingTerms)) throw new QuoteValidationError("Select valid shipping terms.");
    const quoteCreatedDate = getString(formData, "quoteCreatedDate") || new Date().toISOString().slice(0, 10);
    let quoteValidUntil: string;
    try { calculateQuoteValidUntil(quoteCreatedDate); }
    catch { throw new QuoteValidationError("Select a valid quote issue date."); }
    try { quoteValidUntil = resolveQuoteValidUntil(quoteCreatedDate, getString(formData, "quoteValidUntil")); }
    catch (error) { throw new QuoteValidationError(error instanceof Error ? error.message : "Select a valid quote expiration date."); }
    const estimatedDeliveryDate = getString(formData, "estimatedDeliveryDate");
    if (estimatedDeliveryDate) {
      try { calculateQuoteValidUntil(estimatedDeliveryDate); }
      catch { throw new QuoteValidationError("Select a valid estimated delivery date."); }
    }
    const quoteSummary = getString(formData, "quoteSummary").trim();
    const lineItems = current.lineItems.map((item) => ({
      description: item.partName,
      finish: item.surfaceFinish ?? "",
      id: item.id,
      material: item.material,
      process: processLabel(item.manufacturingDetails?.process || current.process),
      quantity: item.quantity,
      leadTimeDays: getOptionalInteger(formData, `leadTimeDays:${item.id}`),
      unitPrice: (getPriceCents(formData, `unitPrice:${item.id}`, true) as number) / 100,
    }));
    const supplierLineItems = current.lineItems.map((item) => ({
      id: item.id,
      description: item.partName,
      drawingRevision: item.manufacturingDetails?.drawingRevision || item.manufacturingDetails?.cadRevision || "Released package",
      finish: item.surfaceFinish ?? "",
      inspection: (item.qualityDocumentation ?? []).join(", ") || "Standard inspection",
      leadTimeDays: getOptionalInteger(formData, `leadTimeDays:${item.id}`),
      material: item.material,
      process: processLabel(item.manufacturingDetails?.process || current.process),
      quantity: item.quantity,
      supplierNotes: "",
      unitPrice: (getPriceCents(formData, `unitPrice:${item.id}`, true) as number) / 100,
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
    if (estimatedPriceCents > 2_147_483_647 || supplierLineTotalCents + (shippingCostCents ?? 0) > 2_147_483_647 || !Number.isSafeInteger(estimatedPriceCents) || !Number.isSafeInteger(supplierLineTotalCents + (shippingCostCents ?? 0))) {
      throw new QuoteValidationError("Quote total exceeds the supported amount.");
    }
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
      notes: quoteSummary,
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
      estimatedDeliveryDate,
      estimatedPriceCents,
      leadTimeDays,
      markdown: buildCustomerQuoteMarkdown(quote),
      quoteSummary,
      selectedSupplierQuote,
      shippingCostCents,
      shippingMethod,
      shippingTerms,
    }, { requireDatabase: true });
    revalidatePath("/admin");
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${requestId}`);
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${requestId}`);
    revalidatePath("/notifications");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (error) { return actionError(error); }
}

export async function updateAdminRfqDecisionAction(formData: FormData) {
  await requireActionRole(["admin"]);
  try {
    const requestId = getString(formData, "requestId").trim();
    const status = getString(formData, "status");
    const customerNote = getString(formData, "customerNote").trim();

    if (!requestId) {
      throw new QuoteValidationError("Request ID is required");
    }

    if (!allowedDecisionStatuses.has(status)) {
      throw new QuoteValidationError("Unsupported RFQ decision");
    }

    if (!customerNote) {
      throw new QuoteValidationError("Customer-facing note is required");
    }

    const current = await getRequestById(requestId, { requireDatabase: true });
    if (!current) throw new QuoteValidationError("Request not found");
    if (["DRAFT", "PURCHASED", "CLOSED"].includes(current.status) || current.isArchived) {
      throw new QuoteValidationError("Only active RFQs can receive a customer-facing decision.");
    }

    await updateAdminRfqDecision(requestId, {
      customerNote,
      status: status as "NEEDS_INFO" | "CLOSED",
    }, { requireDatabase: true });

    revalidatePath("/admin");
    revalidatePath("/admin/quotes");
    revalidatePath(`/admin/quotes/${requestId}`);
    revalidatePath("/dashboard");
    revalidatePath("/quotes");
    revalidatePath(`/quotes/${requestId}`);
    revalidatePath("/notifications");
    return { success: true as const };
  } catch (error) { return actionError(error); }
}
