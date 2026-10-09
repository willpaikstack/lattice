import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), finalize: vi.fn(), retrieveCharge: vi.fn(), listSessions: vi.fn(), retrieveIntent: vi.fn(), recordRefund: vi.fn(), listRefunds: vi.fn() }));
vi.mock("./stripe", () => ({ getStripeClient: () => ({ refunds: { list: mocks.listRefunds }, charges: { retrieve: mocks.retrieveCharge }, paymentIntents: { retrieve: mocks.retrieveIntent }, checkout: { sessions: { retrieve: mocks.retrieve, list: mocks.listSessions } } }), stripePaymentMethodCardSnapshot: () => null }));
vi.mock("./request-repository", () => ({ recordStripeRefund: mocks.recordRefund, finalizeStripePaidQuote: mocks.finalize, markStripeCheckoutSessionFailed: vi.fn(), quoteCheckoutAmountCents: vi.fn(), recordStripeCheckoutSession: vi.fn() }));
vi.mock("./account-settings", () => ({ ensureStripeCustomerForAccount: vi.fn() }));
import { finalizeStripeCheckoutSession, reconcileStripeChargeRefund } from "./stripe-checkout";
function session() { return { id: "cs_owned", mode: "payment", metadata: { requestId: "req_owned" }, payment_status: "paid", automatic_tax: { enabled: true, status: "complete" }, total_details: { amount_tax: 888, amount_shipping: 1000 }, amount_subtotal: 10000, amount_total: 11888, currency: "usd", created: 1, payment_intent: { id: "pi_owned", payment_method: null } }; }
describe("taxed checkout reconciliation", () => {
  beforeEach(() => { mocks.retrieve.mockReset(); mocks.finalize.mockReset(); });
  it("passes trusted tax and shipping amounts to order finalization", async () => {
    mocks.retrieve.mockResolvedValue(session());
    await finalizeStripeCheckoutSession("cs_owned", "req_owned");
    expect(mocks.finalize).toHaveBeenCalledWith(expect.objectContaining({ amountCents: 11888, taxCents: 888, shippingCents: 1000, checkoutSessionId: "cs_owned", requestId: "req_owned" }));
  });
  it("rejects incomplete automatic tax", async () => {
    mocks.retrieve.mockResolvedValue({ ...session(), automatic_tax: { enabled: true, status: "requires_location_inputs" } });
    await expect(finalizeStripeCheckoutSession("cs_owned")).rejects.toThrow("tax calculation is incomplete");
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
  it("rejects inconsistent totals and another company’s session", async () => {
    mocks.retrieve.mockResolvedValue({ ...session(), amount_total: 10000 });
    await expect(finalizeStripeCheckoutSession("cs_owned")).rejects.toThrow("cannot be reconciled");
    mocks.retrieve.mockResolvedValue(session());
    await expect(finalizeStripeCheckoutSession("cs_owned", "req_other")).rejects.toThrow("does not belong");
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
  it("does not fulfill a payment awaiting confirmation", async () => {
    mocks.retrieve.mockResolvedValue({ ...session(), payment_status: "unpaid" });
    expect(await finalizeStripeCheckoutSession("cs_owned")).toBeNull();
    expect(mocks.finalize).not.toHaveBeenCalled();
  });
});

describe("Stripe refund ownership and cumulative amounts", () => {
  beforeEach(() => { mocks.retrieveCharge.mockReset(); mocks.listSessions.mockReset(); mocks.retrieveIntent.mockReset(); mocks.recordRefund.mockReset(); mocks.listRefunds.mockReturnValue([{ status: "succeeded", amount: 5000 }]); });
  it("retrieves the latest charge total and resolves its quote through the payment's checkout session", async () => {
    mocks.retrieveCharge.mockResolvedValue({ id: "ch_owned", payment_intent: "pi_owned", amount: 11888, amount_refunded: 5000, currency: "usd" });
    mocks.listSessions.mockResolvedValue({ data: [{ id: "cs_owned", metadata: { requestId: "req_owned" } }] });
    await reconcileStripeChargeRefund("ch_owned");
    expect(mocks.listSessions).toHaveBeenCalledWith({ payment_intent: "pi_owned", limit: 1 });
    expect(mocks.recordRefund).toHaveBeenCalledWith({ chargeId: "ch_owned", paymentIntentId: "pi_owned", checkoutSessionId: "cs_owned", requestId: "req_owned", amountCents: 11888, refundedAmountCents: 5000, pendingRefundAmountCents: 0, failedRefundAmountCents: 0, currency: "usd" });
  });
  it("counts current successful, pending and failed refunds separately", async () => {
    mocks.retrieveCharge.mockResolvedValue({ id: "ch_owned", payment_intent: "pi_owned", amount: 11888, currency: "usd" });
    mocks.listSessions.mockResolvedValue({ data: [{ id: "cs_owned", metadata: { requestId: "req_owned" } }] });
    mocks.listRefunds.mockReturnValue([{ status: "succeeded", amount: 1000 }, { status: "pending", amount: 2000 }, { status: "failed", amount: 3000 }, { status: "canceled", amount: 4000 }]);
    await reconcileStripeChargeRefund("ch_owned");
    expect(mocks.recordRefund).toHaveBeenCalledWith(expect.objectContaining({ refundedAmountCents: 1000, pendingRefundAmountCents: 2000, failedRefundAmountCents: 3000 }));
  });
  it("ignores unrelated payments without Lattice request metadata", async () => {
    mocks.retrieveCharge.mockResolvedValue({ id: "ch_other", payment_intent: "pi_other", amount_refunded: 100 });
    mocks.listSessions.mockResolvedValue({ data: [] });
    mocks.retrieveIntent.mockResolvedValue({ metadata: {} });
    expect(await reconcileStripeChargeRefund("ch_other")).toBeNull();
    expect(mocks.recordRefund).not.toHaveBeenCalled();
  });
});
