import { vendorEquipment } from "./vendor-equipment";
import type { LatticeRequest, SupplierQuote, SupplierQuoteStatus } from "./request-model";

export type OverseasVendorStatus = "Active" | "Quoting" | "Invited" | "Needs review";

export type OverseasVendor = {
  id: string;
  name: string;
  country: string;
  city: string;
  region: string;
  status: OverseasVendorStatus;
  relationshipOwner: string;
  primaryContact: string;
  primaryCapability: string;
  capabilities: string[];
  materials: string[];
  certifications: string[];
  qualitySystem: string;
  communicationWindow: string;
  shippingLane: string;
  paymentTerms: string;
  quoteCount: number;
  receivedQuoteCount: number;
  selectedOrderCount: number;
  activeOrderCount: number;
  openRfqCount: number;
  averageLeadTimeDays: number | null;
  averageQuoteCents: number | null;
  lastQuotedAt: string | null;
  lastActivityAt: string | null;
  notes: string;
  recentRfqs: Array<{
    id: string;
    title: string;
    customer: string;
    status: SupplierQuoteStatus | "ORDER";
    href: string;
  }>;
};

type VendorDirectoryEntry = Omit<
  OverseasVendor,
  | "status"
  | "quoteCount"
  | "receivedQuoteCount"
  | "selectedOrderCount"
  | "activeOrderCount"
  | "openRfqCount"
  | "averageLeadTimeDays"
  | "averageQuoteCents"
  | "lastQuotedAt"
  | "lastActivityAt"
  | "recentRfqs"
>;

