import { describe, expect, it } from "vitest";

import { capabilities, materials } from "./catalog-data";

describe("catalog data", () => {
  it("includes the canonical Bubble material categories", () => {
    expect(materials.map((material) => material.name)).toEqual([
      "Aluminum",
      "Stainless steel",
      "Mild steel",
      "Brass",
      "Copper",
      "Alloy steel",
      "Tool steel",
      "Titanium",
      "Inconel/Incoloy",
    ]);
  });

  it("keeps material records useful for RFQ guidance", () => {
    for (const material of materials) {
      expect(material.slug).toMatch(/^[a-z0-9-]+$/);
      expect(material.summary.length).toBeGreaterThan(40);
      expect(material.details.length).toBeGreaterThan(40);
      expect(material.commonGrades.length).toBeGreaterThan(0);
      expect(material.standards.length).toBeGreaterThan(0);
    }
  });

  it("includes Bubble-style stainless steel grade sub-cards", () => {
    const stainless = materials.find((material) => material.slug === "stainless-steel");

    expect(stainless?.variants?.map((variant) => variant.name)).toEqual(["SS 304", "SS 316", "SS 303"]);
    expect(stainless?.variants?.[0]).toMatchObject({
      uns: "S30400",
      commonSpec: "ASTM B205",
      industry: "Oil & Gas",
    });
  });

  it("fills Bubble's blank fabrication capability accordions with labeled categories", () => {
    expect(capabilities.map((capability) => capability.name)).toEqual([
      "CNC milling",
      "CNC turning / mill-turn",
      "Precision inspection",
      "Material traceability",
      "Production scaling",
      "Supplier network coordination",
    ]);
  });
});
