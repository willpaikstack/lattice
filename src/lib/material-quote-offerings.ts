import { customerMaterialCatalog } from "./customer-material-catalog";
import { catalogGradeRecords } from "./material-catalog-records";
import { resolveMaterialName } from "./material-identity-registry";
import { catalogMaterialReference } from "./material-uns-references";
import { canonicalMaterialValue, selectableRfqMaterials, searchRfqMaterials } from "./rfq-material-search";
import { otherMaterialValue, type RfqOption } from "./rfq-options";

export type MaterialConditionChoice = { label: string; value: string; sourcing: boolean };
export type MaterialOffering = {
  value: string;
  grade: string;
  label: string;
  family: string;
  familySlug: string;
  conditions: MaterialConditionChoice[];
  variants: RfqOption[];
};
export type MaterialSearchChoice = RfqOption & { category: string; subgroup: string; sourcing: boolean };

function catalogValue(slug: string, grade: string) {
  return `catalog:${slug}:${encodeURIComponent(grade)}`;
}
function quoteMaterialLabel(family: string, name: string) {
  if (family === "Aluminum" && !/\bAluminum$/i.test(name)) return `${name} Aluminum`;
  if (family === "Stainless steel" && !/\bStainless Steel$/i.test(name)) return `${name} Stainless Steel`;
  if (family === "Titanium" && !/\bTitanium\b/i.test(name)) return `${name} Titanium`;
  return name;
}
function aluminumCondition(label: string) {
  return label.match(/-(T\d+|H\d+) Aluminum$/i)?.[1].toUpperCase();
}
function catalogNameFor(option: RfqOption) {
  const family = String(option.metadata?.family ?? "");
  const scope = ({ Aluminum: "Aluminum", "Stainless steel": "Stainless Steel", Steel: "Carbon / Alloy Steel", "Tool steel": "Carbon / Alloy Steel", Titanium: "Titanium", "Copper / brass / bronze": "Copper / Brass / Bronze", "Nickel / precision alloy": "Controlled Expansion / Precision Alloy" } as Record<string, string>)[family];
  if (family === "Aluminum") return option.label.replace(/-(T\d+|H\d+) Aluminum$/i, " Aluminum").replace(/^MIC6 Aluminum$/i, "MIC-6 Aluminum");
  if (option.label === "A2 Tool Steel") return "A2 Steel";
  return scope ? resolveMaterialName(`catalog:${scope}`, option.label) : option.label;
}

const offerings: MaterialOffering[] = customerMaterialCatalog.flatMap((family) => catalogGradeRecords(family.materialGroups).map((record) => {
  const value = catalogValue(family.slug, record.grade);
  return {
    value, grade: record.grade, label: quoteMaterialLabel(family.name, record.name), family: family.name, familySlug: family.slug,
    variants: [],
    conditions: record.conditions.map((condition) => ({ label: condition.label, value: `${value}:condition:${condition.label}`, sourcing: true })),
  };
}));

for (const option of selectableRfqMaterials) {
  const grade = catalogNameFor(option);
  let offering = offerings.find((candidate) => candidate.grade === grade);
  const condition = aluminumCondition(option.label);
  // Catalog lookup aliases can describe a related grade rather than an exact
  // purchasing equivalent. Keep distinct RFQ variants visible instead of
  // silently folding a second designation into the first selectable value.
  if (offering && !condition && offering.variants.some((variant) => !aluminumCondition(variant.label))) offering = undefined;
  if (!offering) {
    // Existing requestable selections remain available even while their public
    // directory presentation is being curated. Never migrate historical keys.
    offering = { value: `material:${option.value}`, grade: option.label, label: option.label, family: String(option.metadata?.family ?? "Other materials"), familySlug: "", conditions: [], variants: [] };
    offerings.push(offering);
  }
  offering.variants.push(option);
  if (condition) {
    const existing = offering.conditions.find((candidate) => candidate.label === condition);
    if (existing) Object.assign(existing, { value: option.value, sourcing: false });
    else offering.conditions.push({ label: condition, value: option.value, sourcing: false });
  }
}

