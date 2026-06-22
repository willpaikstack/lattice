import { cncMaterialLibrary } from "./cnc-material-library";

type BubbleTranslationTarget = "prisma-enum" | "lookup" | "seed-record" | "future-table" | "do-not-migrate";

export type RfqOption = {
  value: string;
  label: string;
  bubbleValue?: string;
  description?: string;
  metadata?: Record<string, string | boolean | number>;
  surfaceFinish?: SurfaceFinishMetadata;
};

export type SurfaceFinishBadge =
  | "Non cosmetic"
  | "Cosmetic on request"
  | "Cosmetic";

export type SurfaceFinishColorOption = {
  value: string;
  label: string;
  swatch?: string;
  mode?: "fixed" | "custom";
  placeholder?: string;
};

export type SurfaceFinishMetadata = {
  badge: SurfaceFinishBadge;
  cosmeticRequirement?: boolean;
  defaultCosmeticRequirement?: string;
  colors?: SurfaceFinishColorOption[];
  defaultColor?: string;
};

export type SurfaceFinishCosmeticRequirementOption = {
  value: string;
  label: string;
  shortLabel: string;
  description: string;
};

export type BubbleOptionSetTranslation = {
  bubbleName: string;
  localName: string;
  target: BubbleTranslationTarget;
  recommendation: string;
  options: RfqOption[];
};

function option(value: string, label: string, bubbleValue = value, metadata?: RfqOption["metadata"]): RfqOption {
  return { value, label, bubbleValue, metadata };
}

function finishOption(
  value: string,
  label: string,
  bubbleValue = value,
  surfaceFinish: SurfaceFinishMetadata,
): RfqOption {
  return { value, label, bubbleValue, surfaceFinish };
}

export const processOptions: RfqOption[] = [
  option("cnc_milling", "CNC Milling", "cnc_milling", { active: true }),
  option("cnc_turning", "CNC Turning", "cnc_turning", { active: true }),
  option("sheet_metal_fabrication", "Sheet Metal Fabrication"),
  option("injection_molding", "Injection Molding Services", "injection_molding_services"),
  option("sls", "Selective Laser Sintering (SLS)", "selective_laser_sintering__sls_"),
  option("fdm", "Fused Deposition Modeling (FDM)", "fused_deposition_modeling__fdm_"),
];

export const generalToleranceOptions: RfqOption[] = [
  option("iso_2768_medium_m", "ISO 2768 Medium (m)", "iso_2768_medium__m_"),
  option("iso_2768_fine_f", "ISO 2768 Fine (f)", "iso_2768_fine__f_"),
];

const machiningDifficultyOptions: RfqOption[] = [
  option("easy", "Easy"),
  option("medium", "Medium"),
  option("hard", "Hard"),
];

const materialCategoryOptions: RfqOption[] = [
  option("aluminum", "Aluminum"),
  option("stainless_steel", "Stainless steel"),
  option("steel", "Steel"),
  option("mild_steel", "Mild steel"),
  option("brass", "Brass"),
  option("bronze", "Bronze"),
  option("copper", "Copper"),
  option("alloy_steel", "Alloy steel"),
  option("tool_steel", "Tool steel"),
  option("titanium", "Titanium"),
  option("inconel_incoloy", "Inconel/Incoloy"),
  option("cast_iron", "Cast iron"),
  option("magnesium_zinc", "Magnesium / zinc"),
  option("plastics_polymers", "Plastics / polymers"),
  option("composites", "Composites"),
];

const materialCostOptions: RfqOption[] = [
  option("tier_1", "$", "_", { rank: 1 }),
  option("tier_2", "$$", "__", { rank: 2 }),
  option("tier_3", "$$$", "___", { rank: 3 }),
  option("tier_4", "$$$$", "____", { rank: 4 }),
];

function uniqueOptionsByValue(options: RfqOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    if (seen.has(option.value)) {
      return false;
    }

    seen.add(option.value);
    return true;
  });
}

export const rfqMaterialOptions: RfqOption[] = uniqueOptionsByValue(
  cncMaterialLibrary.map((entry) =>
    option(entry.value, entry.label, entry.value, {
      family: entry.family,
      unsNumber: entry.unsNumber,
      composition: entry.composition,
      compositionFormula: entry.compositionFormula,
      sources: entry.sources.join(", "),
    }),
  ),
);

