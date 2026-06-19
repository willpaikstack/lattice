export type RoadmapCategory = "Quoting" | "Manufacturing" | "Services" | "Reporting";

export type RoadmapStatus = "Discovery" | "Planned" | "Pilot";

export type ProductRoadmapItem = {
  category: RoadmapCategory;
  customerValue: string;
  horizon: string;
  id: string;
  signals: string[];
  status: RoadmapStatus;
  summary: string;
  title: string;
};

export const productRoadmapItems: ProductRoadmapItem[] = [
  {
    category: "Quoting",
    customerValue: "Fewer clarification loops before supplier pricing starts.",
    horizon: "Next",
    id: "instant-dfm-review",
    signals: ["Automatic drawing and CAD requirement checks", "Tolerance and material risk flags", "Operator notes before submission"],
    status: "Pilot",
    summary: "A faster manufacturability review that catches missing drawings, risky tolerances, and quote blockers while the RFQ is still being prepared.",
    title: "Instant DFM Review",
  },
  {
    category: "Manufacturing",
    customerValue: "More confidence that Lattice can absorb overflow work quickly.",
    horizon: "Next",
    id: "reserved-supplier-capacity",
    signals: ["Visible capacity windows", "Priority slots for repeat parts", "Earlier supplier allocation for urgent work"],
    status: "Planned",
    summary: "Pre-reserved production capacity across partner shops for customers who need predictable lead times on repeat or urgent machining work.",
    title: "Reserved Supplier Capacity",
  },
  {
    category: "Services",
    customerValue: "One place to source production-ready assemblies, not only machined parts.",
    horizon: "Soon",
    id: "assembly-and-kitting",
    signals: ["Multi-part kitting", "Basic assembly and hardware install", "Bagging, labeling, and shipment preparation"],
    status: "Discovery",
    summary: "Post-machining assembly, kitting, labeling, and packaging services for customers who want parts delivered closer to installation-ready.",
    title: "Assembly and Kitting",
  },
  {
    category: "Manufacturing",
    customerValue: "More process coverage without starting a separate supplier search.",
    horizon: "Soon",
    id: "sheet-metal-fabrication",
    signals: ["Laser-cut blanks", "Bending and forming", "Powder coat and anodize routing"],
    status: "Discovery",
    summary: "A sheet-metal lane for formed brackets, panels, enclosures, and production fixtures alongside the current CNC-focused workflow.",
    title: "Sheet Metal Fabrication",
  },
  {
    category: "Reporting",
    customerValue: "Better order visibility for purchasing and engineering teams.",
    horizon: "Later",
    id: "order-milestone-tracking",
    signals: ["Supplier acknowledgment timeline", "Inspection and document milestones", "Shipment and delivery confirmations"],
    status: "Planned",
    summary: "More granular order tracking from supplier acknowledgment through inspection, document release, shipment, and delivered confirmation.",
    title: "Order Milestone Tracking",
  },
  {
    category: "Quoting",
    customerValue: "Less repeated setup work for recurring parts and programs.",
    horizon: "Later",
    id: "blanket-rfq-programs",
    signals: ["Annual or quarterly volume breaks", "Release-based ordering", "Stored repeat-part quote packages"],
    status: "Discovery",
    summary: "Program-style RFQs for repeat production, blanket quantities, scheduled releases, and quote packages that can be reopened without starting from scratch.",
    title: "Blanket RFQ Programs",
  },
];

export function getProductRoadmapItem(id: string) {
  return productRoadmapItems.find((item) => item.id === id) ?? null;
}
