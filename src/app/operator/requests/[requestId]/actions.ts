"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { OperatorStatusUpdateInput } from "@/lib/request-model";
import { updateOperatorRequestStatus } from "@/lib/request-repository";

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

export async function updateOperatorRequestStatusAction(requestId: string, formData: FormData) {
  const status = getString(formData, "status") as OperatorStatusUpdateInput["status"];

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

  revalidatePath("/operator/requests");
  revalidatePath(`/operator/requests/${requestId}`);
  revalidatePath("/quotes");
  redirect(`/operator/requests/${requestId}`);
}
