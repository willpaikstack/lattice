import { describe, expect, it } from "vitest";

import { customerMaterialCatalog } from "./customer-material-catalog";
import { catalogGradeRecords, catalogReferenceProperties } from "./material-catalog-records";
import { getFeaturedMaterialGrades, getMaterialFamilyDetail, materialFamilies } from "./material-family-view-models";

describe("material family detail view models", () => {
  it.each([
    ["aluminum", "6061", 4],
    ["stainless-steel", "304/304L Stainless Steel", 4],
    ["mild-steel", "A36 Steel", 3],
    ["brass", "Brass 360 (UNS C36000)", 2],
    ["copper", "Copper 110 (UNS C11000)", 2],
    ["alloy-steel", "4140", 3],
    ["tool-steel", "A2 Steel", 2],
    ["titanium", "Grade 2", 3],
    ["inconel-incoloy", "Inconel 625", 4],
    ["precision-alloys", "Kovar", 4],
    ["magnesium-zinc", "AZ91D", 4],
    ["plastics-polymers", "Acetal (POM)", 4],
  ])("provides catalog-backed highlights and photography for %s", (slug, firstGrade, count) => {
    const material = getMaterialFamilyDetail(String(slug));

    expect(material).toBeDefined();
    expect(material?.heroImage).toBe(slug === "aluminum" ? "/materials/detail/aluminum-hero.png" : `/materials/detail/${slug}/hero.png`);
    expect(material?.featuredGrades).toHaveLength(Number(count));
    expect(material?.featuredGrades[0]).toMatchObject({ commonStartingPoint: true, name: firstGrade });
    expect(material?.featuredGrades.every((grade) => grade.image.startsWith(slug === "aluminum" ? "/materials/detail/aluminum-" : `/materials/detail/${slug}/`))).toBe(true);
  });

  it("keeps family examples, common cards, names and reference conditions aligned with each full directory", () => {
    for (const material of customerMaterialCatalog) {
      const detail = getMaterialFamilyDetail(material.slug)!;
      const records = catalogGradeRecords(material.materialGroups);
      expect(detail.gradeCount).toBe(records.length);
      expect(detail.examples).toEqual(detail.featuredGrades.map((grade) => grade.name));
      expect(materialFamilies.find((family) => family.slug === material.slug)?.examples).toEqual(detail.examples);
      for (const featured of detail.featuredGrades) {
        const record = records.find((candidate) => candidate.grade === featured.grade);
        expect(record, `${material.slug}: ${featured.grade}`).toBeDefined();
        expect(featured.name).toBe(record!.name);
        const condition = record!.conditions.find((candidate) => candidate.label === featured.condition);
        if (featured.condition) expect(condition).toBeDefined();
        expect(featured.mechanicalProperties).toEqual(catalogReferenceProperties(material.name, record!.grade, condition));
      }
    }
  });

  it("stops featuring a removed grade without reintroducing legacy display-only variants", () => {
    const brass = customerMaterialCatalog.find((material) => material.slug === "brass")!;
    const updated = { ...brass, materialGroups: brass.materialGroups.map((group) => ({
      ...group, grades: group.grades.filter((grade) => grade !== "Brass 360 (UNS C36000)"),
    })) };
    const featured = getFeaturedMaterialGrades(updated);
    expect(featured.map((grade) => grade.grade)).toEqual(["Brass 260"]);
    expect(featured[0].commonStartingPoint).toBe(true);
  });

  it("omits a condition-specific card if its temper is no longer published", () => {
    const aluminum = customerMaterialCatalog.find((material) => material.slug === "aluminum")!;
    const updated = { ...aluminum, materialGroups: aluminum.materialGroups.map((group) => ({
      ...group,
      conditionsByGrade: { ...group.conditionsByGrade, "6061 Aluminum": [{ grade: "6061-T651 Aluminum", label: "T651" }] },
    })) };
    expect(getFeaturedMaterialGrades(aluminum)[0]).toMatchObject({ grade: "6061 Aluminum", name: "6061", condition: "T6" });
    expect(getFeaturedMaterialGrades(updated).some((grade) => grade.grade === "6061 Aluminum")).toBe(false);
  });

  it("uses only directory records for an uncurated family", () => {
    const copper = customerMaterialCatalog.find((material) => material.slug === "copper")!;
    const updated = { ...copper, slug: "uncurated-family", materialGroups: [{ name: "Published grades", grades: ["Copper 101"] }] };
    expect(getFeaturedMaterialGrades(updated).map((grade) => grade.grade)).toEqual(["Copper 101"]);
    expect(getFeaturedMaterialGrades({ ...updated, materialGroups: [] })).toEqual([]);
  });

  it("does not attach single-grade reference properties to the combined stainless requirements", () => {
    const stainless = getMaterialFamilyDetail("stainless-steel")!;
    for (const grade of stainless.featuredGrades.filter((candidate) => candidate.name.includes("/"))) {
      expect(grade.mechanicalProperties).toBeUndefined();
    }
    expect(stainless.featuredGrades[0].uns).toBe("UNS S30400 / S30403");
    expect(stainless.featuredGrades[1].uns).toBe("UNS S31600 / S31603");
  });
});
