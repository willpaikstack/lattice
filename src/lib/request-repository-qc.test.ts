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
        validUntil: "2099-07-18",
        versionNumber: 1,
      },
    ],
    quote: {
      ...submitted.quote,
      estimatedPriceCents: 120000,
      leadTimeDays: 12,
      quoteCreatedDate: "2026-06-18",
      quoteValidUntil: "2099-07-18",
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

  it("rejects purchase-order payment even with a valid uploaded PO", async () => {
    await expect(purchaseQuote("req_qc_checkout", { accountsPayableEmail: "ap@amogy.co", customerPoNumber: "PO-42", paymentMethod: "purchase-order", poAttachment: { name: "po.pdf", sizeBytes: 100, type: "application/pdf", storageKey: "po/test.pdf" } })).rejects.toThrow("Purchase-order payment is not available");
    expect(mocks.saveLocalRequest).not.toHaveBeenCalled();
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
  it("reconciles Stripe tax and rejects altered shipping", async () => {
    await recordStripeCheckoutSession("req_qc_checkout", { amountCents: 128000, checkoutSessionId: "cs_tax", currency: "usd" });
    const paid = { amountCents: 139360, taxCents: 11360, card: null, checkoutSessionId: "cs_tax", currency: "usd", paidAt: "2026-10-08T13:00:00.000Z", paymentIntentId: "pi_tax", requestId: "req_qc_checkout" };
    await expect(finalizeStripePaidQuote({ ...paid, shippingCents: 1 })).rejects.toThrow("shipping does not match");
    await expect(finalizeStripePaidQuote({ ...paid, taxCents: -1 })).rejects.toThrow("Invalid Stripe tax");
    await expect(finalizeStripePaidQuote({ ...paid, amountCents: 128000 })).rejects.toThrow("amount does not match");
    const order = await finalizeStripePaidQuote(paid);
    expect(order.purchasePayment.stripe.amountCents).toBe(139360);
    expect(order.checkoutDetails?.taxCents).toBe("11360");
  });

  it("does not fall back to a local purchase when a concurrent database update wins", async () => {
    await recordStripeCheckoutSession("req_qc_checkout", { amountCents: 128000, checkoutSessionId: "cs_race", currency: "usd" });
    mocks.saveLocalRequest.mockClear();
    mocks.getPrismaClient.mockResolvedValueOnce({ request: { findUnique: mocks.unavailable } } as never).mockResolvedValueOnce({ request: { update: vi.fn().mockRejectedValue({ code: "P2025" }) } } as never);
    await expect(finalizeStripePaidQuote({ amountCents: 128000, card: null, checkoutSessionId: "cs_race", currency: "usd", paidAt: "2026-10-09T13:00:00.000Z", paymentIntentId: "pi_race", requestId: "req_qc_checkout" })).rejects.toThrow("changed while payment was finalizing");
    expect(mocks.saveLocalRequest).not.toHaveBeenCalled();
  });

});
