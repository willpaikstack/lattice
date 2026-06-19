import { describe, expect, it } from "vitest";

import { buildCustomerDashboardSummary } from "./customer-dashboard";
import { buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion, type LatticeRequest, type RequestStatus } from "./request-model";

function statusEvent(to: RequestStatus, at: string, from: RequestStatus | null = null): LatticeRequest["statusEvents"][number] {
  return {
    actor: "operator",
    at,
    from,
    id: `event_${to}_${at}`,
    to,
  };
}

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
    markdown: "# Quote LQ-2001",
    notes: "Ready for review.",
    preparedBy: "Lattice",
    projectName: "Hydrogen skid bracket RFQ",
    quoteDate: "2026-06-04",
    quoteNumber: "LQ-2001",
    shipping: "Billed at actual",
    tax: "Not included",
    totalCents: 182500,
    validUntil: "2026-06-18",
    versionNumber: 1,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<LatticeRequest> = {}) {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: {
        requesterEmail: "will@latticeos.co",
      },
      dueDate: "2026-06-20",
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [{ material: "6061-T6 Aluminum", partName: "Mounting bracket", quantity: 24 }],
      process: "CNC milling",
      requesterName: "William Paik",
      title: "Hydrogen skid bracket RFQ",
    }),
  );

  return {
    ...submitted,
    createdAt: "2026-06-01T08:00:00.000Z",
    id: "req_base",
    statusEvents: [statusEvent("SUBMITTED", "2026-06-01T08:00:00.000Z", "DRAFT")],
    updatedAt: "2026-06-01T08:00:00.000Z",
    ...overrides,
  };
}

describe("customer dashboard summary", () => {
  it("computes live dashboard metrics from mixed RFQ and order states", () => {
    const submitted = makeRequest({ id: "req_submitted", status: "SUBMITTED" });
    const needsInfo = makeRequest({
      id: "req_needs_info",
      operatorReview: {
        assignedOwner: null,
        completeness: "MISSING_INFO",
        internalNotes: "Please confirm the thread callout.",
        supplierPackageNotes: "",
      },
      status: "NEEDS_INFO",
      statusEvents: [statusEvent("NEEDS_INFO", "2026-06-02T09:00:00.000Z", "SUBMITTED")],
    });
    const supplierReady = makeRequest({
      id: "req_supplier_ready",
      status: "READY_FOR_SUPPLIER_RFQ",
      statusEvents: [statusEvent("READY_FOR_SUPPLIER_RFQ", "2026-06-03T09:00:00.000Z", "SUBMITTED")],
    });
    const quoted = makeRequest({
      customerQuotes: [customerQuote()],
      id: "req_quoted",
      quote: {
        estimatedDeliveryDate: "",
        estimatedPriceCents: 182500,
        leadTimeDays: 15,
        quoteCreatedDate: "2026-06-04",
        quoteValidUntil: "2026-06-18",
        shippingCostCents: null,
        shippingMethod: "",
        shippingTerms: "",
        summary: "Ready for buyer review.",
      },
      status: "QUOTED",
      statusEvents: [statusEvent("QUOTED", "2026-06-04T10:00:00.000Z", "READY_FOR_SUPPLIER_RFQ")],
    });
    const activeOrder = makeRequest({ id: "req_order_active", status: "PURCHASED" });
    const shippedOrder = makeRequest({
      id: "req_order_shipped",
      status: "PURCHASED",
      supplierOrder: {
        ...activeOrder.supplierOrder,
        status: "SHIPPED",
      },
    });

    const summary = buildCustomerDashboardSummary([submitted, needsInfo, supplierReady, quoted], [activeOrder, shippedOrder]);
    const metrics = Object.fromEntries(summary.metrics.map((metric) => [metric.key, metric]));

    expect(metrics.activeRfqs.value).toBe("4");
    expect(metrics.orders.value).toBe("2");
    expect(metrics.shipped.value).toBe("1");
    expect(metrics.alerts.value).toBe("2");
  });

  it("sorts quote and order activity by the newest quote receipt or order placement", () => {
    const submitted = makeRequest({
      id: "req_submitted_only",
      status: "SUBMITTED",
      title: "Submitted request",
    });
    const quoteDriven = makeRequest({
      customerQuotes: [customerQuote({ issuedAt: "2026-06-04T09:00:00.000Z", quoteNumber: "LQ-3001" })],
      id: "req_quote",
      status: "QUOTED",
      statusEvents: [statusEvent("QUOTED", "2026-06-04T09:00:00.000Z", "READY_FOR_SUPPLIER_RFQ")],
      title: "Quoted request",
    });
    const orderDriven = makeRequest({
      customerQuotes: [customerQuote({ issuedAt: "2026-06-04T09:00:00.000Z", quoteNumber: "LQ-4001", totalCents: 240000 })],
      id: "req_order_new",
      status: "PURCHASED",
      statusEvents: [statusEvent("PURCHASED", "2026-06-06T09:00:00.000Z", "QUOTED")],
      title: "Placed order",
    });

    const summary = buildCustomerDashboardSummary([submitted, quoteDriven], [orderDriven]);

    expect(summary.quoteOrderActivity.map((row) => row.id)).toEqual(["order:req_order_new:event_PURCHASED_2026-06-06T09:00:00.000Z", "quote:req_quote:customer_quote_1"]);
    expect(summary.quoteOrderActivity[0]).toMatchObject({
      event: "Order placed",
      href: "/orders/req_order_new",
      reference: "PO-ORDER_NE",
      status: "In Production",
    });
    expect(summary.quoteOrderActivity[1]).toMatchObject({
      event: "Quote received",
      href: "/quotes/req_quote",
      reference: "LQ-3001",
    });
  });

  it("keeps submitted RFQs without a customer quote out of quote and order activity", () => {
    const submitted = makeRequest({
      id: "req_pending",
      status: "SUBMITTED",
    });

    const summary = buildCustomerDashboardSummary([submitted], []);

    expect(summary.quoteOrderActivity).toEqual([]);
  });

  it("keeps low-signal RFQ audit events out of the dashboard inbox", () => {
    const request = makeRequest({
      id: "req_status_history",
      status: "CLOSED",
      statusEvents: [
        statusEvent("DRAFT", "2026-06-01T08:00:00.000Z", null),
        statusEvent("SUBMITTED", "2026-06-01T09:00:00.000Z", "DRAFT"),
        statusEvent("READY_FOR_SUPPLIER_RFQ", "2026-06-01T10:00:00.000Z", "SUBMITTED"),
        statusEvent("CLOSED", "2026-06-01T11:00:00.000Z", "READY_FOR_SUPPLIER_RFQ"),
      ],
      updatedAt: "2026-06-01T11:00:00.000Z",
    });

    const summary = buildCustomerDashboardSummary([request], []);

    expect(summary.notifications.map((notification) => notification.title)).toEqual([
      "No quote",
      "RFQ submitted",
      "Draft created",
    ]);
    expect(summary.dashboardInbox.map((notification) => notification.title)).toEqual(["No quote", "RFQ submitted"]);
  });

  it("does not add static fallback rows when live data is empty", () => {
    const summary = buildCustomerDashboardSummary([], []);

    expect(summary.notifications).toEqual([]);
    expect(summary.dashboardInbox).toEqual([]);
    expect(summary.quoteOrderActivity).toEqual([]);
    expect(summary.metrics.map((metric) => metric.value)).toEqual(["0", "0", "0", "0"]);
  });
});
