import type { LatticeRequest, RequestStatus } from "./request-model";

export type AdminCustomerSummary = {
  name: string;
  requesters: string[];
  totalRequests: number;
  activeQuoteRequests: number;
  placedOrders: number;
  blockedRequests: number;
  quotedValueCents: number;
  orderValueCents: number;
  latestActivityAt: string;
  latestRequest: {
    id: string;
    title: string;
    status: RequestStatus;
    href: string;
  } | null;
  fabricationShops: Array<{
    name: string;
    country: string;
    quoteCount: number;
    selectedOrderCount: number;
  }>;
};

function sortNewest(left: { latestActivityAt: string }, right: { latestActivityAt: string }) {
  return new Date(right.latestActivityAt).getTime() - new Date(left.latestActivityAt).getTime();
}

function quoteHref(request: LatticeRequest) {
  return request.status === "PURCHASED" ? `/supplier/orders/${request.id}` : `/operator/requests/${request.id}`;
}

export function buildAdminCustomerSummaries(requests: LatticeRequest[]): AdminCustomerSummary[] {
  const customers = new Map<string, AdminCustomerSummary>();

  for (const request of requests) {
    const current = customers.get(request.buyerCompany) ?? {
      name: request.buyerCompany,
      requesters: [],
      totalRequests: 0,
      activeQuoteRequests: 0,
      placedOrders: 0,
      blockedRequests: 0,
      quotedValueCents: 0,
      orderValueCents: 0,
      latestActivityAt: request.updatedAt,
      latestRequest: null,
      fabricationShops: [],
    };

    current.totalRequests += 1;
    if (!current.requesters.includes(request.requesterName)) {
      current.requesters.push(request.requesterName);
    }
    if (request.status !== "DRAFT" && request.status !== "PURCHASED") {
      current.activeQuoteRequests += 1;
    }
    if (request.status === "PURCHASED") {
      current.placedOrders += 1;
      current.orderValueCents += request.quote.estimatedPriceCents ?? 0;
    }
    if (request.status === "NEEDS_INFO") {
      current.blockedRequests += 1;
    }
    current.quotedValueCents += request.quote.estimatedPriceCents ?? 0;

    if (!current.latestRequest || new Date(request.updatedAt).getTime() > new Date(current.latestActivityAt).getTime()) {
      current.latestActivityAt = request.updatedAt;
      current.latestRequest = {
        id: request.id,
        title: request.title,
        status: request.status,
        href: quoteHref(request),
      };
    }

    for (const quote of request.supplierQuotes) {
      const shop = current.fabricationShops.find((candidate) => candidate.name === quote.shopName && candidate.country === quote.country);
      if (shop) {
        shop.quoteCount += 1;
        shop.selectedOrderCount += quote.isSelected || quote.status === "SELECTED" ? 1 : 0;
      } else {
        current.fabricationShops.push({
          name: quote.shopName,
          country: quote.country,
          quoteCount: 1,
          selectedOrderCount: quote.isSelected || quote.status === "SELECTED" ? 1 : 0,
        });
      }
    }

    if (request.status === "PURCHASED" && request.supplierOrder.shopName) {
      const shop = current.fabricationShops.find((candidate) => candidate.name === request.supplierOrder.shopName);
      if (!shop) {
        current.fabricationShops.push({
          name: request.supplierOrder.shopName,
          country: "Overseas",
          quoteCount: 0,
          selectedOrderCount: 1,
        });
      }
    }

    customers.set(request.buyerCompany, current);
  }

  return [...customers.values()]
    .map((customer) => ({
      ...customer,
      requesters: customer.requesters.sort((left, right) => left.localeCompare(right)),
      fabricationShops: customer.fabricationShops.sort(
        (left, right) => right.selectedOrderCount - left.selectedOrderCount || right.quoteCount - left.quoteCount || left.name.localeCompare(right.name),
      ),
    }))
    .sort(sortNewest);
}
