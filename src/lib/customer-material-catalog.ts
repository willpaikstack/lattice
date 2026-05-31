import { materials, type CatalogEntry } from "./catalog-data";
import { vendorMaterialOfferings, type MaterialOfferingCategory } from "./vendor-materials";

export type CustomerMaterialSubGroup = {
  name: string;
  grades: string[];
};

export type CustomerMaterialCatalogEntry = CatalogEntry & {
  materialGroups: CustomerMaterialSubGroup[];
};

function unique(values: string[]) {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function gradesFor(category: MaterialOfferingCategory) {
  return unique(vendorMaterialOfferings.filter((offering) => offering.category === category).flatMap((offering) => offering.grades));
}

function groupGrades(grades: string[], groups: { name: string; matches: (grade: string) => boolean }[]) {
  const used = new Set<string>();
  const grouped = groups
    .map((group) => {
      const matched = grades.filter((grade) => !used.has(grade) && group.matches(grade));
      matched.forEach((grade) => used.add(grade));

      return { name: group.name, grades: matched };
    })
    .filter((group) => group.grades.length > 0);
  const other = grades.filter((grade) => !used.has(grade));

  return other.length > 0 ? [...grouped, { name: "Other grades", grades: other }] : grouped;
}

function existing(slug: string) {
  const material = materials.find((entry) => entry.slug === slug);

  if (!material) {
    throw new Error(`Missing material catalog entry: ${slug}`);
  }

  return material;
}

const aluminumGrades = gradesFor("Aluminum");
const steelGrades = gradesFor("Carbon / Alloy Steel");
const stainlessGrades = gradesFor("Stainless Steel");
const nickelGrades = gradesFor("Nickel / Cobalt Alloy");
const precisionGrades = gradesFor("Controlled Expansion / Precision Alloy");
const titaniumGrades = gradesFor("Titanium");
const copperFamilyGrades = gradesFor("Copper / Brass / Bronze");
const magnesiumZincGrades = gradesFor("Magnesium / Zinc");
const plasticGrades = gradesFor("Plastics / Polymers");

const mildSteelNames = /(1010|1018|1018S|1020|1045|20#|45#|Q235|S355|S355J2|S355JR|SS400|FE510|44W|AISI 1010|S15C|SPCC|SPHC|SGCC|SECC|SPTE|C22|1\.033)/i;
const alloySteelNames = /(4130|4140|4340|42CD4|40Cr|16Mn|18Cr|EN19|300M|4330|52100|6150|9310|E9310|E4340|Toolox|17-4PH H900|1\.0737)/i;
const toolSteelNames = /(A2 Steel|SKD11|ST TOOL M2|X160CrMoV12|Z160CVD12|1\.2085|1\.2510|100MnCrW4|1\.0718|12L14|1215|Steel 12L14)/i;

export const customerMaterialCatalog: CustomerMaterialCatalogEntry[] = [
  {
    ...existing("aluminum"),
    materialGroups: groupGrades(aluminumGrades, [
      { name: "1000 series", matches: (grade) => /\b1070\b/.test(grade) },
      { name: "2000 series", matches: (grade) => /\b2A12\b|\b2A14\b|\b2014\b|\b2017\b|\b2024\b/.test(grade) },
      { name: "3000 series", matches: (grade) => /\b3003\b/.test(grade) },
      { name: "5000 series", matches: (grade) => /\b5052\b|\b5083\b/.test(grade) },
      { name: "6000 series", matches: (grade) => /\b6060\b|\b6061\b|\b6063\b|\b6082\b/.test(grade) },
      { name: "7000 series", matches: (grade) => /\b7075\b/.test(grade) },
      { name: "Casting and tooling plate", matches: (grade) => /MIC-6|A413/i.test(grade) },
    ]),
  },
  {
    ...existing("stainless-steel"),
    materialGroups: groupGrades(stainlessGrades, [
      { name: "300 series austenitic", matches: (grade) => /\b30[12349]\b|304|304L|304H|310|310S|316|316L|316H|316Ti|321|330|347|347H|18-8/i.test(grade) },
      { name: "400 series martensitic/ferritic", matches: (grade) => /\b40|410|416|420|430|431|440|1\.4005|1\.4305|20Cr13|40Cr13/i.test(grade) },
      { name: "Precipitation hardening", matches: (grade) => /13-8|15-5|17-4|630|Custom 455|PH/i.test(grade) },
      { name: "Duplex and super duplex", matches: (grade) => /Duplex|F51|F55|2205|2507|Z100|S32760|S31803|S32205/i.test(grade) },
      { name: "Specialty stainless", matches: (grade) => /Nitronic|904L|Alloy 20|253MA|254SMO|817M40T|1\.2085/i.test(grade) },
    ]),
  },
  {
    ...existing("mild-steel"),
    materialGroups: groupGrades(steelGrades.filter((grade) => mildSteelNames.test(grade)), [
      { name: "Plain carbon steels", matches: (grade) => /1010|1018|1020|1045|20#|45#|AISI 1010|S15C|C22/i.test(grade) },
      { name: "Structural steels", matches: (grade) => /Q235|S355|S355J2|S355JR|SS400|FE510|44W|1\.033/i.test(grade) },
      { name: "Sheet and coated stock", matches: (grade) => /SPCC|SPHC|SGCC|SECC|SPTE/i.test(grade) },
    ]),
  },
  {
    ...existing("brass"),
    materialGroups: groupGrades(
      copperFamilyGrades.filter((grade) => /brass|CuZn/i.test(grade)),
      [
        { name: "Free-machining brass", matches: (grade) => /360|3600|CuZn39Pb3/i.test(grade) },
        { name: "General brass", matches: (grade) => /Brass H62|Brass H59|^Brass$/i.test(grade) },
      ],
    ),
  },
  {
    ...existing("copper"),
    materialGroups: groupGrades(
      copperFamilyGrades.filter((grade) => !/brass|CuZn/i.test(grade)),
      [
        { name: "High-conductivity copper", matches: (grade) => /C110|C101|T2|Red Copper$/i.test(grade) },
        { name: "Bronze and bearing copper alloys", matches: (grade) => /Bronze|QSN|CuSn|Beryllium/i.test(grade) },
      ],
    ),
  },
  {
    ...existing("alloy-steel"),
    materialGroups: groupGrades(
      [...steelGrades.filter((grade) => alloySteelNames.test(grade)), ...gradesFor("Carbon / Alloy Steel").filter((grade) => /4130|4140|4340|52100|6150|9310|300M|E4340|4330/i.test(grade))],
      [
        { name: "Chromium-molybdenum steels", matches: (grade) => /4130|4140|42CD4|40Cr|40CrMn|40CrNiMo/i.test(grade) },
        { name: "High-strength alloy steels", matches: (grade) => /4340|4330|300M|E4340|EN19|18CrNiMo7-6/i.test(grade) },
        { name: "Bearing and spring steels", matches: (grade) => /52100|6150|9310|E9310|16MnCrS5/i.test(grade) },
      ],
    ),
  },
  {
    ...existing("tool-steel"),
    materialGroups: groupGrades(steelGrades.filter((grade) => toolSteelNames.test(grade)), [
      { name: "Cold work and die steels", matches: (grade) => /A2|SKD11|X160|Z160|1\.2085|1\.2510|100MnCrW4/i.test(grade) },
      { name: "High-speed/tooling steels", matches: (grade) => /M2|Toolox|ST TOOL/i.test(grade) },
      { name: "Free-machining bar stock", matches: (grade) => /1215|12L14|1\.0718/i.test(grade) },
    ]),
  },
  {
    ...existing("titanium"),
    materialGroups: groupGrades(titaniumGrades, [
      { name: "Commercially pure titanium", matches: (grade) => /Grade [1-4]$|^Titanium$/i.test(grade) },
      { name: "Alpha-beta titanium alloys", matches: (grade) => /Grade 5|Grade 6|Grade 7|Grade 9|Grade 12|6Al|8Al|TC4|TA6V|6AL4V/i.test(grade) },
    ]),
  },
  {
    ...existing("inconel-incoloy"),
    materialGroups: groupGrades(nickelGrades, [
      { name: "Inconel / Incoloy families", matches: (grade) => /Inconel|Incoloy|Alloy 6|Alloy 7|Alloy 8|Alloy 925|Alloy 925|Alloy 600|Alloy 601|Alloy 625|Alloy 686|Alloy 718|Alloy X|Alloy X-750/i.test(grade) },
      { name: "Hastelloy / corrosion-resistant alloys", matches: (grade) => /Hastelloy|Alloy C|Alloy B|Alloy G|Alloy N|Alloy 20|Alloy 28/i.test(grade) },
      { name: "Monel and nickel-copper", matches: (grade) => /Monel|Alloy 400|Alloy K500/i.test(grade) },
      { name: "Pure nickel", matches: (grade) => /Nickel 200|Nickel 201|Alloy 200|Alloy 201/i.test(grade) },
      { name: "High-temperature superalloys", matches: (grade) => /Waspaloy|Nimonic|MP159|MP35N|R31537|Multimet|AerMet|Alloy 188|Alloy 230|Alloy 242|Alloy 263|Alloy 282|Alloy 556|Alloy 617|Alloy 25|L605|Alloy A286|A-286/i.test(grade) },
    ]),
  },
  {
    slug: "precision-alloys",
    name: "Precision alloys",
    summary: "Controlled-expansion and precision magnetic alloys for glass sealing, electronics, aerospace, and specialty instrument applications.",
    details: "Use these materials when thermal expansion, magnetic behavior, or dimensional stability is the critical design constraint rather than general corrosion or strength alone.",
    commonGrades: ["Kovar", "Invar 36", "1J50", "1J79", "1J85"],
    standards: ["Project-specific requirements", "Material certification", "Traceability documentation"],
    materialGroups: groupGrades(precisionGrades, [
      { name: "Controlled-expansion alloys", matches: (grade) => /Kovar|Invar|4J/i.test(grade) },
      { name: "Soft magnetic precision alloys", matches: (grade) => /1J/i.test(grade) },
    ]),
  },
  {
    slug: "magnesium-zinc",
    name: "Magnesium / zinc alloys",
    summary: "Lightweight magnesium alloys and zinc die-casting alloys for weight-sensitive parts, housings, and cast components.",
    details: "These grades should be reviewed with process, coating, flammability, and casting requirements because manufacturability depends heavily on part geometry and finish expectations.",
    commonGrades: ["AZ91D", "AM60B", "AZ31B", "Zamak 3", "Zamak 5"],
    standards: ["Project-specific requirements", "Casting review", "Surface finish review"],
    materialGroups: groupGrades(magnesiumZincGrades, [
      { name: "Magnesium alloys", matches: (grade) => /Magnesium|AZ|AM/i.test(grade) },
      { name: "Zinc / Zamak alloys", matches: (grade) => /Zamak|ZN/i.test(grade) },
    ]),
  },
  {
    slug: "plastics-polymers",
    name: "Plastics / polymers",
    summary: "Engineering plastics, filled polymers, commodity plastics, and prototype resins for machined, printed, and molded applications.",
    details: "Plastic selection should consider temperature, stiffness, wear, chemical exposure, color, flame rating, and whether the part is for prototype validation or end-use service.",
    commonGrades: ["ABS", "POM", "Nylon", "PEEK", "PPS", "PC", "HDPE"],
    standards: ["Project-specific requirements", "Material data sheet", "Application review"],
    materialGroups: groupGrades(plasticGrades, [
      { name: "ABS and PC blends", matches: (grade) => /ABS|PC\+ABS|Fire-Resistant PC|Flame Retardant ABS/i.test(grade) },
      { name: "Acetal / POM", matches: (grade) => /POM|Delrin/i.test(grade) },
      { name: "Nylon / polyamide", matches: (grade) => /PA|Nylon/i.test(grade) },
      { name: "High-performance plastics", matches: (grade) => /PEEK|PEI|PPS|PPSU|ULTEM|PVDF|TEFLON/i.test(grade) },
      { name: "Polyolefins", matches: (grade) => /^PE$|HDPE|UHMW|PP/i.test(grade) },
      { name: "Prototype resins and composites", matches: (grade) => /PU|PX|Photopolymer|Carbon Fibre|Fibre glass|Bakelite|ASTM D6100|EPDM|PMMA|PVC|PBT|PETP/i.test(grade) },
    ]),
  },
];
