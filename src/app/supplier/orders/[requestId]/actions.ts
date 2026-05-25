"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { SupplierDocumentCategory, SupplierOrderStatus } from "@/lib/request-model";
import { updateSupplierOrder } from "@/lib/request-repository";

const allowedStatuses = new Set<SupplierOrderStatus>([
  "AWAITING_ACKNOWLEDGMENT",
  "IN_PRODUCTION",
  "QC_IN_PROGRESS",
  "DOCUMENTS_UPLOADED",
  "READY_TO_SHIP",
  "SHIPPED",
]);

const allowedDocumentCategories = new Set<SupplierDocumentCategory>([
  "INSPECTION_REPORT",
  "MATERIAL_CERT",
  "CERTIFICATE_OF_CONFORMANCE",
  "PHOTO",
  "PACKING_SLIP",
  "OTHER",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFiles(formData: FormData, key: string, category: SupplierDocumentCategory) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0)
    .map((file) => ({
      name: file.name,
      sizeBytes: file.size,
      type: file.type || "application/octet-stream",
      category,
    }));
}

export async function updateSupplierOrderAction(requestId: string, formData: FormData) {
  const status = getString(formData, "status") as SupplierOrderStatus;
  const documentCategory = getString(formData, "documentCategory") as SupplierDocumentCategory;

  if (!allowedStatuses.has(status)) {
    throw new Error("Unsupported supplier order status");
  }

  if (!allowedDocumentCategories.has(documentCategory)) {
    throw new Error("Unsupported supplier document category");
  }

  await updateSupplierOrder(requestId, {
    status,
    shopName: getString(formData, "shopName"),
    contactName: getString(formData, "contactName"),
    notes: getString(formData, "notes"),
    trackingNumber: getString(formData, "trackingNumber"),
    documents: getFiles(formData, "documents", documentCategory),
  });

  revalidatePath("/supplier/orders");
  revalidatePath(`/supplier/orders/${requestId}`);
  revalidatePath("/orders");
  redirect(`/supplier/orders/${requestId}`);
}