const overseasVendorDirectory: VendorDirectoryEntry[] = [
  {
    id: "shenzhen-precision-manufacturing",
    name: "Shenzhen Precision Manufacturing",
    country: "China",
    city: "Shenzhen",
    region: "Greater Bay Area",
    relationshipOwner: "Adam",
    primaryContact: "Li Wei",
    primaryCapability: "Precision CNC machining",
    capabilities: ["5-axis CNC milling", "CNC turning", "Dimensional inspection", "Aluminum fixtures"],
    materials: ["6061-T6 aluminum", "7075 aluminum", "Stainless steel", "Engineering plastics"],
    certifications: ["ISO 9001 aligned", "Material certs available", "Inspection reports"],
    qualitySystem: "First article and dimensional inspection reports for selected orders.",
    communicationWindow: "7:00 PM - 11:00 PM ET",
    shippingLane: "Shenzhen/Hong Kong to US air freight",
    paymentTerms: "50% deposit / balance before shipment",
    notes: "Reliable prototype-to-low-volume CNC partner with strong response history on Lattice RFQs.",
  },
  {
    id: "dongguan-axis-cnc",
    name: "Dongguan Axis CNC",
    country: "China",
    city: "Dongguan",
    region: "Greater Bay Area",
    relationshipOwner: "Maya",
    primaryContact: "Chen Rui",
    primaryCapability: "Fast-turn CNC production",
    capabilities: ["3-axis milling", "4-axis machining", "CNC turning", "Basic finishing"],
    materials: ["Aluminum", "Stainless steel", "Brass", "Delrin"],
    certifications: ["Material certs on request", "Outgoing QC photos"],
    qualitySystem: "Shop-floor inspection with Lattice review before shipment.",
    communicationWindow: "8:00 PM - 12:00 AM ET",
    shippingLane: "Dongguan to Hong Kong consolidation",
    paymentTerms: "Net on approved repeat work",
    notes: "Good fit when speed matters and tolerances are moderate.",
  },
  {
    id: "tainan-advanced-machining",
    name: "Tainan Advanced Machining",
    country: "Taiwan",
    city: "Tainan",
    region: "Southern Taiwan",
    relationshipOwner: "Adam",
    primaryContact: "Mei Lin",
    primaryCapability: "High-mix precision machining",
    capabilities: ["CNC milling", "CNC turning", "Small batch production", "Tight tolerance review"],
    materials: ["Aluminum", "Stainless steel", "Tool steel"],
    certifications: ["Inspection reports", "Mill cert review"],
    qualitySystem: "Formal quote review before award; inspection package scoped per RFQ.",
    communicationWindow: "7:00 PM - 10:00 PM ET",
    shippingLane: "Taiwan air freight to US",
    paymentTerms: "Deposit required until repeat program is established",
    notes: "Still building response history; keep in the invited pool for precision opportunities.",
  },
  {
    id: "zintilon",
    name: "Zintilon",
    country: "China",
    city: "China",
    region: "Overseas manufacturing network",
    relationshipOwner: "William",
    primaryContact: "Vendor operations",
    primaryCapability: "CNC, sheet metal, inspection, and finishing capacity",
    capabilities: [...new Set(vendorEquipment.map((equipment) => equipment.section))],
    materials: ["Aluminum", "Stainless steel", "Sheet metal alloys", "Production hardware"],
    certifications: ["Equipment lists on file", "Calibration plan on file"],
    qualitySystem: "Equipment-backed capability review with QC and calibration documentation tracked separately.",
    communicationWindow: "Evening ET overlap",
    shippingLane: "China export lanes by program",
    paymentTerms: "Program specific",
    notes: "Documented vendor capacity source for the equipment catalog and supplier-matching work.",
  },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function quoteCountsTowardReceived(quote: SupplierQuote) {
  return quote.status === "QUOTE_RECEIVED" || quote.status === "SELECTED";
}

function emptyMetrics() {
  return {
    activeOrderCount: 0,
    averageLeadTimeDays: null as number | null,
    averageQuoteCents: null as number | null,
    lastActivityAt: null as string | null,
    lastQuotedAt: null as string | null,
    openRfqCount: 0,
    quoteCount: 0,
    receivedQuoteCount: 0,
    recentRfqs: [] as OverseasVendor["recentRfqs"],
    selectedOrderCount: 0,
  };
}

function updateLatest(current: string | null, next: string | null) {
  if (!next) {
    return current;
  }

  if (!current || new Date(next).getTime() > new Date(current).getTime()) {
    return next;
  }

  return current;
}

function deriveStatus(metrics: ReturnType<typeof emptyMetrics>): OverseasVendorStatus {
  if (metrics.selectedOrderCount > 0 || metrics.activeOrderCount > 0) {
    return "Active";
  }

  if (metrics.receivedQuoteCount > 0) {
    return "Quoting";
  }

  if (metrics.quoteCount > 0) {
    return "Invited";
  }

  return "Needs review";
}

export function buildOverseasVendors(requests: LatticeRequest[]): OverseasVendor[] {
  const metricsByVendor = new Map<string, ReturnType<typeof emptyMetrics> & { leadTimeTotal: number; leadTimeSamples: number; priceTotal: number; priceSamples: number }>();

  function metricsFor(name: string) {
    const id = slugify(name);
    const current = metricsByVendor.get(id);

    if (current) {
      return current;
    }

    const next = {
      ...emptyMetrics(),
      leadTimeSamples: 0,
      leadTimeTotal: 0,
      priceSamples: 0,
      priceTotal: 0,
    };
    metricsByVendor.set(id, next);
    return next;
  }

  for (const request of requests) {
    for (const quote of request.supplierQuotes) {
      const metrics = metricsFor(quote.shopName);
      metrics.quoteCount += 1;

      if (quoteCountsTowardReceived(quote)) {
        metrics.receivedQuoteCount += 1;
      }

      if (quote.isSelected || quote.status === "SELECTED") {
        metrics.selectedOrderCount += 1;
      }

      if (quote.status === "INVITED") {
        metrics.openRfqCount += 1;
      }

      if (quote.leadTimeDays !== null) {
        metrics.leadTimeTotal += quote.leadTimeDays;
        metrics.leadTimeSamples += 1;
      }

      if (quote.priceCents !== null) {
        metrics.priceTotal += quote.priceCents;
        metrics.priceSamples += 1;
      }

      metrics.lastQuotedAt = updateLatest(metrics.lastQuotedAt, quote.quotedAt);
      metrics.lastActivityAt = updateLatest(metrics.lastActivityAt, quote.quotedAt ?? request.updatedAt);
      metrics.recentRfqs.push({
        customer: request.buyerCompany,
        href: `/operator/requests/${request.id}`,
        id: request.id,
        status: quote.status,
        title: request.title,
      });
    }

    if (request.status === "PURCHASED" && request.supplierOrder.shopName) {
      const metrics = metricsFor(request.supplierOrder.shopName);
      metrics.activeOrderCount += request.supplierOrder.status === "SHIPPED" ? 0 : 1;
      metrics.selectedOrderCount += 1;
      metrics.lastActivityAt = updateLatest(metrics.lastActivityAt, request.updatedAt);
      metrics.recentRfqs.push({
        customer: request.buyerCompany,
        href: `/supplier/orders/${request.id}`,
        id: request.id,
        status: "ORDER",
        title: request.title,
      });
    }
  }

  return overseasVendorDirectory
    .map<OverseasVendor>((vendor) => {
      const metrics = metricsByVendor.get(vendor.id) ?? {
        ...emptyMetrics(),
        leadTimeSamples: 0,
        leadTimeTotal: 0,
        priceSamples: 0,
        priceTotal: 0,
      };

      return {
        ...vendor,
        activeOrderCount: metrics.activeOrderCount,
        averageLeadTimeDays: metrics.leadTimeSamples > 0 ? Math.round(metrics.leadTimeTotal / metrics.leadTimeSamples) : null,
        averageQuoteCents: metrics.priceSamples > 0 ? Math.round(metrics.priceTotal / metrics.priceSamples) : null,
        lastActivityAt: metrics.lastActivityAt,
        lastQuotedAt: metrics.lastQuotedAt,
        openRfqCount: metrics.openRfqCount,
        quoteCount: metrics.quoteCount,
        receivedQuoteCount: metrics.receivedQuoteCount,
        recentRfqs: metrics.recentRfqs.slice(-4).reverse(),
        selectedOrderCount: metrics.selectedOrderCount,
        status: deriveStatus(metrics),
      };
    })
    .sort((left, right) => {
      const statusWeight: Record<OverseasVendorStatus, number> = {
        Active: 0,
        Quoting: 1,
        Invited: 2,
        "Needs review": 3,
      };

      return statusWeight[left.status] - statusWeight[right.status] || right.quoteCount - left.quoteCount || left.name.localeCompare(right.name);
    });
}
