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
      quote: {
        estimatedPriceCents: null,
        leadTimeDays: null,
        summary: "",
      },
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
