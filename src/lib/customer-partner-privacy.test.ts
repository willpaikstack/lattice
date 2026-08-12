import { describe, expect, it } from "vitest";

import { buildDraftRequest, submitDraftRequest } from "./request-model";
import { customerEquipmentGuidance, customerPartnerPrivacy, customerSafeRequest } from "./customer-partner-privacy";

describe("customer partner privacy", () => {
  it("removes internal partner identity from equipment guidance", () => {
    expect(customerEquipmentGuidance("Beijing Jingdiao 5-axis machining center listed by Best Prototypes.")).toBe(
      "Beijing Jingdiao 5-axis machining center available through the Lattice manufacturing network.",
    );
    expect(customerEquipmentGuidance("Highest-volume 5-axis group in the current Zintilon list.")).not.toMatch(/Zintilon/i);
  });

  it("redacts supplier names, contacts, and free-text updates from buyer data", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Acme Manufacturing",
        dueDate: "2026-08-20",
        files: [{ name: "part.step", sizeBytes: 1000, type: "model/step" }],
        lineItems: [{ material: "6061-T6 Aluminum", partName: "Housing", quantity: 1 }],
        process: "CNC milling",
        requesterName: "Avery Chen",
        title: "Partner privacy test",
      }),
    );
    const customerSafe = customerSafeRequest({
      ...request,
      supplierOrder: {
        ...request.supplierOrder,
        contactName: "Li Wei",
        notes: "Shenzhen Precision Manufacturing has completed machining.",
        shopName: "Shenzhen Precision Manufacturing",
        documents: [{ category: "INSPECTION_REPORT", id: "document_1", name: "Shenzhen Precision inspection report.pdf", sizeBytes: 1000, storageKey: "documents/inspection.pdf", uploadedAt: "2026-08-11T12:00:00.000Z" }],
        updates: [{ actor: "supplier", createdAt: "2026-08-11T12:00:00.000Z", id: "update_1", note: "Dongguan Axis CNC is ready to ship.", status: "READY_TO_SHIP", trackingNumber: "" }],
      },
      supplierQuotes: [{ contactName: "Li Wei", country: "China", id: "quote_1", isSelected: true, leadTimeDays: 10, lineItems: [], notes: "Jucheng Precision quote", priceCents: 1000, shopName: "Jucheng Precision", status: "SELECTED" }],
    });

    expect(JSON.stringify(customerSafe)).not.toMatch(/Shenzhen Precision|Dongguan Axis|Jucheng Precision|Li Wei/);
    expect(customerSafe.supplierOrder.shopName).toBe(customerPartnerPrivacy.networkLabel);
    expect(customerSafe.supplierOrder.contactName).toBe(customerPartnerPrivacy.partnerLabel);
  });
});
