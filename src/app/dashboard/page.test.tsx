import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDraftRequest,
  submitDraftRequest,
  type CustomerQuoteVersion,
  type LatticeRequest,
} from "@/lib/request-model";

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  listBuyerOrders: vi.fn(),
  listBuyerQuotes: vi.fn(),
}));

vi.mock("@/lib/request-repository", () => ({
  listBuyerOrders: mocks.listBuyerOrders,
  listBuyerQuotes: mocks.listBuyerQuotes,
}));

vi.mock("@/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import Home from "./page";

function makeSubmittedRequest(overrides: Partial<LatticeRequest> = {}) {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: { requesterEmail: "will@latticeos.co" },
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
    createdAt: "2026-06-01T10:00:00.000Z",
    id: "req_base",
    updatedAt: "2026-06-01T10:00:00.000Z",
    ...overrides,
  };
}

function makeCustomerQuote(overrides: Partial<CustomerQuoteVersion> = {}): CustomerQuoteVersion {
  return {
    assumptions: "CAD is latest revision.",
    clarifications: "",
    customerCompany: "Amogy Manufacturing",
    customerContact: "William Paik",
    filesReviewed: "mounting-bracket.step",
    id: "customer_quote_1",
    issuedAt: "2026-06-02T12:00:00.000Z",
    leadTime: "15 business days",
    lineItems: [],
    markdown: "# Quote LQ-1001",
    notes: "Ready for review.",
    preparedBy: "Lattice",
    projectName: "Hydrogen skid bracket RFQ",
    quoteDate: "2026-06-02",
    quoteNumber: "LQ-1001",
    shipping: "Billed at actual",
    tax: "Not included",
    totalCents: 182500,
    validUntil: "2026-06-16",
    versionNumber: 1,
    ...overrides,
  };
}