export const materialOfferings: readonly MaterialOffering[] = offerings;
const offeringByValue = new Map<string, MaterialOffering>();
for (const offering of materialOfferings) {
  offeringByValue.set(offering.value, offering);
  for (const variant of offering.variants) offeringByValue.set(variant.value, offering);
  for (const condition of offering.conditions) offeringByValue.set(condition.value, offering);
}
const variantByValue = new Map(selectableRfqMaterials.map((option) => [option.value, option]));
const namedSteelConditions: Record<string, { grade: string; condition: string }> = {
  "4140 Annealed": { grade: "4140", condition: "Annealed" },
  "4140 Normalized": { grade: "4140", condition: "Normalized" },
  "6150 Vac Melt Annealed": { grade: "6150", condition: "Annealed" },
  "4330 Mod VM N&T": { grade: "4330 Mod VM", condition: "Normalized and tempered" },
};
const gradesWithNamedSteelConditions = new Set(materialOfferings
  .filter((offering) => offering.family === "Alloy steel" && namedSteelConditions[offering.grade])
  .map((offering) => namedSteelConditions[offering.grade].grade));

export function materialOfferingFor(value: string) {
  return offeringByValue.get(canonicalMaterialValue(value));
}
export function materialVariantFor(value: string) {
  return variantByValue.get(canonicalMaterialValue(value));
}
export function materialSelectionLabel(value: string) {
  const variant = materialVariantFor(value);
  if (variant) return variant.label;
  const offering = materialOfferingFor(value);
  const condition = offering?.conditions.find((candidate) => candidate.value === value);
  return offering ? `${offering.grade}${condition ? ` — ${condition.label}` : ""}` : value;
}
export function materialSelectionError(value: string) {
  if (!value) return "Select a material";
  if (materialVariantFor(value)) return null;
  const offering = materialOfferingFor(value);
  if (offering?.conditions.some((condition) => condition.value === value && condition.sourcing) || !offering?.variants.length) return "Request sourcing review for this material";
  return "Select a material condition";
}
export function materialNotesError(value: string, notes: string) {
  return canonicalMaterialValue(value) === otherMaterialValue && !notes.trim()
    ? "Specify the material, grade and temper/condition in Manufacturing notes"
    : null;
}
export function initialOfferingValue(offering: MaterialOffering) {
  return offering.conditions.length ? offering.value : offering.variants[0]?.value ?? offering.value;
}
export function materialConditionFor(value: string) {
  const canonical = canonicalMaterialValue(value);
  return materialOfferingFor(canonical)?.conditions.find((condition) => condition.value === canonical);
}

export function sourcingInquiryHref(value: string) {
  return `/materials/inquiry?${new URLSearchParams({ material: value })}`;
}
export function catalogMaterialAction(familyName: string, grade: string, conditionLabel?: string) {
  const offering = materialOfferings.find((candidate) => candidate.family === familyName && candidate.grade === grade);
  if (!offering) return { label: "Ask us to source", href: `/materials/inquiry?${new URLSearchParams({ materialName: grade, specification: conditionLabel ?? "" })}`, sourcing: true };
  const condition = conditionLabel ? offering.conditions.find((candidate) => candidate.label === conditionLabel) : undefined;
  if (conditionLabel && !condition) return { label: "Ask us to source", href: `/materials/inquiry?${new URLSearchParams({ materialName: grade, specification: conditionLabel })}`, sourcing: true };
  const variant = condition ? !condition.sourcing && materialVariantFor(condition.value)
    : offering.variants.find((candidate) => !aluminumCondition(candidate.label));
  const value = variant ? variant.value : condition?.value ?? offering.value;
  return variant
    ? { label: "Request quote", href: `/requests/new?${new URLSearchParams({ material: value })}`, sourcing: false }
    : offering.variants.length && !conditionLabel
      ? { label: "Request quote", href: `/requests/new?${new URLSearchParams({ material: offering.value })}`, sourcing: false }
      : { label: "Ask us to source", href: sourcingInquiryHref(value), sourcing: true };
}

