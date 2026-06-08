import { describe, expect, it } from "vitest";

import { normalizeVendorSaveInput } from "./admin-vendor-overrides";

describe("admin vendor overrides", () => {
  it("normalizes editable vendor fields and detail rows before persistence", () => {
    const normalized = normalizeVendorSaveInput({
      detail: {
        orderRows: [
          {
            id: " PO-1 ",
            leadTime: " 12 days ",
            parts: 3,
            response: " In production ",
            selected: " Yes ",
            sent: " Jun 5 ",
            value: " $100 ",
          },
        ],
      },
      fields: {
        capabilities: [" CNC ", "", null],
        certifications: [" ISO 9001 "],
        city: " Dongguan ",
        communicationWindow: " 08:00-18:00 ",
        country: " China ",
        defectRate: " 0.8% ",
        fabCapabilities: [" Milling "],
        materials: [" 6061 "],
        name: " Axis CNC ",
        nonFabOfferings: [" Assembly "],
        notes: " Fast partner ",
        onboardingStatus: "Definitely not valid",
        onTimeDeliveryRate: " 94% ",
        paymentTerms: " Net 45 ",
        phoneNumber: " +86 ",
        primaryCapability: " CNC ",
        primaryContact: " Liang ",
        primaryEmail: " liang@example.com ",
        qmsStandard: " ISO ",
        qualitySystem: " Inspection ",
        region: " Guangdong ",
        relationshipOwner: " Maya ",
        shippingLane: " HK ",
        vendorDocs: [" QMS.pdf "],
        vendorType: [" Machine Shop "],
        website: " https://example.com ",
        wechatId: " axis ",
      },
    });

    expect(normalized.fields.name).toBe("Axis CNC");
    expect(normalized.fields.capabilities).toEqual(["CNC"]);
    expect(normalized.fields.onboardingStatus).toBe("Needs intake");
    expect(normalized.detail?.orderRows).toEqual([
      {
        id: "PO-1",
        leadTime: "12 days",
        parts: "",
        response: "In production",
        selected: "Yes",
        sent: "Jun 5",
        value: "$100",
      },
    ]);
  });
});
