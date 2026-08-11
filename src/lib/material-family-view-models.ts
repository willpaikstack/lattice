import { customerMaterialCatalog, type CustomerMaterialCatalogEntry } from "./customer-material-catalog";
import { materialMechanicalProperties, type MaterialMechanicalProperties } from "./material-grade-properties";

export type MaterialFamilyCardData = {
  catalogNoun: "grades" | "offerings";
  examples: string[];
  gradeCount: number;
  grades: string[];
  name: string;
  slug: string;
  summary: string;
  texture: string;
};

export type MaterialGradeProfile = {
  applications: string;
  commonStartingPoint?: boolean;
  functionalTraits?: {
    chemicalResistance: string;
    heatTolerance: string;
    moistureResponse: string;
    wearFriction: string;
  };
  forms: string;
  image: string;
  imageAlt: string;
  machinability: string;
  mechanicalProperties?: MaterialMechanicalProperties;
  name: string;
  selectionNote: string;
  uns: string;
};

export type MaterialFamilyDetail = MaterialFamilyCardData & {
  catalogEntry: CustomerMaterialCatalogEntry;
  featuredGrades: MaterialGradeProfile[];
  heroAlt: string;
  heroImage: string;
};

const familyExamples: Record<string, string[]> = {
  aluminum: ["6061", "5052", "7075", "2024", "6063"],
  "stainless-steel": ["304", "316", "321", "410", "17-4 PH"],
  "mild-steel": ["A36", "1018", "1020", "1045", "Q235"],
  brass: ["C360", "C260", "C280", "C385", "C464"],
  copper: ["C110", "C101", "C102", "C122", "C172"],
  "alloy-steel": ["4140", "4340", "8620", "4130", "6150"],
  "tool-steel": ["D2", "A2", "O1", "H13", "S7"],
  titanium: ["Ti-6Al-4V", "Ti-3Al-2.5V", "Grade 2", "Grade 5"],
  "inconel-incoloy": ["Inconel 625", "Inconel 718", "Incoloy 800H", "Inconel X-750"],
  "precision-alloys": ["Kovar", "Invar 36", "1J50", "1J79", "1J85"],
  "magnesium-zinc": ["AZ91D", "AM60B", "AZ31B", "Zamak 3", "Zamak 5"],
  "plastics-polymers": ["POM", "PEEK", "PTFE", "UHMW-PE", "Nylon 6/6"],
};

export const familyTextures: Record<string, string> = {
  aluminum: "/materials/aluminum-brushed-v3.png",
  "stainless-steel": "/materials/stainless-brushed-v3.png",
  "mild-steel": "/materials/mild-steel-v3.png",
  brass: "/materials/brass-brushed-v3.png",
  copper: "/materials/copper-brushed-v3.png",
  "alloy-steel": "/materials/alloy-steel-v3.png",
  "tool-steel": "/materials/tool-steel-v3.png",
  titanium: "/materials/titanium-satin-v3.png",
  "inconel-incoloy": "/materials/nickel-alloy-v4.png",
  "precision-alloys": "/materials/titanium-satin-v3.png",
  "magnesium-zinc": "/materials/aluminum-brushed-v3.png",
  "plastics-polymers": "/materials/polymer-white-v3.png",
};

const familyForms: Record<string, string> = {
  aluminum: "Plate, extrusions, bar, tube",
  "stainless-steel": "Plate, sheet, bar, tube",
  "mild-steel": "Plate, sheet, bar, tube",
  brass: "Bar, tube, plate, fittings",
  copper: "Bar, plate, sheet, busbar",
  "alloy-steel": "Bar, plate, tube, forgings",
  "tool-steel": "Bar, plate, ground stock",
  titanium: "Plate, bar, sheet, forgings",
  "inconel-incoloy": "Plate, bar, sheet, forgings",
  "precision-alloys": "Sheet, strip, bar, wire",
  "magnesium-zinc": "Plate, bar, castings",
  "plastics-polymers": "Sheet, plate, rod, tube",
};

