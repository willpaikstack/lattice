import { describe, expect, it } from "vitest";

import { buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion } from "./request-model";
import { buildCustomerActivityFeed } from "./customer-notifications";

function makeSubmittedRequest() {
  return submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      dueDate: "2026-06-20",
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [{ material: "6061-T6 Aluminum", partName: "Mounting bracket", quantity: 24 }],
      process: "CNC milling",
      requesterName: "William Paik",
      title: "Hydrogen skid bracket RFQ",
    }),
  );
}

describe("customer notifications", () => {
  it("uses customer-facing RFQ status copy while preserving audit-style draft events", () => {
    const request = {
      ...makeSubmittedRequest(),
      id: "req_status",
      status: "READY_FOR_SUPPLIER_RFQ" as const,
      statusEvents: [
        {
          actor: "buyer" as const,
          at: "2026-06-01T08:00:00.000Z",
          from: null,
          id: "event_draft",
          to: "DRAFT" as const,
        },
        {
          actor: "buyer" as const,
          at: "2026-06-01T09:00:00.000Z",
          from: "DRAFT" as const,
          id: "event_submitted",
          to: "SUBMITTED" as const,
        },
        {
          actor: "operator" as const,
          at: "2026-06-01T10:00:00.000Z",
          from: "SUBMITTED" as const,
          id: "event_supplier_pricing",
          to: "READY_FOR_SUPPLIER_RFQ" as const,
        },
      ],
      updatedAt: "2026-06-01T10:00:00.000Z",
    };

    const feed = buildCustomerActivityFeed({ quotes: [request] });

    expect(feed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: "Buyer opened the RFQ workspace.",
          title: "Draft created",
        }),
        expect.objectContaining({
          detail: "Lattice received your RFQ and is reviewing the files and requirements.",
          title: "RFQ submitted",
        }),
      ]),
    );
    expect(feed.some((item) => item.title === "Supplier pricing started")).toBe(false);
  });

  it("creates customer inbox items from quote and order activity records", () => {
    const needsInfo = {
      ...makeSubmittedRequest(),
      id: "req_needs",
      operatorReview: {
        assignedOwner: null,
        completeness: "MISSING_INFO" as const,
        internalNotes: "Please confirm thread callout.",
        supplierPackageNotes: "",
      },
      status: "NEEDS_INFO" as const,
      statusEvents: [
        {
          actor: "operator" as const,
          at: "2026-06-03T10:00:00.000Z",
          from: "SUBMITTED" as const,
          id: "event_needs_info",
          to: "NEEDS_INFO" as const,
        },
      ],
      updatedAt: "2026-06-03T10:00:00.000Z",
    };
    const quoted = {
      ...makeSubmittedRequest(),
      customerQuotes: [customerQuote()],
      id: "req_quoted",
      status: "QUOTED" as const,
      statusEvents: [
        {
          actor: "operator" as const,
          at: "2026-06-04T12:00:00.000Z",
          from: "READY_FOR_SUPPLIER_RFQ" as const,
          id: "event_quoted",
          to: "QUOTED" as const,
        },
      ],
      updatedAt: "2026-06-04T12:00:00.000Z",
    };
    const order = {
      ...makeSubmittedRequest(),
      id: "req_order123",
      status: "PURCHASED" as const,
      statusEvents: [
        {
          actor: "buyer" as const,
          at: "2026-06-05T09:00:00.000Z",
          from: "QUOTED" as const,
          id: "event_purchased",
          to: "PURCHASED" as const,
        },
      ],
      supplierOrder: {
        ...makeSubmittedRequest().supplierOrder,
        documents: [
          {
            category: "INSPECTION_REPORT" as const,
            id: "supplier_doc_1",
            name: "dimensional-report.pdf",
            sizeBytes: 4096,
            type: "application/pdf",
            uploadedAt: "2026-06-06T11:00:00.000Z",
          },
          {
            category: "PHOTO" as const,
            id: "supplier_photo_1",
            name: "finished-parts.jpg",
            sizeBytes: 8192,
            type: "image/jpeg",
            uploadedAt: "2026-06-06T12:00:00.000Z",
          },
        ],
        status: "SHIPPED" as const,
        trackingNumber: "1Z999AA10123456784",
        updates: [
          {
            createdAt: "2026-06-05T16:00:00.000Z",
            id: "supplier_update_1",
            note: "CMM inspection is underway.",
            status: "QC_IN_PROGRESS" as const,
            trackingNumber: "",
          },
        ],
      },
      updatedAt: "2026-06-07T09:00:00.000Z",
    };

    const feed = buildCustomerActivityFeed({ orders: [order], quotes: [needsInfo, quoted] });

    expect(feed[0]).toEqual(
      expect.objectContaining({
        detail: "PO-ORDER123 shipped. Tracking 1Z999AA10123456784 is available.",
        href: "/orders/req_order123",
        title: "Order shipped",
      }),
    );
    expect(feed.some((item) => item.title === "Photo uploaded" || item.detail.includes("finished-parts.jpg"))).toBe(false);
    expect(feed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionRequired: true,
          href: "/quotes/req_quoted",
          meta: "RFQ Progress",
          title: "Quote ready for review",
        }),
        expect.objectContaining({
          actionRequired: true,
          detail: "Please confirm thread callout.",
          href: "/quotes/req_needs",
          title: "More information requested",
        }),
        expect.objectContaining({
          actionRequired: true,
          href: "/orders/req_order123",
          meta: "Documents uploaded",
          title: "Quality documents uploaded",
        }),
        expect.objectContaining({
          href: "/orders/req_order123",
          meta: "Order progress",
          title: "Inspection In Progress",
        }),
        expect.objectContaining({
          href: "/orders/req_order123",
          meta: "Order progress",
          title: "Order placed",
        }),
      ]),
    );
  });

  it("creates informational no-quote notifications from closed RFQs with customer-facing reasons", () => {
    const closed = {
      ...makeSubmittedRequest(),
      id: "req_closed",
      operatorReview: {
        assignedOwner: null,
        completeness: "COMPLETE" as const,
        internalNotes: "We are unable to quote this RFQ because the required process is outside our supplier network.",
        supplierPackageNotes: "",
      },
      status: "CLOSED" as const,
      statusEvents: [
        {
          actor: "operator" as const,
          at: "2026-06-08T10:00:00.000Z",
          from: "SUBMITTED" as const,
          id: "event_no_quote",
          to: "CLOSED" as const,
        },
      ],
      updatedAt: "2026-06-08T10:00:00.000Z",
    };

    const feed = buildCustomerActivityFeed({ quotes: [closed] });

    expect(feed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionRequired: false,
          detail: "We are unable to quote this RFQ because the required process is outside our supplier network.",
          href: "/quotes/req_closed",
          title: "No quote",
          tone: "status",
        }),
      ]),
    );
  });

  it("limits customer order progress notifications to placed, production, and inspection", () => {
    const order = {
      ...makeSubmittedRequest(),
      id: "req_order_progress",
      status: "PURCHASED" as const,
      statusEvents: [
        {
          actor: "buyer" as const,
          at: "2026-06-05T09:00:00.000Z",
          from: "QUOTED" as const,
          id: "event_purchased",
          to: "PURCHASED" as const,
        },
      ],
      supplierOrder: {
        ...makeSubmittedRequest().supplierOrder,
        updates: [
          {
            createdAt: "2026-06-05T10:00:00.000Z",
            id: "supplier_ack",
            note: "",
            status: "AWAITING_ACKNOWLEDGMENT" as const,
            trackingNumber: "",
          },
          {
            createdAt: "2026-06-05T11:00:00.000Z",
            id: "supplier_production",
            note: "",
            status: "IN_PRODUCTION" as const,
            trackingNumber: "",
          },
          {
            createdAt: "2026-06-05T12:00:00.000Z",
            id: "supplier_qc",
            note: "",
            status: "QC_IN_PROGRESS" as const,
            trackingNumber: "",
          },
          {
            createdAt: "2026-06-05T13:00:00.000Z",
            id: "supplier_ready",
            note: "",
            status: "READY_TO_SHIP" as const,
            trackingNumber: "",
          },
        ],
      },
      updatedAt: "2026-06-05T13:00:00.000Z",
    };

    const feed = buildCustomerActivityFeed({ orders: [order] });

    expect(feed.map((item) => item.title)).toEqual(["Inspection In Progress", "In Production", "Order placed"]);
    expect(feed.every((item) => item.meta === "Order progress")).toBe(true);
    expect(feed.some((item) => item.title.includes("Ready to ship") || item.title.includes("Awaiting"))).toBe(false);
  });
});

function customerQuote(overrides: Partial<CustomerQuoteVersion> = {}): CustomerQuoteVersion {
  return {
    assumptions: "CAD is latest revision.",
    clarifications: "",
    customerCompany: "Amogy Manufacturing",
    customerContact: "William Paik",
    filesReviewed: "mounting-bracket.step",
    id: "customer_quote_1",
    issuedAt: "2026-06-04T12:00:00.000Z",
    leadTime: "15 business days",
    lineItems: [],
    markdown: "# Quote LQ-1001",
    notes: "Ready for review.",
    preparedBy: "Lattice",
    projectName: "Hydrogen skid bracket RFQ",
    quoteDate: "2026-06-04",
    quoteNumber: "LQ-1001",
    shipping: "Billed at actual",
    tax: "Not included",
    totalCents: 182500,
    validUntil: "2026-06-18",
    versionNumber: 1,
    ...overrides,
  };
}
