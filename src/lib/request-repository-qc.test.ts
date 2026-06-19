import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LatticeRequest } from "./request-model";

const mocks = vi.hoisted(() => {
  const state = {
    currentRequest: null as LatticeRequest | null,
    savedRequests: [] as LatticeRequest[],
  };
  const unavailable = vi.fn(async () => {
    throw new Error("database unavailable");
  });

  return {
    getLocalRequestById: vi.fn(async (id: string) => (state.currentRequest?.id === id ? state.currentRequest : null)),
    getPrismaClient: vi.fn(async () => ({
      customerQuoteVersion: {
        count: vi.fn(async () => 0),
      },
      request: {
        create: unavailable,
        delete: unavailable,
        findFirst: unavailable,
        findMany: unavailable,
        findUnique: unavailable,
        update: unavailable,
      },
    })),
    listLocalRequests: vi.fn(async () => (state.currentRequest ? [state.currentRequest] : [])),
    saveLocalRequest: vi.fn(async (request: LatticeRequest) => {
      state.currentRequest = request;
      state.savedRequests.push(request);
      return request;
    }),
    state,
    unavailable,
  };
});

vi.mock("./prisma", () => ({
  getPrismaClient: mocks.getPrismaClient,
}));

vi.mock("./local-request-store", () => ({
  deleteLocalRequest: vi.fn(),
  getLocalRequestById: mocks.getLocalRequestById,
  listLocalRequests: mocks.listLocalRequests,
  saveLocalRequest: mocks.saveLocalRequest,
}));

import { buildDraftRequest, submitDraftRequest } from "./request-model";
import { finalizeStripePaidQuote, purchaseQuote, quoteCheckoutAmountCents, recordStripeCheckoutSession } from "./request-repository";

function quotedRequest(): LatticeRequest {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: {
        requesterEmail: "buyer@amogy.co",
        requesterPhone: "555-0101",
        shipToAddress1: "19 Morris Ave",
        shipToCity: "Brooklyn",
        shipToCompany: "Amogy",
        shipToName: "Buyer Ops",
        shipToState: "NY",
        shipToZipCode: "11205",
      },
      dueDate: "2026-07-01",
      files: [
        { name: "bracket.step", sizeBytes: 2048, storageKey: "rfq/2026-06-18/bracket.step", type: "model/step" },
        { name: "bracket.pdf", sizeBytes: 4096, storageKey: "rfq/2026-06-18/bracket.pdf", type: "application/pdf" },
      ],
      lineItems: [
        {
          generalTolerance: "ISO 2768 Medium",
          material: "6061-T6 Aluminum",
          partName: "Bracket",
          qualityDocumentation: ["Standard Inspection"],
          quantity: 4,
          surfaceFinish: "As machined",
        },
      ],
      process: "CNC machining",
      requesterName: "Buyer Ops",
      title: "Bracket package",
    }),
  );
  const quotedAt = "2026-06-18T12:00:00.000Z";

  return {
    ...submitted,
    id: "req_qc_checkout",
    status: "QUOTED",
    customerQuotes: [
      {
        assumptions: "Customer CAD is final.",
        clarifications: "",
        customerCompany: "Amogy Manufacturing",
        customerContact: "Buyer Ops",
        filesReviewed: "bracket.step\nbracket.pdf",
        id: "customer_quote_1",
        issuedAt: quotedAt,
        leadTime: "12 business days",
        lineItems: [
          {
            description: "Bracket",
            finish: "As machined",
            id: submitted.lineItems[0].id,
            leadTimeDays: 12,
            material: "6061-T6 Aluminum",
            process: "CNC machining",
            quantity: 4,
            unitPrice: 300,
          },
        ],
        markdown: "# Quote",
        notes: "Ready for approval.",
        preparedBy: "Lattice",
        projectName: "Bracket package",
        quoteDate: "2026-06-18",
        quoteNumber: "LQ-CHECKOUT",
        shipping: "International / DDP - $80.00",
        tax: "Excluded",
        totalCents: 120000,
        validUntil: "2026-07-18",
        versionNumber: 1,
      },
    ],
    quote: {
      ...submitted.quote,
      estimatedPriceCents: 120000,
      leadTimeDays: 12,
      quoteCreatedDate: "2026-06-18",
      quoteValidUntil: "2026-07-18",
      shippingCostCents: 8000,
      shippingMethod: "International",
      shippingTerms: "DDP",
      summary: "Quoted at $1,200 plus shipping.",
    },
    statusEvents: [
      ...submitted.statusEvents,
      {
        actor: "operator",
        at: quotedAt,
        from: "SUBMITTED",
        id: "event_quoted",
        to: "QUOTED",
      },
    ],
    updatedAt: quotedAt,
  };
}

function currentRequestFixture() {
  if (!mocks.state.currentRequest) {
    throw new Error("Expected current request fixture to be set");
  }

  return mocks.state.currentRequest;
}