const familySummaryOverrides: Record<string, string> = {
  "alloy-steel": "Heat-treatable alloy steels deliver higher strength, toughness, fatigue life, and wear resistance for gears, shafts, and high-load components.",
  brass: "Brass alloys combine excellent machinability, corrosion resistance, and electrical conductivity for fittings, valves, instrumentation, and precision components.",
  copper: "Copper alloys provide high electrical and thermal conductivity for power distribution, electronics, heat transfer, and precision tooling.",
  "inconel-incoloy": "Nickel-based superalloys engineered for extreme temperature, pressure, corrosion, and long-duration service in critical components.",
  "magnesium-zinc": "Lightweight magnesium and precise zinc die-casting alloys for housings, structural castings, hardware, and weight-sensitive components.",
  "mild-steel": "Mild steels provide reliable strength, weldability, and cost efficiency for structural fabrication, machinery, fixtures, and general industrial parts.",
  "plastics-polymers": "Engineering plastics provide low friction, chemical resistance, electrical insulation, and weight reduction for machined and molded components.",
  "precision-alloys": "Controlled-expansion and soft-magnetic alloys for glass sealing, optical systems, electronics, instruments, and dimensional-stability applications.",
  "stainless-steel": "Corrosion-resistant stainless alloys for food processing, marine, chemical, energy, and industrial equipment—from versatile 304 and 316 to high-strength specialty grades.",
  "tool-steel": "Hardenable tool steels provide wear resistance, dimensional stability, and hot-work performance for dies, molds, punches, and production tooling.",
  titanium: "Titanium alloys combine high strength, low density, and exceptional corrosion resistance for aerospace, energy, marine, and medical applications.",
};

const aluminumGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "General-purpose structural parts, fixtures, machine components.",
    commonStartingPoint: true,
    forms: "Plate, extrusions, bar, tube",
    image: "/materials/detail/aluminum-6061.png",
    imageAlt: "Precision CNC-machined circular aluminum fixture plate",
    machinability: "Good",
    name: "6061-T6",
    selectionNote: "The most versatile aluminum alloy. Strong, weldable, and widely available in many forms.",
    uns: "UNS A96061",
  },
  {
    applications: "High-strength components, aerospace structures, tooling.",
    forms: "Plate, bar, forgings",
    image: "/materials/detail/aluminum-7075.png",
    imageAlt: "Lightweight CNC-machined high-strength aluminum bracket",
    machinability: "Fair",
    name: "7075-T6",
    selectionNote: "Very high strength-to-weight ratio. Lower corrosion resistance and generally not selected for welding.",
    uns: "UNS A97075",
  },
  {
    applications: "Marine panels, tanks, enclosures, welded assemblies.",
    forms: "Sheet, plate",
    image: "/materials/detail/aluminum-5052.png",
    imageAlt: "Formed aluminum sheet enclosure beside stacked plate",
    machinability: "Good",
    name: "5052-H32",
    selectionNote: "Excellent corrosion resistance and formability for sheet-metal and marine applications.",
    uns: "UNS A95052",
  },
  {
    applications: "Aircraft structures, riveted assemblies, high-strength parts.",
    forms: "Sheet, plate, bar",
    image: "/materials/detail/aluminum-2024.png",
    imageAlt: "Machined aluminum structural frame with triangular ribs",
    machinability: "Fair",
    name: "2024-T3",
    selectionNote: "High strength with good fatigue performance. Corrosion protection is commonly required.",
    uns: "UNS A92024",
  },
];

const stainlessSteelGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Food equipment, enclosures, tanks, and general industrial parts.",
    commonStartingPoint: true,
    forms: "Sheet, plate, bar, tube",
    image: "/materials/detail/stainless-steel/304.png",
    imageAlt: "CNC-machined 304 stainless sanitary flange",
    machinability: "Fair",
    name: "304",
    selectionNote: "The general-purpose stainless starting point, with strong corrosion resistance, formability, and broad stock availability.",
    uns: "UNS S30400",
  },
  {
    applications: "Marine, chemical-processing, pharmaceutical, and washdown parts.",
    forms: "Sheet, plate, bar, tube",
    image: "/materials/detail/stainless-steel/316.png",
    imageAlt: "Machined 316 stainless corrosion-service pump component",
    machinability: "Fair",
    name: "316",
    selectionNote: "Selected over 304 when chloride and chemical exposure require stronger pitting and corrosion resistance.",
    uns: "UNS S31600",
  },
  {
    applications: "Turned fittings, shafts, fasteners, and precision components.",
    forms: "Bar, rod, wire",
    image: "/materials/detail/stainless-steel/303.png",
    imageAlt: "Precision-turned 303 stainless shafts and fittings",
    machinability: "Good",
    name: "303",
    selectionNote: "A free-machining stainless for high-volume turned parts; lower corrosion resistance and weldability than 304.",
    uns: "UNS S30300",
  },
  {
    applications: "High-load brackets, valve parts, aerospace hardware, and shafts.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/stainless-steel/17-4-ph.png",
    imageAlt: "High-strength machined 17-4 PH stainless clevis",
    machinability: "Fair",
    name: "17-4 PH",
    selectionNote: "Combines stainless corrosion resistance with heat-treatable high strength; final condition must be specified.",
    uns: "UNS S17400",
  },
];

const mildSteelGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Frames, base plates, brackets, weldments, and structural assemblies.",
    commonStartingPoint: true,
    forms: "Plate, sheet, structural shapes",
    image: "/materials/detail/mild-steel/a36.png",
    imageAlt: "Welded A36 structural steel base bracket",
    machinability: "Fair",
    name: "ASTM A36",
    selectionNote: "The economical structural steel starting point for fabricated and welded components where high precision strength is not the primary driver.",
    uns: "UNS K02600",
  },
  {
    applications: "Shafts, pins, spacers, fixtures, and general machined parts.",
    forms: "Cold-finished bar, rod",
    image: "/materials/detail/mild-steel/1018.png",
    imageAlt: "Precision-turned 1018 steel shafts and spacers",
    machinability: "Good",
    name: "AISI 1018",
    selectionNote: "A versatile low-carbon machining grade with good weldability, dimensional consistency, and surface finish.",
    uns: "UNS G10180",
  },
  {
    applications: "Tubular assemblies, general fabrication, fittings, and light-duty parts.",
    forms: "Bar, tube, sheet, plate",
    image: "/materials/detail/mild-steel/1020.png",
    imageAlt: "Welded 1020 steel tube assembly and machined plate",
    machinability: "Good",
    name: "AISI 1020",
    selectionNote: "A readily formed and welded low-carbon steel commonly chosen for tubing, forgings, and general fabrication.",
    uns: "UNS G10200",
  },
  {
    applications: "Gears, axles, pins, rollers, and higher-strength machine parts.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/mild-steel/1045.png",
    imageAlt: "Machined 1045 steel gear and keyed shaft",
    machinability: "Good",
    name: "AISI 1045",
    selectionNote: "Provides higher strength and wear resistance than low-carbon grades, with reduced weldability and formability.",
    uns: "UNS G10450",
  },
];

const brassGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Fittings, valve parts, threaded components, and precision hardware.",
    commonStartingPoint: true,
    forms: "Bar, rod, tube",
    image: "/materials/detail/brass/c360.png",
    imageAlt: "Precision-turned C360 brass fittings and valve stems",
    machinability: "Excellent",
    name: "C360",
    selectionNote: "The default brass for machining, offering excellent chip control, surface finish, and production efficiency.",
    uns: "UNS C36000",
  },
  {
    applications: "Formed housings, electrical parts, radiator components, and decorative hardware.",
    forms: "Sheet, strip, tube",
    image: "/materials/detail/brass/c260.png",
    imageAlt: "Formed C260 brass sheet enclosures",
    machinability: "Fair",
    name: "C260",
    selectionNote: "Cartridge brass is preferred for deep drawing and forming; it is more ductile but less machinable than C360.",
    uns: "UNS C26000",
  },
  {
    applications: "Marine fittings, propeller hardware, condenser components, and fasteners.",
    forms: "Plate, sheet, bar, tube",
    image: "/materials/detail/brass/c464.png",
    imageAlt: "Machined C464 naval brass marine component",
    machinability: "Fair",
    name: "C464",
    selectionNote: "Naval brass adds improved seawater corrosion resistance for marine service and outdoor hardware.",
    uns: "UNS C46400",
  },
  {
    applications: "Architectural profiles, hardware, trim, and extruded components.",
    forms: "Extrusions, bar, shapes",
    image: "/materials/detail/brass/c385.png",
    imageAlt: "Machined C385 brass architectural profiles and hardware",
    machinability: "Good",
    name: "C385",
    selectionNote: "An architectural brass suited to complex extruded profiles with good machining and finishing characteristics.",
    uns: "UNS C38500",
  },
];

const titaniumGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Chemical-processing equipment, marine hardware, heat exchangers, and medical parts.",
    commonStartingPoint: true,
    forms: "Plate, sheet, bar, tube",
    image: "/materials/detail/titanium/grade-2.png",
    imageAlt: "Machined Grade 2 titanium flange and formed fitting",
    machinability: "Difficult",
    name: "Grade 2",
    selectionNote: "The commercially pure titanium starting point, balancing formability, corrosion resistance, and moderate strength.",
    uns: "UNS R50400",
  },
  {
    applications: "Aerospace structures, high-load components, motorsport, and medical hardware.",
    forms: "Plate, bar, forgings",
    image: "/materials/detail/titanium/grade-5.png",
    imageAlt: "Lightweight CNC-machined Grade 5 titanium aerospace bracket",
    machinability: "Difficult",
    name: "Grade 5 / Ti-6Al-4V",
    selectionNote: "The most widely used titanium alloy where high strength-to-weight ratio and fatigue performance justify higher processing cost.",
    uns: "UNS R56400",
  },
  {
    applications: "Aerospace and motorsport tubing, hydraulic systems, and bicycle components.",
    forms: "Tube, sheet, bar",
    image: "/materials/detail/titanium/grade-9.png",
    imageAlt: "Grade 9 titanium tube junction and hydraulic fitting",
    machinability: "Difficult",
    name: "Grade 9 / Ti-3Al-2.5V",
    selectionNote: "A medium-strength alloy valued for cold formability and weldable thin-wall tubing applications.",
    uns: "UNS R56320",
  },
  {
    applications: "Surgical implants, orthopedic hardware, and critical medical components.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/titanium/grade-23.png",
    imageAlt: "Machined Grade 23 ELI titanium orthopedic components",
    machinability: "Difficult",
    name: "Grade 23 / Ti-6Al-4V ELI",
    selectionNote: "An extra-low-interstitial version of Grade 5 selected for improved toughness and demanding implant applications.",
    uns: "UNS R56407",
  },
];

const nickelAlloyGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Subsea hardware, chemical processing, marine systems, and exhaust components.",
    commonStartingPoint: true,
    forms: "Plate, sheet, bar, tube",
    image: "/materials/detail/inconel-incoloy/inconel-625.png",
    imageAlt: "Machined Inconel 625 subsea valve flange",
    machinability: "Difficult",
    name: "Inconel 625",
    selectionNote: "A corrosion-resistant nickel alloy for aggressive marine and chemical environments, with strong weldability and no required age hardening.",
    uns: "UNS N06625",
  },
  {
    applications: "Turbine disks, aerospace fasteners, rocket hardware, and high-load hot-section parts.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/inconel-incoloy/inconel-718.png",
    imageAlt: "Precision-machined Inconel 718 turbine impeller",
    machinability: "Difficult",
    name: "Inconel 718",
    selectionNote: "A precipitation-hardened superalloy combining high strength, fatigue resistance, and stability at elevated temperature.",
    uns: "UNS N07718",
  },
  {
    applications: "Furnace equipment, heat exchangers, process piping, and petrochemical systems.",
    forms: "Sheet, plate, tube, bar",
    image: "/materials/detail/inconel-incoloy/incoloy-800h.png",
    imageAlt: "Fabricated Incoloy 800H furnace tube and formed sheet",
    machinability: "Difficult",
    name: "Incoloy 800H",
    selectionNote: "Designed for oxidation resistance and creep strength in long-duration high-temperature service.",
    uns: "UNS N08810",
  },
  {
    applications: "High-temperature springs, turbine fasteners, seals, and retaining hardware.",
    forms: "Bar, wire, sheet, forgings",
    image: "/materials/detail/inconel-incoloy/inconel-x750.png",
    imageAlt: "Inconel X-750 spring, retaining ring, and turbine fastener",
    machinability: "Difficult",
    name: "Inconel X-750",
    selectionNote: "A precipitation-hardened nickel-chromium alloy selected for springs and components that must retain strength at heat.",
    uns: "UNS N07750",
  },
];

const copperGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Electrical busbars, terminals, heat sinks, and power-distribution parts.",
    commonStartingPoint: true,
    forms: "Plate, sheet, bar, busbar",
    image: "/materials/detail/copper/c110.png",
    imageAlt: "Machined C110 copper busbars and electrical terminals",
    machinability: "Fair",
    name: "C110",
    selectionNote: "The general-purpose high-conductivity copper starting point, with broad availability and strong electrical and thermal performance.",
    uns: "UNS C11000",
  },
  {
    applications: "RF hardware, vacuum components, electronics, and high-conductivity parts.",
    forms: "Bar, plate, rod",
    image: "/materials/detail/copper/c101.png",
    imageAlt: "Precision-machined C101 copper RF and vacuum components",
    machinability: "Difficult",
    name: "C101",
    selectionNote: "Oxygen-free electronic copper for applications requiring very high purity, conductivity, and low residual oxygen.",
    uns: "UNS C10100",
  },
  {
    applications: "Plumbing tube, heat exchangers, formed vessels, and brazed assemblies.",
    forms: "Tube, sheet, plate",
    image: "/materials/detail/copper/c122.png",
    imageAlt: "C122 copper heat-exchanger tube and formed components",
    machinability: "Difficult",
    name: "C122",
    selectionNote: "Phosphorus-deoxidized copper selected for forming, brazing, and welded tube applications rather than maximum electrical conductivity.",
    uns: "UNS C12200",
  },
  {
    applications: "Springs, mold tooling, electrical contacts, and high-load conductive parts.",
    forms: "Bar, plate, strip, wire",
    image: "/materials/detail/copper/c172.png",
    imageAlt: "C172 beryllium-copper springs and mold tooling inserts",
    machinability: "Fair",
    name: "C172",
    selectionNote: "A heat-treatable copper alloy combining high strength with useful conductivity; temper and handling requirements must be specified.",
    uns: "UNS C17200",
  },
];

const alloySteelGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Shafts, gears, fixtures, couplings, and general high-strength machine parts.",
    commonStartingPoint: true,
    forms: "Bar, plate, tube, forgings",
    image: "/materials/detail/alloy-steel/4140.png",
    imageAlt: "Machined 4140 alloy-steel shaft, coupling, and gear",
    machinability: "Good",
    name: "4140",
    selectionNote: "The versatile chromium-molybdenum steel starting point, with a useful balance of strength, toughness, heat treatment, and availability.",
    uns: "UNS G41400",
  },
  {
    applications: "Landing-gear parts, high-load shafts, aerospace hardware, and critical forgings.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/alloy-steel/4340.png",
    imageAlt: "High-load machined 4340 alloy-steel aerospace component",
    machinability: "Fair",
    name: "4340",
    selectionNote: "Selected over 4140 for greater hardenability, toughness, and fatigue performance in heavily loaded sections.",
    uns: "UNS G43400",
  },
  {
    applications: "Carburized gears, pinions, bushings, and wear-resistant transmission parts.",
    forms: "Bar, forgings",
    image: "/materials/detail/alloy-steel/8620.png",
    imageAlt: "Carburized 8620 alloy-steel gear and pinion",
    machinability: "Good",
    name: "8620",
    selectionNote: "A case-hardening steel that combines a tough core with a hard wear surface after carburizing and heat treatment.",
    uns: "UNS G86200",
  },
  {
    applications: "Welded aerospace structures, motorsport frames, tubing, and fittings.",
    forms: "Tube, sheet, plate, bar",
    image: "/materials/detail/alloy-steel/4130.png",
    imageAlt: "Welded 4130 chromoly tubular frame node and fitting",
    machinability: "Good",
    name: "4130",
    selectionNote: "A weldable chromium-molybdenum steel widely used in thin-wall tubing and lightweight structural assemblies.",
    uns: "UNS G41300",
  },
];

const toolSteelGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Blanking dies, wear plates, shear blades, and long-run production tooling.",
    commonStartingPoint: true,
    forms: "Plate, bar, ground stock",
    image: "/materials/detail/tool-steel/d2.png",
    imageAlt: "D2 tool-steel blanking die, punch, and wear insert",
    machinability: "Difficult",
    name: "D2",
    selectionNote: "A high-wear, air-hardening tool steel for long production runs; dimensional change, toughness, and finish grinding require planning.",
    uns: "UNS T30402",
  },
  {
    applications: "Punches, dies, gauges, and precision cold-work tooling.",
    forms: "Plate, bar, ground stock",
    image: "/materials/detail/tool-steel/a2.png",
    imageAlt: "A2 tool-steel precision stamping die and punch",
    machinability: "Fair",
    name: "A2",
    selectionNote: "Balances wear resistance, toughness, and dimensional stability for general-purpose cold-work tooling.",
    uns: "UNS T30102",
  },
  {
    applications: "Gauges, fixture pins, small cutting tools, and short-run dies.",
    forms: "Bar, plate, ground stock",
    image: "/materials/detail/tool-steel/o1.png",
    imageAlt: "O1 tool-steel gauge blocks, pins, and form tool",
    machinability: "Good",
    name: "O1",
    selectionNote: "An oil-hardening tool steel that machines readily before heat treatment and suits simpler tooling with moderate wear demands.",
    uns: "UNS T31501",
  },
  {
    applications: "Hot-forging dies, extrusion tooling, die-casting inserts, and hot shear blades.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/tool-steel/h13.png",
    imageAlt: "H13 hot-work tool-steel extrusion and forging dies",
    machinability: "Fair",
    name: "H13",
    selectionNote: "The common hot-work choice for thermal-fatigue resistance, hot hardness, and toughness under repeated heating cycles.",
    uns: "UNS T20813",
  },
];

const precisionAlloyGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Glass-to-metal seals, electronic packages, feedthroughs, and sensor housings.",
    commonStartingPoint: true,
    forms: "Sheet, strip, bar, wire",
    image: "/materials/detail/precision-alloys/kovar.png",
    imageAlt: "Kovar glass-to-metal seal rings and electronic headers",
    machinability: "Fair",
    name: "Kovar",
    selectionNote: "A controlled-expansion iron-nickel-cobalt alloy selected to match the thermal behavior of sealing glasses and ceramics.",
    uns: "UNS K94610",
  },
  {
    applications: "Optical tooling, metrology frames, precision instruments, and stable reference structures.",
    forms: "Plate, sheet, bar",
    image: "/materials/detail/precision-alloys/invar-36.png",
    imageAlt: "Invar 36 optical metrology frame and reference bar",
    machinability: "Fair",
    name: "Invar 36",
    selectionNote: "A very-low-expansion nickel-iron alloy for assemblies where dimensional stability across temperature is the primary requirement.",
    uns: "UNS K93600",
  },
  {
    applications: "Relay armatures, soft-magnetic cores, sensors, and electromagnetic components.",
    forms: "Sheet, strip, bar",
    image: "/materials/detail/precision-alloys/1j50.png",
    imageAlt: "1J50 soft-magnetic relay and core components",
    machinability: "Application review",
    name: "1J50",
    selectionNote: "A Chinese soft-magnetic alloy designation; magnetic properties depend on chemistry, thickness, processing, and final anneal, so the governing specification must be confirmed.",
    uns: "GB/T specification review",
  },
  {
    applications: "Magnetic shielding, transformer cores, instrumentation, and high-permeability assemblies.",
    forms: "Strip, sheet",
    image: "/materials/detail/precision-alloys/1j79.png",
    imageAlt: "1J79 high-permeability magnetic shields and core shapes",
    machinability: "Application review",
    name: "1J79",
    selectionNote: "A high-permeability Chinese nickel-iron designation whose final magnetic performance is highly sensitive to forming and heat treatment.",
    uns: "GB/T specification review",
  },
];

const magnesiumZincGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Electronics housings, gearbox covers, brackets, and general die-cast components.",
    commonStartingPoint: true,
    forms: "Die castings",
    image: "/materials/detail/magnesium-zinc/az91d.png",
    imageAlt: "AZ91D magnesium die-cast housing with machined datum faces",
    machinability: "Good",
    name: "AZ91D",
    selectionNote: "The common magnesium die-casting starting point, combining low weight, castability, strength, and useful corrosion performance.",
    uns: "Specification review",
  },
  {
    applications: "Impact-resistant automotive structures, frames, and thin-wall safety castings.",
    forms: "Die castings",
    image: "/materials/detail/magnesium-zinc/am60b.png",
    imageAlt: "AM60B magnesium thin-wall structural die casting",
    machinability: "Good",
    name: "AM60B",
    selectionNote: "Chosen over AZ91D when ductility and impact performance matter more than maximum room-temperature strength.",
    uns: "Specification review",
  },
  {
    applications: "Formed brackets, machined plates, lightweight enclosures, and extruded parts.",
    forms: "Sheet, plate, bar, extrusions",
    image: "/materials/detail/magnesium-zinc/az31b.png",
    imageAlt: "AZ31B magnesium formed bracket, plate, and extrusion",
    machinability: "Good",
    name: "AZ31B",
    selectionNote: "A common wrought magnesium alloy for sheet, plate, and extrusion applications requiring very low mass.",
    uns: "Specification review",
  },
  {
    applications: "Precision hardware, lock housings, covers, handles, and detailed die castings.",
    forms: "Die castings",
    image: "/materials/detail/magnesium-zinc/zamak-3.png",
    imageAlt: "Zamak 3 zinc precision die-cast hardware housing",
    machinability: "Good",
    name: "Zamak 3",
    selectionNote: "The general-purpose zinc die-casting alloy for fine detail, dimensional consistency, finishing quality, and economical high-volume production.",
    uns: "ASTM B86 review",
  },
];