const companySeedOptions: RfqOption[] = [option("amogy", "Amogy Inc.")];

export const qualityDocumentationOptions: RfqOption[] = [
  option("standard_inspection", "Standard Inspection", "cmm"),
  option("dimensional_inspection_report", "Dimensional Inspection Report", "dimensional_inspection_report", { requiresDrawing: true }),
  option("formal_dimensional_report", "Formal Inspection with Dimensional Report", "coc", { requiresDrawing: true }),
  option("cmm_dimensional_report", "CMM Inspection with Dimensional Report", "fai", { requiresDrawing: true }),
  option("fair_as9102", "First Article Inspection Report (FAIR AS9102)", "fat", { requiresDrawing: true }),
  option("source_inspection", "Source Inspection", "reach_compliance_declaration"),
  option("build_and_hold_first_article", "Build and Hold First Article Inspection", "iso_90001", { requiresDrawing: true }),
  option("custom_inspection", "Custom Inspection"),
  option("material_test_report", "Material Test Report (MTR)", "material_test_report__mtr_"),
];

export const requestStatusOptions: RfqOption[] = [
  option("DRAFT", "Draft", "draft"),
  option("SUBMITTED", "Requested", "requested"),
  option("READY_FOR_SUPPLIER_RFQ", "Under Review", "in_review"),
  option("QUOTED", "Quote received", "quoted"),
  option("PURCHASED", "Purchased", "purchased"),
  option("CLOSED", "Closed", "closed"),
];

export const surfaceFinishCosmeticRequirementOptions: SurfaceFinishCosmeticRequirementOption[] = [
  {
    value: "non_cosmetic",
    label: "Non cosmetic - Optimizes cost",
    shortLabel: "Non cosmetic",
    description:
      "Parts may show slight visual differences or cosmetic imperfections. Best for optimizing cost.",
  },
  {
    value: "cosmetic",
    label: "Cosmetic",
    shortLabel: "Cosmetic",
    description:
      "Parts follow cosmetic standards for visual consistency and no cosmetic defects on the primary side.",
  },
];

const anodizedTypeIiColors: SurfaceFinishColorOption[] = [
  { value: "black", label: "Black", swatch: "#000000" },
  { value: "blue", label: "Blue", swatch: "#2c8ff0" },
  { value: "red", label: "Red", swatch: "#ff100b" },
  { value: "orange", label: "Orange", swatch: "#ff9a00" },
  { value: "gold", label: "Gold", swatch: "#f0bd00" },
  { value: "clear", label: "Clear", swatch: "checker" },
];

const hardcoatColors: SurfaceFinishColorOption[] = [
  { value: "black", label: "Black", swatch: "#000000" },
  { value: "natural", label: "Natural", swatch: "#9ca3af" },
];

const clearOnlyColor: SurfaceFinishColorOption[] = [
  { value: "clear", label: "Clear", swatch: "checker" },
];

const powderCoatColors: SurfaceFinishColorOption[] = [
  { value: "black", label: "Black", swatch: "#000000" },
  { value: "white", label: "White", swatch: "#ffffff" },
  {
    value: "ral",
    label: "RAL",
    mode: "custom",
    placeholder: "Enter RAL code or name",
  },
  {
    value: "pantone",
    label: "Pantone",
    mode: "custom",
    placeholder: "Enter Pantone code or name",
  },
];

const nonCosmeticFinish: SurfaceFinishMetadata = { badge: "Non cosmetic" };
const cosmeticFinish: SurfaceFinishMetadata = { badge: "Cosmetic" };
const cosmeticOnRequestFinish: SurfaceFinishMetadata = {
  badge: "Cosmetic on request",
  cosmeticRequirement: true,
  defaultCosmeticRequirement: "non_cosmetic",
};

