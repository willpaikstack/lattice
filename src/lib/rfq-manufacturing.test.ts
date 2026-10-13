import { describe, expect, it } from "vitest";
import { compatibleFinishOptions, finishCompatibilityError, intakeUploadError, restrictionPolicyVersion, validateManufacturingIntake } from "./rfq-manufacturing";
import { cadMetadataFromModel } from "./cad-model-metadata";

describe("manufacturing eligibility and finishes", () => {
  it.each([undefined, "unconfirmed", "restricted", "unsure"])("rejects %s eligibility", status => {
    expect(intakeUploadError(status, restrictionPolicyVersion)).toBeTruthy();
  });
  it("requires the current declaration version", () => {
    expect(intakeUploadError("unrestricted", "old-policy")).toBeTruthy();
    expect(intakeUploadError("unrestricted", restrictionPolicyVersion)).toBeNull();
  });
  it("filters aluminum-only finishes out of stainless menus", () => {
    expect(compatibleFinishOptions("ss_304", "cnc_milling", "as_machined_ra_3_2").some(option => option.value.includes("anodized"))).toBe(false);
    expect(finishCompatibilityError("al_6061_t6", "as_machined_anodized_type_ii")).toBeNull();
    expect(finishCompatibilityError("ss_304", "chromate_conversion_coating")).toBeTruthy();
  });
  it("keeps an invalid saved choice visible for deliberate correction", () => {
    expect(compatibleFinishOptions("ss_304", "cnc_milling", "as_machined_anodized_type_ii")[0].label).toMatch(/select a compatible finish/);
  });
  it("uses a conservative metal/polymer and process matrix", () => {
    expect(finishCompatibilityError("al_6061_t6", "powder_coated")).toBeNull();
    expect(finishCompatibilityError("ultem_2300", "powder_coated")).toBeTruthy();
    expect(finishCompatibilityError("ss_304", "electroless_nickel_plating")).toBeNull();
    expect(finishCompatibilityError("titanium_grade_5", "electroless_nickel_plating")).toBeTruthy();
    expect(finishCompatibilityError("al_6061_t6", "fine_machining_ra_0_8", "sheet_metal_fabrication")).toBeTruthy();
  });
  it("rejects mixed end-use and derives the overall process from each part", () => {
    const input = { process: "old hidden value", intakeDeclaration: { restrictionStatus: "unrestricted" as const, policyVersion: restrictionPolicyVersion, endUse: "mixed" as "mixed" | "prototype", endUseNotes: "" }, lineItems: [
      { material: "SS 304", surfaceFinish: "As machined (Ra 3.2 um / Ra 126 uin)", manufacturingDetails: { process: "cnc_turning", materialKey: "ss_304", finishKey: "as_machined_ra_3_2", customerPartNumber: "P-1", cadRevision: "B", drawingRevision: "C", fileHistory: [] } },
    ] };
    expect(() => validateManufacturingIntake(input)).toThrow(/prototype or commercial/);
    input.intakeDeclaration.endUse = "prototype";
    validateManufacturingIntake(input);
    expect(input.process).toBe("CNC Turning");
    input.lineItems[0].manufacturingDetails.finishKey = "as_machined_anodized_type_ii";
    expect(() => validateManufacturingIntake(input)).toThrow(/require aluminum/);
  });
});

describe("CAD envelope metadata", () => {
  it.each([["mm", 0.001, 25.4], ["in", 0.0254, 1]])("converts %s model coordinates to millimeters", (unit, scale, extent) => {
    const metadata = cadMetadataFromModel({ getBoundingBox: () => ({ min: { x: 0, y: 0, z: 0 }, max: { x: extent as number, y: extent as number, z: extent as number } }), getUnitString: () => unit as string, getUnitScale: () => scale as number });
    expect(metadata?.dimensionsMm[0]).toBeCloseTo(25.4);
    expect(metadata?.sourceUnit).toBe(unit);
  });
  it("does not assume unknown units or infinite bounds", () => {
    expect(cadMetadataFromModel({ getUnitString: () => null, getUnitScale: () => 1 })).toBeUndefined();
    expect(cadMetadataFromModel({ getUnitString: () => "mm", getUnitScale: () => 0.001, getBoundingBox: () => ({ min: { x: 0, y: 0, z: 0 }, max: { x: Infinity, y: 1, z: 1 } }) })).toBeUndefined();
  });
});
