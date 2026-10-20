import type { MaterialOfferingCategory } from "./vendor-materials";

export type MaterialAliasKind = "equivalent" | "lookup-alias" | "combined-selection";

export type MaterialAlias = {
  alias: string;
  canonical: string;
  kind: MaterialAliasKind;
  scope: string;
};

const catalogAliases: Partial<Record<MaterialOfferingCategory, Record<string, string>>> = {
  "Carbon / Alloy Steel": {
    "1018s": "1018 Steel",
    "aisi 1010": "AISI 1010 Steel", "steel 1010": "AISI 1010 Steel",
    "aisi 1010 steel": "AISI 1010 Steel", "aisi 1020": "AISI 1020 Steel", "steel 1020": "AISI 1020 Steel",
    "aisi 1020 steel": "AISI 1020 Steel",
    "4130 steel": "4130", "steel 4130": "4130", "4140 steel": "4140", "steel 4140": "4140",
    "4340 steel": "4340 / E4340", "steel 4340": "4340 / E4340", "42cd4": "4140",
    "1.7227 / 42crmos4 alloy steel": "4140", "steel 1.2085": "1.2085", x160crmov12: "D2",
    z160cvd12: "D2", skd11: "D2", "1.2510 / 100mncrw4": "O1 Tool Steel", "1215 steel": "1215",
    "steel 1215": "1215", "steel 12l14": "12L14",
  },
  "Copper / Brass / Bronze": {
    "brass 360": "Brass 360 (UNS C36000)", "brass c360": "Brass 360 (UNS C36000)",
    "brass c3600": "Brass 360 (UNS C36000)", cuzn39pb3: "Brass 360 (UNS C36000)",
    "red copper": "Copper 110 (UNS C11000)", "red copper c110": "Copper 110 (UNS C11000)",
    "copper 110": "Copper 110 (UNS C11000)", "copper c110": "Copper 110 (UNS C11000)",
    "red copper c101": "Copper 101", "red copper t2": "Copper 101",
    "bronze 932": "Bronze 932 (UNS C93200)", "bronze c932": "Bronze 932 (UNS C93200)",
  },
  "Nickel / Cobalt Alloy": {
    "alloy x": "Hastelloy X",
    "alloy c-22": "Hastelloy C-22",
    "alloy c-276": "Hastelloy C-276",
    "alloy 600": "Inconel 600", "alloy 601": "Inconel 601", "alloy 617": "Inconel 617",
    "alloy 625": "Inconel 625", "inconel 625 / alloy 625": "Inconel 625", "alloy 718": "Inconel 718",
    "alloy x-750": "Inconel X-750", "alloy 800": "Incoloy 800", "alloy 800h": "Incoloy 800H",
    "alloy 800ht": "Incoloy 800HT", "alloy 925": "Incoloy 925", "alloy 400": "Monel 400",
    "alloy k500": "Monel K-500", "monel k500": "Monel K-500", "alloy 200": "Nickel 200",
    "alloy 201": "Nickel 201", "alloy a286": "Incoloy A-286", invar36: "Invar 36",
    "invar36 alloy": "Invar 36", "kovar / 4j29": "Kovar",
  },
  "Stainless Steel": {
    "duplex f51": "Duplex 2205 / S31803",
    "duplex f55": "Zeron 100", "z100 / s32760": "Zeron 100", z100: "Zeron 100",
    "18-8 stainless steel": "18-8", "ss 18-8": "18-8", "301 stainless steel": "301",
    "303 stainless steel": "303", "ss 303": "303", "304": "304/304L Stainless Steel",
    "304 stainless steel": "304/304L Stainless Steel", "ss 304": "304/304L Stainless Steel",
    "ss 304 / 1.4301": "304/304L Stainless Steel", "304l": "304/304L Stainless Steel",
    "304l stainless steel": "304/304L Stainless Steel", "ss 304l": "304/304L Stainless Steel",
    "316": "316/316L Stainless Steel", "316 stainless steel": "316/316L Stainless Steel",
    "ss 316": "316/316L Stainless Steel", "316l": "316/316L Stainless Steel",
    "316l stainless steel": "316/316L Stainless Steel", "ss 316l": "316/316L Stainless Steel",
    "ss 316 / 1.4404": "316/316L Stainless Steel", "ss 304h": "304H", "ss 316h": "316H",
    "316ti stainless steel": "316Ti", "410 stainless steel": "410", "416 stainless steel": "416",
    "ss 416": "416", "ss 1.4305": "303", "420 stainless steel": "420", "ss 420": "420",
    "430 stainless steel": "430", "ss 430": "430", "440c stainless steel": "440C", "ss 440c": "440C",
    "15-5 stainless steel": "15-5 PH", "15-5ph": "15-5 PH", "17-4 ph stainless steel": "17-4 PH",
    "17-4ph": "17-4 PH", "ss 17-4ph": "17-4 PH", "ss 630": "17-4 PH",
    "nitronic 60 stainless steel": "Nitronic 60",
  },
  Titanium: {
    "titanium grade 2": "Grade 2", "titanium grade 5": "Grade 5 / 6Al-4V",
    "6al4v": "Grade 5 / 6Al-4V", ta6v: "Grade 5 / 6Al-4V", tc4: "Grade 5 / 6Al-4V",
  },
  "Controlled Expansion / Precision Alloy": {
    invar36: "Invar 36", "invar36 alloy": "Invar 36", "kovar / 4j29": "Kovar",
  },
};

