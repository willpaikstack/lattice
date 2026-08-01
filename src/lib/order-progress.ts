import type { LatticeRequest, SupplierOrderStatus } from "./request-model";

export const customerOrderStatusLabel: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "Awaiting supplier acknowledgment",
  IN_PRODUCTION: "In production",
  QC_IN_PROGRESS: "Quality review",
  DOCUMENTS_UPLOADED: "Quality documents ready",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipping",
  DELIVERED: "Delivered",
};

export function isOrderComplete(order: Pick<LatticeRequest, "supplierOrder">) {
  return order.supplierOrder.status === "DELIVERED";
}

export function isOrderMilestoneLate(order: Pick<LatticeRequest, "supplierOrder" | "quote">, now = new Date()) {
  const milestoneDate = order.supplierOrder.nextMilestoneDate || order.quote.estimatedDeliveryDate;

  if (isOrderComplete(order) || !milestoneDate) {
    return false;
  }

  const milestone = new Date(`${milestoneDate}T23:59:59.999Z`);
  return !Number.isNaN(milestone.getTime()) && milestone < now;
}

export function orderNextStep(order: Pick<LatticeRequest, "supplierOrder" | "quote">) {
  const { nextMilestone, nextMilestoneDate, responsibleParty } = order.supplierOrder;

  if (isOrderComplete(order)) {
    return "Delivered";
  }

  if (!nextMilestone) {
    return order.quote.estimatedDeliveryDate ? `Estimated delivery by ${order.quote.estimatedDeliveryDate} - Lattice` : "Next milestone to be confirmed";
  }

  const date = nextMilestoneDate ? ` by ${nextMilestoneDate}` : "";
  return `${nextMilestone}${date} - ${responsibleParty}`;
}
