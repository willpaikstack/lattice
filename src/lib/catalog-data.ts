export type CatalogEntry = {
  slug: string;
  name: string;
  summary: string;
  details: string;
  commonGrades: string[];
  standards: string[];
  variants?: MaterialVariant[];
};

export type MaterialVariant = {
  name: string;
  uns: string;
  priceTier: string;
  machinability: "Easy" | "Medium" | "Hard";
  metrics: {
    leadTime: number;
    tolerance: number;
    supplierCount: number;
    quoteCount: number;
  };
  commonSpec: string;
  industry: string;
  imageTone: "dark-fixture" | "round-flange" | "bright-fitting";
};

export const stainlessSteelVariants: MaterialVariant[] = [
  {
    name: "SS 304",
    uns: "S30400",
    priceTier: "$$",
    machinability: "Medium",
    metrics: {
      leadTime: 34,
      tolerance: 70,
      supplierCount: 231,
      quoteCount: 70,
    },
    commonSpec: "ASTM B205",
    industry: "Oil & Gas",
    imageTone: "dark-fixture",
  },
  {
    name: "SS 316",
    uns: "S31600",
    priceTier: "$$",
    machinability: "Easy",
    metrics: {
      leadTime: 24,
      tolerance: 213,
      supplierCount: 23,
      quoteCount: 213,
    },
    commonSpec: "ASTM 316",
    industry: "Oil & Gas",
    imageTone: "round-flange",
  },
  {
    name: "SS 303",
    uns: "S30300",
    priceTier: "$$",
    machinability: "Medium",
    metrics: {
      leadTime: 32,
      tolerance: 12,
      supplierCount: 32,
      quoteCount: 12,
    },
    commonSpec: "ASTM B169",
    industry: "Oil & Gas",
    imageTone: "bright-fitting",
  },
];

export const materials: CatalogEntry[] = [
  {
    slug: "aluminum",
    name: "Aluminum",
    summary:
      "Aluminum alloys offer an exceptional strength-to-weight ratio, corrosion resistance, and excellent machinability for aerospace, automotive, energy, and industrial applications.",
    details:
      "Lattice provides access to common and high-performance aluminum grades through vetted mills and authorized distributors, with full mill certifications and traceability for specification-driven work.",
    commonGrades: ["6061", "7075", "2024", "5052"],
    standards: ["ASTM", "AMS", "Project-specific requirements"],
  },
  {
    slug: "stainless-steel",
    name: "Stainless steel",
    summary:
      "Stainless steels are corrosion-resistant, high-strength alloys widely used across oil & gas, energy, food processing, and industrial equipment applications. Lattice provides access to a broad range of austenitic, martensitic, and specialty stainless grades — including 303, 304, 316, and other specification-driven variants — sourced directly from vetted mills and authorized distributors.",
    details:
      "All materials are supplied with full mill certifications and traceability to meet ASTM, ASME, and project-specific compliance requirements, ensuring reliability in demanding fabrication environments.",
    commonGrades: ["303", "304", "316", "17-4 PH"],
    standards: ["ASTM", "ASME", "Mill certification"],
    variants: stainlessSteelVariants,
  },
  {
    slug: "mild-steel",
    name: "Mild steel",
    summary:
      "Mild steels provide reliable strength, weldability, and cost-efficiency for structural, industrial, and general fabrication applications. Commonly used in frames, supports, and heavy equipment components, these grades balance mechanical performance with economic scalability.",
    details:
      "Lattice sources certified carbon steel grades with full traceability and compliance documentation to meet ASTM and structural specification requirements.",
    commonGrades: ["A36", "1018", "1020"],
    standards: ["ASTM", "Structural specification", "Material traceability"],
  },
  {
    slug: "brass",
    name: "Brass",
    summary:
      "Brass alloys offer excellent machinability, corrosion resistance, and electrical conductivity for fittings, valves, instrumentation, and precision components.",
    details:
      "Lattice sources brass through qualified distributors with traceable mill certifications to support consistent production performance in fluid handling and electrical applications.",
    commonGrades: ["C360", "C260", "C464"],
    standards: ["ASTM", "Mill certification", "Distributor traceability"],
  },
  {
    slug: "copper",
    name: "Copper",
    summary:
      "Copper provides superior electrical and thermal conductivity, along with strong corrosion resistance for demanding industrial environments.",
    details:
      "Common applications include electrical systems, heat exchangers, bus bars, and high-conductivity components supplied through authorized mills and distributors.",
    commonGrades: ["C110", "C101", "C122"],
    standards: ["ASTM", "Material integrity", "Traceability documentation"],
  },
  {
    slug: "alloy-steel",
    name: "Alloy steel",
    summary:
      "Alloy steels are engineered for enhanced strength, toughness, and fatigue resistance compared with standard carbon steels.",
    details:
      "They are frequently selected for shafts, gears, fasteners, and high-load components where mechanical performance and application-specific standards are critical.",
    commonGrades: ["4140", "4340", "8620"],
    standards: ["ASTM", "Application-specific standards", "Full certification"],
  },
  {
    slug: "tool-steel",
    name: "Tool steel",
    summary:
      "Tool steels are designed for high hardness, wear resistance, and dimensional stability under demanding operating conditions.",
    details:
      "These materials support dies, molds, cutting tools, and forming equipment where precision manufacturing and long service life are required.",
    commonGrades: ["A2", "D2", "O1", "H13"],
    standards: ["ASTM", "Traceable documentation", "Production/prototyping availability"],
  },
  {
    slug: "titanium",
    name: "Titanium",
    summary:
      "Titanium alloys combine high strength, low density, and exceptional corrosion resistance for aerospace, energy, marine, and high-performance industrial applications.",
    details:
      "Certified titanium grades are sourced from trusted mills and distributors with compliance documentation for critical strength-to-weight and corrosion service requirements.",
    commonGrades: ["Grade 2", "Grade 5 / Ti-6Al-4V"],
    standards: ["ASTM", "AMS", "Full traceability"],
  },
  {
    slug: "inconel-incoloy",
    name: "Inconel/Incoloy",
    summary:
      "Nickel-based superalloys such as Inconel and Incoloy are engineered for extreme temperature, pressure, and corrosion environments.",
    details:
      "These alloys are used in oil and gas, energy, aerospace, and chemical processing applications where certified mill documentation and service reliability are essential.",
    commonGrades: ["Inconel 625", "Inconel 718", "Incoloy 800"],
    standards: ["ASTM", "ASME", "Certified mill documentation"],
  },
];

