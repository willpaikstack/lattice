import { customerMaterialCatalog, type CustomerMaterialCatalogEntry } from "./customer-material-catalog";
import type { MaterialMechanicalProperties } from "./material-grade-properties";
import { catalogGradeRecords, catalogReferenceProperties, type CatalogGradeRecord } from "./material-catalog-records";

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

export type FunctionalTraits = {
  chemicalResistance: string;
  heatTolerance: string;
  moistureResponse: string;
  wearFriction: string;
};

export type MaterialGradeProfile = {
  grade: string;
  condition?: string;
  applications: string;
  commonStartingPoint?: boolean;
  functionalTraits?: FunctionalTraits;
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

// These selections contain presentation only. Grade names and conditions must
// resolve to a published directory record before a card or example is shown.
type FeaturedGradePresentation = Omit<MaterialGradeProfile, "grade" | "name" | "condition" | "mechanicalProperties"> & {
  grade: string;
  condition?: string;
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

const aluminumGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "General-purpose structural parts, fixtures, machine components.",
    commonStartingPoint: true,
    forms: "Plate, extrusions, bar, tube",
    image: "/materials/detail/aluminum-6061.png",
    imageAlt: "Precision CNC-machined circular aluminum fixture plate",
    machinability: "Good",
    grade: "6061 Aluminum",
    condition: "T6",
    selectionNote: "The most versatile aluminum alloy. Strong, weldable, and widely available in many forms.",
    uns: "UNS A96061",
  },
  {
    applications: "High-strength components, aerospace structures, tooling.",
    forms: "Plate, bar, forgings",
    image: "/materials/detail/aluminum-7075.png",
    imageAlt: "Lightweight CNC-machined high-strength aluminum bracket",
    machinability: "Fair",
    grade: "7075 Aluminum",
    condition: "T6",
    selectionNote: "Very high strength-to-weight ratio. Lower corrosion resistance and generally not selected for welding.",
    uns: "UNS A97075",
  },
  {
    applications: "Marine panels, tanks, enclosures, welded assemblies.",
    forms: "Sheet, plate",
    image: "/materials/detail/aluminum-5052.png",
    imageAlt: "Formed aluminum sheet enclosure beside stacked plate",
    machinability: "Good",
    grade: "5052 Aluminum",
    condition: "H32",
    selectionNote: "Excellent corrosion resistance and formability for sheet-metal and marine applications.",
    uns: "UNS A95052",
  },
  {
    applications: "Aircraft structures, riveted assemblies, high-strength parts.",
    forms: "Sheet, plate, bar",
    image: "/materials/detail/aluminum-2024.png",
    imageAlt: "Machined aluminum structural frame with triangular ribs",
    machinability: "Fair",
    grade: "2024 Aluminum",
    condition: "T3",
    selectionNote: "High strength with good fatigue performance. Corrosion protection is commonly required.",
    uns: "UNS A92024",
  },
];

const stainlessSteelGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Food equipment, enclosures, tanks, and general industrial parts.",
    commonStartingPoint: true,
    forms: "Sheet, plate, bar, tube",
    image: "/materials/detail/stainless-steel/304.png",
    imageAlt: "CNC-machined 304 stainless sanitary flange",
    machinability: "Fair",
    grade: "304/304L Stainless Steel",
    selectionNote: "The general-purpose stainless starting point, with strong corrosion resistance, formability, and broad stock availability.",
    uns: "UNS S30400 / S30403",
  },
  {
    applications: "Marine, chemical-processing, pharmaceutical, and washdown parts.",
    forms: "Sheet, plate, bar, tube",
    image: "/materials/detail/stainless-steel/316.png",
    imageAlt: "Machined 316 stainless corrosion-service pump component",
    machinability: "Fair",
    grade: "316/316L Stainless Steel",
    selectionNote: "Selected over 304 when chloride and chemical exposure require stronger pitting and corrosion resistance.",
    uns: "UNS S31600 / S31603",
  },
  {
    applications: "Turned fittings, shafts, fasteners, and precision components.",
    forms: "Bar, rod, wire",
    image: "/materials/detail/stainless-steel/303.png",
    imageAlt: "Precision-turned 303 stainless shafts and fittings",
    machinability: "Good",
    grade: "303",
    selectionNote: "A free-machining stainless for high-volume turned parts; lower corrosion resistance and weldability than 304.",
    uns: "UNS S30300",
  },
  {
    applications: "High-load brackets, valve parts, aerospace hardware, and shafts.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/stainless-steel/17-4-ph.png",
    imageAlt: "High-strength machined 17-4 PH stainless clevis",
    machinability: "Fair",
    grade: "17-4 PH",
    selectionNote: "Combines stainless corrosion resistance with heat-treatable high strength; final condition must be specified.",
    uns: "UNS S17400",
  },
];

const mildSteelGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Frames, base plates, brackets, weldments, and structural assemblies.",
    commonStartingPoint: true,
    forms: "Plate, sheet, structural shapes",
    image: "/materials/detail/mild-steel/a36.png",
    imageAlt: "Welded A36 structural steel base bracket",
    machinability: "Fair",
    grade: "A36 Steel",
    selectionNote: "The economical structural steel starting point for fabricated and welded components where high precision strength is not the primary driver.",
    uns: "UNS K02600",
  },
  {
    applications: "Shafts, pins, spacers, fixtures, and general machined parts.",
    forms: "Cold-finished bar, rod",
    image: "/materials/detail/mild-steel/1018.png",
    imageAlt: "Precision-turned 1018 steel shafts and spacers",
    machinability: "Good",
    grade: "1018 Steel",
    selectionNote: "A versatile low-carbon machining grade with good weldability, dimensional consistency, and surface finish.",
    uns: "UNS G10180",
  },
  {
    applications: "Tubular assemblies, general fabrication, fittings, and light-duty parts.",
    forms: "Bar, tube, sheet, plate",
    image: "/materials/detail/mild-steel/1020.png",
    imageAlt: "Welded 1020 steel tube assembly and machined plate",
    machinability: "Good",
    grade: "Steel 1020",
    selectionNote: "A readily formed and welded low-carbon steel commonly chosen for tubing, forgings, and general fabrication.",
    uns: "UNS G10200",
  },
  {
    applications: "Gears, axles, pins, rollers, and higher-strength machine parts.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/mild-steel/1045.png",
    imageAlt: "Machined 1045 steel gear and keyed shaft",
    machinability: "Good",
    grade: "Steel 1045 / 45#",
    selectionNote: "Provides higher strength and wear resistance than low-carbon grades, with reduced weldability and formability.",
    uns: "UNS G10450",
  },
];

const brassGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Fittings, valve parts, threaded components, and precision hardware.",
    commonStartingPoint: true,
    forms: "Bar, rod, tube",
    image: "/materials/detail/brass/c360.png",
    imageAlt: "Precision-turned C360 brass fittings and valve stems",
    machinability: "Excellent",
    grade: "Brass 360 (UNS C36000)",
    selectionNote: "The default brass for machining, offering excellent chip control, surface finish, and production efficiency.",
    uns: "UNS C36000",
  },
  {
    applications: "Formed housings, electrical parts, radiator components, and decorative hardware.",
    forms: "Sheet, strip, tube",
    image: "/materials/detail/brass/c260.png",
    imageAlt: "Formed C260 brass sheet enclosures",
    machinability: "Fair",
    grade: "Brass 260",
    selectionNote: "Cartridge brass is preferred for deep drawing and forming; it is more ductile but less machinable than C360.",
    uns: "UNS C26000",
  },
];

const titaniumGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Chemical-processing equipment, marine hardware, heat exchangers, and medical parts.",
    commonStartingPoint: true,
    forms: "Plate, sheet, bar, tube",
    image: "/materials/detail/titanium/grade-2.png",
    imageAlt: "Machined Grade 2 titanium flange and formed fitting",
    machinability: "Difficult",
    grade: "Grade 2",
    selectionNote: "The commercially pure titanium starting point, balancing formability, corrosion resistance, and moderate strength.",
    uns: "UNS R50400",
  },
  {
    applications: "Aerospace structures, high-load components, motorsport, and medical hardware.",
    forms: "Plate, bar, forgings",
    image: "/materials/detail/titanium/grade-5.png",
    imageAlt: "Lightweight CNC-machined Grade 5 titanium aerospace bracket",
    machinability: "Difficult",
    grade: "Grade 5 / 6Al-4V",
    selectionNote: "The most widely used titanium alloy where high strength-to-weight ratio and fatigue performance justify higher processing cost.",
    uns: "UNS R56400",
  },
  {
    applications: "Aerospace and motorsport tubing, hydraulic systems, and bicycle components.",
    forms: "Tube, sheet, bar",
    image: "/materials/detail/titanium/grade-9.png",
    imageAlt: "Grade 9 titanium tube junction and hydraulic fitting",
    machinability: "Difficult",
    grade: "Grade 9 / 3Al-2.5V",
    selectionNote: "A medium-strength alloy valued for cold formability and weldable thin-wall tubing applications.",
    uns: "UNS R56320",
  },
];

const nickelAlloyGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Subsea hardware, chemical processing, marine systems, and exhaust components.",
    commonStartingPoint: true,
    forms: "Plate, sheet, bar, tube",
    image: "/materials/detail/inconel-incoloy/inconel-625.png",
    imageAlt: "Machined Inconel 625 subsea valve flange",
    machinability: "Difficult",
    grade: "Inconel 625",
    selectionNote: "A corrosion-resistant nickel alloy for aggressive marine and chemical environments, with strong weldability and no required age hardening.",
    uns: "UNS N06625",
  },
  {
    applications: "Turbine disks, aerospace fasteners, rocket hardware, and high-load hot-section parts.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/inconel-incoloy/inconel-718.png",
    imageAlt: "Precision-machined Inconel 718 turbine impeller",
    machinability: "Difficult",
    grade: "Inconel 718",
    selectionNote: "A precipitation-hardened superalloy combining high strength, fatigue resistance, and stability at elevated temperature.",
    uns: "UNS N07718",
  },
  {
    applications: "Furnace equipment, heat exchangers, process piping, and petrochemical systems.",
    forms: "Sheet, plate, tube, bar",
    image: "/materials/detail/inconel-incoloy/incoloy-800h.png",
    imageAlt: "Fabricated Incoloy 800H furnace tube and formed sheet",
    machinability: "Difficult",
    grade: "Incoloy 800H",
    selectionNote: "Designed for oxidation resistance and creep strength in long-duration high-temperature service.",
    uns: "UNS N08810",
  },
  {
    applications: "High-temperature springs, turbine fasteners, seals, and retaining hardware.",
    forms: "Bar, wire, sheet, forgings",
    image: "/materials/detail/inconel-incoloy/inconel-x750.png",
    imageAlt: "Inconel X-750 spring, retaining ring, and turbine fastener",
    machinability: "Difficult",
    grade: "Inconel X-750",
    selectionNote: "A precipitation-hardened nickel-chromium alloy selected for springs and components that must retain strength at heat.",
    uns: "UNS N07750",
  },
];

const copperGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Electrical busbars, terminals, heat sinks, and power-distribution parts.",
    commonStartingPoint: true,
    forms: "Plate, sheet, bar, busbar",
    image: "/materials/detail/copper/c110.png",
    imageAlt: "Machined C110 copper busbars and electrical terminals",
    machinability: "Fair",
    grade: "Copper 110 (UNS C11000)",
    selectionNote: "The general-purpose high-conductivity copper starting point, with broad availability and strong electrical and thermal performance.",
    uns: "UNS C11000",
  },
  {
    applications: "RF hardware, vacuum components, electronics, and high-conductivity parts.",
    forms: "Bar, plate, rod",
    image: "/materials/detail/copper/c101.png",
    imageAlt: "Precision-machined C101 copper RF and vacuum components",
    machinability: "Difficult",
    grade: "Copper 101",
    selectionNote: "Oxygen-free electronic copper for applications requiring very high purity, conductivity, and low residual oxygen.",
    uns: "UNS C10100",
  },
];

const alloySteelGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Shafts, gears, fixtures, couplings, and general high-strength machine parts.",
    commonStartingPoint: true,
    forms: "Bar, plate, tube, forgings",
    image: "/materials/detail/alloy-steel/4140.png",
    imageAlt: "Machined 4140 alloy-steel shaft, coupling, and gear",
    machinability: "Good",
    grade: "4140",
    selectionNote: "The versatile chromium-molybdenum steel starting point, with a useful balance of strength, toughness, heat treatment, and availability.",
    uns: "UNS G41400",
  },
  {
    applications: "Landing-gear parts, high-load shafts, aerospace hardware, and critical forgings.",
    forms: "Bar, plate, forgings",
    image: "/materials/detail/alloy-steel/4340.png",
    imageAlt: "High-load machined 4340 alloy-steel aerospace component",
    machinability: "Fair",
    grade: "4340 / E4340",
    selectionNote: "Selected over 4140 for greater hardenability, toughness, and fatigue performance in heavily loaded sections.",
    uns: "UNS G43400",
  },
  {
    applications: "Welded aerospace structures, motorsport frames, tubing, and fittings.",
    forms: "Tube, sheet, plate, bar",
    image: "/materials/detail/alloy-steel/4130.png",
    imageAlt: "Welded 4130 chromoly tubular frame node and fitting",
    machinability: "Good",
    grade: "4130",
    selectionNote: "A weldable chromium-molybdenum steel widely used in thin-wall tubing and lightweight structural assemblies.",
    uns: "UNS G41300",
  },
];

const toolSteelGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Punches, dies, gauges, and precision cold-work tooling.",
    forms: "Plate, bar, ground stock",
    image: "/materials/detail/tool-steel/a2.png",
    imageAlt: "A2 tool-steel precision stamping die and punch",
    machinability: "Fair",
    grade: "A2 Steel",
    selectionNote: "Balances wear resistance, toughness, and dimensional stability for general-purpose cold-work tooling.",
    uns: "UNS T30102",
  },
  {
    applications: "Gauges, fixture pins, small cutting tools, and short-run dies.",
    forms: "Bar, plate, ground stock",
    image: "/materials/detail/tool-steel/o1.png",
    imageAlt: "O1 tool-steel gauge blocks, pins, and form tool",
    machinability: "Good",
    grade: "O1 Tool Steel",
    selectionNote: "An oil-hardening tool steel that machines readily before heat treatment and suits simpler tooling with moderate wear demands.",
    uns: "UNS T31501",
  },
];

const precisionAlloyGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Glass-to-metal seals, electronic packages, feedthroughs, and sensor housings.",
    commonStartingPoint: true,
    forms: "Sheet, strip, bar, wire",
    image: "/materials/detail/precision-alloys/kovar.png",
    imageAlt: "Kovar glass-to-metal seal rings and electronic headers",
    machinability: "Fair",
    grade: "Kovar",
    selectionNote: "A controlled-expansion iron-nickel-cobalt alloy selected to match the thermal behavior of sealing glasses and ceramics.",
    uns: "UNS K94610",
  },
  {
    applications: "Optical tooling, metrology frames, precision instruments, and stable reference structures.",
    forms: "Plate, sheet, bar",
    image: "/materials/detail/precision-alloys/invar-36.png",
    imageAlt: "Invar 36 optical metrology frame and reference bar",
    machinability: "Fair",
    grade: "Invar 36",
    selectionNote: "A very-low-expansion nickel-iron alloy for assemblies where dimensional stability across temperature is the primary requirement.",
    uns: "UNS K93600",
  },
  {
    applications: "Relay armatures, soft-magnetic cores, sensors, and electromagnetic components.",
    forms: "Sheet, strip, bar",
    image: "/materials/detail/precision-alloys/1j50.png",
    imageAlt: "1J50 soft-magnetic relay and core components",
    machinability: "Application review",
    grade: "1J50",
    selectionNote: "A Chinese soft-magnetic alloy designation; magnetic properties depend on chemistry, thickness, processing, and final anneal, so the governing specification must be confirmed.",
    uns: "GB/T specification review",
  },
  {
    applications: "Magnetic shielding, transformer cores, instrumentation, and high-permeability assemblies.",
    forms: "Strip, sheet",
    image: "/materials/detail/precision-alloys/1j79.png",
    imageAlt: "1J79 high-permeability magnetic shields and core shapes",
    machinability: "Application review",
    grade: "1J79",
    selectionNote: "A high-permeability Chinese nickel-iron designation whose final magnetic performance is highly sensitive to forming and heat treatment.",
    uns: "GB/T specification review",
  },
];

const magnesiumZincGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Electronics housings, gearbox covers, brackets, and general die-cast components.",
    commonStartingPoint: true,
    forms: "Die castings",
    image: "/materials/detail/magnesium-zinc/az91d.png",
    imageAlt: "AZ91D magnesium die-cast housing with machined datum faces",
    machinability: "Good",
    grade: "AZ91D",
    selectionNote: "The common magnesium die-casting starting point, combining low weight, castability, strength, and useful corrosion performance.",
    uns: "Specification review",
  },
  {
    applications: "Impact-resistant automotive structures, frames, and thin-wall safety castings.",
    forms: "Die castings",
    image: "/materials/detail/magnesium-zinc/am60b.png",
    imageAlt: "AM60B magnesium thin-wall structural die casting",
    machinability: "Good",
    grade: "AM60B",
    selectionNote: "Chosen over AZ91D when ductility and impact performance matter more than maximum room-temperature strength.",
    uns: "Specification review",
  },
  {
    applications: "Formed brackets, machined plates, lightweight enclosures, and extruded parts.",
    forms: "Sheet, plate, bar, extrusions",
    image: "/materials/detail/magnesium-zinc/az31b.png",
    imageAlt: "AZ31B magnesium formed bracket, plate, and extrusion",
    machinability: "Good",
    grade: "AZ31B",
    selectionNote: "A common wrought magnesium alloy for sheet, plate, and extrusion applications requiring very low mass.",
    uns: "Specification review",
  },
  {
    applications: "Precision hardware, lock housings, covers, handles, and detailed die castings.",
    forms: "Die castings",
    image: "/materials/detail/magnesium-zinc/zamak-3.png",
    imageAlt: "Zamak 3 zinc precision die-cast hardware housing",
    machinability: "Good",
    grade: "Zamak 3",
    selectionNote: "The general-purpose zinc die-casting alloy for fine detail, dimensional consistency, finishing quality, and economical high-volume production.",
    uns: "ASTM B86 review",
  },
];

const plasticsPolymersGradeProfiles: FeaturedGradePresentation[] = [
  {
    applications: "Gears, bushings, wear parts, fixtures, and low-friction machine components.",
    commonStartingPoint: true,
    forms: "Rod, sheet, plate",
    image: "/materials/detail/plastics-polymers/pom.png",
    imageAlt: "Machined POM acetal gears, bushings, and fixture block",
    machinability: "Excellent",
    grade: "Acetal (POM)",
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
    grade: "PEEK",
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
    grade: "PTFE",
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
    grade: "UHMW PE",
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

const featuredGradePresentationsBySlug: Record<string, FeaturedGradePresentation[]> = {
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

export function getFeaturedMaterialGrades(material: CustomerMaterialCatalogEntry): MaterialGradeProfile[] {
  const records = catalogGradeRecords(material.materialGroups);
  const presentations = featuredGradePresentationsBySlug[material.slug];
  const featured = presentations?.flatMap((presentation) => {
    const record = records.find((candidate) => candidate.grade === presentation.grade);
    if (!record) return [];
    const condition = presentation.condition
      ? record.conditions.find((candidate) => candidate.label === presentation.condition)
      : undefined;
    // Never advertise a condition removed from the directory or fall back to
    // properties for a different grade/temper when a reference is unavailable.
    if (presentation.condition && !condition) return [];
    return [{
      ...presentation,
      grade: record.grade,
      name: record.name,
      condition: condition?.label,
      mechanicalProperties: catalogReferenceProperties(material.name, record.grade, condition),
    }];
  }) ?? [];

  if (featured.length > 0) {
    return featured.map((grade, index) => ({ ...grade, commonStartingPoint: index === 0 }));
  }

  // Families without curated highlights use actual directory records. Legacy
  // display-only variants must not introduce materials absent from the catalog.
  return records.slice(0, 4).map((record: CatalogGradeRecord, index) => ({
    grade: record.grade,
    name: record.name,
    commonStartingPoint: index === 0,
    applications: material.summary,
    forms: familyForms[material.slug] ?? "Project-specific stock forms",
    image: familyTextures[material.slug] ?? "/materials/steel-dark.png",
    imageAlt: `${material.name} material surface`,
    machinability: "Application review",
    selectionNote: "Confirm grade, condition, stock form, and documentation requirements during RFQ review.",
    uns: "UNS / specification review",
    mechanicalProperties: catalogReferenceProperties(material.name, record.grade),
  }));
}

export const materialFamilies: MaterialFamilyCardData[] = customerMaterialCatalog.map((material) => {
  const records = catalogGradeRecords(material.materialGroups);
  return {
    catalogNoun: material.slug === "aluminum" ? "offerings" : "grades",
    examples: getFeaturedMaterialGrades(material).map((grade) => grade.name),
    gradeCount: records.length,
    grades: records.map((record) => record.grade),
    name: material.name,
    slug: material.slug,
    summary: familySummaryOverrides[material.slug] ?? material.summary,
    texture: familyTextures[material.slug] ?? "/materials/steel-dark.png",
  };
});

export function getMaterialFamilyDetail(slug: string): MaterialFamilyDetail | undefined {
  const family = materialFamilies.find((candidate) => candidate.slug === slug);
  const catalogEntry = customerMaterialCatalog.find((candidate) => candidate.slug === slug);

  if (!family || !catalogEntry) return undefined;

  const featuredGrades = getFeaturedMaterialGrades(catalogEntry);
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
