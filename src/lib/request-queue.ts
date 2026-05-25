import type { LatticeRequest } from "./request-model";

const OPERATOR_VISIBLE_STATUSES = new Set<LatticeRequest["status"]>([
  "SUBMITTED",
  "NEEDS_INFO",
  "READY_FOR_SUPPLIER_RFQ",
  "QUOTED",
]);

export function sortRequestsNewestFirst(requests: LatticeRequest[]) {
  return [...requests].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function getOperatorQueueRequests(requests: LatticeRequest[]) {
  return sortRequestsNewestFirst(
    requests.filter((request) => OPERATOR_VISIBLE_STATUSES.has(request.status)),
  );
}