describe("Home dashboard", () => {
  beforeEach(() => {
    mocks.getCurrentSession.mockReset();
    mocks.listBuyerQuotes.mockReset();
    mocks.listBuyerOrders.mockReset();
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        email: "will@latticeos.co",
        id: "user_test",
        name: "William Paik",
        role: "customer",
      },
    });
  });

  it("renders live buyer dashboard data from quote and order repositories", async () => {
    const quoted = makeSubmittedRequest({
      customerQuotes: [makeCustomerQuote({ quoteNumber: "LQ-2001" })],
      id: "req_quoted",
      status: "QUOTED",
      statusEvents: [{ actor: "operator", at: "2026-06-02T12:00:00.000Z", from: "READY_FOR_SUPPLIER_RFQ", id: "event_quote_issued", to: "QUOTED" }],
      updatedAt: "2026-06-02T12:00:00.000Z",
    });
    const needsInfo = makeSubmittedRequest({
      id: "req_needs_info",
      operatorReview: {
        assignedOwner: null,
        completeness: "MISSING_INFO",
        internalNotes: "Please confirm the thread callout.",
        supplierPackageNotes: "",
      },
      status: "NEEDS_INFO",
      statusEvents: [{ actor: "operator", at: "2026-06-03T09:00:00.000Z", from: "SUBMITTED", id: "event_needs_info", to: "NEEDS_INFO" }],
      title: "Drawing clarification RFQ",
      updatedAt: "2026-06-03T09:00:00.000Z",
    });
    const order = makeSubmittedRequest({
      customerQuotes: [makeCustomerQuote({ id: "customer_quote_order", quoteNumber: "LQ-3001", totalCents: 240000 })],
      id: "req_order",
      status: "PURCHASED",
      statusEvents: [{ actor: "buyer", at: "2026-06-04T15:32:00.000Z", from: "QUOTED", id: "event_quote_accepted", to: "PURCHASED" }],
      supplierOrder: {
        ...quoted.supplierOrder,
        contactName: "Li Wei",
        shopName: "Shenzhen Precision",
        status: "IN_PRODUCTION",
      },
      title: "Purchased manifold quote",
      updatedAt: "2026-06-05T15:32:00.000Z",
    });
    const closed = makeSubmittedRequest({
      id: "req_no_quote",
      operatorReview: {
        assignedOwner: null,
        completeness: "COMPLETE",
        internalNotes: "We are unable to quote this RFQ because the required process is outside our supplier network.",
        supplierPackageNotes: "",
      },
      status: "CLOSED",
      statusEvents: [{ actor: "operator", at: "2026-06-06T09:00:00.000Z", from: "SUBMITTED", id: "event_no_quote", to: "CLOSED" }],
      title: "No quote fixture RFQ",
      updatedAt: "2026-06-06T09:00:00.000Z",
    });

    mocks.listBuyerQuotes.mockResolvedValue([quoted, needsInfo, closed]);
    mocks.listBuyerOrders.mockResolvedValue([order]);

    render(await Home());

    expect(screen.getByRole("heading", { name: "Hi William Paik" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Active RFQs/ })).toHaveAttribute("href", "/quotes");
    expect(screen.getByRole("link", { name: /View Orders/ })).toHaveAttribute("href", "/orders");
    expect(screen.getByRole("link", { name: /View Shipped/ })).toHaveAttribute("href", "/shipped");
    expect(screen.getByRole("link", { name: /View Actions/ })).toHaveAttribute("href", "/dashboard#action-center");
    expect(screen.getByRole("heading", { name: "Needs Attention" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recent Updates" })).toBeInTheDocument();
    expect(screen.getByText("Supplier clarification required")).toBeInTheDocument();
    expect(screen.getAllByText("Quote ready for review").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Quote ready for review/ }).some((link) => link.getAttribute("href") === "/quotes/req_quoted")).toBe(true);
    expect(screen.getAllByText("More information requested").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /More information requested/ }).some((link) => link.getAttribute("href") === "/quotes/req_needs_info")).toBe(true);
    expect(screen.getAllByText("No quote").length).toBeGreaterThan(0);
    expect(screen.getByText("We are unable to quote this RFQ because the required process is outside our supplier network.")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /No quote/ }).some((link) => link.getAttribute("href") === "/quotes/req_no_quote")).toBe(true);
    expect(screen.getAllByText("Needs attention").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Quote and Order Activity" })).toBeInTheDocument();
    expect(screen.getByText("Quotes received by customers and orders placed by customers")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Transactions" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Quotes/ })).toHaveAttribute("href", "/quotes");
    expect(screen.getAllByText("LQ-2001").length).toBeGreaterThan(0);
    expect(screen.getByText("PO-ORDER")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Order placed/ }).some((link) => link.getAttribute("href") === "/orders/req_order")).toBe(true);
    expect(screen.getAllByText("$1,825").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Orders" })).not.toBeInTheDocument();
    expect(screen.queryByText("Recent order and quote contacts")).not.toBeInTheDocument();
    expect(screen.queryByText("Frank Bennett")).not.toBeInTheDocument();
  });

  it("shows high-signal RFQ status rows in the dashboard inbox", async () => {
    const statusHistory = makeSubmittedRequest({
      id: "req_status_history",
      status: "READY_FOR_SUPPLIER_RFQ",
      statusEvents: [
        { actor: "buyer", at: "2026-06-01T08:00:00.000Z", from: null, id: "event_draft", to: "DRAFT" },
        { actor: "buyer", at: "2026-06-01T09:00:00.000Z", from: "DRAFT", id: "event_submitted", to: "SUBMITTED" },
        { actor: "operator", at: "2026-06-01T10:00:00.000Z", from: "SUBMITTED", id: "event_supplier_pricing", to: "READY_FOR_SUPPLIER_RFQ" },
      ],
      updatedAt: "2026-06-01T10:00:00.000Z",
    });

    mocks.listBuyerQuotes.mockResolvedValue([statusHistory]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await Home());

    expect(screen.queryByText("Draft created")).not.toBeInTheDocument();
    expect(screen.getByText("RFQ submitted")).toBeInTheDocument();
    expect(screen.getByText("Lattice received your RFQ and is reviewing the files and requirements.")).toBeInTheDocument();
    expect(screen.queryByText("Supplier pricing started")).not.toBeInTheDocument();
    expect(screen.queryByText("Lattice is collecting supplier pricing for this RFQ.")).not.toBeInTheDocument();
  });

  it("renders operational empty states when live records are empty", async () => {
    mocks.listBuyerQuotes.mockResolvedValue([]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await Home());

    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
    expect(screen.getByText("There are no customer workflows requiring attention right now.")).toBeInTheDocument();
    expect(screen.getByText("RFQ, quote, order, shipment, and document updates will appear here.")).toBeInTheDocument();
    expect(screen.getByText("Quotes received and placed orders will appear here.")).toBeInTheDocument();
    expect(screen.queryByText("Purchased quotes will appear here.")).not.toBeInTheDocument();
    expect(screen.queryByText("Order PO-1042 moved to final inspection")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quote and Order Activity" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Transactions" })).not.toBeInTheDocument();
  });
});
