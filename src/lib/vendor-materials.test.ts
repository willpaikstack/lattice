import { describe, expect, it } from "vitest";

import { vendorMaterialOfferings } from "./vendor-materials";
import { vendorSourceDocuments } from "./vendor-source-documents";

describe("vendor material offerings", () => {
  it("keeps admin traceability back to vendor source documents", () => {
    const sourceIds = new Set(Object.values(vendorSourceDocuments).map((source) => source.id));

    for (const offering of vendorMaterialOfferings) {
      expect(offering.vendor.length).toBeGreaterThan(0);
      expect(offering.grades.length).toBeGreaterThan(0);
      expect(offering.sourceDocumentIds.length).toBeGreaterThan(0);

      for (const sourceDocumentId of offering.sourceDocumentIds) {
        expect(sourceIds.has(sourceDocumentId)).toBe(true);
      }
    }
  });

  it("captures newly supplied vendor material sources", () => {
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Zintilon" && offering.category === "Plastics / Polymers")?.grades).toContain("PEEK");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Zintilon" && offering.category === "Plastics / Polymers")?.grades).toContain("PPS+40%GF");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Zintilon" && offering.category === "Carbon / Alloy Steel")?.grades).toContain("05Cr17Ni4Cu4Nb");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Saky Steel" && offering.category === "Nickel / Cobalt Alloy")?.grades).toContain("Hastelloy C-276");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Saky Steel" && offering.category === "Controlled Expansion / Precision Alloy")?.grades).toContain("1J85");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Saky Steel" && offering.category === "Stainless Steel")?.grades).toContain("Z100 / S32760");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Tianjin ZYTC Alloy Technology Co., Ltd" && offering.category === "Titanium")?.grades).toContain("Grade 5 / 6Al-4V");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Tianjin ZYTC Alloy Technology Co., Ltd" && offering.category === "Nickel / Cobalt Alloy")?.grades).toContain("MP35N");
    expect(vendorMaterialOfferings.find((offering) => offering.vendor === "Tianjin ZYTC Alloy Technology Co., Ltd" && offering.category === "Stainless Steel")?.grades).toContain("316Ti");
  });
});