const plasticsPolymersGradeProfiles: MaterialGradeProfile[] = [
  {
    applications: "Gears, bushings, wear parts, fixtures, and low-friction machine components.",
    commonStartingPoint: true,
    forms: "Rod, sheet, plate",
    image: "/materials/detail/plastics-polymers/pom.png",
    imageAlt: "Machined POM acetal gears, bushings, and fixture block",
    machinability: "Excellent",
    name: "POM / Acetal",
    functionalTraits: {
      chemicalResistance: "Good",
      heatTolerance: "Moderate",
      moistureResponse: "Low",
      wearFriction: "Low",
    },
    selectionNote: "The versatile engineering-plastic starting point for dimensional stability, low friction, good wear behavior, and clean machining.",
    uns: "Resin grade review",
  },
  {
    applications: "Aerospace hardware, medical components, bearings, and high-temperature electrical parts.",
    forms: "Rod, plate, tube",
    image: "/materials/detail/plastics-polymers/peek.png",
    imageAlt: "Machined PEEK bearing cages and manifold block",
    machinability: "Good",
    name: "PEEK",
    functionalTraits: {
      chemicalResistance: "Excellent",
      heatTolerance: "High",
      moistureResponse: "Low",
      wearFriction: "Low",
    },
    selectionNote: "A premium high-temperature polymer with strong chemical resistance and mechanical retention in demanding service.",
    uns: "Resin grade review",
  },
  {
    applications: "Seals, valve seats, gaskets, chemical-service parts, and electrical insulation.",
    forms: "Sheet, rod, tube",
    image: "/materials/detail/plastics-polymers/ptfe.png",
    imageAlt: "Machined white PTFE valve seats, seals, and gaskets",
    machinability: "Fair",
    name: "PTFE",
    functionalTraits: {
      chemicalResistance: "Excellent",
      heatTolerance: "Moderate",
      moistureResponse: "Low",
      wearFriction: "Very low",
    },
    selectionNote: "Selected for exceptional chemical resistance, low friction, and wide temperature capability; creep and dimensional stability require attention.",
    uns: "Resin grade review",
  },
  {
    applications: "Wear strips, conveyor guides, chutes, sprockets, and impact-resistant liners.",
    forms: "Sheet, plate, rod",
    image: "/materials/detail/plastics-polymers/uhmw-pe.png",
    imageAlt: "UHMW-PE wear strips, conveyor guide, and sprocket",
    machinability: "Good",
    name: "UHMW-PE",
    functionalTraits: {
      chemicalResistance: "Good",
      heatTolerance: "Low",
      moistureResponse: "Low",
      wearFriction: "Very low",
    },
    selectionNote: "A tough, low-friction polyethylene for sliding wear and impact service, with lower stiffness and temperature capability than acetal or PEEK.",
    uns: "Resin grade review",
  },
];

const featuredGradeProfilesBySlug: Record<string, MaterialGradeProfile[]> = {
  aluminum: aluminumGradeProfiles,
  "alloy-steel": alloySteelGradeProfiles,
  brass: brassGradeProfiles,
  copper: copperGradeProfiles,
  "inconel-incoloy": nickelAlloyGradeProfiles,
  "magnesium-zinc": magnesiumZincGradeProfiles,
  "mild-steel": mildSteelGradeProfiles,
  "plastics-polymers": plasticsPolymersGradeProfiles,
  "precision-alloys": precisionAlloyGradeProfiles,
  "stainless-steel": stainlessSteelGradeProfiles,
  titanium: titaniumGradeProfiles,
  "tool-steel": toolSteelGradeProfiles,
};

const familyHeroBySlug: Record<string, { alt: string; src: string }> = {
  aluminum: { alt: "Aluminum round bar, plate, and a precision CNC-machined housing", src: "/materials/detail/aluminum-hero.png" },
  "alloy-steel": { alt: "Alloy-steel round bar, plate, gear, shaft, and high-load machined components", src: "/materials/detail/alloy-steel/hero.png" },
  brass: { alt: "Brass round bar, plate, and a precision CNC-machined manifold", src: "/materials/detail/brass/hero.png" },
  copper: { alt: "Copper bar, sheet, busbar, terminals, and a precision-machined cooling component", src: "/materials/detail/copper/hero.png" },
  "inconel-incoloy": { alt: "Nickel-alloy round bar, plate, and a precision-machined turbine component", src: "/materials/detail/inconel-incoloy/hero.png" },
  "magnesium-zinc": { alt: "Magnesium and zinc raw stock with lightweight precision die-cast housings", src: "/materials/detail/magnesium-zinc/hero.png" },
  "mild-steel": { alt: "Mild-steel round bar, plate, and a machined shaft assembly", src: "/materials/detail/mild-steel/hero.png" },
  "plastics-polymers": { alt: "Engineering-plastic rod, plate, sheet, gears, seals, and machined components", src: "/materials/detail/plastics-polymers/hero.png" },
  "precision-alloys": { alt: "Precision-alloy stock with controlled-expansion and soft-magnetic instrument components", src: "/materials/detail/precision-alloys/hero.png" },
  "stainless-steel": { alt: "Stainless-steel round bar, plate, and a precision-machined sanitary valve", src: "/materials/detail/stainless-steel/hero.png" },
  titanium: { alt: "Titanium round bar, plate, and a lightweight CNC-machined bracket", src: "/materials/detail/titanium/hero.png" },
  "tool-steel": { alt: "Tool-steel plate and round stock with precision dies, punches, and mold inserts", src: "/materials/detail/tool-steel/hero.png" },
};

