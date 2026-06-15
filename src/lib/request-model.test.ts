import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, applySupplierOrderUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";

describe("request model", () => {
  it("builds a buyer draft request with one line item and one uploaded file", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "CNC bracket package",
      process: "CNC machining",
      dueDate: "2026-06-15",
      contact: {
        requesterEmail: "william.paik@amogy.co",
        requesterPhone: "+1 (310) 617-4533",
        shipToAddress1: "19 Morris Ave",
        shipToCity: "Brooklyn",
        shipToCompany: "Amogy",
        shipToName: "William Paik",
        shipToState: "NY",
        shipToZipCode: "11205",
      },
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
    expect(draft.requestOrigin).toBe("ACCOUNT");
    expect(draft.isArchived).toBe(false);
    expect(draft.lineItems).toHaveLength(1);
    expect(draft.files).toHaveLength(1);
    expect(draft.lineItems[0].partName).toBe("Bracket A");
    expect(draft.requesterEmail).toBe("william.paik@amogy.co");
    expect(draft.shipToCompany).toBe("Amogy");
    expect(draft.shipToAddress1).toBe("19 Morris Ave");
    expect(draft.lineItems[0].generalTolerance).toBe("ISO 2768 Medium (m)");
    expect(draft.lineItems[0].surfaceFinish).toBe("As machined (Ra 3.2 µm / Ra 126 µin)");
    expect(draft.lineItems[0].qualityDocumentation).toEqual(["Standard Inspection"]);
  });

  it("stores guest simple quote access metadata on draft requests", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Acme Machining",
      guestAccessTokenExpiresAt: "2026-07-30T00:00:00.000Z",
      guestAccessTokenHash: "abc123",
      requesterName: "Guest Buyer",
      requestOrigin: "GUEST_SIMPLE_QUOTE",
      title: "One-off bracket quote",
      process: "CNC machining",
      dueDate: "2026-06-25",
      contact: {
        requesterEmail: "buyer@example.com",
        requesterPhone: "555-0100",
      },
      lineItems: [
        {
          partName: "Bracket",
          quantity: 4,
          material: "6061-T6 Aluminum",
        },
      ],
      files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step" }],
    });

    expect(draft.requestOrigin).toBe("GUEST_SIMPLE_QUOTE");
    expect(draft.guestAccessTokenHash).toBe("abc123");
    expect(draft.guestAccessTokenExpiresAt).toBe("2026-07-30T00:00:00.000Z");
    expect(draft.requesterEmail).toBe("buyer@example.com");
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

  it("stores revision lineage and changelog on revised drafts", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Revision request",
      process: "CNC machining",
      dueDate: "2026-06-21",
      revision: {
        changeLog: ["Line 1 quantity: 4 -> 8"],
        revisionNumber: 2,
        sourceQuoteReference: "LQ-1001",
        sourceRequestId: "req_original",
      },
      lineItems: [
        {
          partName: "Bracket A",
          quantity: 8,
          material: "6061-T6 Aluminum",
        },
      ],
      files: [{ name: "bracket-a.step", sizeBytes: 2048, type: "model/step", storageKey: "rfq/bracket-a.step" }],
    });

    expect(draft.revisionOfRequestId).toBe("req_original");
    expect(draft.revisionNumber).toBe(2);
    expect(draft.revisionChangeLog).toEqual(["Line 1 quantity: 4 -> 8"]);
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

  it("lets suppliers update purchased order status and attach document metadata", () => {
    const quoted = applyOperatorStatusUpdate(
      submitDraftRequest(
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
      ),
      {
        status: "QUOTED",
        estimatedPriceCents: 125000,
        leadTimeDays: 14,
      },
    );

    const updated = applySupplierOrderUpdate(
      {
        ...quoted,
        status: "PURCHASED",
      },
      {
        status: "QC_IN_PROGRESS",
        shopName: "Shenzhen Precision",
        contactName: "Li Wei",
        notes: "First article inspection is running.",
        trackingNumber: "SF123",
        documents: [
          {
            name: "inspection-report.pdf",
            sizeBytes: 2048,
            type: "application/pdf",
            category: "INSPECTION_REPORT",
          },
        ],
      },
    );

    expect(updated.supplierOrder.status).toBe("QC_IN_PROGRESS");
    expect(updated.supplierOrder.shopName).toBe("Shenzhen Precision");
    expect(updated.supplierOrder.documents[0]).toMatchObject({
      name: "inspection-report.pdf",
      category: "INSPECTION_REPORT",
    });
    expect(updated.supplierOrder.updates.at(-1)).toMatchObject({
      status: "QC_IN_PROGRESS",
      note: "First article inspection is running.",
      trackingNumber: "SF123",
    });
    expect(updated.statusEvents.at(-1)).toMatchObject({
      actor: "supplier",
    });
  });
});
