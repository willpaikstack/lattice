export type CncMaterialFamily =
  | "Aluminum"
  | "Stainless steel"
  | "Steel"
  | "Tool steel"
  | "Titanium"
  | "Nickel / precision alloy"
  | "Copper / brass / bronze"
  | "Cast iron"
  | "Magnesium / zinc"
  | "Plastic / polymer"
  | "Composite";

export type CncMaterialSource = "Fictiv" | "Hubs" | "Xometry";

export type CncMaterialLibraryEntry = {
  label: string;
  value: string;
  family: CncMaterialFamily;
  sources: CncMaterialSource[];
};

function slug(label: string) {
  return label
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function material(label: string, family: CncMaterialFamily, sources: CncMaterialSource[], value = slug(label)): CncMaterialLibraryEntry {
  return { label, value, family, sources };
}

export const cncMaterialLibrary: CncMaterialLibraryEntry[] = [
  material("6061-T6 Aluminum", "Aluminum", ["Fictiv", "Hubs", "Xometry"], "al_6061_t6"),
  material("6061-T651 Aluminum", "Aluminum", ["Hubs"]),
  material("6063 Aluminum", "Aluminum", ["Fictiv", "Hubs", "Xometry"]),
  material("6063-T5 Aluminum", "Aluminum", ["Xometry"]),
  material("6060 Aluminum", "Aluminum", ["Hubs"]),
  material("6082 Aluminum", "Aluminum", ["Hubs"]),
  material("6082-T651 Aluminum", "Aluminum", ["Hubs"]),
  material("7075-T6 Aluminum", "Aluminum", ["Fictiv", "Hubs", "Xometry"]),
  material("7075-T651 Aluminum", "Aluminum", ["Hubs"]),
  material("7075-T7351 Aluminum", "Aluminum", ["Hubs"]),
  material("7050 Aluminum", "Aluminum", ["Fictiv", "Hubs", "Xometry"]),
  material("2024 Aluminum", "Aluminum", ["Fictiv", "Xometry"]),
  material("2024-T351 Aluminum", "Aluminum", ["Hubs"]),
  material("2014 Aluminum", "Aluminum", ["Hubs"]),
  material("2017A Aluminum", "Aluminum", ["Hubs"]),
  material("2007 Aluminum", "Aluminum", ["Hubs"]),
  material("3003 Aluminum", "Aluminum", ["Fictiv"]),
  material("5052 Aluminum", "Aluminum", ["Fictiv", "Hubs"]),
  material("5083-H111 Aluminum", "Aluminum", ["Hubs"]),
  material("5251 Aluminum", "Aluminum", ["Hubs"]),
  material("5754 Aluminum", "Aluminum", ["Hubs"]),
  material("MIC6 Aluminum", "Aluminum", ["Fictiv", "Hubs", "Xometry"]),

  material("303 Stainless Steel", "Stainless steel", ["Fictiv", "Hubs", "Xometry"], "ss_303"),
  material("304 Stainless Steel", "Stainless steel", ["Hubs", "Xometry"], "ss_304_full"),
  material("304/304L Stainless Steel", "Stainless steel", ["Hubs", "Xometry"]),
  material("304L Stainless Steel", "Stainless steel", ["Fictiv"]),
  material("316 Stainless Steel", "Stainless steel", ["Hubs", "Xometry"], "ss_316_full"),
  material("316/316L Stainless Steel", "Stainless steel", ["Hubs", "Xometry"]),
  material("316L Stainless Steel", "Stainless steel", ["Fictiv"]),
  material("316Ti Stainless Steel", "Stainless steel", ["Hubs"]),
  material("301 Stainless Steel", "Stainless steel", ["Hubs"]),
  material("410 Stainless Steel", "Stainless steel", ["Fictiv", "Xometry"]),
  material("416 Stainless Steel", "Stainless steel", ["Fictiv", "Hubs", "Xometry"]),
  material("420 Stainless Steel", "Stainless steel", ["Hubs", "Xometry"]),
  material("420C Stainless Steel", "Stainless steel", ["Hubs"]),
  material("430 Stainless Steel", "Stainless steel", ["Hubs"]),
  material("440C Stainless Steel", "Stainless steel", ["Fictiv", "Hubs", "Xometry"]),
  material("15-5 Stainless Steel", "Stainless steel", ["Hubs", "Xometry"]),
  material("17-4 PH Stainless Steel", "Stainless steel", ["Fictiv", "Hubs", "Xometry"]),
  material("18-8 Stainless Steel", "Stainless steel", ["Xometry"]),
  material("2205 Duplex Stainless Steel", "Stainless steel", ["Hubs"]),
  material("Nitronic 60 Stainless Steel", "Stainless steel", ["Fictiv", "Xometry"]),
  material("SS 300 series", "Stainless steel", ["Xometry"], "ss_300"),
  material("SS 303", "Stainless steel", ["Fictiv", "Hubs", "Xometry"]),
  material("SS 304", "Stainless steel", ["Hubs", "Xometry"], "ss_304"),
  material("SS 316", "Stainless steel", ["Hubs", "Xometry"], "ss_316"),

  material("1018 Steel", "Steel", ["Xometry"]),
  material("1215 Steel", "Steel", ["Hubs", "Xometry"]),
  material("4130 Steel", "Steel", ["Fictiv", "Hubs", "Xometry"]),
  material("4140 Steel", "Steel", ["Fictiv", "Hubs", "Xometry"]),
  material("4340 Steel", "Steel", ["Fictiv", "Hubs", "Xometry"]),
  material("A36 Steel", "Steel", ["Xometry"]),
  material("A514 Steel", "Steel", ["Fictiv"]),
  material("1.7131 / 16MnCr5 Alloy Steel", "Steel", ["Hubs"]),
  material("1.7139 / 16MnCrS5 Alloy Steel", "Steel", ["Hubs"]),
  material("1.7227 / 42CrMoS4 Alloy Steel", "Steel", ["Hubs"]),
  material("1.6580 / 30CrNiMo8 Alloy Steel", "Steel", ["Hubs"]),
  material("1.6582 / 34CrNiMo6 Alloy Steel", "Steel", ["Hubs"]),

  material("A2 Tool Steel", "Tool steel", ["Fictiv", "Xometry"]),
  material("O1 Tool Steel", "Tool steel", ["Xometry"]),

  material("Titanium Grade 2", "Titanium", ["Xometry"]),
  material("Titanium Grade 5", "Titanium", ["Fictiv", "Xometry"]),

  material("Inconel 625", "Nickel / precision alloy", ["Hubs"], "in_625"),
  material("Invar", "Nickel / precision alloy", ["Fictiv"]),
  material("Invar 36", "Nickel / precision alloy", ["Hubs"]),
  material("Kovar", "Nickel / precision alloy", ["Fictiv"]),

  material("Brass 260", "Copper / brass / bronze", ["Xometry"]),
  material("Brass 360", "Copper / brass / bronze", ["Fictiv"]),
  material("Brass C360", "Copper / brass / bronze", ["Hubs", "Xometry"]),
  material("Bronze 932", "Copper / brass / bronze", ["Fictiv"]),
  material("Bronze C932", "Copper / brass / bronze", ["Xometry"]),
  material("Copper 101", "Copper / brass / bronze", ["Fictiv", "Xometry"]),
  material("Copper 110", "Copper / brass / bronze", ["Fictiv"]),
  material("Copper C110", "Copper / brass / bronze", ["Hubs", "Xometry"]),

  material("Cast Iron", "Cast iron", ["Fictiv"]),
  material("Magnesium", "Magnesium / zinc", ["Fictiv"]),
  material("Zinc", "Magnesium / zinc", ["Fictiv", "Xometry"]),

  material("ABS", "Plastic / polymer", ["Fictiv", "Hubs", "Xometry"]),
  material("Acetal (POM)", "Plastic / polymer", ["Xometry"]),
  material("Acetal Copolymer (POM-C)", "Plastic / polymer", ["Hubs"]),
  material("Acetal Copolymer (POM-C) ESD", "Plastic / polymer", ["Hubs"]),
  material("Acetal Copolymer (POM-C) FDA", "Plastic / polymer", ["Hubs"]),
  material("Acetal Homopolymer (POM-H)", "Plastic / polymer", ["Hubs"]),
  material("Acrylic", "Plastic / polymer", ["Fictiv", "Xometry"]),
  material("Delrin", "Plastic / polymer", ["Fictiv"]),
  material("Delrin 100 AF", "Plastic / polymer", ["Xometry"]),
  material("Delrin 150", "Plastic / polymer", ["Fictiv", "Xometry"]),
  material("Delrin 30% Glass Filled", "Plastic / polymer", ["Fictiv"]),
  material("FR4", "Composite", ["Hubs"]),
  material("Garolite G-10", "Composite", ["Fictiv", "Hubs", "Xometry"]),
  material("Garolite G-10 / FR4", "Composite", ["Xometry"]),
  material("Garolite G-11 / FR5", "Composite", ["Xometry"]),
  material("HDPE", "Plastic / polymer", ["Fictiv", "Xometry"]),
  material("Nylon", "Plastic / polymer", ["Fictiv", "Hubs"]),
  material("Nylon 6/6", "Plastic / polymer", ["Xometry"]),
  material("PEEK", "Plastic / polymer", ["Fictiv", "Hubs", "Xometry"]),
  material("PEEK 30% Glass Filled", "Plastic / polymer", ["Fictiv", "Xometry"]),
  material("PEEK / USP Class VI TECAPEEK", "Plastic / polymer", ["Xometry"]),
  material("PEI", "Plastic / polymer", ["Hubs"]),
  material("PET", "Plastic / polymer", ["Hubs"]),
  material("PMMA (Acrylic)", "Plastic / polymer", ["Hubs"]),
  material("Polycarbonate", "Plastic / polymer", ["Fictiv", "Hubs", "Xometry"]),
  material("Polyethylene", "Plastic / polymer", ["Hubs"]),
  material("Polypropylene", "Plastic / polymer", ["Fictiv", "Hubs", "Xometry"]),
  material("POM (Delrin/Acetal)", "Plastic / polymer", ["Hubs"]),
  material("PPS", "Plastic / polymer", ["Fictiv"]),
  material("PPSU", "Plastic / polymer", ["Hubs"]),
  material("PTFE", "Plastic / polymer", ["Fictiv"]),
  material("PTFE (Teflon)", "Plastic / polymer", ["Hubs"]),
  material("PVC", "Plastic / polymer", ["Fictiv", "Hubs", "Xometry"], "pvc"),
  material("Torlon", "Plastic / polymer", ["Fictiv"]),
  material("UHMW", "Plastic / polymer", ["Fictiv"]),
  material("UHMW PE", "Plastic / polymer", ["Xometry"]),
  material("Ultem", "Plastic / polymer", ["Fictiv"]),
  material("ULTEM 1000", "Plastic / polymer", ["Xometry"]),
  material("ULTEM 2300", "Plastic / polymer", ["Xometry"]),
];

