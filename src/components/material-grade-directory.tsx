"use client";

import { ChevronDown, ChevronUp, Droplets, FlaskConical, Gauge, Thermometer } from "lucide-react";
import { useMemo, useState } from "react";

import type { CustomerMaterialCondition, CustomerMaterialSubGroup } from "@/lib/customer-material-catalog";
import { getDirectoryMechanicalProperties, materialMechanicalProperties, type MaterialMechanicalProperties } from "@/lib/material-grade-properties";

type GradeProfile = {
  applications: string;
  forms: string;
  functionalTraits?: {
    chemicalResistance: string;
    heatTolerance: string;
    moistureResponse: string;
    wearFriction: string;
  };
  machinability: "Difficult" | "Fair" | "Good" | "Review" | "Unspecified";
  machinabilitySourceLabel?: string;
  machinabilitySourceUrl?: string;
  selectionGuidance: string;
  temper: string;
  uns: string | null;
};

const unavailableMechanicalProperties: MaterialMechanicalProperties = {
  condition: "Exact condition not yet sourced",
  density: "—",
  elongation: "—",
  hardness: "—",
  sourceLabel: "Source needed",
  sourceUrl: "",
  tensileStrength: "—",
  yieldStrength: "—",
};

function mechanicalPropertiesForGrade(familyName: string, grade: string, condition?: CustomerMaterialCondition) {
  const propertyGrade = condition?.grade ?? grade;

  return getDirectoryMechanicalProperties(familyName, propertyGrade)
    ?? materialMechanicalProperties[displayGradeName(propertyGrade)]
    ?? unavailableMechanicalProperties;
}

const seriesProfiles: Record<string, Omit<GradeProfile, "temper" | "uns">> = {
  "1000 series": {
    applications: "Electrical, thermal, and highly formable components.",
    forms: "Sheet, plate, bar",
    machinability: "Fair",
    selectionGuidance: "Consider when conductivity and formability matter more than structural strength.",
  },
  "2000 series": {
    applications: "Aircraft structures, tooling, and fatigue-loaded components.",
    forms: "Plate, sheet, bar",
    machinability: "Good",
    selectionGuidance: "High-strength family; confirm corrosion protection, joining method, and temper requirements.",
  },
  "3000 series": {
    applications: "Formed sheet, enclosures, and general-purpose components.",
    forms: "Sheet, plate",
    machinability: "Fair",
    selectionGuidance: "Often considered for formed sheet applications where moderate strength is sufficient.",
  },
  "5000 series": {
    applications: "Marine, welded, and corrosion-resistant assemblies.",
    forms: "Sheet, plate, bar",
    machinability: "Fair",
    selectionGuidance: "Confirm the required temper and fabrication process, especially for formed or welded parts.",
  },
  "6000 series": {
    applications: "Structural profiles, fixtures, frames, and general CNC parts.",
    forms: "Extrusion, plate, bar, tube",
    machinability: "Good",
    selectionGuidance: "A versatile family for machined and extruded components; select the temper around strength and forming needs.",
  },
  "7000 series": {
    applications: "Aerospace, tooling, and high-load lightweight components.",
    forms: "Plate, bar, forgings",
    machinability: "Fair",
    selectionGuidance: "Confirm corrosion protection, stress-corrosion requirements, and temper before release.",
  },
  "Casting and tooling plate": {
    applications: "Cast components, fixtures, jigs, and dimensionally stable tooling.",
    forms: "Casting, tooling plate",
    machinability: "Good",
    selectionGuidance: "Review flatness, porosity, surface-finish, and dimensional-stability requirements with the process.",
  },
  "Other grades": {
    applications: "Application-specific aluminum components.",
    forms: "Project-specific forms",
    machinability: "Review",
    selectionGuidance: "Confirm designation, temper, stock form, and documentation requirements during RFQ review.",
  },
};

const groupDescriptions: Record<string, string> = {
  "1000 series": "Commercially pure aluminum with excellent conductivity and formability.",
  "2000 series": "Copper-alloyed grades used where high strength and fatigue performance matter.",
  "3000 series": "Manganese-alloyed grades suited to formed sheet and general fabrication.",
  "5000 series": "Magnesium-alloyed grades with strong corrosion resistance and weldability.",
  "6000 series": "Magnesium-silicon alloys balancing strength, corrosion resistance, and extrudability.",
  "7000 series": "Zinc-alloyed grades for high-strength and weight-sensitive applications.",
  "Casting and tooling plate": "Grades intended for cast geometry or stable tooling and fixture plate.",
  "Other grades": "Additional designations that require application and availability review.",
};

const stainlessMachinabilitySources = {
  austenitic: "https://www.outokumpu.com/-/media/files/products/prodec/outokumpu-machining-guideline-for-prodec-304.pdf",
  duplex: "https://www.outokumpu.com/sv-se/products/product-ranges/-/media/files/products/forta/outokumpu-machining-guidelines-for-forta-dx2205.pdf?modified=20171103133321&revision=f68efe4c-f965-4d52-aee4-ca061300a6e1",
  freeMachining: "https://www.carpentertechnology.com/alloy-finder/416",
} as const;

const mildSteelMachinabilitySources = {
  a36: "https://www.beams-steel.com/info/what-is-the-machinability-rating-of-astm-a36i-103239907.html",
  carbon: "https://www.matweb.com/search/datasheet.aspx?matguid=10b74ebc27344380ab16b1b69f1cffbb&n=1",
  en10025: "https://gangsteel.net/uploads/soft/150729/EN10025-2.pdf",
  grade1018: "https://www.matweb.com/search/datasheet_print.aspx?matguid=3a9cc570fbb24d119f08db22a53e2421",
  grade1045: "https://asia.matweb.com/search/SpecificMaterialPrint.asp?bassnum=m1045a",
} as const;

