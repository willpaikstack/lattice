import { describe, expect, it } from "vitest";

import { getMaterialFamilyDetail } from "./material-family-view-models";

describe("material family detail view models", () => {
  it.each([
    ["stainless-steel", "304"],
    ["mild-steel", "ASTM A36"],
    ["brass", "C360"],
    ["copper", "C110"],
    ["alloy-steel", "4140"],
    ["tool-steel", "D2"],
    ["titanium", "Grade 2"],
    ["inconel-incoloy", "Inconel 625"],
    ["precision-alloys", "Kovar"],
    ["magnesium-zinc", "AZ91D"],
    ["plastics-polymers", "POM / Acetal"],
  ])("provides art-directed photography and four profiles for %s", (slug, firstGrade) => {
    const material = getMaterialFamilyDetail(slug);

    expect(material).toBeDefined();
    expect(material?.heroImage).toBe(`/materials/detail/${slug}/hero.png`);
    expect(material?.featuredGrades).toHaveLength(4);
    expect(material?.featuredGrades[0]).toMatchObject({ commonStartingPoint: true, name: firstGrade });
    expect(material?.featuredGrades.every((grade) => grade.mechanicalProperties?.condition)).toBe(true);
    expect(material?.featuredGrades.every((grade) => grade.image.startsWith(`/materials/detail/${slug}/`))).toBe(true);
  });
});
