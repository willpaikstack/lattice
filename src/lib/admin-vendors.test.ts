import { describe, expect, it } from "vitest";

import { buildOverseasVendors } from "./admin-vendors";

describe("admin vendors", () => {
  it("includes JC Proto and Best Prototypes in the overseas vendor directory", () => {
    const vendors = buildOverseasVendors([]);

    const jcProto = vendors.find((vendor) => vendor.id === "jucheng-precision-jc-proto");
    const bestPrototypes = vendors.find((vendor) => vendor.id === "best-prototypes");

    expect(jcProto).toMatchObject({
      city: "Shenzhen",
      country: "China",
      name: "Jucheng Precision (JC Proto)",
      primaryEmail: "project@juchengjm.com",
      status: "Needs review",
      website: "https://www.jcproto.com/",
    });
    expect(jcProto?.capabilities).toContain("Rapid tooling");
    expect(jcProto?.certifications).toContain("IATF 16949");

    expect(bestPrototypes).toMatchObject({
      city: "Dongguan",
      country: "China",
      name: "Best Prototypes",
      primaryEmail: "enquiry@best-prototypes.com",
      status: "Needs review",
      website: "https://www.best-prototype.com/",
    });
    expect(bestPrototypes?.capabilities).toContain("CMM inspection");
    expect(bestPrototypes?.vendorDocs).toContain("best_prototypes_equipment_list.pdf");
  });
});
