import { describe, expect, it } from "vitest";

import type { DraftRequestInput } from "./request-model";
import { buildSubmittedRequestCreateInput, mapStoredRequest } from "./request-persistence";

const draftInput: DraftRequestInput = {
  buyerCompany: "Amogy Manufacturing",
  requesterName: "William Paik",
  title: "CNC bracket package",
  process: "CNC machining",
  dueDate: "2026-06-15",
  lineItems: [
    {
      partName: "Bracket A",
      quantity: 12,
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
      sizeBytes: 0,
      type: "reference/name-only",
    },
  ],
};

describe("request persistence", () => {
  it("builds a submitted Prisma create payload from buyer intake input", () => {
    const createInput = buildSubmittedRequestCreateInput(draftInput);

    expect(createInput).toMatchObject({
      title: "CNC bracket package",
      process: "CNC machining",
      requesterName: "William Paik",
      status: "SUBMITTED",
      operatorCompleteness: "READY_FOR_REVIEW",
      supplierOrderStatus: "AWAITING_ACKNOWLEDGMENT",
      supplierShopName: "China supplier team",
      supplierContactName: "",
      supplierNotes: "",
      supplierTrackingNumber: "",
      buyerCompany: {
        create: {
          name: "Amogy Manufacturing",
        },
      },
      lineItems: {
        create: [
          {
            partName: "Bracket A",
            quantity: 12,
            material: "6061-T6 Aluminum",
            generalTolerance: "ISO 2768 Medium (m)",
            surfaceFinish: "As machined (Ra 3.2 µm / Ra 126 µin)",
            qualityDocumentation: ["Standard Inspection"],
            notes: "Deburr all edges",
          },
        ],
      },
      files: {
        create: [
          {
            name: "bracket-a.step",
            sizeBytes: 0,
            type: "reference/name-only",
          },
        ],
      },
      statusEvents: {
        create: [
          { from: null, to: "DRAFT", actor: "buyer" },
          { from: "DRAFT", to: "SUBMITTED", actor: "buyer" },
        ],
      },
    });
    expect(createInput.dueDate).toBeInstanceOf(Date);
  });

  it("maps a stored Prisma request record into the app request model", () => {
    const stored = {
      id: "req_1",
      title: "CNC bracket package",
      process: "CNC machining",
      dueDate: new Date("2026-06-15T00:00:00.000Z"),
      status: "SUBMITTED" as const,
      buyerCompany: { name: "Amogy Manufacturing" },
      requesterName: "William Paik",
      operatorCompleteness: "READY_FOR_REVIEW" as const,
      assignedOwner: null,
      internalNotes: "",
      supplierPackageNotes: "",
      supplierOrderStatus: "QC_IN_PROGRESS" as const,
      supplierShopName: "Shenzhen Precision",
      supplierContactName: "Li Wei",
      supplierNotes: "First article inspection is running.",
      supplierTrackingNumber: "SF123",
      estimatedPriceCents: null,
      leadTimeDays: null,
      quoteSummary: "",
      lineItems: [
        {
          id: "line_1",
          partName: "Bracket A",
          quantity: 12,
          material: "6061-T6 Aluminum",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined (Ra 3.2 µm / Ra 126 µin)",
          qualityDocumentation: ["Standard Inspection"],
          notes: "Deburr all edges",
        },
      ],
      files: [
        {
          id: "file_1",
          name: "bracket-a.step",
          sizeBytes: 0,
          type: "reference/name-only",
        },
      ],
      supplierDocuments: [
        {
          id: "supplier_doc_1",
          name: "inspection-report.pdf",
          sizeBytes: 2048,
          type: "application/pdf",
          category: "INSPECTION_REPORT" as const,
          createdAt: new Date("2026-06-02T10:00:00.000Z"),
        },
      ],
      supplierUpdates: [
        {
          id: "supplier_update_1",
          status: "QC_IN_PROGRESS" as const,
          note: "First article inspection is running.",
          trackingNumber: "SF123",
          createdAt: new Date("2026-06-02T10:05:00.000Z"),
        },
      ],
      supplierQuotes: [
        {
          id: "supplier_quote_1",
          shopName: "Shenzhen Precision Manufacturing",
          country: "China",
          contactName: "Li Wei",
          status: "SELECTED" as const,
          priceCents: 125000,
          leadTimeDays: 14,
          notes: "Selected overseas shop quote.",
          quotedAt: new Date("2026-06-01T12:00:00.000Z"),
          isSelected: true,
        },
      ],
      customerQuotes: [
        {
          id: "customer_quote_1",
          versionNumber: 1,
          quoteNumber: "LQ-1001",
          quoteDate: new Date("2026-06-02T00:00:00.000Z"),
          validUntil: new Date("2026-06-16T00:00:00.000Z"),
          customerCompany: "Amogy Manufacturing",
          customerContact: "William Paik",
          projectName: "CNC bracket package",
          preparedBy: "Lattice",
          leadTime: "14 business days",
          shipping: "Billed at actual",
          tax: "Not included",
          notes: "Customer-ready quote notes.",
          assumptions: "CAD is latest revision.",
          clarifications: "",
          filesReviewed: "bracket-a.step",
          lineItems: [
            {
              id: "line_1",
              description: "Bracket A",
              process: "CNC machining",
              material: "6061-T6 Aluminum",
              finish: "As machined",
              quantity: 12,
              unitPrice: 100,
            },
          ],
          totalCents: 120000,
          markdown: "# Quote LQ-1001",
          issuedAt: new Date("2026-06-02T12:00:00.000Z"),
        },
      ],
      statusEvents: [
        {
          id: "event_1",
          from: null,
          to: "DRAFT" as const,
          actor: "buyer",
          createdAt: new Date("2026-06-01T10:00:00.000Z"),
        },
        {
          id: "event_2",
          from: "DRAFT" as const,
          to: "SUBMITTED" as const,
          actor: "buyer",
          createdAt: new Date("2026-06-01T10:01:00.000Z"),
        },
      ],
      createdAt: new Date("2026-06-01T10:00:00.000Z"),
      updatedAt: new Date("2026-06-01T10:01:00.000Z"),
    };

    expect(mapStoredRequest(stored)).toMatchObject({
      id: "req_1",
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "CNC bracket package",
      process: "CNC machining",
      dueDate: "2026-06-15",
      status: "SUBMITTED",
      operatorReview: {
        completeness: "READY_FOR_REVIEW",
        assignedOwner: null,
        internalNotes: "",
        supplierPackageNotes: "",
      },
      supplierOrder: {
        status: "QC_IN_PROGRESS",
        shopName: "Shenzhen Precision",
        contactName: "Li Wei",
        notes: "First article inspection is running.",
        trackingNumber: "SF123",
        documents: [
          {
            id: "supplier_doc_1",
            name: "inspection-report.pdf",
            sizeBytes: 2048,
            type: "application/pdf",
            category: "INSPECTION_REPORT",
            uploadedAt: "2026-06-02T10:00:00.000Z",
          },
        ],
        updates: [
          {
            id: "supplier_update_1",
            status: "QC_IN_PROGRESS",
            note: "First article inspection is running.",
            trackingNumber: "SF123",
            createdAt: "2026-06-02T10:05:00.000Z",
          },
        ],
      },
      quote: {
        estimatedPriceCents: null,
        leadTimeDays: null,
        summary: "",
      },
      supplierQuotes: [
        {
          id: "supplier_quote_1",
          shopName: "Shenzhen Precision Manufacturing",
          country: "China",
          contactName: "Li Wei",
          status: "SELECTED",
          priceCents: 125000,
          leadTimeDays: 14,
          notes: "Selected overseas shop quote.",
          quotedAt: "2026-06-01T12:00:00.000Z",
          isSelected: true,
        },
      ],
      customerQuotes: [
        {
          id: "customer_quote_1",
          versionNumber: 1,
          quoteNumber: "LQ-1001",
          quoteDate: "2026-06-02",
          validUntil: "2026-06-16",
          customerCompany: "Amogy Manufacturing",
          customerContact: "William Paik",
          projectName: "CNC bracket package",
          totalCents: 120000,
          issuedAt: "2026-06-02T12:00:00.000Z",
        },
      ],
      lineItems: [
        {
          id: "line_1",
          partName: "Bracket A",
          quantity: 12,
          material: "6061-T6 Aluminum",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined (Ra 3.2 µm / Ra 126 µin)",
          qualityDocumentation: ["Standard Inspection"],
          notes: "Deburr all edges",
        },
      ],
      files: [
        {
          id: "file_1",
          name: "bracket-a.step",
          sizeBytes: 0,
          type: "reference/name-only",
        },
      ],
      statusEvents: [
        { id: "event_1", from: null, to: "DRAFT", actor: "buyer", at: "2026-06-01T10:00:00.000Z" },
        { id: "event_2", from: "DRAFT", to: "SUBMITTED", actor: "buyer", at: "2026-06-01T10:01:00.000Z" },
      ],
    });
  });
});
