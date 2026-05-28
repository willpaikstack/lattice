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
  image: MaterialImageSource;
  imageTone: "dark-fixture" | "round-flange" | "bright-fitting";
};

export type MaterialImageSource = {
  src: string;
  alt: string;
  credit: string;
  license: string;
  sourceUrl: string;
};

const commonsFile = (fileName: string) => `https://commons.wikimedia.org/wiki/Special:Redirect/file/${fileName}`;

const materialImages = {
  aluminumMachinedParts: {
    src: commonsFile("Aluminum_and_steel_parts_made_with_CNC_milling_machine_in_NideloK.png"),
    alt: "Aluminum and steel CNC machined parts arranged on a table",
    credit: "NideloK",
    license: "CC0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Aluminum_and_steel_parts_made_with_CNC_milling_machine_in_NideloK.png",
  },
  stainlessBars: {
    src: commonsFile("Stainless_Steel_Reinforcing_Bars_VT_(8495189007).jpg"),
    alt: "Bundles of stainless steel reinforcing bars",
    credit: "Federal Highway Administration",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Stainless_Steel_Reinforcing_Bars_VT_(8495189007).jpg",
  },
  machinedGear: {
    src: commonsFile("Zahnrad_mit_Innenverzahnung.JPG"),
    alt: "Machined steel gear with internal teeth",
    credit: "Dirk Grafe",
    license: "CC BY-SA 2.5",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Zahnrad_mit_Innenverzahnung.JPG",
  },
  brassFittings: {
    src: commonsFile("Brassfittingbbi.jpg"),
    alt: "Brass fittings arranged in rows",
    credit: "Bhavyabrass",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Brassfittingbbi.jpg",
  },
  copperBusbars: {
    src: commonsFile("2500A_copper_busbars_in_motor_control_panel.jpg"),
    alt: "Copper busbars mounted inside a motor control panel",
    credit: "ToT89",
    license: "CC BY-SA 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:2500A_copper_busbars_in_motor_control_panel.jpg",
  },
  titaniumMetal: {
    src: commonsFile("Titanium_metal.jpg"),
    alt: "Titanium metal sample beside a penny",
    credit: "US Government",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Titanium_metal.jpg",
  },
  nickelAlloySpecimens: {
    src: commonsFile("ISOSTATICALLY_PRESSED_NICKEL_ALLOY_TEST_SPECIMENS_-_NARA_-_17441738.jpg"),
    alt: "Isostatically pressed nickel alloy test specimens",
    credit: "NASA Glenn Research Center",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:ISOSTATICALLY_PRESSED_NICKEL_ALLOY_TEST_SPECIMENS_-_NARA_-_17441738.jpg",
  },
} satisfies Record<string, MaterialImageSource>;

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
    image: materialImages.stainlessBars,
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
    image: materialImages.stainlessBars,
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
    image: materialImages.stainlessBars,
    imageTone: "bright-fitting",
  },
];

export const aluminumVariants: MaterialVariant[] = [
  {
    name: "Aluminum 6061-T6",
    uns: "A96061",
    priceTier: "$",
    machinability: "Easy",
    metrics: { leadTime: 18, tolerance: 145, supplierCount: 180, quoteCount: 145 },
    commonSpec: "ASTM B221 / ASTM B209 / AMS 4027",
    industry: "General CNC",
    image: materialImages.aluminumMachinedParts,
    imageTone: "bright-fitting",
  },
  {
    name: "Aluminum 7075-T6",
    uns: "A97075",
    priceTier: "$$",
    machinability: "Easy",
    metrics: { leadTime: 26, tolerance: 92, supplierCount: 86, quoteCount: 92 },
    commonSpec: "ASTM B211 / AMS 4045 / AMS 4122",
    industry: "Aerospace",
    image: materialImages.aluminumMachinedParts,
    imageTone: "dark-fixture",
  },
  {
    name: "Aluminum 2024-T3",
    uns: "A92024",
    priceTier: "$$",
    machinability: "Medium",
    metrics: { leadTime: 29, tolerance: 64, supplierCount: 72, quoteCount: 64 },
    commonSpec: "ASTM B209 / AMS 4037",
    industry: "Aircraft",
    image: materialImages.aluminumMachinedParts,
    imageTone: "round-flange",
  },
  {
    name: "Aluminum 5052-H32",
    uns: "A95052",
    priceTier: "$",
    machinability: "Medium",
    metrics: { leadTime: 20, tolerance: 58, supplierCount: 132, quoteCount: 58 },
    commonSpec: "ASTM B209 / AMS 4016",
    industry: "Sheet Metal",
    image: materialImages.aluminumMachinedParts,
    imageTone: "bright-fitting",
  },
];

