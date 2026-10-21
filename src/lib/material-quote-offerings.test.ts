import { describe, expect, it } from "vitest";
import { customerMaterialCatalog } from "./customer-material-catalog";
import { catalogGradeRecords } from "./material-catalog-records";
import { catalogInquiryPrefill, catalogMaterialAction, initialOfferingValue, materialConditionFor, materialOfferingFor, materialOfferings, materialSearchChoices, materialSelectionError, materialSelectionLabel, materialVariantFor, searchMaterialOfferings } from "./material-quote-offerings";
import { readManufacturingDetails, restrictionPolicyVersion, validateManufacturingIntake } from "./rfq-manufacturing";
import { selectableRfqMaterials } from "./rfq-material-search";
import { buildDraftRequest } from "./request-model";
import { draftInitialState } from "./request-form-prefill";

const intakeDeclaration = { restrictionStatus: "unrestricted" as const, policyVersion: restrictionPolicyVersion, endUse: "commercial" as const, endUseNotes: "" };

describe("catalog material quote and sourcing paths", () => {
  it("gives every published grade and listed condition a valid quote or prefilled sourcing action", () => {
    for (const family of customerMaterialCatalog) for (const record of catalogGradeRecords(family.materialGroups)) {
      for (const condition of [undefined, ...record.conditions.map((candidate) => candidate.label)]) {
        const action = catalogMaterialAction(family.name, record.grade, condition);
        const url = new URL(action.href, "https://lattice.example");
        const value = url.searchParams.get("material")!;
        expect(materialOfferingFor(value), `${family.name}: ${record.grade} ${condition ?? ""}`).toBeDefined();
        if (action.sourcing) {
          expect(url.pathname).toBe("/materials/inquiry");
          expect(catalogInquiryPrefill(value)).toEqual({ materialName: record.grade, specification: condition ?? "" });
        } else {
          expect(url.pathname).toBe("/requests/new");
          expect([null, "Select a material condition"]).toContain(materialSelectionError(value));
          if (condition) expect(materialConditionFor(value)?.label).toBe(condition);
        }
      }
    }
  });

  it("keeps historical RFQ keys readable while hiding curated requirements from the picker", () => {
    for (const variant of selectableRfqMaterials) {
      expect(materialOfferingFor(variant.value), variant.label).toBeDefined();
      expect(materialVariantFor(variant.value)?.value, variant.label).toBe(variant.value);
      expect(materialSelectionError(variant.value), variant.label).toBeNull();
    }
    for (const value of ["al_6061_t6", "6061_t651_aluminum"]) {
      expect(materialSearchChoices.some(choice => choice.value === value)).toBe(true);
    }
    for (const label of ["18-8 Stainless Steel", "Beryllium Copper", "Magnesium", "Zinc", "Cast Iron", "Duplex 2205 / S31803", "Duplex 2205 / S32205"]) {
      expect(materialSearchChoices.some(choice => choice.label === label), label).toBe(false);
    }
  });

  it("does not merge a distinct steel requirement through a broad catalog lookup alias", () => {
    const distinct = selectableRfqMaterials.find((option) => option.label === "1.7227 / 42CrMoS4 Alloy Steel")!;
    const conventional = selectableRfqMaterials.find((option) => option.label === "4140 Steel")!;
    expect(materialOfferingFor(distinct.value)?.value).not.toBe(materialOfferingFor(conventional.value)?.value);
    expect(materialSelectionLabel(distinct.value)).toBe(distinct.label);
  });

  it("routes 321 and 347 to sourcing without claiming an unqualified quote selection", () => {
    for (const grade of ["321", "347"]) {
      const action = catalogMaterialAction("Stainless steel", grade);
      expect(action.sourcing).toBe(true);
      const value = new URL(action.href, "https://lattice.example").searchParams.get("material");
      const choice = searchMaterialOfferings(grade).find((candidate) => candidate.value === value)!;
      expect(choice.sourcing).toBe(true);
      expect(materialSelectionError(choice.value)).toMatch(/sourcing review/);
    }
  });

  it("selects both alloy and temper from an exact search and keeps T6 and T651 distinct", () => {
    const result = searchMaterialOfferings("6061-T651")[0];
    expect(result.value).toBe("6061_t651_aluminum");
    expect(materialOfferingFor(result.value)?.grade).toBe("6061 Aluminum");
    expect(materialConditionFor(result.value)?.label).toBe("T651");
    expect(materialSelectionLabel(result.value)).toBe("6061-T651 Aluminum");
    expect(materialConditionFor("al_6061_t6")?.label).toBe("T6");
    const parent = materialOfferingFor(result.value)!;
    expect(materialSelectionError(initialOfferingValue(parent))).toBe("Select a material condition");
  });

  it("does not substitute an unspecified alloy for a catalog-only temper", () => {
    const action = catalogMaterialAction("Aluminum", "6063 Aluminum", "T6");
    expect(action.sourcing).toBe(true);
    const value = new URL(action.href, "https://lattice.example").searchParams.get("material")!;
    expect(catalogInquiryPrefill(value)).toEqual({ materialName: "6063 Aluminum", specification: "T6" });
    expect(materialSelectionError(value)).toMatch(/sourcing/);
  });

  it("preserves pending selections and exact legacy temper keys through saved drafts", () => {
    for (const value of ["al_6061_t6", "6061_t651_aluminum", materialOfferings.find((candidate) => candidate.grade === "6061 Aluminum")!.value]) {
      const request = buildDraftRequest({ title: "Material draft", files: [], lineItems: [{ quantity: 1, material: materialSelectionLabel(value), manufacturingDetails: readManufacturingDetails({ materialKey: value }) }] });
      expect(draftInitialState(request).lineItems?.[0].material).toBe(value);
    }
  });

  it("validates full material requirements and derives grade/condition metadata on the server", () => {
    const details = readManufacturingDetails({ materialKey: "6061_t651_aluminum", materialGrade: "321", materialCondition: "T6", process: "cnc_milling", finishKey: "as_machined_ra_3_2" })!;
    expect(details).toMatchObject({ materialGrade: "6061 Aluminum", materialCondition: "T651" });
    const input = { intakeDeclaration, lineItems: [{ quantity: 1, material: "6061-T651 Aluminum", surfaceFinish: "As machined (Ra 3.2 um / Ra 126 uin)", manufacturingDetails: details }] };
    expect(() => validateManufacturingIntake(input)).not.toThrow();
    input.lineItems[0].material = "6061-T6 Aluminum";
    expect(() => validateManufacturingIntake(input)).toThrow(/invalid material selection/);
    input.lineItems[0].manufacturingDetails.materialKey = materialOfferingFor("6061_t651_aluminum")!.value;
    expect(() => validateManufacturingIntake(input)).toThrow(/Select a material condition/);
  });
});
