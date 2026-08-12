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
    expect(gradesBySlug["magnesium-zinc"]).not.toContain("Cast Iron");
    expect(gradesBySlug["plastics-polymers"]).toContain("ULTEM 2300");
  });

  it("consolidates equivalent aluminum supplier labels into one customer-facing grade", () => {
    const aluminum = customerMaterialCatalog.find((material) => material.slug === "aluminum");
    const grades = aluminum?.materialGroups.flatMap((group) => group.grades) ?? [];

    expect(aluminum?.gradeCount).toBe(21);
    expect(grades).toContain("6061 Aluminum");
    expect(grades).not.toContain("6061-T6 Aluminum");
    expect(aluminum?.materialGroups.flatMap((group) => group.conditionsByGrade?.["6061 Aluminum"] ?? []).map((condition) => condition.label)).toEqual(["T6", "T651"]);
    expect(grades).not.toContain("Al 6061-T6");
    expect(grades).not.toContain("6061-T6 Aluminum Aluminum");
  });

  it("consolidates standard 304 and 316 stainless variants into dual-certified offerings", () => {
    const stainless = customerMaterialCatalog.find((material) => material.slug === "stainless-steel");
    const grades = stainless?.materialGroups.flatMap((group) => group.grades) ?? [];

    expect(grades).toContain("304/304L Stainless Steel");
    expect(grades).toContain("316/316L Stainless Steel");
    expect(grades).not.toEqual(expect.arrayContaining(["304", "304L", "316", "316L"]));
    expect(grades).toContain("304H");
    expect(grades).toContain("316H");
    expect(grades).not.toEqual(expect.arrayContaining(["SS 304H", "SS 316H"]));
  });

  it("uses the material-family term for precipitation-hardened stainless steels", () => {
    const stainless = customerMaterialCatalog.find((material) => material.slug === "stainless-steel");
    const groupNames = stainless?.materialGroups.map((group) => group.name) ?? [];
    const precipitationGroup = stainless?.materialGroups.find(
      (group) => group.name === "Precipitation-hardened stainless steels",
    );

    expect(groupNames).toContain("Precipitation-hardened stainless steels");
    expect(groupNames).not.toContain("Precipitation hardening");
    expect(precipitationGroup?.grades).toEqual(expect.arrayContaining(["17-4 PH"]));
  });

  it("places 303 free-machining variants in the 300 series and omits generic family labels", () => {
    const stainless = customerMaterialCatalog.find((material) => material.slug === "stainless-steel");
    const austeniticGrades = stainless?.materialGroups.find((group) => group.name === "300 series austenitic")?.grades ?? [];
    const catalogLabels = cncMaterialLibrary.map((material) => material.label);

    expect(austeniticGrades).toEqual(expect.arrayContaining(["303Se", "303Sulf"]));
    expect(austeniticGrades).not.toContain("SS 300 series");
    expect(catalogLabels).not.toContain("SS 300 series");
  });

  it("places every standard wrought aluminum offering in its numbered series", () => {
    const aluminum = customerMaterialCatalog.find((material) => material.slug === "aluminum");
    const groupsByName = new Map(aluminum?.materialGroups.map((group) => [group.name, group.grades]) ?? []);

    expect(groupsByName.get("2000 series")).toEqual(expect.arrayContaining(["2007 Aluminum", "2017A Aluminum"]));
    expect(groupsByName.get("5000 series")).toEqual(expect.arrayContaining(["5251 Aluminum", "5754 Aluminum"]));
    expect(groupsByName.get("7000 series")).toEqual(expect.arrayContaining(["7050 Aluminum"]));
    expect(groupsByName.get("Other grades")).toBeUndefined();
  });
});
