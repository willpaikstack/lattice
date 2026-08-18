import "server-only";

import { isDraftUploadStorageKey } from "./local-file-storage";
import type { LatticeRequest, UploadedFile } from "./request-model";
import { getRequestById, listAdminRequests } from "./request-repository";
import { getCurrentSession } from "./session";

type Session = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;

export function customerCompanyOwnsRequest(companyId: string | null | undefined, request: Pick<LatticeRequest, "buyerCompanyId">) {
  return Boolean(companyId && request.buyerCompanyId && companyId === request.buyerCompanyId);
}

export function canSessionAccessCustomerRequest(session: Session | null, request: LatticeRequest) {
  if (!session) {
    return false;
  }

  if (session.user.role === "admin") {
    return true;
  }

  return session.user.role === "customer" && customerCompanyOwnsRequest(session.user.companyId, request);
}

export function filterCustomerVisibleRequests(requests: LatticeRequest[], session: Session | null) {
  return requests.filter((request) => canSessionAccessCustomerRequest(session, request));
}

export async function getCustomerRequestByIdForCurrentSession(requestId: string) {
  const [session, request] = await Promise.all([getCurrentSession(), getRequestById(requestId)]);

  return request && canSessionAccessCustomerRequest(session, request) ? request : null;
}

export async function filterCustomerVisibleRequestsForCurrentSession(requests: LatticeRequest[]) {
  const session = await getCurrentSession();

  return filterCustomerVisibleRequests(requests, session);
}

function storageKeyMatches(file: Pick<UploadedFile, "storageKey"> | null | undefined, storageKey: string) {
  return file?.storageKey === storageKey;
}

function requestHasCustomerVisibleStorageKey(request: LatticeRequest, storageKey: string) {
  return request.files.some((file) => storageKeyMatches(file, storageKey)) || storageKeyMatches(request.customerPurchaseOrderAttachment, storageKey);
}

function requestHasAdminOnlyStorageKey(request: LatticeRequest, storageKey: string) {
  return request.supplierQuoteFiles.some((file) => storageKeyMatches(file, storageKey));
}

export function canSessionAccessRequestStorageKey(session: Session | null, request: LatticeRequest, storageKey: string) {
  if (!session) {
    return false;
  }

  if (requestHasAdminOnlyStorageKey(request, storageKey)) {
    return session.user.role === "admin";
  }

  if (requestHasCustomerVisibleStorageKey(request, storageKey)) {
    return canSessionAccessCustomerRequest(session, request);
  }

  return false;
}

export async function canCurrentSessionAccessStorageKey(storageKey: string) {
  const session = await getCurrentSession();

  if (!session) {
    return { authenticated: false, authorized: false };
  }

  if (isDraftUploadStorageKey(storageKey)) {
    return { authenticated: true, authorized: session.user.role === "admin" || session.user.role === "customer" };
  }

  const requests = await listAdminRequests();
  const owningRequest = requests.find(
    (request) => requestHasAdminOnlyStorageKey(request, storageKey) || requestHasCustomerVisibleStorageKey(request, storageKey),
  );

  return {
    authenticated: true,
    authorized: owningRequest ? canSessionAccessRequestStorageKey(session, owningRequest, storageKey) : false,
  };
}
