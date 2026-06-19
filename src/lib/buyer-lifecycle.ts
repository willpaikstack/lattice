import type { LatticeRequest } from "./request-model";

export type BuyerLifecycleTag = "Draft" | "Quote Requested" | "Quote Received" | "In Production" | "Shipping" | "Delivered" | "Archived";

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
    return request.supplierOrder.status === "SHIPPED" ? "Shipping" : "In Production";
  }

  return "Quote Requested";
}