function allGradeNames(material: CustomerMaterialCatalogEntry) {
  // The directory is the customer-facing source of truth. Common grades and
  // source-catalog variants are presentation/provenance data, and may use
  // equivalent labels (for example, "Al 6061-T6"). Do not let them inflate
  // the count or reintroduce aliases into family search.
  return material.materialGroups.flatMap((group) => group.grades);
}

export const materialFamilies: MaterialFamilyCardData[] = customerMaterialCatalog.map((material) => {
  const grades = allGradeNames(material);

  return {
    catalogNoun: material.slug === "aluminum" ? "offerings" : "grades",
    examples: familyExamples[material.slug] ?? grades.slice(0, 5),
    gradeCount: material.gradeCount,
    grades,
    name: material.name,
    slug: material.slug,
    summary: familySummaryOverrides[material.slug] ?? material.summary,
    texture: familyTextures[material.slug] ?? "/materials/steel-dark.png",
  };
});

function genericFeaturedGrades(material: CustomerMaterialCatalogEntry, family: MaterialFamilyCardData) {
  const forms = familyForms[material.slug] ?? "Project-specific stock forms";
  const variants = material.variants ?? [];
  const profiles: MaterialGradeProfile[] = variants.slice(0, 4).map((variant, index) => ({
    applications: `${variant.industry} and specification-driven components.`,
    commonStartingPoint: index === 0,
    forms,
    image: variant.image?.src ?? family.texture,
    imageAlt: variant.image?.alt ?? `${material.name} material surface`,
    machinability: variant.machinability,
    name: variant.name,
    selectionNote: `Commonly reviewed against ${variant.commonSpec}; confirm condition, stock form, and certification requirements in the RFQ.`,
    uns: variant.uns.startsWith("UNS") ? variant.uns : `UNS ${variant.uns}`,
  }));

  const usedNames = new Set(profiles.map((profile) => profile.name.toLowerCase()));
  const fallbackNames = family.grades.filter((grade) => ![...usedNames].some((usedName) => usedName.includes(grade.toLowerCase()) || grade.toLowerCase().includes(usedName)));

  for (const grade of fallbackNames) {
    if (profiles.length >= 4) break;
    profiles.push({
      applications: material.summary,
      commonStartingPoint: profiles.length === 0,
      forms,
      image: family.texture,
      imageAlt: `${material.name} material surface`,
      machinability: "Application review",
      name: grade,
      selectionNote: "Confirm grade, condition, stock form, and documentation requirements during RFQ review.",
      uns: "UNS / specification review",
    });
  }

  return profiles;
}

export function getMaterialFamilyDetail(slug: string): MaterialFamilyDetail | undefined {
  const family = materialFamilies.find((candidate) => candidate.slug === slug);
  const catalogEntry = customerMaterialCatalog.find((candidate) => candidate.slug === slug);

  if (!family || !catalogEntry) return undefined;

  const featuredGrades = (featuredGradeProfilesBySlug[slug] ?? genericFeaturedGrades(catalogEntry, family)).map((grade) => ({
    ...grade,
    mechanicalProperties: materialMechanicalProperties[grade.name],
  }));
  const hero = familyHeroBySlug[slug];
  const heroImage = hero?.src ?? featuredGrades[0]?.image ?? family.texture;
  const heroAlt = hero?.alt ?? featuredGrades[0]?.imageAlt ?? `${family.name} material`;

  return {
    ...family,
    catalogEntry,
    featuredGrades,
    heroAlt,
    heroImage,
  };
}
