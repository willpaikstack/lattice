import { describe, expect, it } from "vitest";

import { buildMaterialInquiry, isMaterialInquiryStatus } from "./material-inquiries";

describe("material inquiries", () => {
  it("normalizes a new inquiry into the review workflow", () => {
    const inquiry = buildMaterialInquiry({
      company: " ForgeWorks ",
      intendedUse: " Medical casting ",
      materialName: " Cobalt chrome ",
      requesterEmail: " BUYER@FORGEWORKS.COM ",
      requesterName: " Avery Chen ",
      specification: " ASTM F75 ",
    });

    expect(inquiry).toMatchObject({
      company: "ForgeWorks",
      intendedUse: "Medical casting",
      materialName: "Cobalt chrome",
      requesterEmail: "buyer@forgeworks.com",
      requesterName: "Avery Chen",
      specification: "ASTM F75",
      status: "NEW",
    });
  });

  it("requires the minimum information needed for follow-up", () => {
    expect(() => buildMaterialInquiry({
      company: "",
      intendedUse: "",
      materialName: "",
      requesterEmail: "buyer@example.com",
      requesterName: "Buyer",
    })).toThrow(/require a material, company, intended use/);
  });

  it("accepts only supported workflow statuses", () => {
    expect(isMaterialInquiryStatus("REVIEWING")).toBe(true);
    expect(isMaterialInquiryStatus("PENDING_VENDOR")).toBe(false);
  });
});
