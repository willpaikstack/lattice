import { customerMaterialCatalog } from "./customer-material-catalog";
import { catalogGradeRecords } from "./material-catalog-records";
import { resolveMaterialName } from "./material-identity-registry";
import { canonicalMaterialValue, selectableRfqMaterials, searchRfqMaterials } from "./rfq-material-search";
import type { RfqOption } from "./rfq-options";

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
    value, grade: record.grade, label: record.name, family: family.name, familySlug: family.slug,
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
  const sourcing = condition?.sourcing ?? !offering.variants.length;
  return {
    value,
    label: `${offering.label}${condition ? ` · ${condition.label}` : ""}`,
    description: sourcing ? "Sourcing review required" : variant?.description,
    metadata: { ...offering.variants[0]?.metadata, ...variant?.metadata, family: offering.family },
    category: offering.family, subgroup: offering.family, sourcing,
  };
}
export const materialGradeChoices = materialOfferings.map((offering) => searchChoice(offering, initialOfferingValue(offering)));
export const materialSearchChoices = [...new Map([
  ...materialGradeChoices,
  ...materialOfferings.flatMap((offering) => offering.conditions.map((condition) => searchChoice(offering, condition.value, condition))),
].map((option) => [option.value, option])).values()];
export function searchMaterialOfferings(query: string) {
  return query.trim() ? searchRfqMaterials(materialSearchChoices, query) : materialGradeChoices;
}

export function catalogInquiryPrefill(value?: string) {
  const offering = value ? materialOfferingFor(value) : undefined;
  if (!offering) return undefined;
  return { materialName: offering.grade, specification: materialConditionFor(value!)?.label ?? "" };
}

export function materialSelectionDetails(value: string) {
  const offering = materialOfferingFor(value);
  return offering ? { materialGrade: offering.grade, materialCondition: materialConditionFor(value)?.label ?? "" } : {};
}