export const surfaceFinishOptions: RfqOption[] = [
  finishOption("as_machined_ra_3_2", "As machined (Ra 3.2 um / Ra 126 uin)", "as_machined__ra_3_2__m___ra_126__in_", nonCosmeticFinish),
  finishOption("as_machined_anodized_type_ii", "As machined + Anodized type II", "as_machined___anodized_type_ii", {
    badge: "Non cosmetic",
    colors: anodizedTypeIiColors,
    defaultColor: "black",
  }),
  finishOption("bead_blasted_anodized_type_ii_matte", "Bead blasted + Anodized type II (Matte)", "bead_blasted___anodized_type_ii__matte_", {
    ...cosmeticOnRequestFinish,
    colors: anodizedTypeIiColors,
    defaultColor: "black",
  }),
  finishOption("chromate_conversion_coating", "Chromate Conversion Coating", "chromate_conversion_coating", {
    badge: "Non cosmetic",
    colors: clearOnlyColor,
    defaultColor: "clear",
  }),
  finishOption("smooth_machining_ra_1_6", "Smooth machining (Ra 1.6 um / Ra 63 uin)", "smooth_machining__ra_1_6__m___ra_63__in_", nonCosmeticFinish),
  finishOption("bead_blasted", "Bead blasted", "bead_blasted", cosmeticOnRequestFinish),
  finishOption("as_machined_anodized_type_iii_hardcoat", "As machined + Anodized type III (Hardcoat)", "as_machined___anodized_type_iii__hardcoat_", {
    badge: "Non cosmetic",
    colors: hardcoatColors,
    defaultColor: "black",
  }),
  finishOption("bead_blasted_anodized_type_ii_glossy", "Bead Blasted + Anodized type II (Glossy)", "bead_blasted___anodized_type_ii__glossy_", {
    ...cosmeticOnRequestFinish,
    colors: anodizedTypeIiColors,
    defaultColor: "black",
  }),
  finishOption("brushed_ra_1_2", "Brushed (Ra 1.2 um / Ra 47 uin)", "brushed__ra_1_2__m___ra_47__in_", cosmeticOnRequestFinish),
  finishOption("brushed_anodized_type_ii_glossy", "Brushed + Anodized type II (Glossy)", "brushed___anodized_type_ii__glossy_", {
    ...cosmeticOnRequestFinish,
    colors: anodizedTypeIiColors,
    defaultColor: "black",
  }),
  finishOption("powder_coated", "Powder coated", "powder_coated", {
    badge: "Non cosmetic",
    colors: powderCoatColors,
    defaultColor: "black",
  }),
  finishOption("polishing_ra_0_8", "Polishing (Ra 0.8 um / Ra 32 uin)", "polishing__ra_0_8__m___ra_32__in_", cosmeticFinish),
  finishOption("electroless_nickel_plating", "Electroless Nickel Plating", "electroless_nickel_plating", nonCosmeticFinish),
  finishOption("fine_machining_ra_0_8", "Fine machining (Ra 0.8 um / Ra 32 uin)", "fine_machining__ra_0_8__m___ra_32__in_", nonCosmeticFinish),
  finishOption("bead_blasted_anodized_type_iii_hardcoat", "Bead Blasted + Anodized type III (Hardcoat)", "bead_blasted___anodized_type_iii__hardcoat_", {
    ...cosmeticOnRequestFinish,
    colors: hardcoatColors,
    defaultColor: "black",
  }),
  finishOption("bead_blasted_chromate_conversion", "Bead Blasted + Chromate Conversion Coating", "bead_blasted___chromate_conversion_coating", {
    ...cosmeticOnRequestFinish,
    colors: clearOnlyColor,
    defaultColor: "clear",
  }),
];

export function surfaceFinishMetadataFor(value: string) {
  return surfaceFinishOptions.find((option) => option.value === value)?.surfaceFinish;
}

export function surfaceFinishColorOptionsFor(value: string) {
  return surfaceFinishMetadataFor(value)?.colors ?? [];
}

export function surfaceFinishColorOption(value: string, colorValue: string) {
  return surfaceFinishColorOptionsFor(value).find((color) => color.value === colorValue);
}

export function surfaceFinishCosmeticRequirementLabel(value: string, labelType: "label" | "shortLabel" = "label") {
  return surfaceFinishCosmeticRequirementOptions.find((option) => option.value === value)?.[labelType] ?? value;
}

const industryTagOptions: RfqOption[] = [
  option("maritime", "Maritime"),
  option("oil_gas", "Oil & Gas", "oil___gas"),
  option("space", "Space"),
  option("aerospace", "Aerospace"),
  option("plastic", "Plastic"),
];