export const mildSteelVariants: MaterialVariant[] = [
  {
    name: "ASTM A36",
    uns: "K02600",
    priceTier: "$",
    machinability: "Medium",
    metrics: { leadTime: 16, tolerance: 80, supplierCount: 210, quoteCount: 80 },
    commonSpec: "ASTM A36",
    industry: "Structures",
    image: materialImages.machinedGear,
    imageTone: "dark-fixture",
  },
  {
    name: "AISI 1018",
    uns: "G10180",
    priceTier: "$",
    machinability: "Easy",
    metrics: { leadTime: 18, tolerance: 118, supplierCount: 168, quoteCount: 118 },
    commonSpec: "ASTM A108 / ASTM A29",
    industry: "Machined Parts",
    image: materialImages.machinedGear,
    imageTone: "round-flange",
  },
  {
    name: "AISI 1020",
    uns: "G10200",
    priceTier: "$",
    machinability: "Easy",
    metrics: { leadTime: 19, tolerance: 72, supplierCount: 132, quoteCount: 72 },
    commonSpec: "ASTM A108 / ASTM A29",
    industry: "General Fabrication",
    image: materialImages.machinedGear,
    imageTone: "bright-fitting",
  },
];

export const brassVariants: MaterialVariant[] = [
  {
    name: "Brass C360",
    uns: "C36000",
    priceTier: "$$",
    machinability: "Easy",
    metrics: { leadTime: 20, tolerance: 106, supplierCount: 96, quoteCount: 106 },
    commonSpec: "ASTM B16",
    industry: "Fittings",
    image: materialImages.brassFittings,
    imageTone: "bright-fitting",
  },
  {
    name: "Brass C260",
    uns: "C26000",
    priceTier: "$$",
    machinability: "Medium",
    metrics: { leadTime: 24, tolerance: 54, supplierCount: 74, quoteCount: 54 },
    commonSpec: "ASTM B36 / ASTM B135",
    industry: "Formed Parts",
    image: materialImages.brassFittings,
    imageTone: "round-flange",
  },
  {
    name: "Naval Brass C464",
    uns: "C46400",
    priceTier: "$$$",
    machinability: "Medium",
    metrics: { leadTime: 31, tolerance: 38, supplierCount: 44, quoteCount: 38 },
    commonSpec: "ASTM B21 / ASTM B171",
    industry: "Marine",
    image: materialImages.brassFittings,
    imageTone: "dark-fixture",
  },
];

export const copperVariants: MaterialVariant[] = [
  {
    name: "Copper C110",
    uns: "C11000",
    priceTier: "$$",
    machinability: "Medium",
    metrics: { leadTime: 21, tolerance: 86, supplierCount: 120, quoteCount: 86 },
    commonSpec: "ASTM B152 / ASTM B187",
    industry: "Electrical",
    image: materialImages.copperBusbars,
    imageTone: "bright-fitting",
  },
  {
    name: "Copper C101",
    uns: "C10100",
    priceTier: "$$$",
    machinability: "Hard",
    metrics: { leadTime: 32, tolerance: 42, supplierCount: 48, quoteCount: 42 },
    commonSpec: "ASTM B170 / ASTM B187",
    industry: "Electronics",
    image: materialImages.copperBusbars,
    imageTone: "round-flange",
  },
  {
    name: "Copper C122",
    uns: "C12200",
    priceTier: "$$",
    machinability: "Hard",
    metrics: { leadTime: 25, tolerance: 46, supplierCount: 72, quoteCount: 46 },
    commonSpec: "ASTM B75 / ASTM B88 / ASTM B152",
    industry: "Heat Transfer",
    image: materialImages.copperBusbars,
    imageTone: "dark-fixture",
  },
];

export const alloySteelVariants: MaterialVariant[] = [
  {
    name: "Alloy Steel 4140",
    uns: "G41400",
    priceTier: "$$",
    machinability: "Medium",
    metrics: { leadTime: 23, tolerance: 88, supplierCount: 112, quoteCount: 88 },
    commonSpec: "ASTM A29 / ASTM A108 / AMS 6349",
    industry: "Shafts",
    image: materialImages.machinedGear,
    imageTone: "dark-fixture",
  },
  {
    name: "Alloy Steel 4340",
    uns: "G43400",
    priceTier: "$$$",
    machinability: "Medium",
    metrics: { leadTime: 30, tolerance: 52, supplierCount: 58, quoteCount: 52 },
    commonSpec: "ASTM A29 / AMS 6414 / AMS 6415",
    industry: "High Load",
    image: materialImages.machinedGear,
    imageTone: "round-flange",
  },
  {
    name: "Alloy Steel 8620",
    uns: "G86200",
    priceTier: "$$",
    machinability: "Easy",
    metrics: { leadTime: 26, tolerance: 49, supplierCount: 64, quoteCount: 49 },
    commonSpec: "ASTM A29 / ASTM A108",
    industry: "Gears",
    image: materialImages.machinedGear,
    imageTone: "bright-fitting",
  },
];

