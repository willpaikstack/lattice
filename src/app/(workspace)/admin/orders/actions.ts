"use server";

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