const userEmailSettingOptions: RfqOption[] = [
  option("roadmap_updates", "Roadmap Updates"),
  option("offers", "Offers"),
  option("order_updates", "Order Updates"),
  option("vendor_comms", "Vendor Comms"),
  option("marketing", "Marketing"),
];

const workspaceRoleOptions: RfqOption[] = [
  option("owner", "Owner"),
  option("admin", "Admin"),
  option("member", "Member"),
];

const stateOptions: RfqOption[] = [];

export const bubbleOptionSetTranslations: BubbleOptionSetTranslation[] = [
  {
    bubbleName: "Fabrication Capability",
    localName: "processOptions",
    target: "future-table",
    recommendation: "Use as RFQ process lookup now; promote to capability records when supplier matching and capability pages need shared data.",
    options: processOptions,
  },
  {
    bubbleName: "General Tolerance",
    localName: "generalToleranceOptions",
    target: "lookup",
    recommendation: "Keep as a fixed RFQ dropdown until tolerance rules become more detailed.",
    options: generalToleranceOptions,
  },
  {
    bubbleName: "Machining Difficulty",
    localName: "machiningDifficultyOptions",
    target: "lookup",
    recommendation: "Keep as material metadata, not a standalone business table.",
    options: machiningDifficultyOptions,
  },
  {
    bubbleName: "Material Category",
    localName: "materialCategoryOptions",
    target: "future-table",
    recommendation: "Promote to MaterialCategory when the catalog becomes admin-managed or supplier-aware.",
    options: materialCategoryOptions,
  },
  {
    bubbleName: "Material Cost",
    localName: "materialCostOptions",
    target: "lookup",
    recommendation: "Use as coarse material metadata; replace with real pricing inputs later.",
    options: materialCostOptions,
  },
  {
    bubbleName: "Materials",
    localName: "rfqMaterialOptions",
    target: "future-table",
    recommendation: "Use as a form lookup now; promote to Material records for specs, grades, images, and supplier fit.",
    options: rfqMaterialOptions,
  },
  {
    bubbleName: "Onboarded Companies",
    localName: "companySeedOptions",
    target: "seed-record",
    recommendation: "Seed companies into Company records; do not keep customers as an option set.",
    options: companySeedOptions,
  },
  {
    bubbleName: "Quality Documentation",
    localName: "qualityDocumentationOptions",
    target: "lookup",
    recommendation: "Keep as RFQ requirements now; promote to documentation packages if they gain pricing or supplier constraints.",
    options: qualityDocumentationOptions,
  },
  {
    bubbleName: "Quote Status",
    localName: "requestStatusOptions",
    target: "prisma-enum",
    recommendation: "Map into RequestStatus instead of preserving Bubble's quote-specific status model.",
    options: requestStatusOptions,
  },
  {
    bubbleName: "State",
    localName: "stateOptions",
    target: "do-not-migrate",
    recommendation: "Bubble set is empty; use address text or a standard US state list when addresses become active.",
    options: stateOptions,
  },
  {
    bubbleName: "Surface Finish Options",
    localName: "surfaceFinishOptions",
    target: "lookup",
    recommendation: "Keep as a fixed dropdown now; promote if finishes need compatibility, lead-time, or supplier capability data.",
    options: surfaceFinishOptions,
  },
  {
    bubbleName: "Tags",
    localName: "industryTagOptions",
    target: "lookup",
    recommendation: "Use as catalog tags; promote only when flexible tagging/filtering becomes admin-managed.",
    options: industryTagOptions,
  },
  {
    bubbleName: "User Email Settings",
    localName: "userEmailSettingOptions",
    target: "lookup",
    recommendation: "Defer until notification preferences are implemented.",
    options: userEmailSettingOptions,
  },
  {
    bubbleName: "Workspace Role",
    localName: "workspaceRoleOptions",
    target: "prisma-enum",
    recommendation: "Use as a bridge only; local auth should eventually define Lattice roles such as buyer, operator, admin, and supplier.",
    options: workspaceRoleOptions,
  },
];

export function optionLabel(options: RfqOption[], value: string) {
  return options.find((option) => option.value === value || option.bubbleValue === value)?.label ?? value;
}

export function localOptionValue(options: RfqOption[], value: string) {
  return options.find((option) => option.value === value || option.bubbleValue === value)?.value ?? value;
}