export const capabilities: CatalogEntry[] = [
  {
    slug: "cnc-milling",
    name: "CNC milling",
    summary:
      "Precision CNC milling supported by modern 3-axis, 4-axis, and 5-axis equipment for prototype through production work.",
    details:
      "Use this capability for prismatic machined components, brackets, plates, housings, and complex industrial parts requiring tolerance control and repeatable setup discipline.",
    commonGrades: ["3-axis", "4-axis", "5-axis"],
    standards: ["Inspection plan", "Tolerance review", "Material traceability"],
  },
  {
    slug: "cnc-turning-mill-turn",
    name: "CNC turning / mill-turn",
    summary:
      "Turning and mill-turn capacity for round, shaft-like, threaded, or rotational components that need precise concentricity and finish control.",
    details:
      "Lattice can route cylindrical components to partners with the right lathe, live tooling, and inspection depth instead of relying on generic shop capacity.",
    commonGrades: ["Turning", "Live tooling", "Mill-turn"],
    standards: ["Dimensional inspection", "Surface finish review", "Material certification"],
  },
  {
    slug: "precision-inspection",
    name: "Precision inspection",
    summary:
      "Documented inspection workflows for tolerance-critical manufacturing, including first article and dimensional verification needs.",
    details:
      "Inspection requirements are reviewed during RFQ intake so suppliers quote the real quality workload, not just the cutting or fabrication time.",
    commonGrades: ["FAI", "CMM", "Dimensional report"],
    standards: ["AS9102 where required", "Customer inspection plan", "Certificate package"],
  },
  {
    slug: "material-traceability",
    name: "Material traceability",
    summary:
      "Material certification, mill documentation, and specification-driven sourcing for industrial work where compliance matters.",
    details:
      "Every relevant workflow should preserve traceability from supplier quote through order fulfillment, especially for ASTM, ASME, AMS, and customer-controlled specifications.",
    commonGrades: ["Mill certs", "Heat trace", "Authorized distributors"],
    standards: ["ASTM", "ASME", "AMS"],
  },
  {
    slug: "production-scaling",
    name: "Production scaling",
    summary:
      "Supplier selection based on equipment depth, quality systems, and production scalability rather than capacity availability alone.",
    details:
      "Lattice is intended to help buyers move from one-off RFQs into repeatable supplier programs with clear status, documentation, and execution ownership.",
    commonGrades: ["Prototype", "Bridge production", "Repeat orders"],
    standards: ["Supplier qualification", "Capacity planning", "Quality system review"],
  },
  {
    slug: "supplier-network-coordination",
    name: "Supplier network coordination",
    summary:
      "Coordinated RFQ routing across vetted domestic manufacturing partners so buyers can access the right capability without managing every supplier interaction themselves.",
    details:
      "The local app should eventually turn this into operator workflows for supplier outreach, quote comparison, award decisions, and order follow-through.",
    commonGrades: ["Supplier outreach", "Quote comparison", "Order follow-through"],
    standards: ["Operator review", "Buyer approval", "Status traceability"],
  },
];
