import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion, type LatticeRequest } from "@/lib/request-model";

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

import NotificationsPage from "./page";

function makeSubmittedRequest(overrides: Partial<LatticeRequest> = {}) {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: { requesterEmail: "will@amogy.co" },
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

describe("NotificationsPage", () => {
  beforeEach(() => {
    mocks.getCurrentSession.mockReset();
    mocks.listBuyerQuotes.mockReset();
    mocks.listBuyerOrders.mockReset();
    mocks.getCurrentSession.mockResolvedValue({
      user: {
        email: "will@amogy.co",
        id: "user_test",
        name: "William Paik",
        role: "customer",
      },
    });
  });

  it("renders derived quote notifications without static fallback rows", async () => {
    const quoted = makeSubmittedRequest({
      customerQuotes: [makeCustomerQuote()],
      id: "req_quoted",
      status: "QUOTED",
      statusEvents: [
        {
          actor: "operator",
          at: "2026-06-02T12:00:00.000Z",
          from: "READY_FOR_SUPPLIER_RFQ",
          id: "event_quote_issued",
          to: "QUOTED",
        },
      ],
      updatedAt: "2026-06-02T12:00:00.000Z",
    });

    mocks.listBuyerQuotes.mockResolvedValue([quoted]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await NotificationsPage());

    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getAllByText("Needs attention").length).toBeGreaterThan(0);
    expect(screen.getByText("Notification history")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Action Center" })).toHaveAttribute("href", "/dashboard#action-center");
    expect(screen.getByText("Quote ready for review")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Quote ready for review/ })).toHaveAttribute("href", "/quotes/req_quoted");
    expect(screen.queryByText("Order PO-1042 moved to final inspection")).not.toBeInTheDocument();
    expect(screen.queryByText("Drawing clarification requested")).not.toBeInTheDocument();
  });

  it("keeps full RFQ status history in the notification center", async () => {
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

    render(await NotificationsPage());

    expect(screen.getByText("Draft created")).toBeInTheDocument();
    expect(screen.getByText("RFQ submitted")).toBeInTheDocument();
    expect(screen.queryByText("Supplier pricing started")).not.toBeInTheDocument();
  });

  it("renders no-quote notifications with customer-facing reasons", async () => {
    const closed = makeSubmittedRequest({
      id: "req_no_quote",
      operatorReview: {
        assignedOwner: null,
        completeness: "COMPLETE",
        internalNotes: "We are unable to quote this RFQ because the required process is outside our supplier network.",
        supplierPackageNotes: "",
      },
      status: "CLOSED",
      statusEvents: [
        {
          actor: "operator",
          at: "2026-06-08T10:00:00.000Z",
          from: "SUBMITTED",
          id: "event_no_quote",
          to: "CLOSED",
        },
      ],
      updatedAt: "2026-06-08T10:00:00.000Z",
    });

    mocks.listBuyerQuotes.mockResolvedValue([closed]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await NotificationsPage());

    expect(screen.getByText("No quote")).toBeInTheDocument();
    expect(screen.getByText("We are unable to quote this RFQ because the required process is outside our supplier network.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /No quote/ })).toHaveAttribute("href", "/quotes/req_no_quote");
  });

  it("renders an empty state when no derived activity exists", async () => {
    mocks.listBuyerQuotes.mockResolvedValue([]);
    mocks.listBuyerOrders.mockResolvedValue([]);

    render(await NotificationsPage());

    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "No updates yet." })).toBeInTheDocument();
    expect(screen.getByText("RFQ, quote, order, shipment, and quality-document events will appear here.")).toBeInTheDocument();
    expect(screen.queryByText("RFQ RFQ-1187 is ready for review")).not.toBeInTheDocument();
  });
});
