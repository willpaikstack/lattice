import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildDraftRequest,
  submitDraftRequest,
  type CustomerQuoteVersion,
  type LatticeRequest,
} from "@/lib/request-model";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  getCurrentSession: vi.fn(),
  listBuyerOrders: vi.fn(),
  listBuyerQuotes: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
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
    buyerCompanyId: "company_test",
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
    mocks.currentUser.mockReset();
    mocks.currentUser.mockResolvedValue(null);
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        email: "will@latticeos.co",
        id: "user_test",
        name: "William Paik",
        role: "customer",
        companyId: "company_test",
        companyName: "Amogy Manufacturing",
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
    expect(screen.getByRole("link", { name: /View Open items/ })).toHaveAttribute("href", "/dashboard#action-center");
    expect(screen.getByRole("heading", { name: "Action Center" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recent Updates" })).not.toBeInTheDocument();
    expect(screen.getByText("Supplier clarification required")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quote and Order Activity" })).toBeInTheDocument();
    expect(screen.getByText("Quotes received by customers and orders placed by customers")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Transactions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View Quotes/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("LQ-2001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PO-ORDER").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Order placed/ }).some((link) => link.getAttribute("href") === "/orders/req_order")).toBe(true);
    expect(screen.getAllByText("$1,825").length).toBeGreaterThan(0);
    expect(screen.queryByRole("heading", { name: "Orders" })).not.toBeInTheDocument();
    expect(screen.queryByText("Recent order and quote contacts")).not.toBeInTheDocument();
    expect(screen.queryByText("Frank Bennett")).not.toBeInTheDocument();
  });

  it("uses the signed-in Clerk name when no Lattice profile has been linked yet", async () => {
    mocks.getCurrentSession.mockResolvedValue(null);
    mocks.currentUser.mockResolvedValue({ fullName: "Avery Hoyer" });
    mocks.listBuyerQuotes.mockResolvedValue([]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await Home());

    expect(screen.getByRole("heading", { name: "Hi Avery Hoyer" })).toBeInTheDocument();
  });

  it("renders lean operational summaries when live records are empty", async () => {
    mocks.listBuyerQuotes.mockResolvedValue([]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await Home());

    expect(screen.getByText("No action items require attention.")).toBeInTheDocument();
    expect(screen.getByText("No quote or order activity yet.")).toBeInTheDocument();
    expect(screen.getByText("0 open")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Work item" })).not.toBeInTheDocument();
    expect(screen.queryByText("You're all caught up.")).not.toBeInTheDocument();
    expect(screen.queryByText("There are no customer workflows requiring attention right now.")).not.toBeInTheDocument();
    expect(screen.queryByText("Quotes received and placed orders will appear here.")).not.toBeInTheDocument();
    expect(screen.queryByText("LQ-3104")).not.toBeInTheDocument();
    expect(screen.queryByText("CNC aluminum bracket package")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recent Updates" })).not.toBeInTheDocument();
    expect(screen.queryByText("Purchased quotes will appear here.")).not.toBeInTheDocument();
    expect(screen.queryByText("Order PO-1042 moved to final inspection")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quote and Order Activity" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Transactions" })).not.toBeInTheDocument();
  });

  it("renders a dashboard scenario from the URL without changing live repository data", async () => {
    mocks.listBuyerQuotes.mockResolvedValue([]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await Home({ searchParams: Promise.resolve({ scenario: "full" }) }));

    expect(screen.getByRole("navigation", { name: "Dashboard preview scenarios" })).toBeInTheDocument();
    expect(screen.getByText("CNC aluminum bracket package")).toBeInTheDocument();
    expect(screen.getByText("Production manifold order")).toBeInTheDocument();
    expect(screen.getAllByText("LQ-3104").length).toBeGreaterThan(0);
    expect(screen.getAllByText("PO-SCENARIO").length).toBeGreaterThan(0);
    expect(mocks.listBuyerQuotes).toHaveBeenCalled();
    expect(mocks.listBuyerOrders).toHaveBeenCalled();
  });
});
