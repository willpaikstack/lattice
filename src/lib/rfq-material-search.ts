import { rfqMaterialOptions, type RfqOption } from "./rfq-options";
import { materialAliasesFor, resolveMaterialAlias, resolveMaterialName } from "./material-identity-registry";

const canonicalByValue = new Map<string, string>();
const aliasesByValue = new Map<string, string[]>();
for (const alias of rfqMaterialOptions) {
  const canonicalLabel = resolveMaterialName("rfq", alias.label);
  if (canonicalLabel === alias.label) continue;
  const canonical = rfqMaterialOptions.find(option => option.label === canonicalLabel);
  if (!canonical) continue;
  canonicalByValue.set(alias.value, canonical.value);
  aliasesByValue.set(canonical.value, [...(aliasesByValue.get(canonical.value) ?? []), alias.label, alias.value]);
}
export function canonicalMaterialValue(value: string) {
  const direct = canonicalByValue.get(value);
  if (direct) return direct;
  const option = rfqMaterialOptions.find(candidate => candidate.value === value || candidate.label === value);
  const canonicalLabel = resolveMaterialName("rfq", option?.label ?? value);
  const canonicalOption = rfqMaterialOptions.find(candidate => candidate.label === canonicalLabel);
  return canonicalOption?.value ?? (option ? canonicalByValue.get(option.value) ?? option.value : value);
}
const selectableMaterialValues = new Set<string>();
export const selectableRfqMaterials = rfqMaterialOptions.filter(option => {
  const canonicalValue = canonicalMaterialValue(option.value);
  if (selectableMaterialValues.has(canonicalValue)) return false;
  selectableMaterialValues.add(canonicalValue);
  return !resolveMaterialAlias("rfq", option.label);
});

function normalized(text: string) {
  return text.normalize("NFKD").toLowerCase().replace(/([a-z])([0-9])/g, "$1 $2").replace(/([0-9])([a-z])/g, "$1 $2").replace(/[^a-z0-9]+/g, " ").trim();
}
function compact(text: string) {
  return normalized(text).replace(/\s+/g, "");
}
export function searchRfqMaterials<T extends RfqOption & { category?: string; subgroup?: string }>(options: T[], query: string): T[] {
  const needle = normalized(query);
  if (!needle) return options;
  const tokens = needle.split(/\s+/);
  return options.map((option, index) => {
    const aliases = [...(aliasesByValue.get(option.value) ?? []), ...materialAliasesFor("rfq", option.label)];
    const identities = [option.label, ...aliases, String(option.metadata?.unsNumber ?? "")];
    const fields = [...identities, option.category ?? "", option.subgroup ?? "", String(option.metadata?.family ?? ""), String(option.metadata?.composition ?? ""), String(option.metadata?.compositionFormula ?? "")];
    const haystack = normalized(fields.join(" "));
    const matches = tokens.every(token => haystack.includes(token)) || fields.some(field => compact(field).includes(compact(query)));
    if (!matches) return null;
    const rank = identities.some(field => compact(field) === compact(query)) ? 0
      : normalized(option.label).startsWith(needle) ? 1
      : tokens.every(token => normalized(option.label).includes(token)) ? 2 : 3;
    return { option, rank, index };
  }).filter((item): item is { option: T; rank: number; index: number } => item !== null)
    .sort((a, b) => a.rank - b.rank || a.index - b.index).map(item => item.option);
}
