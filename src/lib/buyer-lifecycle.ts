import type { LatticeRequest } from "./request-model";
import { customerOrderStatusLabel } from "./order-progress";

export type BuyerLifecycleTag =
  | "Draft"
  | "Quote Requested"
  | "Quote Received"
  | "Awaiting supplier acknowledgment"
  | "In production"
  | "Quality review"
  | "Quality documents ready"
  | "Ready to ship"
  | "Shipping"
  | "Delivered"
  | "Archived";

export function buyerLifecycleTag(request: Pick<LatticeRequest, "isArchived" | "status" | "supplierOrder">): BuyerLifecycleTag {
  if (request.isArchived || request.status === "CLOSED") {
    return "Archived";
  }

  if (request.status === "DRAFT") {
    return "Draft";
  }

  if (request.status === "QUOTED") {
    return "Quote Received";
  }

  if (request.status === "PURCHASED") {
    return customerOrderStatusLabel[request.supplierOrder.status] as BuyerLifecycleTag;
  }

  return "Quote Requested";
}
