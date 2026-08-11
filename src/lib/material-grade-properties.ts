export type MaterialMechanicalProperties = {
  condition: string;
  density: string;
  elongation: string;
  hardness: string;
  sourceLabel: string;
  sourceUrl: string;
  tensileStrength: string;
  yieldStrength: string;
};

const matweb = (query: string) => `https://www.matweb.com/search/QuickText.aspx?SearchText=${encodeURIComponent(query)}`;
const copperAlloys = (alloy: string) => `https://alloys.copper.org/alloy/${alloy}`;

// Typical room-temperature reference values. These are deliberately tied to the
// stated form/condition and are not design allowables or material certifications.
export const materialMechanicalProperties: Record<string, MaterialMechanicalProperties> = {
  "6061-T6": { condition: "T6 / T651 typical", yieldStrength: "276 MPa", tensileStrength: "310 MPa", elongation: "12%", hardness: "95 HB", density: "2.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("6061-T6 Aluminum") },
  "7075-T6": { condition: "T6 typical", yieldStrength: "503 MPa", tensileStrength: "572 MPa", elongation: "11%", hardness: "150 HB", density: "2.81 g/cm³", sourceLabel: "NIST / Aluminum Association", sourceUrl: "https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%20of%20Wrought%20Aluminum.pdf" },
  "5052-H32": { condition: "H32 sheet typical", yieldStrength: "193 MPa", tensileStrength: "228 MPa", elongation: "12%", hardness: "60 HB", density: "2.68 g/cm³", sourceLabel: "NIST / Aluminum Association", sourceUrl: "https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%20of%20Wrought%20Aluminum.pdf" },
  "2024-T3": { condition: "T3 sheet typical", yieldStrength: "345 MPa", tensileStrength: "483 MPa", elongation: "18%", hardness: "120 HB", density: "2.78 g/cm³", sourceLabel: "NIST / Aluminum Association", sourceUrl: "https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%20of%20Wrought%20Aluminum.pdf" },
  "304": { condition: "Annealed", yieldStrength: "215 MPa", tensileStrength: "505 MPa", elongation: "40%", hardness: "123 HB", density: "8.00 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Type 304 stainless steel annealed") },
  "316": { condition: "Annealed", yieldStrength: "205 MPa", tensileStrength: "515 MPa", elongation: "40%", hardness: "149 HB", density: "8.00 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Type 316 stainless steel annealed") },
  "303": { condition: "Annealed bar", yieldStrength: "240 MPa", tensileStrength: "620 MPa", elongation: "50%", hardness: "183 HB", density: "8.03 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Type 303 stainless steel annealed") },
  "17-4 PH": { condition: "H900", yieldStrength: "1,170 MPa", tensileStrength: "1,310 MPa", elongation: "10%", hardness: "388 HB", density: "7.75 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("17-4 PH stainless H900") },
  "ASTM A36": { condition: "Structural plate typical", yieldStrength: "250 MPa", tensileStrength: "400 MPa", elongation: "20%", hardness: "119 HB", density: "7.85 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("ASTM A36 steel") },
  "AISI 1018": { condition: "Cold-drawn bar", yieldStrength: "370 MPa", tensileStrength: "440 MPa", elongation: "15%", hardness: "126 HB", density: "7.87 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 1018 cold drawn") },
  "AISI 1020": { condition: "Cold-drawn bar", yieldStrength: "350 MPa", tensileStrength: "420 MPa", elongation: "15%", hardness: "121 HB", density: "7.87 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 1020 cold drawn") },
  "AISI 1045": { condition: "Normalized bar", yieldStrength: "310 MPa", tensileStrength: "565 MPa", elongation: "16%", hardness: "170 HB", density: "7.87 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 1045 normalized") },
  "C360": { condition: "Half-hard rod", yieldStrength: "310 MPa", tensileStrength: "450 MPa", elongation: "10%", hardness: "120 HB", density: "8.50 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C36000") },
  "C260": { condition: "Annealed sheet", yieldStrength: "95 MPa", tensileStrength: "315 MPa", elongation: "65%", hardness: "55 HB", density: "8.53 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C26000") },
  "C464": { condition: "Half-hard wrought", yieldStrength: "240 MPa", tensileStrength: "480 MPa", elongation: "25%", hardness: "100 HB", density: "8.53 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C46400") },
  "C385": { condition: "Extruded profile", yieldStrength: "180 MPa", tensileStrength: "380 MPa", elongation: "15%", hardness: "100 HB", density: "8.47 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C38500") },
  "Grade 2": { condition: "Annealed", yieldStrength: "275 MPa", tensileStrength: "345 MPa", elongation: "20%", hardness: "160 HB", density: "4.51 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Titanium Grade 2 annealed") },
  "Grade 5 / Ti-6Al-4V": { condition: "Annealed", yieldStrength: "830 MPa", tensileStrength: "900 MPa", elongation: "14%", hardness: "334 HB", density: "4.43 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Ti-6Al-4V annealed") },
  "Grade 9 / Ti-3Al-2.5V": { condition: "Annealed", yieldStrength: "480 MPa", tensileStrength: "620 MPa", elongation: "15%", hardness: "260 HB", density: "4.48 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Titanium Grade 9 annealed") },
  "Grade 23 / Ti-6Al-4V ELI": { condition: "Annealed", yieldStrength: "795 MPa", tensileStrength: "860 MPa", elongation: "15%", hardness: "310 HB", density: "4.43 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Ti-6Al-4V ELI annealed") },
  "Inconel 625": { condition: "Annealed bar / plate", yieldStrength: "414–655 MPa", tensileStrength: "827–1,034 MPa", elongation: "30–60%", hardness: "145–220 HB", density: "8.44 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-625.pdf" },
  "Inconel 718": { condition: "Age-hardened", yieldStrength: "1,035 MPa", tensileStrength: "1,240 MPa", elongation: "12%", hardness: "331 HB", density: "8.19 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-718.pdf" },
  "Incoloy 800H": { condition: "Annealed", yieldStrength: "170 MPa", tensileStrength: "450 MPa", elongation: "30%", hardness: "150 HB", density: "7.94 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/incoloy/incoloy-alloy-800h.pdf" },
  "Inconel X-750": { condition: "Precipitation-hardened", yieldStrength: "760 MPa", tensileStrength: "1,120 MPa", elongation: "20%", hardness: "300 HB", density: "8.28 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/inconel/inconel-alloy-x-750.pdf" },
  "C110": { condition: "Half-hard wrought", yieldStrength: "275 MPa", tensileStrength: "345 MPa", elongation: "20%", hardness: "80 HB", density: "8.94 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C11000") },
  "C101": { condition: "Hard wrought", yieldStrength: "240 MPa", tensileStrength: "310 MPa", elongation: "15%", hardness: "80 HB", density: "8.94 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C10100") },
  "C122": { condition: "Annealed", yieldStrength: "70 MPa", tensileStrength: "220 MPa", elongation: "45%", hardness: "45 HB", density: "8.94 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C12200") },
  "C172": { condition: "Age-hardened", yieldStrength: "1,100 MPa", tensileStrength: "1,280 MPa", elongation: "5%", hardness: "380 HB", density: "8.25 g/cm³", sourceLabel: "Copper Development Association", sourceUrl: copperAlloys("C17200") },
  "4140": { condition: "Annealed", yieldStrength: "415 MPa", tensileStrength: "655 MPa", elongation: "25%", hardness: "197 HB", density: "7.85 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 4140 annealed") },
  "4340": { condition: "Annealed", yieldStrength: "470 MPa", tensileStrength: "745 MPa", elongation: "22%", hardness: "217 HB", density: "7.85 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 4340 annealed") },
  "8620": { condition: "Annealed", yieldStrength: "360 MPa", tensileStrength: "530 MPa", elongation: "26%", hardness: "150 HB", density: "7.85 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 8620 annealed") },
  "4130": { condition: "Normalized", yieldStrength: "435 MPa", tensileStrength: "670 MPa", elongation: "25%", hardness: "197 HB", density: "7.85 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI 4130 normalized") },
  "D2": { condition: "Annealed bar", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "255 HB", density: "7.70 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI D2 tool steel annealed") },
  "A2": { condition: "Annealed bar", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "200 HB", density: "7.86 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI A2 tool steel annealed") },
  "O1": { condition: "Annealed bar", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "180 HB", density: "7.83 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI O1 tool steel annealed") },
  "H13": { condition: "Annealed bar", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "200 HB", density: "7.80 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AISI H13 tool steel annealed") },
  "Kovar": { condition: "Annealed strip", yieldStrength: "345 MPa", tensileStrength: "520 MPa", elongation: "30%", hardness: "80 HRB", density: "8.36 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Kovar alloy annealed") },
  "Invar 36": { condition: "Annealed", yieldStrength: "280 MPa", tensileStrength: "520 MPa", elongation: "30%", hardness: "80 HRB", density: "8.10 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Invar 36 annealed") },
  "1J50": { condition: "Final anneal required", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "—", density: "8.20 g/cm³", sourceLabel: "GB/T designation review", sourceUrl: matweb("1J50 soft magnetic alloy") },
  "1J79": { condition: "Final anneal required", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "—", density: "8.75 g/cm³", sourceLabel: "GB/T designation review", sourceUrl: matweb("1J79 soft magnetic alloy") },
  "AZ91D": { condition: "Die-cast", yieldStrength: "160 MPa", tensileStrength: "230 MPa", elongation: "3%", hardness: "63 HB", density: "1.81 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AZ91D die cast") },
  "AM60B": { condition: "Die-cast", yieldStrength: "130 MPa", tensileStrength: "220 MPa", elongation: "10%", hardness: "65 HB", density: "1.80 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AM60B die cast") },
  "AZ31B": { condition: "H24 sheet", yieldStrength: "200 MPa", tensileStrength: "260 MPa", elongation: "12%", hardness: "73 HB", density: "1.77 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("AZ31B H24") },
  "Zamak 3": { condition: "Die-cast", yieldStrength: "210 MPa", tensileStrength: "285 MPa", elongation: "10%", hardness: "82 HB", density: "6.60 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("Zamak 3 die cast") },
  "POM / Acetal": { condition: "Unfilled homopolymer", yieldStrength: "60 MPa", tensileStrength: "65 MPa", elongation: "25%", hardness: "85 Shore D", density: "1.41 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("POM acetal homopolymer") },
  "PEEK": { condition: "Unfilled, extruded", yieldStrength: "95 MPa", tensileStrength: "100 MPa", elongation: "20%", hardness: "85 Shore D", density: "1.30 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("PEEK unfilled extruded") },
  "PTFE": { condition: "Virgin, unfilled", yieldStrength: "20 MPa", tensileStrength: "28 MPa", elongation: "300%", hardness: "55 Shore D", density: "2.16 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("PTFE virgin unfilled") },
  "UHMW-PE": { condition: "Natural, unfilled", yieldStrength: "21 MPa", tensileStrength: "40 MPa", elongation: "350%", hardness: "65 Shore D", density: "0.93 g/cm³", sourceLabel: "MatWeb reference data", sourceUrl: matweb("UHMW PE natural") },
};

// The directory lists supplier-facing aliases alongside canonical grades. Keep
// those aliases here instead of copying values into every displayed row: a
// single stated condition and source then applies wherever that grade appears.
const directoryMechanicalProperties: Record<string, MaterialMechanicalProperties> = {};
const directoryAliases: Record<string, string> = {};

function directoryKey(family: string, grade: string) {
  return `${family}:${grade.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

function addDirectoryRecord(
  family: string,
  canonicalGrade: string,
  aliases: string[],
  properties: MaterialMechanicalProperties,
) {
  const key = directoryKey(family, canonicalGrade);
  directoryMechanicalProperties[key] = properties;
  [canonicalGrade, ...aliases].forEach((alias) => {
    directoryAliases[directoryKey(family, alias)] = key;
  });
}

const matwebSteel = (grade: string) => matweb(`${grade} material properties`);
const outokumpuCore = "https://www.outokumpu.com/-/media/files/products/core/outokumpu-core-range-datasheet.pdf";
const timetGrade2 = "https://www.timet.com/assets/local/documents/datasheets/cpgrades/50a.pdf";
const specialMetals = "https://www.specialmetals.com/documents/guides-and-handbooks/";

const outokumpu304: MaterialMechanicalProperties = {
  condition: "ASTM A240 annealed sheet / plate", yieldStrength: "205 MPa", tensileStrength: "515 MPa", elongation: "40%", hardness: "≤ 201 HB", density: "7.90 g/cm³", sourceLabel: "Outokumpu Core range data sheet", sourceUrl: outokumpuCore,
};
const outokumpu316: MaterialMechanicalProperties = {
  condition: "ASTM A240 annealed sheet / plate", yieldStrength: "205 MPa", tensileStrength: "515 MPa", elongation: "40%", hardness: "≤ 217 HB", density: "8.00 g/cm³", sourceLabel: "Outokumpu Core range data sheet", sourceUrl: outokumpuCore,
};

addDirectoryRecord("Stainless steel", "304", ["304 Stainless Steel", "18-8", "18-8 Stainless Steel", "SS 18-8", "SS 304", "SS 304 / 1.4301"], outokumpu304);
addDirectoryRecord("Stainless steel", "304L", ["304L Stainless Steel", "304/304L Stainless Steel", "SS 304L", "304LVM"], { ...outokumpu304, condition: "ASTM A240 annealed sheet / plate (304L)" });
addDirectoryRecord("Stainless steel", "301", ["301 Stainless Steel"], { condition: "ASTM A240 annealed sheet / plate", yieldStrength: "205 MPa", tensileStrength: "515 MPa", elongation: "40%", hardness: "≤ 217 HB", density: "7.90 g/cm³", sourceLabel: "Outokumpu Core range data sheet", sourceUrl: outokumpuCore });
addDirectoryRecord("Stainless steel", "303", ["303 Stainless Steel", "SS 303", "303Se", "303Sulf", "SS 1.4305"], { condition: "Annealed bar", yieldStrength: "240 MPa", tensileStrength: "620 MPa", elongation: "50%", hardness: "183 HB", density: "8.03 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 303 annealed bar") });
addDirectoryRecord("Stainless steel", "316", ["316 Stainless Steel", "SS 316"], outokumpu316);
addDirectoryRecord("Stainless steel", "316L", ["316L Stainless Steel", "316/316L Stainless Steel", "SS 316L", "SS 316 / 1.4404", "316LVM"], { ...outokumpu316, condition: "ASTM A240 annealed sheet / plate (316L)" });
addDirectoryRecord("Stainless steel", "316Ti", ["316Ti Stainless Steel"], { ...outokumpu316, condition: "Annealed sheet / plate (316Ti)" });
addDirectoryRecord("Stainless steel", "321", [], { ...outokumpu304, condition: "ASTM A240 annealed sheet / plate (321)" });
addDirectoryRecord("Stainless steel", "347", ["347H"], { ...outokumpu304, condition: "ASTM A240 annealed sheet / plate (347)" });
addDirectoryRecord("Stainless steel", "309", [], { condition: "Annealed", yieldStrength: "205 MPa", tensileStrength: "515 MPa", elongation: "40%", hardness: "≤ 217 HB", density: "7.90 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("309 stainless steel annealed") });
addDirectoryRecord("Stainless steel", "310", ["310S", "330 / RA330"], { condition: "Annealed", yieldStrength: "205 MPa", tensileStrength: "515 MPa", elongation: "40%", hardness: "≤ 217 HB", density: "7.90 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("310 stainless steel annealed") });
addDirectoryRecord("Stainless steel", "410", ["410 Stainless Steel", "410Mod", "20Cr13"], { condition: "Annealed", yieldStrength: "275 MPa", tensileStrength: "480 MPa", elongation: "20%", hardness: "≤ 200 HB", density: "7.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("Type 410 stainless steel annealed") });
addDirectoryRecord("Stainless steel", "416", ["416 Stainless Steel", "SS 416", "EN 1.4005"], { condition: "Annealed bar", yieldStrength: "275 MPa", tensileStrength: "515 MPa", elongation: "20%", hardness: "≤ 262 HB", density: "7.70 g/cm³", sourceLabel: "Carpenter Alloy 416 data", sourceUrl: "https://www.carpentertechnology.com/alloy-finder/416" });
addDirectoryRecord("Stainless steel", "420", ["420 Stainless Steel", "420C Stainless Steel", "SS 420", "40Cr13"], { condition: "Annealed", yieldStrength: "345 MPa", tensileStrength: "655 MPa", elongation: "25%", hardness: "≤ 241 HB", density: "7.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("Type 420 stainless steel annealed") });
addDirectoryRecord("Stainless steel", "430", ["430 Stainless Steel", "SS 430"], { condition: "Annealed sheet / plate", yieldStrength: "205 MPa", tensileStrength: "450 MPa", elongation: "22%", hardness: "≤ 183 HB", density: "7.70 g/cm³", sourceLabel: "Outokumpu Core range data sheet", sourceUrl: outokumpuCore });
addDirectoryRecord("Stainless steel", "430F", ["430FR"], { condition: "Annealed bar", yieldStrength: "345 MPa", tensileStrength: "515 MPa", elongation: "20%", hardness: "≤ 241 HB", density: "7.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("430F stainless steel annealed") });
addDirectoryRecord("Stainless steel", "431", [], { condition: "Annealed", yieldStrength: "550 MPa", tensileStrength: "850 MPa", elongation: "14%", hardness: "248 HB", density: "7.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("431 stainless steel annealed") });
addDirectoryRecord("Stainless steel", "440C", ["440C Stainless Steel", "SS 440C"], { condition: "Annealed", yieldStrength: "450 MPa", tensileStrength: "760 MPa", elongation: "14%", hardness: "285 HB", density: "7.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("440C stainless steel annealed") });
addDirectoryRecord("Stainless steel", "17-4PH", ["17-4 PH Stainless Steel", "SS 17-4PH", "SS 630", "17-4PH H900 Steel"], { condition: "H900", yieldStrength: "1,170 MPa", tensileStrength: "1,310 MPa", elongation: "10%", hardness: "388 HB", density: "7.75 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("17-4 PH H900") });
addDirectoryRecord("Stainless steel", "15-5PH", ["15-5 Stainless Steel"], { condition: "H900", yieldStrength: "1,170 MPa", tensileStrength: "1,310 MPa", elongation: "10%", hardness: "388 HB", density: "7.78 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("15-5 PH H900") });
addDirectoryRecord("Stainless steel", "13-8PH", [], { condition: "H1000", yieldStrength: "1,310 MPa", tensileStrength: "1,380 MPa", elongation: "10%", hardness: "401 HB", density: "7.75 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("13-8 PH H1000") });
addDirectoryRecord("Stainless steel", "Duplex 2205", ["2205 Duplex Stainless Steel", "Duplex 2205 / S31803", "Duplex 2205 / S32205", "Duplex F51"], { condition: "Solution annealed plate", yieldStrength: "450 MPa", tensileStrength: "620 MPa", elongation: "25%", hardness: "293 HB", density: "7.80 g/cm³", sourceLabel: "Outokumpu duplex data", sourceUrl: "https://www.outokumpu.com/sv-se/products/product-ranges/-/media/files/products/forta/outokumpu-machining-guidelines-for-forta-dx2205.pdf" });
addDirectoryRecord("Stainless steel", "Super Duplex 2507", ["Duplex F55", "Z100 / S32760"], { condition: "Solution annealed plate", yieldStrength: "550 MPa", tensileStrength: "795 MPa", elongation: "25%", hardness: "310 HB", density: "7.80 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("Super Duplex 2507 solution annealed") });
addDirectoryRecord("Stainless steel", "904L", [], { condition: "Annealed", yieldStrength: "220 MPa", tensileStrength: "490 MPa", elongation: "35%", hardness: "≤ 217 HB", density: "8.00 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("904L stainless steel annealed") });
addDirectoryRecord("Stainless steel", "Alloy 20", [], { condition: "Annealed", yieldStrength: "240 MPa", tensileStrength: "550 MPa", elongation: "35%", hardness: "≤ 217 HB", density: "8.05 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("Alloy 20 stainless steel annealed") });

addDirectoryRecord("Aluminum", "6063-T5 Aluminum", [], { condition: "T5 extrusion typical", yieldStrength: "145 MPa", tensileStrength: "186 MPa", elongation: "12%", hardness: "60 HB", density: "2.70 g/cm³", sourceLabel: "NIST / Aluminum Association", sourceUrl: "https://materialsdata.nist.gov/bitstream/handle/11115/179/Properties%20of%20Wrought%20Aluminum.pdf" });
// These records are deliberately keyed to the catalog's bare offering label. The
// condition in each record is a sourced *reference condition*, not a claim that
// every supplier offering is delivered in that condition.
addDirectoryRecord("Aluminum", "1070 Aluminum", [], { condition: "H14 wrought reference", yieldStrength: "74 MPa", tensileStrength: "100 MPa", elongation: "6.7%", hardness: "Not published", density: "2.70 g/cm³", sourceLabel: "1070-H14 reference data", sourceUrl: "https://www.makeitfrom.com/material-properties/1070-H14-Aluminum" });
addDirectoryRecord("Aluminum", "2A12 Aluminum", [], { condition: "T4 plate reference", yieldStrength: "275 MPa", tensileStrength: "425 MPa", elongation: "12%", hardness: "120 HB", density: "2.80 g/cm³", sourceLabel: "2A12-T4 supplier data", sourceUrl: "https://www.hangbogroup.com/product/3101180080.html" });
addDirectoryRecord("Aluminum", "2A14 Aluminum", [], { condition: "T6 round-bar reference", yieldStrength: "380 MPa", tensileStrength: "460 MPa", elongation: "8%", hardness: "115 HBW", density: "2.80 g/cm³", sourceLabel: "Mingtai 2A14 technical data", sourceUrl: "https://m.mingtai-al.com/2A14-Aluminum-Round-Bar.html" });
addDirectoryRecord("Aluminum", "2014-T6 Aluminum", ["2014-T651 Aluminum"], { condition: "T6 / T651 typical", yieldStrength: "414 MPa", tensileStrength: "483 MPa", elongation: "13%", hardness: "135 HB", density: "2.80 g/cm³", sourceLabel: "ASM / MatWeb 2014-T6 / T651", sourceUrl: "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=MA2014T6" });
addDirectoryRecord("Aluminum", "2017-T4 Aluminum", [], { condition: "T4 typical", yieldStrength: "276 MPa", tensileStrength: "427 MPa", elongation: "22%", hardness: "105 HB", density: "2.79 g/cm³", sourceLabel: "ASM / MatWeb 2017-T4", sourceUrl: "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=MA2017T4" });
addDirectoryRecord("Aluminum", "2024-T3 Aluminum", [], materialMechanicalProperties["2024-T3"]);
addDirectoryRecord("Aluminum", "2024-T351 Aluminum", [], { condition: "T351 typical", yieldStrength: "324 MPa", tensileStrength: "469 MPa", elongation: "19%", hardness: "120 HB", density: "2.78 g/cm³", sourceLabel: "ASM / MatWeb 2024-T4 / T351", sourceUrl: "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=MA2024T4" });
addDirectoryRecord("Aluminum", "3003 Aluminum", [], { condition: "H14 sheet reference", yieldStrength: "145 MPa", tensileStrength: "152 MPa", elongation: "8%", hardness: "40 HB", density: "2.73 g/cm³", sourceLabel: "ASM / MatWeb 3003-H14", sourceUrl: "https://www.matweb.com/search/datasheetText.aspx?bassnum=MA3003H14" });
addDirectoryRecord("Aluminum", "5052-H32 Aluminum", [], materialMechanicalProperties["5052-H32"]);
addDirectoryRecord("Aluminum", "5083-H111 Aluminum", [], { condition: "H111 extruded product, ≤200 mm", yieldStrength: "110 MPa", tensileStrength: "270 MPa", elongation: "12%", hardness: "70 HB", density: "2.66 g/cm³", sourceLabel: "Klöckner EN AW-5083 data sheet", sourceUrl: "https://facts.kloeckner.de/werkstoffe/aluminium/3-3547/" });
addDirectoryRecord("Aluminum", "6061-T6 Aluminum", ["6061-T651 Aluminum"], { condition: "T6 / T651 typical", yieldStrength: "276 MPa", tensileStrength: "310 MPa", elongation: "12%", hardness: "95 HB", density: "2.70 g/cm³", sourceLabel: "ASM / MatWeb 6061-T6 / T651", sourceUrl: "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=ma6061t6" });
addDirectoryRecord("Aluminum", "6063-T6 Aluminum", [], { condition: "T6 typical", yieldStrength: "214 MPa", tensileStrength: "241 MPa", elongation: "12%", hardness: "73 HB", density: "2.70 g/cm³", sourceLabel: "Alliance 6063-T6 data sheet", sourceUrl: "https://allianceorg.com/pdfs/alumext/6063t6.pdf" });
addDirectoryRecord("Aluminum", "6060 Aluminum", ["6060", "Al 6060", "6060-T6 Aluminum", "Al 6060-T6"], { condition: "T6 extruded rod / bar, ≤150 mm", yieldStrength: "≥150 MPa", tensileStrength: "≥190 MPa", elongation: "≥8%", hardness: "~70 HB", density: "2.70 g/cm³", sourceLabel: "Hydro EN AW-6060 extrusion data", sourceUrl: "https://www.hydro.com/globalassets/08-about-hydro/hydro-worldwide/germany/extrusion-germany/alloy-data-sheets/hydro-en-aw-6060.pdf" });
addDirectoryRecord("Aluminum", "6082-T6 Aluminum", ["6082-T651 Aluminum"], { condition: "T6 / T651 plate, 3–6 mm", yieldStrength: "260 MPa", tensileStrength: "310 MPa", elongation: "10%", hardness: "94 HB", density: "2.70 g/cm³", sourceLabel: "Batz + Bürgel EN AW-6082 data sheet", sourceUrl: "https://batz-burgel.com/wp-content/uploads/data-en/BB_6082.pdf" });
addDirectoryRecord("Aluminum", "7050 Aluminum", [], { condition: "T7451 plate reference", yieldStrength: "469 MPa", tensileStrength: "524 MPa", elongation: "11%", hardness: "140 HB", density: "2.83 g/cm³", sourceLabel: "Kaiser 7050 technical data", sourceUrl: "https://online.kaiseraluminum.com/depot/PublicProductInformation/Document/1016/Kaiser_Aluminum_7050_Sheet_Coil_and_Plate.pdf" });
addDirectoryRecord("Aluminum", "7075-T6 Aluminum", [], materialMechanicalProperties["7075-T6"]);
addDirectoryRecord("Aluminum", "7075-T651 Aluminum", [], { condition: "T6 / T651 typical", yieldStrength: "503 MPa", tensileStrength: "572 MPa", elongation: "11%", hardness: "150 HB", density: "2.81 g/cm³", sourceLabel: "ASM / MatWeb 7075-T6 / T651", sourceUrl: "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=MA7075T6&lang=en" });
addDirectoryRecord("Aluminum", "7075-T7351 Aluminum", [], { condition: "T7351 typical", yieldStrength: "435 MPa", tensileStrength: "505 MPa", elongation: "13%", hardness: "135 HB", density: "2.81 g/cm³", sourceLabel: "ASM / MatWeb 7075-T735x", sourceUrl: "https://asm.matweb.com/search/SpecificMaterial.asp?bassnum=MA7075T73" });
addDirectoryRecord("Aluminum", "A413 Aluminum", [], { condition: "A413.0 die-cast reference", yieldStrength: "130 MPa", tensileStrength: "290 MPa", elongation: "3.5%", hardness: "80 HB", density: "2.66 g/cm³", sourceLabel: "NADCA A413.0 alloy data", sourceUrl: "https://tcdcinc.com/assets/NADCA_Alloy_Data_2009.pdf" });
addDirectoryRecord("Aluminum", "MIC-6 Aluminum", [], { condition: "Cast tooling-plate reference", yieldStrength: "105 MPa", tensileStrength: "165 MPa", elongation: "3%", hardness: "65 HB", density: "2.80 g/cm³", sourceLabel: "Alcoa MIC-6 / ASM MatWeb", sourceUrl: "https://www.matweb.com/search/datasheet.aspx?ckck=1&matguid=00fb97ab02dc42e8bfa06108f56682b5" });
addDirectoryRecord("Aluminum", "2007 Aluminum", [], { condition: "T4 reference", yieldStrength: "240 MPa", tensileStrength: "380 MPa", elongation: "8.1%", hardness: "Not published", density: "2.82 g/cm³", sourceLabel: "ASM / MatWeb 2007-T4", sourceUrl: "https://www.matweb.com/search/DataSheet.aspx?MatGUID=379a418aafc24efb91b00c7d1b95294e" });
addDirectoryRecord("Aluminum", "2017A Aluminum", [], { condition: "T451 bar reference", yieldStrength: "260 MPa", tensileStrength: "420 MPa", elongation: "10%", hardness: "105 HB", density: "2.80 g/cm³", sourceLabel: "Weerg 2017A technical data", sourceUrl: "https://www.weerg.com/hubfs/Datasheets/Datasheets%202024/ENG/EN_Alluminio2017A.pdf" });
addDirectoryRecord("Aluminum", "5251 Aluminum", [], { condition: "H22 sheet / plate reference", yieldStrength: "165 MPa", tensileStrength: "210 MPa", elongation: "14%", hardness: "65 HV", density: "2.69 g/cm³", sourceLabel: "thyssenkrupp 5251-H22 data sheet", sourceUrl: "https://ucpcdn.thyssenkrupp.com/_legacy/UCPthyssenkruppBAMXUK/assets.files/material-data-sheets/aluminium/5251-h22.pdf" });
addDirectoryRecord("Aluminum", "5754 Aluminum", [], { condition: "H22 sheet / plate reference", yieldStrength: "185 MPa", tensileStrength: "245 MPa", elongation: "15%", hardness: "75 HV", density: "2.67 g/cm³", sourceLabel: "ASM / MatWeb 5754-H22", sourceUrl: "https://www.matweb.com/search/datasheet_print.aspx?matguid=bb191b05a9424da5bdef4be5cad33182&n=1" });

addDirectoryRecord("Mild steel", "A36 Steel", [], materialMechanicalProperties["ASTM A36"]);
addDirectoryRecord("Mild steel", "1018 Steel", ["1018S"], materialMechanicalProperties["AISI 1018"]);
addDirectoryRecord("Mild steel", "Steel 1020", ["AISI 1010", "Steel 1010", "Steel 20#", "S15C", "C22"], materialMechanicalProperties["AISI 1020"]);
addDirectoryRecord("Mild steel", "Steel 1045 / 45#", [], materialMechanicalProperties["AISI 1045"]);
addDirectoryRecord("Mild steel", "Q235", ["SS400"], { condition: "Structural plate typical", yieldStrength: "235 MPa", tensileStrength: "375–500 MPa", elongation: "26%", hardness: "≤ 170 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("Q235 structural steel") });
addDirectoryRecord("Mild steel", "S355", ["S355J2", "Steel S355JR", "FE510 Steel"], { condition: "Structural plate typical", yieldStrength: "355 MPa", tensileStrength: "470–630 MPa", elongation: "22%", hardness: "≤ 220 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("S355JR structural steel") });
addDirectoryRecord("Mild steel", "A514 Steel", [], { condition: "Quenched and tempered plate", yieldStrength: "690 MPa", tensileStrength: "760–895 MPa", elongation: "18%", hardness: "235 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("ASTM A514 plate") });
addDirectoryRecord("Mild steel", "44W Steel", [], { condition: "CSA 44WT plate, 2.54–63.5 mm", yieldStrength: "≥303 MPa", tensileStrength: "441–621 MPa", elongation: "≥21%", hardness: "Not published", density: "Not published", sourceLabel: "SSAB CSA 44WT product data", sourceUrl: "https://www.ssab.com/en-us/brands-and-products/commercial-steel/structural-steel/csa-g40-21-13/44wt" });

addDirectoryRecord("Brass", "Brass 360", ["Brass C360", "Brass C3600", "CuZn39Pb3"], materialMechanicalProperties.C360);
addDirectoryRecord("Brass", "Brass 260", [], materialMechanicalProperties.C260);
addDirectoryRecord("Brass", "Brass C464", [], materialMechanicalProperties.C464);
addDirectoryRecord("Brass", "Brass C385", [], materialMechanicalProperties.C385);
addDirectoryRecord("Copper", "Copper C110", ["Copper 110", "Red Copper C110", "Red Copper T2"], materialMechanicalProperties.C110);
addDirectoryRecord("Copper", "Copper 101", ["Copper C101", "Red Copper C101"], materialMechanicalProperties.C101);
addDirectoryRecord("Copper", "Bronze 932", ["Bronze C932"], { condition: "As-cast bearing bronze", yieldStrength: "145 MPa", tensileStrength: "240 MPa", elongation: "10%", hardness: "65 HB", density: "8.83 g/cm³", sourceLabel: "Copper Development Association C93200", sourceUrl: copperAlloys("C93200") });

addDirectoryRecord("Alloy steel", "4130", ["4130 Steel", "Steel 4130"], materialMechanicalProperties["4130"]);
addDirectoryRecord("Alloy steel", "4140 Annealed", ["4140", "4140 Steel", "Steel 4140", "42CD4", "1.7227 / 42CrMoS4 Alloy Steel"], materialMechanicalProperties["4140"]);
addDirectoryRecord("Alloy steel", "4140 Normalized", [], { condition: "Normalized", yieldStrength: "655 MPa", tensileStrength: "950 MPa", elongation: "16%", hardness: "269 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 4140 normalized") });
addDirectoryRecord("Alloy steel", "4340 / E4340", ["4340 Steel", "Steel 4340", "EN19"], materialMechanicalProperties["4340"]);
addDirectoryRecord("Alloy steel", "300M VAR / E4340 Mod", ["4330 Mod VM N&T"], { condition: "Quenched and tempered", yieldStrength: "1,655 MPa", tensileStrength: "1,930 MPa", elongation: "8%", hardness: "534 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("300M VAR steel") });
addDirectoryRecord("Alloy steel", "52100", [], { condition: "Spheroidize annealed", yieldStrength: "415 MPa", tensileStrength: "690 MPa", elongation: "20%", hardness: "207 HB", density: "7.81 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 52100 annealed") });
addDirectoryRecord("Alloy steel", "6150 Vac Melt Annealed", [], { condition: "Annealed", yieldStrength: "415 MPa", tensileStrength: "725 MPa", elongation: "20%", hardness: "207 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 6150 annealed") });
addDirectoryRecord("Alloy steel", "9310 / E9310", [], { condition: "Annealed", yieldStrength: "415 MPa", tensileStrength: "655 MPa", elongation: "25%", hardness: "197 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 9310 annealed") });
addDirectoryRecord("Alloy steel", "16MnCrS5", ["1.7139 / 16MnCrS5 Alloy Steel", "1.7131 / 16MnCr5 Alloy Steel"], { condition: "Annealed", yieldStrength: "350 MPa", tensileStrength: "600 MPa", elongation: "15%", hardness: "180 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("16MnCr5 annealed") });
addDirectoryRecord("Alloy steel", "40CrMnMoS8-6 / 1.2312", [], { condition: "Pre-hardened", yieldStrength: "930 MPa", tensileStrength: "1,100 MPa", elongation: "10%", hardness: "310 HB", density: "7.85 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("1.2312 prehardened steel") });
addDirectoryRecord("Alloy steel", "40CrNiMo", [], { condition: "Quenched and tempered, ≤80 mm", yieldStrength: "≥835 MPa", tensileStrength: "≥980 MPa", elongation: "≥12%", hardness: "≤269 HB", density: "Not published", sourceLabel: "40CrNiMo GB/T 3077 supplier data", sourceUrl: "https://www.bealloy.com/40crnimo-15780289621199751.html" });
addDirectoryRecord("Alloy steel", "1.0737", [], { condition: "Cold-drawn, 40–63 mm", yieldStrength: "≥305 MPa", tensileStrength: "400–650 MPa", elongation: "≥9%", hardness: "Not published", density: "Not published", sourceLabel: "Kanat 11SMnPb37 / 1.0737 data sheet", sourceUrl: "https://www.kanatcelik.com/_files/ugd/f21b16_622ee01f358d442a9fab068415ae326b.pdf?index=true" });
addDirectoryRecord("Alloy steel", "1.6580 / 30CrNiMo8 Alloy Steel", [], { condition: "Quenched and tempered, ≤16 mm", yieldStrength: "≥1,050 MPa", tensileStrength: "1,250–1,450 MPa", elongation: "≥9%", hardness: "Not published", density: "Not published", sourceLabel: "Hillfoot 30CrNiMo8 / 1.6580 data sheet", sourceUrl: "https://www.hillfoot.com/files/30crnimo8-1.6580.pdf" });
addDirectoryRecord("Alloy steel", "1.6582 / 34CrNiMo6 Alloy Steel", [], { condition: "Quenched and tempered, ≤16 mm", yieldStrength: "≥1,000 MPa", tensileStrength: "1,200–1,400 MPa", elongation: "≥9%", hardness: "Not published", density: "Not published", sourceLabel: "Hillfoot 34CrNiMo6 / 1.6582 data sheet", sourceUrl: "https://www.hillfoot.com/files/34crnimo6-1.6582.pdf" });
addDirectoryRecord("Alloy steel", "17-4PH H900 Steel", [], materialMechanicalProperties["17-4 PH"]);
addDirectoryRecord("Alloy steel", "Toolox 33", [], { condition: "Delivered plate, 6–130 mm", yieldStrength: "≥700 MPa", tensileStrength: "≥800 MPa", elongation: "≥10%", hardness: "275–325 HBW", density: "Not published", sourceLabel: "SSAB Toolox 33 product data", sourceUrl: "https://www.ssab.com/en/brands-and-products/toolox/product-offer/toolox-33" });

addDirectoryRecord("Tool steel", "A2 Steel", [], materialMechanicalProperties["A2"]);
addDirectoryRecord("Tool steel", "SKD11", ["X160CrMoV12", "Z160CVD12"], materialMechanicalProperties["D2"]);
addDirectoryRecord("Tool steel", "O1 Tool Steel", ["1.2510 / 100MnCrW4"], materialMechanicalProperties["O1"]);
addDirectoryRecord("Tool steel", "ST TOOL M2", [], { condition: "Annealed", yieldStrength: "—", tensileStrength: "—", elongation: "—", hardness: "269 HB", density: "8.16 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("M2 tool steel annealed") });
addDirectoryRecord("Tool steel", "1215 Steel", ["1215", "Steel 1215", "1.0718"], { condition: "Cold-drawn bar", yieldStrength: "350 MPa", tensileStrength: "540 MPa", elongation: "10%", hardness: "167 HB", density: "7.87 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 1215 cold drawn") });
addDirectoryRecord("Tool steel", "Steel 12L14", ["12L14"], { condition: "Cold-drawn bar", yieldStrength: "415 MPa", tensileStrength: "540 MPa", elongation: "10%", hardness: "163 HB", density: "7.87 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matwebSteel("AISI 12L14 cold drawn") });
addDirectoryRecord("Tool steel", "1.2085", ["Steel 1.2085"], { condition: "Prehardened plate", yieldStrength: "750–950 MPa", tensileStrength: "950–1,100 MPa", elongation: "≥5%", hardness: "280–325 HB", density: "7.85 g/cm³", sourceLabel: "HABA 1.2085 product data", sourceUrl: "https://www.haba-gmbh.at/en/cuts/steel/haba-2316-s" });
addDirectoryRecord("Tool steel", "Toolox 33", [], { condition: "Delivered plate, 6–130 mm", yieldStrength: "≥700 MPa", tensileStrength: "≥800 MPa", elongation: "≥10%", hardness: "275–325 HBW", density: "Not published", sourceLabel: "SSAB Toolox 33 product data", sourceUrl: "https://www.ssab.com/en/brands-and-products/toolox/product-offer/toolox-33" });

addDirectoryRecord("Stainless steel", "1.2085", [], { condition: "Prehardened plate", yieldStrength: "750–950 MPa", tensileStrength: "950–1,100 MPa", elongation: "≥5%", hardness: "280–325 HB", density: "7.85 g/cm³", sourceLabel: "HABA 1.2085 product data", sourceUrl: "https://www.haba-gmbh.at/en/cuts/steel/haba-2316-s" });
addDirectoryRecord("Titanium", "Grade 1", [], { condition: "Annealed", yieldStrength: "170 MPa", tensileStrength: "240 MPa", elongation: "24%", hardness: "120 HB", density: "4.51 g/cm³", sourceLabel: "TIMET CP titanium data", sourceUrl: timetGrade2 });
addDirectoryRecord("Titanium", "Grade 2", ["Titanium Grade 2"], materialMechanicalProperties["Grade 2"]);
addDirectoryRecord("Titanium", "Grade 3", [], { condition: "Annealed", yieldStrength: "380 MPa", tensileStrength: "450 MPa", elongation: "18%", hardness: "200 HB", density: "4.51 g/cm³", sourceLabel: "TIMET CP titanium data", sourceUrl: timetGrade2 });
addDirectoryRecord("Titanium", "Grade 4", [], { condition: "Annealed", yieldStrength: "480 MPa", tensileStrength: "550 MPa", elongation: "15%", hardness: "250 HB", density: "4.51 g/cm³", sourceLabel: "TIMET CP titanium data", sourceUrl: timetGrade2 });
addDirectoryRecord("Titanium", "Grade 5 / 6Al-4V", ["Titanium Grade 5", "6AL4V", "TA6V", "TC4"], materialMechanicalProperties["Grade 5 / Ti-6Al-4V"]);
addDirectoryRecord("Titanium", "Grade 9 / 3Al-2.5V", [], materialMechanicalProperties["Grade 9 / Ti-3Al-2.5V"]);
addDirectoryRecord("Titanium", "Grade 6 / 5Al-2.5Sn", [], { condition: "Annealed", yieldStrength: "760 MPa", tensileStrength: "830 MPa", elongation: "10%", hardness: "300 HB", density: "4.48 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Ti-5Al-2.5Sn annealed") });
addDirectoryRecord("Titanium", "Grade 7", [], { ...materialMechanicalProperties["Grade 2"], condition: "Annealed (Grade 7)" });
addDirectoryRecord("Titanium", "Grade 12", [], { condition: "Annealed", yieldStrength: "345 MPa", tensileStrength: "480 MPa", elongation: "18%", hardness: "200 HB", density: "4.51 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Titanium Grade 12 annealed") });
addDirectoryRecord("Titanium", "6Al-2Sn-4Zr-2Mo", [], { condition: "Annealed", yieldStrength: "825 MPa", tensileStrength: "930 MPa", elongation: "10%", hardness: "300 HB", density: "4.54 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Ti 6Al-2Sn-4Zr-2Mo annealed") });
addDirectoryRecord("Titanium", "6Al-6V-2Sn", [], { condition: "Annealed", yieldStrength: "965 MPa", tensileStrength: "1,035 MPa", elongation: "8%", hardness: "350 HB", density: "4.65 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Ti 6Al-6V-2Sn annealed") });
addDirectoryRecord("Titanium", "6Al-7Nb", [], { condition: "Annealed", yieldStrength: "800 MPa", tensileStrength: "900 MPa", elongation: "10%", hardness: "310 HB", density: "4.52 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Ti 6Al-7Nb annealed") });
addDirectoryRecord("Titanium", "8Al-1Mo-1V", [], { condition: "Annealed bar", yieldStrength: "690 MPa", tensileStrength: "760 MPa", elongation: "10%", hardness: "300 HB", density: "4.43 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Ti-8Al-1Mo-1V annealed") });

addDirectoryRecord("Precision alloys", "Invar", ["Invar 36", "Invar36", "Invar36 Alloy"], materialMechanicalProperties["Invar 36"]);
addDirectoryRecord("Precision alloys", "Kovar", ["Kovar / 4J29"], materialMechanicalProperties.Kovar);
addDirectoryRecord("Precision alloys", "1J50", [], materialMechanicalProperties["1J50"]);
addDirectoryRecord("Precision alloys", "1J79", [], materialMechanicalProperties["1J79"]);

addDirectoryRecord("Magnesium / zinc alloys", "Zamak 3", [], materialMechanicalProperties["Zamak 3"]);
addDirectoryRecord("Magnesium / zinc alloys", "Zamak 5 / ASTM AC41A", [], { condition: "Die-cast", yieldStrength: "220 MPa", tensileStrength: "330 MPa", elongation: "7%", hardness: "91 HB", density: "6.70 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Zamak 5 die cast") });
addDirectoryRecord("Magnesium / zinc alloys", "AM60B", [], materialMechanicalProperties.AM60B);
addDirectoryRecord("Magnesium / zinc alloys", "AZ31B", [], materialMechanicalProperties.AZ31B);
addDirectoryRecord("Magnesium / zinc alloys", "AZ91D", [], materialMechanicalProperties.AZ91D);

const unfilledPlastic = (grade: string, condition: string, yieldStrength: string, tensileStrength: string, elongation: string, hardness: string, density: string): MaterialMechanicalProperties => ({
  condition,
  yieldStrength,
  tensileStrength,
  elongation,
  hardness,
  density,
  sourceLabel: "ASM / MatWeb reference data",
  sourceUrl: matweb(`${grade} unfilled material properties`),
});

addDirectoryRecord("Plastics / polymers", "ABS", ["ABS Black / White"], unfilledPlastic("ABS", "Unfilled injection-molding grade", "40 MPa", "45 MPa", "10%", "75 Shore D", "1.05 g/cm³"));
addDirectoryRecord("Plastics / polymers", "Acetal (POM)", ["Acetal Copolymer (POM-C)", "Acetal Copolymer (POM-C) FDA", "Acetal Homopolymer (POM-H)", "Delrin", "Delrin 150", "POM (Delrin/Acetal)", "POM / Delrin", "POM-C", "POM-H"], materialMechanicalProperties["POM / Acetal"]);
addDirectoryRecord("Plastics / polymers", "Nylon 6", ["Nylon", "Nylon 6/6", "Nylon 66", "PA / Nylon", "PA12"], unfilledPlastic("Nylon 6", "Unfilled, conditioned", "70 MPa", "75 MPa", "50%", "80 Shore D", "1.14 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PEEK", ["PEEK / USP Class VI TECAPEEK"], materialMechanicalProperties.PEEK);
addDirectoryRecord("Plastics / polymers", "PEI", ["Ultem", "ULTEM 1000"], unfilledPlastic("PEI", "Unfilled, extruded", "100 MPa", "110 MPa", "60%", "110 Rockwell M", "1.27 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PPS", [], unfilledPlastic("PPS", "Unfilled, extruded", "70 MPa", "90 MPa", "5%", "85 Shore D", "1.35 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PPSU", [], unfilledPlastic("PPSU", "Unfilled, extruded", "70 MPa", "75 MPa", "80%", "80 Shore D", "1.29 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PTFE (Teflon)", ["TEFLON", "PTFE"], materialMechanicalProperties.PTFE);
addDirectoryRecord("Plastics / polymers", "PVDF", [], unfilledPlastic("PVDF", "Unfilled, extruded", "45 MPa", "55 MPa", "50%", "80 Shore D", "1.78 g/cm³"));
addDirectoryRecord("Plastics / polymers", "HDPE", ["HDPE 1000", "PE", "Polyethylene"], unfilledPlastic("HDPE", "Unfilled, extruded", "25 MPa", "30 MPa", "500%", "65 Shore D", "0.95 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PP", ["Polypropylene"], unfilledPlastic("Polypropylene", "Unfilled, extruded", "30 MPa", "35 MPa", "200%", "75 Shore D", "0.90 g/cm³"));
addDirectoryRecord("Plastics / polymers", "UHMW", ["UHMW PE"], materialMechanicalProperties["UHMW-PE"]);
addDirectoryRecord("Plastics / polymers", "PBT", [], unfilledPlastic("PBT", "Unfilled, injection-molding grade", "55 MPa", "60 MPa", "50%", "80 Shore D", "1.30 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PETP", ["PET"], unfilledPlastic("PET", "Unfilled, extruded", "50 MPa", "60 MPa", "50%", "80 Shore D", "1.38 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PC", ["Polycarbonate"], unfilledPlastic("Polycarbonate", "Unfilled, extruded", "62 MPa", "70 MPa", "110%", "75 Shore D", "1.20 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PMMA", ["PMMA (Acrylic)", "Acrylic"], unfilledPlastic("PMMA acrylic", "Unfilled, cast sheet", "60 MPa", "70 MPa", "5%", "90 Shore D", "1.18 g/cm³"));
addDirectoryRecord("Plastics / polymers", "PVC", [], unfilledPlastic("Rigid PVC", "Unfilled, extruded", "50 MPa", "55 MPa", "80%", "80 Shore D", "1.40 g/cm³"));
addDirectoryRecord("Plastics / polymers", "Torlon", [], unfilledPlastic("PAI Torlon", "Unfilled, extruded", "110 MPa", "130 MPa", "10%", "120 Rockwell M", "1.41 g/cm³"));

const nickel625 = materialMechanicalProperties["Inconel 625"];
const nickel718 = materialMechanicalProperties["Inconel 718"];
addDirectoryRecord("Inconel/Incoloy", "Alloy 600", ["Inconel 600"], { condition: "Annealed", yieldStrength: "240 MPa", tensileStrength: "550 MPa", elongation: "30%", hardness: "160 HB", density: "8.47 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 601", ["Inconel 601"], { condition: "Annealed", yieldStrength: "220 MPa", tensileStrength: "550 MPa", elongation: "30%", hardness: "160 HB", density: "8.10 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 617", ["Inconel 617"], { condition: "Annealed", yieldStrength: "280 MPa", tensileStrength: "690 MPa", elongation: "45%", hardness: "190 HB", density: "8.36 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 625", ["Inconel 625", "Inconel 625 / Alloy 625"], nickel625);
addDirectoryRecord("Inconel/Incoloy", "Alloy 686", [], { condition: "Annealed", yieldStrength: "415 MPa", tensileStrength: "860 MPa", elongation: "45%", hardness: "205 HB", density: "8.73 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 718", ["Inconel 718"], nickel718);
addDirectoryRecord("Inconel/Incoloy", "Alloy 725", [], { condition: "Age-hardened", yieldStrength: "1,035 MPa", tensileStrength: "1,240 MPa", elongation: "20%", hardness: "330 HB", density: "8.14 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy X-750", ["Inconel X-750"], materialMechanicalProperties["Inconel X-750"]);
addDirectoryRecord("Inconel/Incoloy", "Alloy 800", ["Incoloy 800", "Alloy 800H", "Incoloy 800H", "Alloy 800HT", "Incoloy 800HT"], materialMechanicalProperties["Incoloy 800H"]);
addDirectoryRecord("Inconel/Incoloy", "Alloy 80A", [], { condition: "Annealed sheet, 0.75–1.65 mm", yieldStrength: "374 MPa", tensileStrength: "802 MPa", elongation: "52%", hardness: "211 HV", density: "8.19 g/cm³", sourceLabel: "Special Metals NIMONIC 80A bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/nimonic-alloy-80a.pdf" });
addDirectoryRecord("Inconel/Incoloy", "Alloy 20", [], { condition: "Annealed", yieldStrength: "240 MPa", tensileStrength: "550 MPa", elongation: "35%", hardness: "≤217 HB", density: "8.05 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Alloy 20 annealed") });
addDirectoryRecord("Inconel/Incoloy", "Invar", ["Invar 36"], materialMechanicalProperties["Invar 36"]);
addDirectoryRecord("Inconel/Incoloy", "Kovar", [], materialMechanicalProperties.Kovar);
addDirectoryRecord("Inconel/Incoloy", "Incoloy 825", [], { condition: "Annealed", yieldStrength: "240 MPa", tensileStrength: "585 MPa", elongation: "30%", hardness: "160 HB", density: "8.14 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Incoloy 925", ["Alloy 925"], { condition: "Age-hardened", yieldStrength: "760 MPa", tensileStrength: "1,035 MPa", elongation: "20%", hardness: "300 HB", density: "8.14 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Hastelloy C-276", ["Alloy C-276", "Inconel C-276"], { condition: "Annealed", yieldStrength: "355 MPa", tensileStrength: "790 MPa", elongation: "40%", hardness: "200 HB", density: "8.89 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Hastelloy C-22", ["Alloy C-22", "Inconel 22"], { condition: "Annealed", yieldStrength: "360 MPa", tensileStrength: "790 MPa", elongation: "45%", hardness: "200 HB", density: "8.69 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Hastelloy X", [], { condition: "Annealed", yieldStrength: "240 MPa", tensileStrength: "690 MPa", elongation: "45%", hardness: "185 HB", density: "8.22 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 400", ["Monel 400"], { condition: "Annealed", yieldStrength: "170 MPa", tensileStrength: "480 MPa", elongation: "35%", hardness: "110 HB", density: "8.80 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy K500", ["Monel K-500", "Monel K500"], { condition: "Age-hardened", yieldStrength: "760 MPa", tensileStrength: "1,035 MPa", elongation: "20%", hardness: "300 HB", density: "8.44 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Nickel 200", ["Alloy 200"], { condition: "Annealed", yieldStrength: "105 MPa", tensileStrength: "380 MPa", elongation: "45%", hardness: "80 HB", density: "8.89 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/nickel-200.pdf" });
addDirectoryRecord("Inconel/Incoloy", "Nickel 201", ["Alloy 201"], { condition: "Annealed", yieldStrength: "105 MPa", tensileStrength: "380 MPa", elongation: "45%", hardness: "80 HB", density: "8.89 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: "https://www.specialmetals.com/documents/technical-bulletins/nickel-200.pdf" });
addDirectoryRecord("Inconel/Incoloy", "Alloy A286", ["Incoloy A-286"], { condition: "Age-hardened", yieldStrength: "690 MPa", tensileStrength: "1,035 MPa", elongation: "15%", hardness: "300 HB", density: "7.94 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("A286 age hardened") });
addDirectoryRecord("Inconel/Incoloy", "Waspaloy", [], { condition: "Age-hardened", yieldStrength: "1,035 MPa", tensileStrength: "1,310 MPa", elongation: "15%", hardness: "330 HB", density: "8.19 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 25 / L605", [], { condition: "Annealed", yieldStrength: "450 MPa", tensileStrength: "930 MPa", elongation: "45%", hardness: "250 HB", density: "9.13 g/cm³", sourceLabel: "Special Metals technical bulletin", sourceUrl: specialMetals });
addDirectoryRecord("Inconel/Incoloy", "Alloy 230", [], { condition: "Annealed", yieldStrength: "345 MPa", tensileStrength: "790 MPa", elongation: "40%", hardness: "210 HB", density: "8.97 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Haynes 230 annealed") });
addDirectoryRecord("Inconel/Incoloy", "Alloy 282", [], { condition: "Age-hardened", yieldStrength: "760 MPa", tensileStrength: "1,170 MPa", elongation: "20%", hardness: "300 HB", density: "8.28 g/cm³", sourceLabel: "ASM / MatWeb reference data", sourceUrl: matweb("Haynes 282 age hardened") });

export function getDirectoryMechanicalProperties(family: string, grade: string) {
  const direct = directoryMechanicalProperties[directoryKey(family, grade)];
  const alias = directoryAliases[directoryKey(family, grade)];
  return direct ?? (alias ? directoryMechanicalProperties[alias] : undefined);
}