const quoteAliases: Record<string, { canonical: string; kind: MaterialAliasKind }> = {
  "1018S": { canonical: "1018 Steel", kind: "equivalent" },
  "AISI 1010": { canonical: "AISI 1010 Steel", kind: "equivalent" },
  "Steel 1010": { canonical: "AISI 1010 Steel", kind: "equivalent" },
  "AISI 1020": { canonical: "AISI 1020 Steel", kind: "equivalent" },
  "Steel 1020": { canonical: "AISI 1020 Steel", kind: "equivalent" },
  "Alloy X": { canonical: "Hastelloy X", kind: "equivalent" },
  "Alloy C-22": { canonical: "Hastelloy C-22", kind: "equivalent" },
  "Alloy C-276": { canonical: "Hastelloy C-276", kind: "equivalent" },
  "Duplex F51": { canonical: "Duplex 2205 / S31803 Stainless Steel", kind: "equivalent" },
  "Duplex 2205 / S31803": { canonical: "Duplex 2205 / S31803 Stainless Steel", kind: "equivalent" },
  "Duplex F55": { canonical: "Zeron 100 Stainless Steel", kind: "equivalent" },
  "Z100 / S32760": { canonical: "Zeron 100 Stainless Steel", kind: "equivalent" },
  "Zeron 100": { canonical: "Zeron 100 Stainless Steel", kind: "equivalent" },
  "304 Stainless Steel": { canonical: "304/304L Stainless Steel", kind: "combined-selection" },
  "304L Stainless Steel": { canonical: "304/304L Stainless Steel", kind: "combined-selection" },
  "SS 304": { canonical: "304/304L Stainless Steel", kind: "combined-selection" },
  "316 Stainless Steel": { canonical: "316/316L Stainless Steel", kind: "combined-selection" },
  "316L Stainless Steel": { canonical: "316/316L Stainless Steel", kind: "combined-selection" },
  "SS 316": { canonical: "316/316L Stainless Steel", kind: "combined-selection" },
  Invar: { canonical: "Invar 36", kind: "equivalent" },
  "Brass 360": { canonical: "Brass 360 (UNS C36000)", kind: "equivalent" },
  "Brass C360": { canonical: "Brass 360 (UNS C36000)", kind: "equivalent" },
  "Copper 110": { canonical: "Copper 110 (UNS C11000)", kind: "equivalent" },
  "Copper C110": { canonical: "Copper 110 (UNS C11000)", kind: "equivalent" },
  "Bronze 932": { canonical: "Bronze 932 (UNS C93200)", kind: "equivalent" },
  "Bronze C932": { canonical: "Bronze 932 (UNS C93200)", kind: "equivalent" },
};

function aliasKey(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const runtimeAliases = new Map<string, MaterialAlias>();
const runtimeAliasConflicts = new Map<string, MaterialAlias[]>();

function key(scope: string, alias: string) {
  return `${scope}:${aliasKey(alias)}`;
}

export function registerMaterialAliases(scope: string, canonical: string, aliases: string[], kind: MaterialAliasKind = "lookup-alias") {
  for (const alias of aliases) {
    const aliasRecord = { alias, canonical, kind, scope };
    const aliasKeyValue = key(scope, alias);
    const existing = runtimeAliases.get(aliasKeyValue);
    if (existing && existing.canonical !== canonical) {
      runtimeAliases.delete(aliasKeyValue);
      runtimeAliasConflicts.set(aliasKeyValue, [...(runtimeAliasConflicts.get(aliasKeyValue) ?? [existing]), aliasRecord]);
      continue;
    }
    if (!runtimeAliasConflicts.has(aliasKeyValue)) runtimeAliases.set(aliasKeyValue, aliasRecord);
  }
}

export function resolveMaterialAlias(scope: string, name: string): MaterialAlias | undefined {
  const aliasKeyValue = key(scope, name);
  if (runtimeAliasConflicts.has(aliasKeyValue)) return undefined;
  const runtime = runtimeAliases.get(aliasKeyValue);
  if (runtime) return runtime;
  if (scope.startsWith("catalog:")) {
    const category = scope.slice("catalog:".length) as MaterialOfferingCategory;
    const canonical = catalogAliases[category]?.[name.toLowerCase()];
    if (canonical) return { alias: name, canonical, kind: "equivalent", scope };
  }
  if (scope === "rfq") {
    const match = Object.entries(quoteAliases).find(([alias]) => aliasKey(alias) === aliasKey(name));
    if (match) return { alias: name, canonical: match[1].canonical, kind: match[1].kind, scope };
  }
  return undefined;
}

export function getMaterialAliasConflicts(scope?: string) {
  return [...runtimeAliasConflicts.values()].flat().filter((record) => !scope || record.scope === scope);
}

export function resolveMaterialName(scope: string, name: string) {
  return resolveMaterialAlias(scope, name)?.canonical ?? name;
}

export function materialAliasesFor(scope: string, canonical: string) {
  const aliases = [...runtimeAliases.values()]
    .filter((record) => record.scope === scope && record.canonical === canonical)
    .map((record) => record.alias);
  if (scope === "rfq") {
    aliases.push(...Object.entries(quoteAliases).filter(([, record]) => record.canonical === canonical).map(([alias]) => alias));
  }
  return [...new Set(aliases)];
}

export function materialAliasKind(scope: string, name: string) {
  return resolveMaterialAlias(scope, name)?.kind;
}