export const toolSteelVariants: MaterialVariant[] = [
  {
    name: "A2 Tool Steel",
    uns: "T30102",
    priceTier: "$$$",
    machinability: "Medium",
    metrics: { leadTime: 31, tolerance: 48, supplierCount: 54, quoteCount: 48 },
    commonSpec: "ASTM A681",
    industry: "Dies",
    image: materialImages.machinedGear,
    imageTone: "dark-fixture",
  },
  {
    name: "D2 Tool Steel",
    uns: "T30402",
    priceTier: "$$$",
    machinability: "Hard",
    metrics: { leadTime: 34, tolerance: 44, supplierCount: 48, quoteCount: 44 },
    commonSpec: "ASTM A681",
    industry: "Wear Parts",
    image: materialImages.machinedGear,
    imageTone: "round-flange",
  },
  {
    name: "O1 Tool Steel",
    uns: "T31501",
    priceTier: "$$",
    machinability: "Medium",
    metrics: { leadTime: 28, tolerance: 36, supplierCount: 42, quoteCount: 36 },
    commonSpec: "ASTM A681",
    industry: "Fixtures",
    image: materialImages.machinedGear,
    imageTone: "bright-fitting",
  },
  {
    name: "H13 Tool Steel",
    uns: "T20813",
    priceTier: "$$$",
    machinability: "Medium",
    metrics: { leadTime: 36, tolerance: 34, supplierCount: 38, quoteCount: 34 },
    commonSpec: "ASTM A681 / AMS 6408",
    industry: "Hot Work",
    image: materialImages.machinedGear,
    imageTone: "dark-fixture",
  },
];

export const titaniumVariants: MaterialVariant[] = [
  {
    name: "Titanium Grade 2",
    uns: "R50400",
    priceTier: "$$$",
    machinability: "Hard",
    metrics: { leadTime: 34, tolerance: 42, supplierCount: 46, quoteCount: 42 },
    commonSpec: "ASTM B348 / ASTM B265",
    industry: "Corrosion Service",
    image: materialImages.titaniumMetal,
    imageTone: "bright-fitting",
  },
  {
    name: "Titanium Grade 5",
    uns: "R56400",
    priceTier: "$$$$",
    machinability: "Hard",
    metrics: { leadTime: 41, tolerance: 57, supplierCount: 52, quoteCount: 57 },
    commonSpec: "ASTM B348 / ASTM B265 / AMS 4928",
    industry: "Aerospace",
    image: materialImages.titaniumMetal,
    imageTone: "round-flange",
  },
];

export const nickelAlloyVariants: MaterialVariant[] = [
  {
    name: "Inconel 625",
    uns: "N06625",
    priceTier: "$$$$",
    machinability: "Hard",
    metrics: { leadTime: 45, tolerance: 33, supplierCount: 34, quoteCount: 33 },
    commonSpec: "ASTM B443 / ASTM B444 / ASTM B446",
    industry: "Marine Energy",
    image: materialImages.nickelAlloySpecimens,
    imageTone: "dark-fixture",
  },
  {
    name: "Inconel 718",
    uns: "N07718",
    priceTier: "$$$$",
    machinability: "Hard",
    metrics: { leadTime: 48, tolerance: 39, supplierCount: 36, quoteCount: 39 },
    commonSpec: "AMS 5662 / AMS 5663 / ASTM B637",
    industry: "Turbomachinery",
    image: materialImages.nickelAlloySpecimens,
    imageTone: "round-flange",
  },
  {
    name: "Incoloy 800",
    uns: "N08800",
    priceTier: "$$$$",
    machinability: "Hard",
    metrics: { leadTime: 44, tolerance: 24, supplierCount: 28, quoteCount: 24 },
    commonSpec: "ASTM B409 / ASTM B408 / ASTM B407",
    industry: "High Temp",
    image: materialImages.nickelAlloySpecimens,
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
    variants: aluminumVariants,
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
    variants: mildSteelVariants,
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
    variants: brassVariants,
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
    variants: copperVariants,
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
    variants: alloySteelVariants,
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
    variants: toolSteelVariants,
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
    variants: titaniumVariants,
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
    variants: nickelAlloyVariants,
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
