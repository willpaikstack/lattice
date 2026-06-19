import { vendorEquipment } from "./vendor-equipment";
import type { LatticeRequest, SupplierQuote, SupplierQuoteStatus } from "./request-model";

export type OverseasVendorStatus = "Active" | "Quoting" | "Invited" | "Needs review";
export type OverseasVendorOnboardingStatus = "Onboarded" | "Pilot active" | "Docs pending" | "Needs intake";

export type OverseasVendor = {
  id: string;
  name: string;
  country: string;
  city: string;
  region: string;
  status: OverseasVendorStatus;
  onboardingStatus: OverseasVendorOnboardingStatus;
  vendorCode: string;
  website: string;
  relationshipOwner: string;
  primaryContact: string;
  primaryEmail: string;
  phoneNumber: string;
  wechatId: string;
  primaryCapability: string;
  capabilities: string[];
  materials: string[];
  certifications: string[];
  qualitySystem: string;
  communicationWindow: string;
  shippingLane: string;
  paymentTerms: string;
  vendorDocs: string[];
  vendorType: string[];
  nonFabOfferings: string[];
  fabCapabilities: string[];
  qmsStandard: string;
  defectRate: string;
  onTimeDeliveryRate: string;
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
    onboardingStatus: "Onboarded",
    vendorCode: "VND-924",
    website: "https://example.com/shenzhen-precision",
    relationshipOwner: "Adam",
    primaryContact: "Li Wei",
    primaryEmail: "li.wei@szprecision.cn",
    phoneNumber: "+86-755-8821-1208",
    wechatId: "sz_precision_li",
    primaryCapability: "Precision CNC machining",
    capabilities: ["5-axis CNC milling", "CNC turning", "Dimensional inspection", "Aluminum fixtures"],
    materials: ["6061-T6 aluminum", "7075 aluminum", "Stainless steel", "Engineering plastics"],
    certifications: ["ISO 9001 aligned", "Material certs available", "Inspection reports"],
    qualitySystem: "First article and dimensional inspection reports for selected orders.",
    communicationWindow: "7:00 PM - 11:00 PM ET",
    shippingLane: "Shenzhen/Hong Kong to US air freight",
    paymentTerms: "50% deposit / balance before shipment",
    vendorDocs: ["Equipment_List.pdf", "ISO9001_Certificate.pdf", "QC_Process.pdf"],
    vendorType: ["Machine Shop", "Prototype Supplier"],
    nonFabOfferings: ["Material Sourcing", "Assembly"],
    fabCapabilities: ["5-axis CNC Milling", "CNC Turning", "Wire EDM"],
    qmsStandard: "ISO 9001 aligned; last audit pending Lattice review",
    defectRate: "0.7% DPMO",
    onTimeDeliveryRate: "96.1% (last 8 POs)",
    notes: "Reliable prototype-to-low-volume CNC partner with strong response history on Lattice RFQs.",
  },
  {
    id: "dongguan-axis-cnc",
    name: "Dongguan Axis CNC Co., Ltd.",
    country: "China",
    city: "Dongguan",
    region: "Guangdong",
    onboardingStatus: "Onboarded",
    vendorCode: "VND-924",
    website: "",
    relationshipOwner: "Maya",
    primaryContact: "Liang Wei",
    primaryEmail: "liang.wei@axiscnc.cn",
    phoneNumber: "+86-769-8821-3340",
    wechatId: "axis_cnc_liang",
    primaryCapability: "Fast-turn CNC production",
    capabilities: ["3-axis milling", "4-axis machining", "CNC turning", "Basic finishing"],
    materials: ["Al 6061-T6", "SS 316L", "Titanium", "Delrin (POM)", "PEEK"],
    certifications: ["ISO 9001:2015", "RoHS Compliant", "REACH Compliant"],
    qualitySystem: "Shop-floor inspection with Lattice review before shipment.",
    communicationWindow: "08:00-18:00 CST (UTC+8)",
    shippingLane: "Dongguan to Hong Kong consolidation",
    paymentTerms: "Net 45 - Wire (USD)",
    vendorDocs: ["Axis_Equipment_List.pdf", "ISO9001_Certificate.pdf", "QMS_Manual_v2.pdf"],
    vendorType: ["Machine Shop", "Custom Parts"],
    nonFabOfferings: ["Material Sourcing", "Assembly"],
    fabCapabilities: ["CNC Milling (3 & 5 axis)", "CNC Turning", "Sheet Metal Fabrication", "Wire EDM"],
    qmsStandard: "ISO 9001:2015 (last audit Dec 2025)",
    defectRate: "0.8% DPMO",
    onTimeDeliveryRate: "94.2% (last 5 POs)",
    notes: "Good fit when speed matters and tolerances are moderate.",
  },
  {
    id: "tainan-advanced-machining",
    name: "Tainan Advanced Machining",
    country: "Taiwan",
    city: "Tainan",
    region: "Southern Taiwan",
    onboardingStatus: "Docs pending",
    vendorCode: "VND-913",
    website: "https://example.com/tainan-advanced",
    relationshipOwner: "Adam",
    primaryContact: "Mei Lin",
    primaryEmail: "mei.lin@tainanadvanced.tw",
    phoneNumber: "+886-6-8821-4402",
    wechatId: "tainan_advanced_mei",
    primaryCapability: "High-mix precision machining",
    capabilities: ["CNC milling", "CNC turning", "Small batch production", "Tight tolerance review"],
    materials: ["Aluminum", "Stainless steel", "Tool steel"],
    certifications: ["Inspection reports", "Mill cert review"],
    qualitySystem: "Formal quote review before award; inspection package scoped per RFQ.",
    communicationWindow: "7:00 PM - 10:00 PM ET",
    shippingLane: "Taiwan air freight to US",
    paymentTerms: "Deposit required until repeat program is established",
    vendorDocs: ["Capability_Profile.pdf", "Inspection_Template.xlsx"],
    vendorType: ["Machine Shop", "Precision Supplier"],
    nonFabOfferings: ["Tolerance Review", "Material Sourcing"],
    fabCapabilities: ["CNC Milling", "CNC Turning", "Tight Tolerance Review"],
    qmsStandard: "Inspection package scoped per RFQ",
    defectRate: "Pending",
    onTimeDeliveryRate: "Pending",
    notes: "Still building response history; keep in the invited pool for precision opportunities.",
  },
  {
    id: "jucheng-precision-jc-proto",
    name: "Jucheng Precision (JC Proto)",
    country: "China",
    city: "Shenzhen",
    region: "Shenzhen / Dongguan, Guangdong",
    onboardingStatus: "Needs intake",
    vendorCode: "VND-902",
    website: "https://www.jcproto.com/",
    relationshipOwner: "William",
    primaryContact: "Project team",
    primaryEmail: "project@juchengjm.com",
    phoneNumber: "+86-186-8005-3076",
    wechatId: "[pending]",
    primaryCapability: "Rapid prototyping to low-volume production",
    capabilities: ["5-axis CNC machining", "CNC turning", "Sheet metal fabrication", "3D printing", "Vacuum casting", "Injection molding", "Die casting", "Rapid tooling"],
    materials: ["Aluminum alloys", "Stainless steel", "Mild steel", "Alloy steel", "Tool steel", "Engineering plastics"],
    certifications: ["ISO 9001:2015", "ISO 14001", "ISO 13485", "IATF 16949"],
    qualitySystem: "Public site lists ISO 9001, ISO 14001, ISO 13485, and IATF 16949 certifications; Lattice audit and certificate files still pending.",
    communicationWindow: "China business hours; RFQ response path pending Lattice intake",
    shippingLane: "Shenzhen/Dongguan to Hong Kong or China export lanes",
    paymentTerms: "Program specific",
    vendorDocs: ["Public website capability review"],
    vendorType: ["Prototype Supplier", "Machine Shop", "Low-volume Manufacturing"],
    nonFabOfferings: ["DFM Review", "Material Sourcing", "Surface Finishing"],
    fabCapabilities: ["5-axis CNC Milling", "CNC Turning", "Sheet Metal Fabrication", "3D Printing", "Vacuum Casting", "Injection Molding", "Die Casting", "Rapid Tooling"],
    qmsStandard: "Publicly listed ISO 9001:2015 / ISO 14001 / ISO 13485 / IATF 16949; certificates to be collected.",
    defectRate: "Pending",
    onTimeDeliveryRate: "Pending",
    notes: "Added from JC Proto public site. Strong candidate for broad prototype-to-production coverage; confirm contacts, current certificates, export lane, and quote responsiveness before active routing.",
  },
  {
    id: "best-prototypes",
    name: "Best Prototypes",
    country: "China",
    city: "Dongguan",
    region: "Chang'an, Dongguan, Guangdong",
    onboardingStatus: "Docs pending",
    vendorCode: "VND-903",
    website: "https://www.best-prototype.com/",
    relationshipOwner: "William",
    primaryContact: "Sales team",
    primaryEmail: "enquiry@best-prototypes.com",
    phoneNumber: "+86-166-2035-8023",
    wechatId: "[pending]",
    primaryCapability: "CNC, additive, sheet metal, casting, and low-volume manufacturing",
    capabilities: ["5-axis CNC machining", "CNC turning", "Wire EDM", "CMM inspection", "Sheet metal fabrication", "3D printing", "Vacuum casting", "Injection molding", "Die casting"],
    materials: ["Aluminum", "Stainless steel", "Carbon steel", "Copper", "Brass", "Engineering plastics", "3D printing materials"],
    certifications: ["ISO 9001 based quality program", "Equipment list on file", "Inspection equipment on file"],
    qualitySystem: "Public site describes 100% finished-assembly inspection and an ISO 9001-based quality program; equipment source is archived in vendor sources.",
    communicationWindow: "China business hours; 24/7 email intake listed publicly",
    shippingLane: "Dongguan to China/Hong Kong export lanes",
    paymentTerms: "Program specific",
    vendorDocs: ["best_prototypes_equipment_list.pdf"],
    vendorType: ["Prototype Supplier", "Machine Shop", "Manufacturing Partner"],
    nonFabOfferings: ["DFM Review", "Material Sourcing", "Post-processing Finishes"],
    fabCapabilities: ["5-axis CNC Milling", "CNC Turning", "Wire EDM", "CMM Inspection", "Sheet Metal Fabrication", "3D Printing", "Vacuum Casting", "Injection Molding", "Die Casting"],
    qmsStandard: "ISO 9001 based quality program per public quality page; Lattice source file covers equipment and inspection capacity.",
    defectRate: "Pending",
    onTimeDeliveryRate: "Pending",
    notes: "Existing equipment source is already in the Lattice vendor source archive. Add quote history and certificate files before promoting to active routing.",
  },
  {
    id: "zintilon",
    name: "Zintilon",
    country: "China",
    city: "China",
    region: "Overseas manufacturing network",
    onboardingStatus: "Needs intake",
    vendorCode: "VND-901",
    website: "https://zintilon.com",
    relationshipOwner: "William",
    primaryContact: "Vendor operations",
    primaryEmail: "ops@zintilon.com",
    phoneNumber: "+86-[pending]",
    wechatId: "[pending]",
    primaryCapability: "CNC, sheet metal, inspection, and finishing capacity",
    capabilities: [...new Set(vendorEquipment.map((equipment) => equipment.section))],
    materials: ["Aluminum", "Stainless steel", "Sheet metal alloys", "Production hardware"],
    certifications: ["Equipment lists on file", "Calibration plan on file"],
    qualitySystem: "Equipment-backed capability review with QC and calibration documentation tracked separately.",
    communicationWindow: "Evening ET overlap",
    shippingLane: "China export lanes by program",
    paymentTerms: "Program specific",
    vendorDocs: ["Zintilon_General_Materials_List.xlsx", "QC_Equipment_List.pdf", "Catalogue.pdf"],
    vendorType: ["Supplier Network", "Manufacturing Partner"],
    nonFabOfferings: ["Material Sourcing", "Inspection Coordination", "Export Support"],
    fabCapabilities: ["CNC Milling", "CNC Lathe", "QC & Inspection"],
    qmsStandard: "Equipment-backed capability review; calibration documentation tracked separately.",
    defectRate: "Pending",
    onTimeDeliveryRate: "Pending",
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
        href: `/admin/quotes?requestId=${encodeURIComponent(request.id)}`,
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
        href: `/admin/orders/${request.id}`,
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

export function findOverseasVendor(vendors: OverseasVendor[], vendorId: string) {
  return vendors.find((vendor) => vendor.id === vendorId) ?? null;
}