function displayGradeName(grade: string) {
  return grade.replace(/ Aluminum$/i, "");
}

function temperForGrade(grade: string) {
  return grade.match(/-(T\d+|H\d+)/i)?.[1]?.toUpperCase() ?? "As listed";
}

const unsByDesignation: Array<[RegExp, string]> = [
  [/\b1070\b/i, "A91070"],
  [/\b2007\b/i, "A92007"],
  [/\b2014\b/i, "A92014"],
  [/\b2017\b/i, "A92017"],
  [/\b2024\b/i, "A92024"],
  [/\b3003\b/i, "A93003"],
  [/\b5052\b/i, "A95052"],
  [/\b5083\b/i, "A95083"],
  [/\b5754\b/i, "A95754"],
  [/\b6060\b/i, "A96060"],
  [/\b6061\b/i, "A96061"],
  [/\b6063\b/i, "A96063"],
  [/\b6082\b/i, "A96082"],
  [/\b7050\b/i, "A97050"],
  [/\b7075\b/i, "A97075"],
];

function unsForGrade(grade: string) {
  return unsByDesignation.find(([designation]) => designation.test(grade))?.[1] ?? null;
}

function stainlessProfile(groupName: string, grade: string): GradeProfile {
  const freeMachining = /\b303\b|303Se|303Sulf|\b416\b|430F|1\.4305|1\.4005/i.test(grade);
  const duplex = /Duplex|\b2205\b|\b2507\b|S31803|S32205|S32760|\bF51\b|\bF55\b/i.test(grade);
  const precipitationHardening = /13-8|15-5|17-4|\b630\b|Custom 455|\bPH\b/i.test(grade);
  const martensitic = /20Cr13|40Cr13|\b410\b|\b420\b|\b431\b|440C/i.test(grade);
  const source = freeMachining
    ? stainlessMachinabilitySources.freeMachining
    : duplex
      ? stainlessMachinabilitySources.duplex
      : stainlessMachinabilitySources.austenitic;

  // Sources are retained here to keep each visible rating traceable while the
  // catalog's property repository is expanded. They are not customer claims.
  void source;

  if (freeMachining) {
    return { applications: "Turned fittings, shafts, fasteners, and precision components.", forms: "Bar, rod, wire", machinability: "Good", selectionGuidance: "Free-machining grades are efficient for turned parts; confirm corrosion, welding, and final-condition requirements.", temper: "As listed", uns: null };
  }
  if (duplex) {
    return { applications: "Chloride-service process equipment, marine hardware, pressure systems, and structural components.", forms: "Plate, bar, tube", machinability: "Difficult", selectionGuidance: "Higher strength and work hardening require rigid setups, sharp tooling, and controlled heat during machining.", temper: "As listed", uns: null };
  }
  if (precipitationHardening) {
    return { applications: "High-strength corrosion-resistant hardware, shafts, valve components, and aerospace parts.", forms: "Bar, plate, forgings", machinability: "Fair", selectionGuidance: "Final heat-treatment condition governs strength and machining behavior; specify the required condition.", temper: "As listed", uns: null };
  }
  if (martensitic) {
    return { applications: "Shafts, wear components, valve parts, fasteners, and hardenable corrosion-resistant hardware.", forms: "Bar, plate, forgings", machinability: "Fair", selectionGuidance: "Confirm annealed versus hardened condition before machining; hardness and final heat treatment substantially change results.", temper: "As listed", uns: null };
  }
  if (groupName === "Specialty stainless") {
    return { applications: "Corrosion-, heat-, wear-, or galling-resistant specialty components.", forms: "Plate, bar, tube", machinability: "Fair", selectionGuidance: "Confirm the governing specification and service environment because specialty grades vary materially by designation and condition.", temper: "As listed", uns: null };
  }
  return { applications: "Corrosion-resistant fabricated components, process equipment, fittings, and general industrial parts.", forms: "Plate, sheet, bar, tube", machinability: "Fair", selectionGuidance: "Austenitic stainless work hardens; use appropriate tooling, feeds, and coolant for the specified stock form.", temper: "As listed", uns: null };
}

