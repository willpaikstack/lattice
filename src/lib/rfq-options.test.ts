import { describe, expect, it } from "vitest";

import {
  bubbleOptionSetTranslations,
  generalToleranceOptions,
  localOptionValue,
  optionLabel,
  processOptions,
  qualityDocumentationOptions,
  requestStatusOptions,
  surfaceFinishOptions,
} from "./rfq-options";

describe("Bubble option set translations", () => {
  it("classifies Bubble option sets by the local persistence strategy", () => {
    expect(Object.fromEntries(bubbleOptionSetTranslations.map((set) => [set.bubbleName, set.target]))).toMatchObject({
      "Fabrication Capability": "future-table",
      "General Tolerance": "lookup",
      "Materials": "future-table",
      "Onboarded Companies": "seed-record",
      "Quote Status": "prisma-enum",
      State: "do-not-migrate",
      "Workspace Role": "prisma-enum",
    });
  });

  it("keeps clean local values while accepting Bubble values during migration", () => {
    expect(optionLabel(surfaceFinishOptions, "as_machined__ra_3_2__m___ra_126__in_")).toBe("As machined (Ra 3.2 um / Ra 126 uin)");
    expect(localOptionValue(surfaceFinishOptions, "as_machined__ra_3_2__m___ra_126__in_")).toBe("as_machined_ra_3_2");
    expect(optionLabel(qualityDocumentationOptions, "cmm")).toBe("Standard Inspection");
    expect(localOptionValue(generalToleranceOptions, "iso_2768_medium__m_")).toBe("iso_2768_medium_m");
  });

  it("preserves the editor option lists used by the RFQ form", () => {
    expect(processOptions.map((option) => option.label)).toEqual([
      "CNC Milling",
      "CNC Turning",
      "Sheet Metal Fabrication",
      "Injection Molding Services",
      "Selective Laser Sintering (SLS)",
      "Fused Deposition Modeling (FDM)",
    ]);

    expect(requestStatusOptions.map((option) => option.value)).toEqual(["DRAFT", "SUBMITTED", "READY_FOR_SUPPLIER_RFQ", "PURCHASED"]);
  });
});
