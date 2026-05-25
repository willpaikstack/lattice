import type { LatticeRequest } from "./request-model";

const STORAGE_KEY = "lattice-os.requests.v1";

export function loadRequests(): LatticeRequest[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LatticeRequest[]) : [];
  } catch {
    return [];
  }
}

export function saveRequests(requests: LatticeRequest[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

export function appendRequest(request: LatticeRequest) {
  const requests = [request, ...loadRequests()];
  saveRequests(requests);
  return requests;
}