function mildSteelProfile(grade: string): GradeProfile {
  const coldDrawn1018 = /1018|1018S/i.test(grade);
  const lowCarbon = /1010|1020|Steel 20#|S15C|C22/i.test(grade);
  const mediumCarbon = /1045|45#/i.test(grade);
  const structural = /A36|Q235|SS400|S355|FE510/i.test(grade);
  const source = coldDrawn1018
    ? mildSteelMachinabilitySources.grade1018
    : mediumCarbon
      ? mildSteelMachinabilitySources.grade1045
      : structural
        ? mildSteelMachinabilitySources.a36
        : mildSteelMachinabilitySources.carbon;

  // Ratings map stated source conditions to the intentionally simple directory
  // scale; unclassified stock and coatings remain blank rather than inferred.
  void source;

  if (coldDrawn1018) {
    return { applications: "Shafts, pins, spacers, fixtures, and general machined components.", forms: "Cold-drawn bar, rod", machinability: "Good", selectionGuidance: "The 70% AISI 1212-reference rating applies to cold-drawn 1018. Confirm the supplied condition before programming production work.", temper: "Cold-drawn", uns: "G10180" };
  }
  if (lowCarbon) {
    return { applications: "Pins, shafts, brackets, general hardware, and case-hardened components.", forms: "Cold-rolled or hot-rolled bar, sheet", machinability: "Good", selectionGuidance: "Typical 1020 cold-rolled reference is 65% relative to AISI 1212. Chip control and finish vary with stock condition.", temper: "As listed", uns: /1020/i.test(grade) ? "G10200" : null };
  }
  if (mediumCarbon) {
    return { applications: "Shafts, gears, machine parts, and induction-hardened wear components.", forms: "Bar, plate, forgings", machinability: "Fair", selectionGuidance: "The cited cold-drawn 1045 condition is 55% relative to AISI 1212. Machining response changes substantially with heat treatment.", temper: "As listed", uns: "G10450" };
  }
  if (structural || /44W/i.test(grade)) {
    return { applications: "Frames, brackets, base plates, weldments, and structural machine components.", forms: "Plate, section, bar", machinability: "Fair", selectionGuidance: "A36 is commonly cited around 72% relative to AISI 1212; EN 10025 notes that S355 is machinable but ductility can affect chip formation and finish. Confirm surface scale and mill condition.", temper: "As rolled / as listed", uns: /A36/i.test(grade) ? "K02600" : null };
  }
  return {
    applications: "Mild-steel components selected for the required service environment and application.",
    forms: "Stock form confirmed during RFQ review",
    machinability: "Unspecified",
    selectionGuidance: "No grade-and-condition-specific machinability reference has been mapped for this listing. Confirm the exact specification and stock form during RFQ review.",
    temper: "As listed",
    uns: null,
  };
}

function sourcedProfile(
  familyName: string,
  machinability: GradeProfile["machinability"],
  sourceLabel: string,
  sourceUrl: string,
  selectionGuidance: string,
  forms = "Stock form confirmed during RFQ review",
): GradeProfile {
  return {
    applications: `${familyName} components selected for the required service environment and application.`,
    forms,
    machinability,
    machinabilitySourceLabel: sourceLabel,
    machinabilitySourceUrl: sourceUrl,
    selectionGuidance,
    temper: "As listed",
    uns: null,
  };
}

