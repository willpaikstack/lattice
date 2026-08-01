import { describe, expect, it } from "vitest";

import { buildCustomerActionWorkflows } from "./customer-action-center";
import { buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion, type LatticeRequest } from "./request-model";

function makeRequest(overrides: Partial<LatticeRequest> = {}) {
  const request = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      dueDate: "2026-08-30",
      files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [{ material: "6061-T6 Aluminum", partName: "Bracket", quantity: 10 }],
      process: "CNC milling",
      requesterName: "William Paik",
      title: "Bracket RFQ",
    }),
  );

  return {
    ...request,
    createdAt: "2026-07-20T09:00:00.000Z",
    id: "req_action",
    updatedAt: "2026-08-01T09:00:00.000Z",
    ...overrides,
  };
}

function customerQuote(overrides: Partial<CustomerQuoteVersion> = {}): CustomerQuoteVersion {
  return {
    assumptions: "CAD is latest revision.",
    clarifications: "",
    customerCompany: "Amogy Manufacturing",
    customerContact: "William Paik",
    filesReviewed: "bracket.step",
    id: "customer_quote_action",
    issuedAt: "2026-07-30T12:00:00.000Z",
    leadTime: "15 business days",
    lineItems: [],
    markdown: "# Quote LQ-5001",
    notes: "Ready for review.",
    preparedBy: "Lattice",
    projectName: "Bracket RFQ",
    quoteDate: "2026-07-30",
    quoteNumber: "LQ-5001",
    shipping: "Billed at actual",
    tax: "Not included",
    totalCents: 125000,
    validUntil: "2026-08-03",
    versionNumber: 1,
    ...overrides,
  };
}

describe("customer action center", () => {
  it("turns a clarification request into a multi-step customer workflow", () => {
    const request = makeRequest({
      id: "req_needs_info",
      operatorReview: {
        assignedOwner: "William Paik",
        completeness: "MISSING_INFO",
        internalNotes: "Confirm whether the thread callout applies to every hole.",
        supplierPackageNotes: "",
      },
      status: "NEEDS_INFO",
    });

    const workflows = buildCustomerActionWorkflows({
      now: new Date("2026-08-01T12:00:00.000Z"),
      quotes: [request],
    });

    expect(workflows).toHaveLength(1);
    expect(workflows[0]).toMatchObject({
      completedSteps: 1,
      ctaLabel: "Review request",
      detail: "Confirm whether the thread callout applies to every hole.",
      owner: "Customer",
      priority: "high",
      title: "Supplier clarification required",
      type: "supplier_question",
    });
    expect(workflows[0].steps.map((step) => step.state)).toEqual(["complete", "current", "upcoming"]);
  });

  it("uses one urgent quote workflow instead of duplicating review and expiration actions", () => {
    const request = makeRequest({
      customerQuotes: [customerQuote()],
      id: "req_quoted",
      status: "QUOTED",
    });

    const workflows = buildCustomerActionWorkflows({
      now: new Date("2026-08-01T12:00:00.000Z"),
      quotes: [request],
    });

    expect(workflows).toHaveLength(1);
    expect(workflows[0]).toMatchObject({
      dueLabel: "Expires in 2 days",
      id: "quote-expiring:req_quoted",
      priority: "high",
      title: "Quote expires soon",
      type: "quote_expiring",
    });
  });

  it("prioritizes overdue milestones and groups uploaded documents into one requirement", () => {
    const delayedOrder = makeRequest({
      id: "req_delayed",
      status: "PURCHASED",
      supplierOrder: {
        ...makeRequest().supplierOrder,
        nextMilestone: "Supplier acknowledgment",
        nextMilestoneDate: "2026-07-25",
        responsibleParty: "Lattice",
      },
    });
    const documentOrder = makeRequest({
      id: "req_documents",
      status: "PURCHASED",
      supplierOrder: {
        ...makeRequest().supplierOrder,
        documents: [
          {
            category: "MATERIAL_CERT",
            id: "doc_material",
            name: "material-cert.pdf",
            sizeBytes: 2048,
            type: "application/pdf",
            uploadedAt: "2026-08-01T10:00:00.000Z",
          },
          {
            category: "INSPECTION_REPORT",
            id: "doc_inspection",
            name: "inspection-report.pdf",
            sizeBytes: 4096,
            type: "application/pdf",
            uploadedAt: "2026-08-01T11:00:00.000Z",
          },
        ],
        nextMilestone: "Shipment",
        nextMilestoneDate: "2026-08-10",
        status: "DOCUMENTS_UPLOADED",
      },
    });

    const workflows = buildCustomerActionWorkflows({
      now: new Date("2026-08-01T12:00:00.000Z"),
      orders: [documentOrder, delayedOrder],
    });

    expect(workflows.map((workflow) => workflow.type)).toEqual(["order_delay", "customer_requirement"]);
    expect(workflows[0]).toMatchObject({
      dueLabel: "7 days overdue",
      owner: "Lattice",
      priority: "critical",
      title: "Order milestone overdue",
    });
    expect(workflows[1]).toMatchObject({
      detail: "2 customer-facing documents are ready to review and retain with the order record.",
      title: "Order documents need review",
    });
  });
});