function searchChoice(offering: MaterialOffering, value: string, condition?: MaterialConditionChoice): MaterialSearchChoice {
  const variant = materialVariantFor(value);
  const reference = catalogMaterialReference(offering.family, offering.grade);
  const existingMetadata = { ...offering.variants[0]?.metadata, ...variant?.metadata };
  const existingComposition = String(existingMetadata.composition ?? "").trim();
  const hasExistingComposition = !!existingComposition && !/^(?:N\/?A|unknown|not listed|composition pending)$/i.test(existingComposition);
  const sourcing = condition?.sourcing ?? !offering.variants.length;
  return {
    value,
    label: condition
      ? offering.family === "Aluminum"
        ? `${offering.label.replace(/ Aluminum$/i, "")}-${condition.label} Aluminum`
        : `${offering.label} · ${condition.label}`
      : variant && offering.family === "Aluminum" && offering.conditions.length
        ? `${variant.label} · Temper not specified`
        : variant && offering.family === "Titanium" && !/\bTitanium\b/i.test(variant.label)
          ? `${variant.label} Titanium`
        : variant?.label ?? offering.label,
    description: sourcing ? "Sourcing review required" : variant?.description,
    metadata: {
      ...reference, ...existingMetadata,
      // A reviewed canonical identifier supersedes legacy placeholders such as
      // UNS N/A. Preserve existing exact-variant composition metadata.
      ...(reference?.unsNumber ? { unsNumber: reference.unsNumber, unsSource: reference.unsSource } : {}),
      // Empty legacy fields must not erase a researched grade reference. Preserve
      // complete existing variant chemistry; never borrow a sibling's condition.
      ...(!hasExistingComposition && reference ? {
        composition: reference.composition,
        compositionFormula: reference.compositionFormula,
        compositionSource: reference.compositionSource,
        compositionBasis: reference.compositionBasis,
        compositionNote: reference.compositionNote,
        compositionStatus: reference.compositionStatus,
      } : {}),
      family: offering.family,
    },
    category: offering.family, subgroup: offering.family, sourcing,
  };
}
export const materialGradeChoices = materialOfferings.map((offering) => searchChoice(offering, initialOfferingValue(offering)));
const excludedQuoteMaterialLabels = new Set([
  "18-8", "18-8 Stainless Steel", "Invar", "ZN", "Beryllium Copper", "Magnesium", "Zinc", "Cast Iron",
  "Duplex 2205 / S31803", "Duplex 2205 / S31803 Stainless Steel",
  "Duplex 2205 / S32205", "Duplex 2205 / S32205 Stainless Steel",
].map((label) => label.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "")));
function quoteMaterialIdentity(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function excludedFromQuotePicker(offering: MaterialOffering, choice: MaterialSearchChoice) {
  return [offering.grade, offering.label, choice.label].some((label) => excludedQuoteMaterialLabels.has(quoteMaterialIdentity(label)));
}
// Offer exact conditions when published; keep generic grades only where no
// condition choices exist. Hidden legacy keys remain resolvable for saved drafts.
export const materialBrowseChoices = materialOfferings.flatMap((offering) => {
  if (excludedQuoteMaterialLabels.has(quoteMaterialIdentity(offering.grade)) || excludedQuoteMaterialLabels.has(quoteMaterialIdentity(offering.label))) return [];
  if (offering.family === "Alloy steel" && gradesWithNamedSteelConditions.has(offering.grade)) return [];
  if (!offering.conditions.length) return [searchChoice(offering, initialOfferingValue(offering))];
  return offering.conditions.map((condition) => searchChoice(offering, condition.value, condition)).filter((choice) => !excludedFromQuotePicker(offering, choice));
});
export const materialSearchChoices = [...new Map([
  // The single selector must offer the same exact requirements when browsing
  // and searching. Parent-only selections previously relied on a second control.
  ...materialBrowseChoices,
].map((option) => [option.value, option])).values()];
export function searchMaterialOfferings(query: string) {
  return query.trim() ? searchRfqMaterials(materialSearchChoices, query) : materialBrowseChoices;
}

export function catalogInquiryPrefill(value?: string) {
  const offering = value ? materialOfferingFor(value) : undefined;
  if (!offering) return undefined;
  return { materialName: offering.grade, specification: materialConditionFor(value!)?.label ?? "" };
}

export function materialSelectionDetails(value: string) {
  const offering = materialOfferingFor(value);
  // These requirements already name their heat treatment. Keep that detail in
  // structured submission metadata as well as in the single dropdown label.
  // Never interpret grade numbers (e.g. Brass H59 or PC+ABS/T85) as tempers.
  return offering ? { materialGrade: offering.grade, materialCondition: materialConditionFor(value)?.label ?? (offering.family === "Alloy steel" ? namedSteelConditions[offering.grade]?.condition : undefined) ?? "" } : {};
}
