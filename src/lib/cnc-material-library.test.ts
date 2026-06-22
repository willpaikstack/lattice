import { describe, expect, it } from "vitest";

import { cncMaterialLibrary } from "./cnc-material-library";
import { customerMaterialCatalog } from "./customer-material-catalog";

describe("CNC material library", () => {
  it("captures researched CNC materials from Fictiv, Hubs, and Xometry", () => {
    const labels = new Set(cncMaterialLibrary.map((material) => material.label));
    const sources = new Set(cncMaterialLibrary.flatMap((material) => material.sources));

    expect(sources).toEqual(new Set(["Fictiv", "Hubs", "Xometry"]));
    expect(labels).toContain("7075-T6 Aluminum");
    expect(labels).toContain("2205 Duplex Stainless Steel");
    expect(labels).toContain("A514 Steel");
    expect(labels).toContain("Invar 36");
    expect(labels).toContain("Bronze 932");
    expect(labels).toContain("Garolite G-11 / FR5");
    expect(labels).toContain("ULTEM 2300");
  });

  it("keeps stable values for legacy RFQ defaults and reordered requests", () => {
    expect(cncMaterialLibrary.find((material) => material.value === "ss_304")?.label).toBe("SS 304");
    expect(cncMaterialLibrary.find((material) => material.value === "al_6061_t6")?.label).toBe("6061-T6 Aluminum");
    expect(cncMaterialLibrary.find((material) => material.value === "pvc")?.label).toBe("PVC");
    expect(cncMaterialLibrary.find((material) => material.value === "in_625")?.label).toBe("Inconel 625");
  });

  it("includes UNS and composition metadata for every RFQ material option", () => {
    for (const material of cncMaterialLibrary) {
      expect(material.unsNumber, material.label).toMatch(/^UNS /);
      expect(material.composition, material.label).not.toHaveLength(0);
      expect(material.compositionFormula, material.label).not.toHaveLength(0);
    }

    expect(cncMaterialLibrary.find((material) => material.value === "ss_304")?.unsNumber).toBe("UNS S30400");
    expect(cncMaterialLibrary.find((material) => material.value === "al_6061_t6")?.composition).toContain("0.8-1.2 Mg");
    expect(cncMaterialLibrary.find((material) => material.value === "al_6061_t6")?.compositionFormula).toBe("AlMg1SiCu");
    expect(cncMaterialLibrary.find((material) => material.value === "ultem_2300")?.compositionFormula).toBe("PEI GF30");
  });

  it("feeds researched marketplace materials into the customer material catalog", () => {
    const gradesBySlug = Object.fromEntries(customerMaterialCatalog.map((material) => [material.slug, material.materialGroups.flatMap((group) => group.grades)]));

    expect(gradesBySlug.aluminum).toContain("7050 Aluminum");
    expect(gradesBySlug["stainless-steel"]).toContain("2205 Duplex Stainless Steel");
    expect(gradesBySlug["magnesium-zinc"]).toContain("Cast Iron");
    expect(gradesBySlug["plastics-polymers"]).toContain("ULTEM 2300");
  });
});