describe("request repository QC", () => {
  let consoleWarn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.state.currentRequest = quotedRequest();
    mocks.state.savedRequests = [];
    mocks.getPrismaClient.mockClear();
    mocks.getLocalRequestById.mockClear();
    mocks.listLocalRequests.mockClear();
    mocks.saveLocalRequest.mockClear();
    mocks.unavailable.mockClear();
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    vi.unstubAllEnvs();
  });

  it("calculates accepted checkout totals with shipping", () => {
    expect(quoteCheckoutAmountCents(currentRequestFixture())).toBe(128000);
  });

  it("blocks card checkout from bypassing Stripe", async () => {
    await expect(purchaseQuote("req_qc_checkout", { paymentMethod: "card" })).rejects.toThrow("Card checkout must be completed through Stripe.");
    expect(mocks.saveLocalRequest).not.toHaveBeenCalled();
  });

  it("requires purchase-order number, AP email, and PO file before order conversion", async () => {
    await expect(purchaseQuote("req_qc_checkout", { paymentMethod: "purchase-order" })).rejects.toThrow("PO number is required");
    await expect(
      purchaseQuote("req_qc_checkout", {
        customerPoNumber: "AMOGY-PO-42",
        paymentMethod: "purchase-order",
      }),
    ).rejects.toThrow("Accounts payable email is required");
    await expect(
      purchaseQuote("req_qc_checkout", {
        accountsPayableEmail: "ap@amogy.co",
        customerPoNumber: "AMOGY-PO-42",
        paymentMethod: "purchase-order",
      }),
    ).rejects.toThrow("Upload the purchase order file");
  });

  it("converts a quoted RFQ into a purchased order through PO checkout", async () => {
    const purchased = await purchaseQuote("req_qc_checkout", {
      accountsPayableEmail: "ap@amogy.co",
      buyerCheckoutNotes: "Route invoice through AP.",
      customerPoNumber: "AMOGY-PO-42",
      paymentMethod: "purchase-order",
      poAttachment: {
        name: "amogy-po-42.pdf",
        sizeBytes: 8192,
        storageKey: "customer-purchase-orders/2026-06-18/amogy-po-42.pdf",
        type: "application/pdf",
      },
      shipToCity: "Rochester",
    });

    expect(purchased.status).toBe("PURCHASED");
    expect(purchased.shipToCity).toBe("Rochester");
    expect(purchased.purchasePayment).toMatchObject({
      accountsPayableEmail: "ap@amogy.co",
      customerPoNumber: "AMOGY-PO-42",
      method: "PURCHASE_ORDER",
      status: "PENDING_REVIEW",
    });
    expect(purchased.customerPurchaseOrderAttachment).toMatchObject({
      name: "amogy-po-42.pdf",
      sizeBytes: 8192,
      storageKey: "customer-purchase-orders/2026-06-18/amogy-po-42.pdf",
    });
    expect(purchased.statusEvents.at(-1)).toMatchObject({
      actor: "buyer",
      from: "QUOTED",
      to: "PURCHASED",
    });
  });

  it("records and finalizes Stripe payments without allowing amount tampering", async () => {
    await recordStripeCheckoutSession("req_qc_checkout", {
      amountCents: 128000,
      checkoutSessionId: "pi_qc_checkout",
      currency: "usd",
    });

    expect(currentRequestFixture().purchasePayment).toMatchObject({
      method: "CARD",
      status: "PAYMENT_PENDING",
      stripe: {
        amountCents: 128000,
        checkoutSessionId: "pi_qc_checkout",
        currency: "usd",
      },
    });

    await expect(
      finalizeStripePaidQuote({
        amountCents: 127999,
        card: null,
        checkoutSessionId: "pi_qc_checkout",
        currency: "usd",
        paidAt: "2026-06-18T13:00:00.000Z",
        paymentIntentId: "pi_qc_checkout",
        requestId: "req_qc_checkout",
      }),
    ).rejects.toThrow("Stripe amount does not match accepted quote total");

    const purchased = await finalizeStripePaidQuote({
      amountCents: 128000,
      card: {
        brand: "visa",
        expires: "04/2029",
        holder: "Buyer Ops",
        id: "pm_card_visa",
        last4: "4242",
      },
      checkoutSessionId: "pi_qc_checkout",
      currency: "usd",
      paidAt: "2026-06-18T13:00:00.000Z",
      paymentIntentId: "pi_qc_checkout",
      requestId: "req_qc_checkout",
    });

    expect(purchased.status).toBe("PURCHASED");
    expect(purchased.purchasePayment).toMatchObject({
      card: {
        brand: "visa",
        id: "pm_card_visa",
        last4: "4242",
      },
      method: "CARD",
      status: "PAID",
      stripe: {
        amountCents: 128000,
        checkoutSessionId: "pi_qc_checkout",
        currency: "usd",
        paymentIntentId: "pi_qc_checkout",
      },
    });

    const eventCount = purchased.statusEvents.length;
    const idempotentRetry = await finalizeStripePaidQuote({
      amountCents: 128000,
      card: null,
      checkoutSessionId: "pi_qc_checkout",
      currency: "usd",
      paidAt: "2026-06-18T13:01:00.000Z",
      paymentIntentId: "pi_qc_checkout",
      requestId: "req_qc_checkout",
    });

    expect(idempotentRetry.statusEvents).toHaveLength(eventCount);
  });
});