function brassProfile(grade: string): GradeProfile {
  if (/360|C3600|CuZn39Pb3/i.test(grade)) return sourcedProfile("Brass", "Good", "Copper Development Association", "https://copper.org/environment/water/NACE02122/nace02122b.php", "Free-machining brass is the preferred choice for high-volume turned parts. Confirm lead restrictions and the required product form.", "Rod, bar, profile");
  if (/260/i.test(grade)) return sourcedProfile("Brass", "Fair", "Copper Development Association", "https://alloys.copper.org/alloy/C26000", "Cartridge brass is readily fabricated, but its machining response depends on temper and lead content.", "Sheet, plate, bar");
  return { applications: "Brass components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "No condition-specific machinability reference has been mapped for this generic or regional designation.", temper: "As listed", uns: null };
}

function copperProfile(grade: string): GradeProfile {
  if (/C110|Copper 110|Red Copper|Copper 101|C101|\bT2\b/i.test(grade)) return sourcedProfile("Copper", "Difficult", "Copper Development Association", "https://copper.org/publications/newsletters/innovations/2001/08/intro_toc.php", "High-purity copper is ductile and tends to form continuous chips; use sharp tooling and suitable support.", "Bar, plate, sheet");
  if (/C932|Bronze 932/i.test(grade)) return sourcedProfile("Copper", "Good", "Copper Development Association", "https://alloys.copper.org/alloy/C93200", "Bearing bronze is a comparatively machining-friendly copper alloy. Confirm the casting specification and finish requirement.", "Casting, bar");
  return { applications: "Copper-alloy components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "No exact alloy-and-temper machinability reference has been mapped for this listing.", temper: "As listed", uns: null };
}

function alloySteelProfile(grade: string): GradeProfile {
  if (/4130/i.test(grade)) return sourcedProfile("Alloy steel", "Good", "ASM / MatWeb 4130 reference", "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=m4130r", "The cited annealed/cold-drawn 4130 condition is about 70% relative to B1112; heat treatment changes the result.", "Bar, plate, tube");
  if (/4140 Annealed|4140 Steel|Steel 4140|42CD4|42CrMoS4/i.test(grade)) return sourcedProfile("Alloy steel", "Good", "4140 product data", "https://www.vanguardsteelvancouver.com/Publish/Images/Cat/Steel_Manua_Single_Pages/Steel_Product_Sheets_4140.pdf", "The cited annealed condition is about 66% relative to B1112. Specify normalization or heat treatment separately.", "Bar, plate, forgings");
  if (/4140 Normalized|4340|E4340|EN19|34CrNiMo6|16MnCr|9310|30CrNiMo8/i.test(grade)) return sourcedProfile("Alloy steel", "Fair", "NASA alloy-steel machining data", "https://ntrs.nasa.gov/api/citations/19680011772/downloads/19680011772.pdf", "This rating assumes the listed annealed or normalized stock condition; quench-and-temper or carburized parts require a separate machining plan.", "Bar, plate, forgings");
  if (/300M|4330 Mod|52100/i.test(grade)) return sourcedProfile("Alloy steel", "Difficult", "Carpenter 52100 technical data", "https://www.carpentertechnology.com/hubfs/7407324/Material%20Saftey%20Data%20Sheets/52100.pdf", "High-strength or high-carbide conditions require rigid setups and condition-specific cutting data.", "Bar, forgings");
  if (/17-4PH H900/i.test(grade)) return sourcedProfile("Alloy steel", "Fair", "17-4 PH H900 reference data", "https://www.matweb.com/search/QuickText.aspx?SearchText=17-4%20PH%20H900", "The H900 precipitation-hardened condition requires a rigid setup and condition-specific cutting data.", "Bar, plate, forgings");
  if (/6150/i.test(grade)) return sourcedProfile("Alloy steel", "Good", "6150 machining data", "https://www.machiningdoctor.com/mds/?matId=570", "The published annealed condition is near 60% relative machinability; confirm supplied hardness.", "Bar, spring stock");
  if (/1\.2312/i.test(grade)) return sourcedProfile("Alloy steel", "Good", "Meusburger 1.2312 data", "https://ecom.meusburger.com/files/pdf/mat/2312_20.pdf", "Sulfur-modified pre-toughened mold steel is intended for improved machinability; confirm its supplied hardness.", "Pre-hardened block, plate");
  if (/1\.0737|Toolox 33/i.test(grade)) return sourcedProfile("Alloy steel", "Good", "SSAB Toolox machining guidance", "https://websitecdn.ssab.com/-/media/files/en/toolox/630entoolox-once-toolox-always-toolox-v12020aplusmweb.pdf", "This product family is designed for stable machining in its delivered condition.", "Bar, plate");
  return { applications: "Alloy-steel components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "No exact grade-and-condition machinability source has been mapped for this listing.", temper: "As listed", uns: null };
}

function toolSteelProfile(grade: string): GradeProfile {
  if (/A2/i.test(grade)) return sourcedProfile("Tool steel", "Fair", "Carpenter A2 technical data", "https://www.alphaknifesupply.com/Pictures/Info/Steel/A2-DS-Carpenter.pdf", "Annealed A2 is documented around 40–50% relative to B1112; hardening state materially changes cutting behavior.", "Annealed bar, plate");
  if (/SKD11|X160|Z160/i.test(grade)) return sourcedProfile("Tool steel", "Difficult", "D2 annealed machining guidance", "https://www.pmtsco.com/d2-annealed", "High-carbon/high-chromium die-steel chemistry requires rigid tooling even when annealed.", "Annealed bar, plate");
  if (/O1|1\.2510|100MnCrW4/i.test(grade)) return sourcedProfile("Tool steel", "Good", "Latrobe O1 technical data", "https://www.alphaknifesupply.com/Pictures/Info/Steel/O1-DS-Latrobe.pdf", "Annealed O1 is documented at 85–90% of a 1% carbon-steel reference; heat treatment must be specified.", "Annealed bar, plate");
  if (/M2/i.test(grade)) return sourcedProfile("Tool steel", "Fair", "M2 high-speed steel data", "https://www.argentsteel.co.uk/index.php/steel-specifications/m2-high-speed-steel/bs-m2-data-page", "Use the cited annealed condition; high-speed steel becomes significantly more demanding after hardening.", "Annealed bar");
  if (/1\.2085/i.test(grade)) return sourcedProfile("Tool steel", "Good", "HSM 1.2085 product data", "https://www.hsm-stahl.de/en/werkstoff/12085/", "Sulfur-bearing mold steel is supplied for improved machinability; confirm its delivered hardness.", "Pre-tempered block, plate");
  if (/1215|12L14|1\.0718/i.test(grade)) return sourcedProfile("Tool steel", "Good", "Free-cutting steel classification", "https://stilma.it/en/prodotti/free-cutting-steels/", "Free-machining bar stock is suitable for turned work; confirm finish and plating needs.", "Cold-drawn bar");
  return { applications: "Tool-steel components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "No exact grade-and-condition machinability source has been mapped for this listing.", temper: "As listed", uns: null };
}

function titaniumProfile(grade: string): GradeProfile {
  if (/^Titanium$/i.test(grade)) return { applications: "Titanium components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "The generic Titanium label does not establish a grade, interstitial chemistry, or product form.", temper: "As listed", uns: null };
  return sourcedProfile("Titanium", "Difficult", "TIMET Design and Fabrication Guide", "https://www.timet.com/assets/local/documents/technicalmanuals/DesignandFabrication.pdf", "Titanium requires controlled heat, positive feed, and rigid setups. Alloy grades generally require lower cutting speed than commercially pure titanium.", "Bar, plate, tube, forgings");
}

function nickelProfile(grade: string): GradeProfile {
  if (/^Alloy X$|Nimonic 300/i.test(grade)) return { applications: "Nickel-alloy components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "This listing is ambiguous or has no named-grade machining reference in the current source set.", temper: "As listed", uns: null };
  if (/Alloy 601|Inconel 601/i.test(grade)) return sourcedProfile("Nickel alloy", "Good", "Special Metals INCONEL 601 bulletin", "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-601.pdf", "Standard operations are supported; the producer recommends solution-treated material for best machining response.", "Bar, plate, sheet, tube");
  if (/Alloy 800|Incoloy 800|Incoloy 825/i.test(grade)) return sourcedProfile("Nickel alloy", "Good", "Special Metals INCOLOY technical bulletin", "https://www.specialmetals.com/documents/technical-bulletins/incoloy/incoloy-alloy-800h-800ht.pdf", "The cited INCOLOY families can be machined with standard methods; use the producer’s heat and tool-life guidance.", "Bar, plate, sheet, tube");
  if (/Alloy 600|Inconel 600|Alloy 400|Monel 400|Nickel 200|Nickel 201|Alloy 200|Alloy 201|A286|Incoloy A-286|Invar|Kovar/i.test(grade)) return sourcedProfile("Nickel alloy", "Fair", "Special Metals NILO / nickel machining guidance", "https://www.specialmetals.com/documents/technical-bulletins/nilo-alloys.pdf", "Use sharp tooling, rigid support, and a condition-aware setup; chips can be stringy or gummy in annealed material.", "Bar, plate, sheet, tube");
  return sourcedProfile("Nickel alloy", "Difficult", "Special Metals nickel-alloy technical bulletins", "https://www.specialmetals.com/documents/technical-bulletins/", "High-strength, work-hardening, or precipitation-hardened nickel alloys require rigid setups, positive feed, and heat control. Confirm the supplied condition before release.", "Bar, plate, sheet, tube, forgings");
}

function precisionAlloyProfile(grade: string): GradeProfile {
  if (/Inconel 625/i.test(grade)) return sourcedProfile("Precision alloy", "Difficult", "Special Metals INCONEL 625 bulletin", "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-625.pdf", "Nickel-alloy work hardening requires rigid setups, positive feed, and heat control.", "Bar, plate, sheet, tube");
  if (/Invar|Kovar/i.test(grade)) return sourcedProfile("Precision alloy", "Fair", "Special Metals NILO technical bulletin", "https://www.specialmetals.com/documents/technical-bulletins/nilo-alloys.pdf", "Controlled-expansion nickel alloys machine similarly to austenitic stainless; use rigid sharp tooling and the stated annealed condition.", "Strip, bar, plate");
  return { applications: "Precision-alloy components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "No exact grade-and-final-anneal machining source has been mapped for this magnetic-alloy designation.", temper: "As listed", uns: null };
}

function magnesiumZincProfile(grade: string): GradeProfile {
  if (/AZ31|AZ91|AM60/i.test(grade)) return sourcedProfile("Magnesium alloy", "Good", "Magnesium-alloy machining review", "https://ir.unikl.edu.my/jspui/handle/123456789/25843", "Magnesium alloys can machine very efficiently, but chip evacuation, ignition prevention, and coolant selection are mandatory process controls.", "Plate, bar, casting");
  return { applications: "Magnesium / zinc components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", machinability: "Unspecified", selectionGuidance: "No exact grade-and-form machinability source has been mapped for this casting, zinc, or generic designation.", temper: "As listed", uns: null };
}

function plasticProfile(grade: string): GradeProfile {
  const filledOrLaminate = /GF|Glass Filled|Carbon Fibre|Fibre glass|FR4|Garolite/i.test(grade);
  const difficult = /PTFE|Teflon|UHMW/i.test(grade) || filledOrLaminate;
  const fair = /Nylon|\bPA\b|PA12|HDPE|\bPE\b|\bPP\b|PVDF|Torlon|ESD|100 AF/i.test(grade);
  const missing = /ASTM D6100|Bakelite|EPDM|Overmolded|Photopolymer|PU8150|PU8400|PX233|PX521|PX527/i.test(grade);
  if (missing) return { applications: "Polymer components selected for the required service environment and application.", forms: "Stock form confirmed during RFQ review", functionalTraits: { heatTolerance: "Confirm", moistureResponse: "Confirm", chemicalResistance: "Confirm", wearFriction: "Confirm" }, machinability: "Unspecified", selectionGuidance: "This is a standard, elastomer, proprietary resin, or multi-material assembly without one traceable machining condition.", temper: "As listed", uns: null };
  const rating = difficult ? "Difficult" : fair ? "Fair" : "Good";
  return {
    ...sourcedProfile("Polymer", rating, "Ensinger machining-material guidance", "https://www.ensingerplastics.com/en-us/machining/machining-materials", filledOrLaminate ? "Fiber-filled and laminate stock is abrasive and needs material-specific tooling and dust control." : difficult ? "Low stiffness, heat sensitivity, or chip control make this polymer more demanding to machine." : fair ? "Modified, hygroscopic, or lower-stiffness polymers need condition-aware workholding and thermal control." : "This polymer family is generally well suited to conventional machining; confirm filler, grade, and stress-relief needs.", "Plate, rod, tube"),
    functionalTraits: functionalTraitsForPlastic(grade),
  };
}

function functionalTraitsForPlastic(grade: string): NonNullable<GradeProfile["functionalTraits"]> {
  if (/PEEK|PEI|ULTEM|Torlon/i.test(grade)) return { heatTolerance: "High", moistureResponse: "Low", chemicalResistance: "Good", wearFriction: "Good" };
  if (/PPSU|PPS/i.test(grade)) return { heatTolerance: "High", moistureResponse: "Low", chemicalResistance: "Good", wearFriction: "Moderate" };
  if (/PTFE|Teflon/i.test(grade)) return { heatTolerance: "High", moistureResponse: "Very low", chemicalResistance: "Excellent", wearFriction: "Very low" };
  if (/PVDF|PVC/i.test(grade)) return { heatTolerance: "Medium", moistureResponse: "Low", chemicalResistance: "Excellent", wearFriction: "Moderate" };
  if (/UHMW/i.test(grade)) return { heatTolerance: "Low", moistureResponse: "Low", chemicalResistance: "Good", wearFriction: "Very low" };
  if (/Nylon|\bPA\b/i.test(grade)) return { heatTolerance: "Medium", moistureResponse: "High", chemicalResistance: "Fair", wearFriction: "Good" };
  if (/POM|Acetal|Delrin/i.test(grade)) return { heatTolerance: "Medium", moistureResponse: "Low", chemicalResistance: "Good", wearFriction: "Low" };
  if (/HDPE|Polyethylene|\bPE\b|\bPP\b|Polypropylene/i.test(grade)) return { heatTolerance: "Low", moistureResponse: "Low", chemicalResistance: "Excellent", wearFriction: "Low" };
  if (/PC|Polycarbonate|PMMA|Acrylic|PET|PBT/i.test(grade)) return { heatTolerance: "Medium", moistureResponse: "Low", chemicalResistance: "Fair", wearFriction: "Moderate" };
  if (/GF|Glass Filled|Carbon Fibre|Fibre glass|FR4|Garolite/i.test(grade)) return { heatTolerance: "Medium", moistureResponse: "Low", chemicalResistance: "Good", wearFriction: "Good" };
  return { heatTolerance: "Low", moistureResponse: "Low", chemicalResistance: "Good", wearFriction: "Moderate" };
}

export function profileForGrade(familyName: string, groupName: string, grade: string): GradeProfile {
  const base = seriesProfiles[groupName] ?? seriesProfiles["Other grades"];

  if (familyName === "Aluminum" && /6063-T5/i.test(grade)) {
    return {
      applications: "Architectural extrusions, decorative profiles, handrails, furniture, and electrical enclosures.",
      forms: "Extrusion, tube, bar",
      machinability: "Good",
      selectionGuidance: "Excellent extrudability and surface finish. Confirm whether the lower-strength T5 temper meets the load case.",
      temper: "T5",
      uns: "A96063",
    };
  }

  if (familyName === "Stainless steel") return stainlessProfile(groupName, grade);
  if (familyName === "Mild steel") return mildSteelProfile(grade);
  if (familyName === "Brass") return brassProfile(grade);
  if (familyName === "Copper") return copperProfile(grade);
  if (familyName === "Alloy steel") return alloySteelProfile(grade);
  if (familyName === "Tool steel") return toolSteelProfile(grade);
  if (familyName === "Titanium") return titaniumProfile(grade);
  if (familyName === "Inconel/Incoloy") return nickelProfile(grade);
  if (familyName === "Precision alloys") return precisionAlloyProfile(grade);
  if (familyName === "Magnesium / zinc alloys") return magnesiumZincProfile(grade);
  if (familyName === "Plastics / polymers") return plasticProfile(grade);

  if (familyName !== "Aluminum") {
    return {
      applications: `${familyName} components selected for the required service environment and application.`,
      forms: "Stock form confirmed during RFQ review",
      machinability: "Unspecified",
      selectionGuidance: "Confirm the exact designation, condition, stock form, dimensions, and documentation requirements during RFQ review.",
      temper: "As listed",
      uns: null,
    };
  }

  return { ...base, temper: temperForGrade(grade), uns: unsForGrade(grade) };
}

function MachinabilityScale({ value }: { value: GradeProfile["machinability"] }) {
  const filled = value === "Good" ? 4 : value === "Fair" ? 2 : value === "Difficult" || value === "Review" ? 1 : 0;

  return (
    <div className="mt-2 flex gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <span className={`h-2 w-4 rounded-[2px] border ${index < filled ? "border-[#55575a] bg-[#55575a]" : "border-[#d2d2d0] bg-transparent"}`} key={index} />
      ))}
    </div>
  );
}

function FunctionalTraitRail({ traits }: { traits: NonNullable<GradeProfile["functionalTraits"]> }) {
  return (
    <div className="grid gap-3 border-t border-[#e8e7e4] pt-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {[
        [Thermometer, "Heat tolerance", traits.heatTolerance],
        [Droplets, "Moisture response", traits.moistureResponse],
        [FlaskConical, "Chemical resistance", traits.chemicalResistance],
        [Gauge, "Wear / friction", traits.wearFriction],
      ].map(([Icon, label, value]) => {
        const TraitIcon = Icon as typeof Thermometer;
        return (
          <div className="flex min-w-0 items-center gap-2" key={label as string}>
            <TraitIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-[#787a7d]" strokeWidth={1.7} />
            <p className="text-[12px] leading-5 text-[#67696d]"><span className="text-[#77797d]">{label as string}:</span> <span className="font-medium text-[#4d4f53]">{value as string}</span></p>
          </div>
        );
      })}
    </div>
  );
}

function PlasticDirectoryGradeCard({ grade, profile }: { grade: string; profile: GradeProfile }) {
  if (!profile.functionalTraits) return null;

  return (
    <article className="grid w-full gap-3 border-b border-[#e7e6e3] px-4 py-4 last:border-b-0 md:min-w-[820px] md:grid-cols-[130px_minmax(190px,1.2fr)_minmax(160px,1fr)_150px] md:gap-4">
      <div><p className="text-[14px] font-semibold text-[#242527]">{displayGradeName(grade)}</p><p className="mt-0.5 text-[11px] text-[#77797d]">Designation as listed</p></div>
      <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8c90] md:hidden">Best suited for</span><p className="text-[12px] leading-[18px] text-[#5f6165]">{profile.applications}</p></div>
      <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8c90] md:hidden">Common forms</span><p className="text-[12px] leading-[18px] text-[#5f6165]">{profile.forms}</p></div>
      <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8c90] md:hidden">Machinability</span>{profile.machinability === "Unspecified" ? <p className="text-[12px] text-[#8a8c90]">â€”</p> : <><p className="text-[12px] text-[#505257]">{profile.machinability}</p><MachinabilityScale value={profile.machinability} /></>}</div>
      <div className="md:col-span-4"><FunctionalTraitRail traits={profile.functionalTraits} /></div>
    </article>
  );
}

export function MaterialGradeDirectory({ familyName, groups, totalCount }: { familyName: string; groups: CustomerMaterialSubGroup[]; totalCount: number }) {
  const catalogNoun = familyName === "Aluminum" ? "offerings" : "grades";
  const usesFunctionalTraits = familyName === "Plastics / polymers";
  const [openGroups, setOpenGroups] = useState(() => new Set([familyName === "Aluminum" ? "6000 series" : groups[0]?.name].filter(Boolean)));
  const [expandedGrade, setExpandedGrade] = useState(familyName === "Aluminum" ? "6063 Aluminum" : "");
  const [selectedConditionByGrade, setSelectedConditionByGrade] = useState<Record<string, string>>({});

  const orderedGroups = useMemo(() => {
    const groupOrder = ["6000 series", "5000 series", "7000 series", "2000 series", "3000 series", "1000 series", "Casting and tooling plate", "Other grades"];
    const preferred6000 = ["6060 Aluminum", "6063 Aluminum", "6082 Aluminum"];

    return [...groups]
      .sort((a, b) => familyName === "Aluminum" ? groupOrder.indexOf(a.name) - groupOrder.indexOf(b.name) : 0)
      .map((group) =>
        group.name === "6000 series"
          ? { ...group, grades: [...group.grades].sort((a, b) => {
              const aIndex = preferred6000.indexOf(a);
              const bIndex = preferred6000.indexOf(b);
              if (aIndex >= 0 || bIndex >= 0) return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
              return a.localeCompare(b, undefined, { numeric: true });
            }) }
          : group,
      );
  }, [familyName, groups]);

  function toggleGroup(groupName: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  }

  return (
    <section className="mt-12 scroll-mt-6" id="all-grades" aria-labelledby="all-grades-title">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-[28px] font-semibold tracking-[-0.035em] text-[#202020]" id="all-grades-title">All {familyName.toLowerCase()} {catalogNoun}</h2>
          <span className="text-[13px] font-medium text-[#66686c]">{totalCount} {familyName === "Aluminum" ? "offerings" : "total"}</span>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-[#686a6e]">Availability depends on condition, stock form, dimensions, quantity, and documentation requirements.</p>
        {usesFunctionalTraits ? <p className="mt-2 text-[11px] leading-4 text-[#73757a]">Functional traits are qualitative selection guidance. Confirm the specific resin data sheet during RFQ review.</p> : null}
      </div>

      <div className="mt-5 space-y-3">
        {orderedGroups.map((group) => {
          const isOpen = openGroups.has(group.name);

          return (
            <section className="overflow-hidden rounded-[8px] border border-[#deddda] bg-white" key={group.name}>
              <button aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#fafaf8]" onClick={() => toggleGroup(group.name)} type="button">
                {isOpen ? <ChevronUp aria-hidden="true" className="h-4 w-4 shrink-0" /> : <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />}
                <h3 className="text-[17px] font-semibold text-[#242527]">{group.name}</h3>
                <span className="text-[12px] text-[#717378]">{group.grades.length} {group.grades.length === 1 ? catalogNoun.slice(0, -1) : catalogNoun}</span>
                <p className="ml-auto hidden max-w-[55%] text-right text-[12px] leading-5 text-[#65676b] md:block">{groupDescriptions[group.name] ?? `Available ${familyName.toLowerCase()} designations in this group; exact specification is confirmed during RFQ review.`}</p>
              </button>

              {isOpen ? (
                <div className="border-t border-[#e2e1de]">
                  <div className="overflow-x-auto">
                    <div className="hidden min-w-[820px] grid-cols-[130px_minmax(190px,1.2fr)_minmax(160px,1fr)_150px] gap-4 border-b border-[#e2e1de] px-4 py-3 text-[11px] font-semibold text-[#353639] md:grid">
                      <span>{familyName === "Aluminum" ? "Alloy offering" : "Grade"}</span><span>Best suited for</span><span>Common forms</span><span>Machinability</span>
                    </div>

                    {group.grades.map((grade) => {
                    const profile = profileForGrade(familyName, group.name, grade);
                    const conditions = group.conditionsByGrade?.[grade] ?? [];
                    const selectedCondition = conditions.find((condition) => condition.grade === selectedConditionByGrade[grade]) ?? conditions[0];
                    const mechanicalProperties = mechanicalPropertiesForGrade(familyName, grade, selectedCondition);
                    const isExpanded = expandedGrade === grade;

                    if (usesFunctionalTraits && profile.functionalTraits) {
                      return <PlasticDirectoryGradeCard grade={grade} key={`${group.name}-${grade}`} profile={profile} />;
                    }

                    return (
                      <article className="border-b border-[#e7e6e3] last:border-b-0" key={`${group.name}-${grade}`}>
                        <button aria-expanded={isExpanded} className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[#fafaf8] md:min-w-[820px] md:grid-cols-[130px_minmax(190px,1.2fr)_minmax(160px,1fr)_150px] md:gap-4" onClick={() => setExpandedGrade(isExpanded ? "" : grade)} type="button">
                          <div className="pr-6 md:pr-0"><p className="text-[14px] font-semibold text-[#242527]">{displayGradeName(grade)}</p><p className="mt-0.5 text-[11px] text-[#77797d]">{profile.uns ? `UNS ${profile.uns}` : familyName === "Aluminum" ? "UNS pending verification" : "Designation as listed"}</p>{familyName === "Aluminum" ? <p className="mt-1 text-[11px] font-medium text-[#5f6165]">{conditions.length > 0 ? `Available: ${conditions.map((condition) => condition.label).join(" · ")}` : "Condition confirmed in RFQ"}</p> : null}</div>
                          <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8c90] md:hidden">Best suited for</span><p className="text-[12px] leading-[18px] text-[#5f6165]">{profile.applications}</p></div>
                          <div><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8c90] md:hidden">Common forms</span><p className="text-[12px] leading-[18px] text-[#5f6165]">{profile.forms}</p></div>
                          <div className="relative"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8c90] md:hidden">Machinability</span>{profile.machinability === "Unspecified" ? <p className="text-[12px] text-[#8a8c90]">—</p> : <><p className="text-[12px] text-[#505257]">{profile.machinability}</p><MachinabilityScale value={profile.machinability} /></>}{isExpanded ? <ChevronUp aria-hidden="true" className="absolute right-0 top-0 h-4 w-4" /> : <ChevronDown aria-hidden="true" className="absolute right-0 top-0 h-4 w-4" />}</div>
                        </button>

                        {isExpanded ? (
                          <div className="mx-3 mb-3 rounded-[6px] border border-[#deddda] bg-[#f5f4f1] px-4 py-4 md:min-w-[796px] md:px-5">
                            <div className="grid gap-5 md:grid-cols-2 md:gap-8">
                              <div><p className="text-[11px] font-medium text-[#4d4f53]">Typical applications</p><p className="mt-1 text-[12px] leading-[18px] text-[#626469]">{profile.applications}</p></div>
                              <div><p className="text-[11px] font-medium text-[#4d4f53]">Selection guidance</p><p className="mt-1 text-[12px] leading-[18px] text-[#626469]">{profile.selectionGuidance}</p></div>
                            </div>

                            {familyName === "Aluminum" ? (
                              <div className="mt-5 border-t border-[#d9d8d5] pt-4">
                                <p className="text-[11px] font-medium text-[#4d4f53]">Available condition{conditions.length === 1 ? "" : "s"}</p>
                                {conditions.length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-2" aria-label={`${displayGradeName(grade)} available conditions`}>
                                    {conditions.map((condition) => {
                                      const isSelected = selectedCondition?.grade === condition.grade;
                                      return <button className={`rounded-[5px] border px-2.5 py-1 text-[11px] font-medium transition ${isSelected ? "border-[#46474a] bg-[#46474a] text-white" : "border-[#d2d1ce] bg-white text-[#4d4f53] hover:border-[#a9a8a4]"}`} key={condition.grade} onClick={() => setSelectedConditionByGrade((current) => ({ ...current, [grade]: condition.grade }))} type="button">{condition.label}</button>;
                                    })}
                                  </div>
                                ) : <p className="mt-1 text-[12px] leading-[18px] text-[#626469]">The network supports this alloy, but the supplied condition is confirmed against the drawing, stock form, and RFQ requirements.</p>}
                              </div>
                            ) : null}

                            {profile.machinabilitySourceUrl ? <p className="mt-4 text-[10px] leading-[15px] text-[#73757a]">Machinability reference: <a className="underline underline-offset-2 hover:text-[#404246]" href={profile.machinabilitySourceUrl} rel="noreferrer" target="_blank">{profile.machinabilitySourceLabel}</a>.</p> : null}

                            {!usesFunctionalTraits ? <div className="mt-5 border-t border-[#d9d8d5] pt-4">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><p className="text-[12px] font-semibold text-[#343538]">Reference mechanical properties</p><p className="text-[10px] text-[#73757a]">{selectedCondition ? `${selectedCondition.label} typical values` : mechanicalProperties.condition}</p></div>
                              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-[#d6d5d2] bg-[#d6d5d2] md:hidden">
                                {[
                                  ["Yield strength", mechanicalProperties.yieldStrength],
                                  ["Tensile strength", mechanicalProperties.tensileStrength],
                                  ["Elongation at break", mechanicalProperties.elongation],
                                  ["Hardness", mechanicalProperties.hardness],
                                  ["Density", mechanicalProperties.density],
                                ].map(([label, value]) => (
                                  <div className="bg-[#f5f4f1] p-3 last:col-span-2" key={label}><dt className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[#66686c]">{label}</dt><dd className="mt-1 text-[12px] font-medium text-[#303235]">{value}</dd></div>
                                ))}
                              </dl>
                              <div className="mt-3 hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[700px] table-fixed border-collapse text-left">
                                  <thead>
                                    <tr className="border-b border-[#d6d5d2] text-[10px] font-semibold leading-[15px] text-[#505257]">
                                      <th className="px-3 pb-2 first:pl-0">Yield strength</th>
                                      <th className="px-3 pb-2">Tensile strength</th>
                                      <th className="px-3 pb-2">Elongation at break</th>
                                      <th className="px-3 pb-2">Hardness</th>
                                      <th className="px-3 pb-2 last:pr-0">Density</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="text-[12px] font-medium text-[#303235]">
                                      <td className="px-3 py-3 first:pl-0">{mechanicalProperties.yieldStrength}</td>
                                      <td className="px-3 py-3">{mechanicalProperties.tensileStrength}</td>
                                      <td className="px-3 py-3">{mechanicalProperties.elongation}</td>
                                      <td className="px-3 py-3">{mechanicalProperties.hardness}</td>
                                      <td className="px-3 py-3 last:pr-0">{mechanicalProperties.density}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                              <p className="border-t border-[#d9d8d5] pt-2 text-[10px] leading-[15px] text-[#73757a]">
                                {mechanicalProperties.sourceUrl ? <>Typical values for the stated reference condition only—not design allowables or certification. <a className="underline underline-offset-2 hover:text-[#404246]" href={mechanicalProperties.sourceUrl} rel="noreferrer" target="_blank">{mechanicalProperties.sourceLabel}</a>.</> : <>Reference values are not shown until this exact condition is sourced. {mechanicalProperties.sourceLabel}.</>}
                              </p>
                            </div> : <p className="mt-5 border-t border-[#d9d8d5] pt-4 text-[10px] leading-[15px] text-[#73757a]">Functional characteristics vary by resin grade, filler, and service environment. Confirm the specific resin data sheet during RFQ review.</p>}
                          </div>
                        ) : null}
                      </article>
                    );
                    })}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

    </section>
  );
}
