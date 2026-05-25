import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";

describe("request model", () => {
  it("builds a buyer draft request with one line item and one uploaded file", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "CNC bracket package",
      process: "CNC machining",
      dueDate: "2026-06-15",
      lineItems: [
        {
          partName: "Bracket A",
          quantity: 24,
          material: "6061-T6 Aluminum",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined (Ra 3.2 µm / Ra 126 µin)",
          qualityDocumentation: ["Standard Inspection"],
          notes: "Deburr all edges",
        },
      ],
      files: [
        {
          name: "bracket-a.step",
          sizeBytes: 2048,
          type: "model/step",
        },
      ],
    });

    expect(draft.status).toBe("DRAFT");
    expect(draft.lineItems).toHaveLength(1);
    expect(draft.files).toHaveLength(1);
    expect(draft.lineItems[0].partName).toBe("Bracket A");
    expect(draft.lineItems[0].generalTolerance).toBe("ISO 2768 Medium (m)");
    expect(draft.lineItems[0].surfaceFinish).toBe("As machined (Ra 3.2 µm / Ra 126 µin)");
    expect(draft.lineItems[0].qualityDocumentation).toEqual(["Standard Inspection"]);
  });

  it("submits a complete draft into the operator review queue", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Fabricated frame kit",
      process: "Sheet metal fabrication",
      dueDate: "2026-06-20",
      lineItems: [
        {
          partName: "Frame Rail",
          quantity: 8,
          material: "304 Stainless Steel",
          notes: "Quote weld prep separately",
        },
      ],
      files: [
        {
          name: "frame-rail.pdf",
          sizeBytes: 4096,
          type: "application/pdf",
        },
      ],
    });

    const submitted = submitDraftRequest(draft);

    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.operatorReview.completeness).toBe("READY_FOR_REVIEW");
    expect(submitted.operatorReview.assignedOwner).toBeNull();
    expect(submitted.statusEvents.at(-1)).toMatchObject({
      from: "DRAFT",
      to: "SUBMITTED",
      actor: "buyer",
    });
  });

  it("rejects submission when the buyer request has no uploaded files", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "No CAD request",
      process: "CNC machining",
      dueDate: "2026-06-15",
      lineItems: [
        {
          partName: "Bracket A",
          quantity: 24,
          material: "6061-T6 Aluminum",
        },
      ],
      files: [],
    });

    expect(() => submitDraftRequest(draft)).toThrow("At least one file is required before submission");
  });

  it("lets operators update review status, owner, and package notes", () => {
    const submitted = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Fabricated frame kit",
        process: "Sheet metal fabrication",
        dueDate: "2026-06-20",
        lineItems: [
          {
            partName: "Frame Rail",
            quantity: 8,
            material: "304 Stainless Steel",
          },
        ],
        files: [{ name: "frame-rail.pdf", sizeBytes: 4096, type: "application/pdf" }],
      }),
    );

    const updated = applyOperatorStatusUpdate(submitted, {
      status: "READY_FOR_SUPPLIER_RFQ",
      assignedOwner: "Adam",
      internalNotes: "Buyer package is complete.",
      supplierPackageNotes: "Send to sheet metal suppliers with weld prep note.",
      estimatedPriceCents: 125000,
      leadTimeDays: 14,
      quoteSummary: "Budgetary quote ready for buyer review.",
    });

    expect(updated.status).toBe("READY_FOR_SUPPLIER_RFQ");
    expect(updated.operatorReview.completeness).toBe("COMPLETE");
    expect(updated.operatorReview.assignedOwner).toBe("Adam");
    expect(updated.operatorReview.supplierPackageNotes).toBe("Send to sheet metal suppliers with weld prep note.");
    expect(updated.quote).toMatchObject({
      estimatedPriceCents: 125000,
      leadTimeDays: 14,
      summary: "Budgetary quote ready for buyer review.",
    });
    expect(updated.statusEvents.at(-1)).toMatchObject({
      from: "SUBMITTED",
      to: "READY_FOR_SUPPLIER_RFQ",
      actor: "operator",
    });
  });
});
