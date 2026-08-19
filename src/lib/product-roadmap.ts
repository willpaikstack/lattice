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
    customerValue: "One governed company workspace instead of disconnected individual accounts.",
    horizon: "Next",
    id: "company-account-management-and-integrations",
    signals: ["Customer Admin teammate and role management", "Shared company billing, shipping, purchasing, and payment defaults", "Approved integrations with auditable company data access"],
    status: "Planned",
    summary: "Company-wide account management and integrations so a customer organization can manage its members, shared operating settings, and connected systems from a single governed workspace.",
    title: "Company Account Management and Integrations",
  },
  {
    category: "Services",
    customerValue: "Apply the right payment controls without sharing card credentials across a company.",
    horizon: "Later",
    id: "company-payment-method-permissions",
    signals: ["Card-specific use and management permissions", "Named-user and role-based card assignments", "Auditable payment-method access and changes"],
    status: "Planned",
    summary: "Build on company-owned saved cards with optional card-level permissions, named-user assignment, and an audit trail for payment-method changes.",
    title: "Company Payment Method Permissions",
  },
  {
    category: "Services",
    customerValue: "Let company administrators onboard and support their own teams with clear controls.",
    horizon: "Later",
    id: "customer-admin-team-management",
    signals: ["Customer Admin teammate invitations", "Role assignment and removal controls", "Invitation and membership audit history"],
    status: "Planned",
    summary: "Allow approved Customer Admins to invite and manage their company's users, with Lattice Admin oversight, clear role controls, and auditable membership changes.",
    title: "Customer Admin Team Management",
  },
  {
    category: "Quoting",
    customerValue: "Use purchase orders only after a company is approved for credit terms.",
    horizon: "Later",
    id: "approved-purchase-orders-and-credit",
    signals: ["Lattice-approved purchase-order access", "Company credit review and limits", "Accounts-payable notification and PO documentation"],
    status: "Planned",
    summary: "Introduce purchase-order checkout only for companies approved by Lattice, with defined credit limits, PO validation, and accounts-payable controls.",
    title: "Approved Purchase Orders and Credit",
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
