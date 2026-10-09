"use server";

import { getCurrentSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { archiveOrder } from "@/lib/request-repository";
import { updateSupplierOrder } from "@/lib/request-repository";
import type { OrderResponsibleParty, SupplierOrderStatus } from "@/lib/request-model";
import { requireActionRole } from "@/lib/route-authorization";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const allowedStatuses = new Set<SupplierOrderStatus>([
  "AWAITING_ACKNOWLEDGMENT",
  "IN_PRODUCTION",
  "QC_IN_PROGRESS",
  "DOCUMENTS_UPLOADED",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
]);

const allowedResponsibleParties = new Set<OrderResponsibleParty>(["Lattice", "Supplier", "Customer"]);

export async function archiveOrderAction(formData: FormData) {
  await requireActionRole(["admin"]);
  const requestId = getString(formData, "requestId").trim();

  if (!requestId) {
    throw new Error("Order ID is required");
  }

  await archiveOrder(requestId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);
  redirect("/admin/orders");
}

export async function updateOrderProgressAction(requestId: string, formData: FormData) {
  await requireActionRole(["admin"]);

  const status = getString(formData, "status") as SupplierOrderStatus;
  const responsibleParty = getString(formData, "responsibleParty") as OrderResponsibleParty;
  const customerUpdate = getString(formData, "customerUpdate").trim();
  const nextMilestone = getString(formData, "nextMilestone").trim();
  const nextMilestoneDate = getString(formData, "nextMilestoneDate").trim();

  if (!allowedStatuses.has(status)) {
    throw new Error("Unsupported order status");
  }

  if (!allowedResponsibleParties.has(responsibleParty)) {
    throw new Error("Choose who owns the next milestone");
  }

  if (!customerUpdate) {
    throw new Error("A customer-facing update is required");
  }

  if (status !== "DELIVERED" && (!nextMilestone || !nextMilestoneDate)) {
    throw new Error("Active orders require a next milestone and expected date");
  }

  await updateSupplierOrder(requestId, {
    actor: "operator",
    assignedOwner: getString(formData, "assignedOwner"),
    nextMilestone,
    nextMilestoneDate,
    notes: customerUpdate,
    responsibleParty,
    status,
    trackingNumber: getString(formData, "trackingNumber"),
  });

  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  revalidatePath("/orders");
  revalidatePath(`/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);
  redirect(`/admin/orders/${requestId}`);
}

export async function uploadOrderQualityDocument(requestId: string, formData: FormData) {
  const session = await getCurrentSession();
  if (session?.user.role !== "admin") throw new Error("Lattice Admin access required.");
  const { getRequestById } = await import("@/lib/request-repository");
  const { saveLocalUpload } = await import("@/lib/local-file-storage");
  const { getPrismaClient } = await import("@/lib/prisma");
  const order = await getRequestById(requestId);
  if (!order || order.status !== "PURCHASED" || ["SHIPPED", "DELIVERED"].includes(order.supplierOrder.status)) throw new Error("Upload quality documents before shipment.");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > 25 * 1024 * 1024) throw new Error("Choose a quality document up to 25 MB.");
  const stored = await saveLocalUpload(file, "quality-documents");
  if (!stored.storageKey) throw new Error("Document storage is unavailable.");
  const client = await getPrismaClient() as import("@prisma/client").PrismaClient;
  await client.request.update({ where: { id: requestId }, data: { qualityApprovedAt: null, qualityApprovedBy: null, supplierDocuments: { create: { name: stored.name, sizeBytes: stored.sizeBytes, type: stored.type, storageKey: stored.storageKey, category: "INSPECTION_REPORT" } } } });
  if (order.requiresQualityApproval) {
    const { queueCustomerLifecycleEmail } = await import("@/lib/customer-lifecycle-email");
    await queueCustomerLifecycleEmail(order, "QUALITY_APPROVAL_REQUESTED", stored.storageKey);
  }
  revalidatePath(`/admin/orders/${requestId}`); revalidatePath(`/orders/${requestId}`);
}

export async function confirmOrderComplianceReview(requestId: string, data: FormData) {
  const session = await requireActionRole(["admin"]);
  const { getRequestById } = await import("@/lib/request-repository");
  const { getPrismaClient } = await import("@/lib/prisma");
  const order = await getRequestById(requestId);
  const note = getString(data, "reviewNote").trim();
  if (!order || order.status !== "PURCHASED" || !order.complianceReviewRequired || !note) throw new Error("Record the completed compliance review before release.");
  const client = await getPrismaClient() as import("@prisma/client").PrismaClient;
  await client.request.update({ where: { id: requestId }, data: { complianceReviewedAt: new Date(), checkoutDetails: { ...order.checkoutDetails, complianceReviewNote: note, complianceReviewedBy: session.user.id } } });
  revalidatePath(`/admin/orders/${requestId}`); revalidatePath(`/orders/${requestId}`);
}
