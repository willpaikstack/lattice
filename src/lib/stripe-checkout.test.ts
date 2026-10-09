import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ retrieve: vi.fn(), finalize: vi.fn() }));
vi.mock("./stripe", () => ({ getStripeClient: () => ({ checkout: { sessions: { retrieve: mocks.retrieve } } }), stripePaymentMethodCardSnapshot: () => null }));
vi.mock("./request-repository", () => ({ finalizeStripePaidQuote: mocks.finalize, markStripeCheckoutSessionFailed: vi.fn(), quoteCheckoutAmountCents: vi.fn(), recordStripeCheckoutSession: vi.fn() }));
vi.mock("./account-settings", () => ({ ensureStripeCustomerForAccount: vi.fn() }));
import { finalizeStripeCheckoutSession } from "./stripe-checkout";
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
