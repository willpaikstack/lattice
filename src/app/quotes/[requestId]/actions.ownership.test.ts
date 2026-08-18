import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureStripeCustomerForAccount: vi.fn(),
  finalizeStripePaymentIntent: vi.fn(),
  getAppBaseUrl: vi.fn(),
  getCurrentSession: vi.fn(),
  getCustomerRequestByIdForCurrentSession: vi.fn(),
  getStripeClient: vi.fn(),
  purchaseQuote: vi.fn(),
  quoteCheckoutAmountCents: vi.fn(),
  recordStripeCheckoutSession: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
  saveLocalUpload: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/account-settings", () => ({
  ensureStripeCustomerForAccount: mocks.ensureStripeCustomerForAccount,
}));

vi.mock("@/lib/local-file-storage", () => ({
  saveLocalUpload: mocks.saveLocalUpload,
}));

vi.mock("@/lib/request-access-policy", () => ({
  getCustomerRequestByIdForCurrentSession: mocks.getCustomerRequestByIdForCurrentSession,
}));

vi.mock("@/lib/request-repository", () => ({
  purchaseQuote: mocks.purchaseQuote,
  quoteCheckoutAmountCents: mocks.quoteCheckoutAmountCents,
  recordStripeCheckoutSession: mocks.recordStripeCheckoutSession,
}));

vi.mock("@/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

vi.mock("@/lib/stripe", () => ({
  getAppBaseUrl: mocks.getAppBaseUrl,
  getStripeClient: mocks.getStripeClient,
}));

vi.mock("@/lib/stripe-checkout", () => ({
  finalizeStripePaymentIntent: mocks.finalizeStripePaymentIntent,
}));

import { finalizeStripeCardPaymentAction, purchaseQuoteAction, updateStripeElementsCheckoutSessionAction } from "./actions";

function customerSession(email = "buyer@acme.com") {
  return {
    user: {
      email,
      id: `user_${email}`,
      name: email,
      role: "customer" as const,
    },
  };
}

function checkoutForm(paymentMethod = "purchase-order") {
  const formData = new FormData();
  formData.set("paymentMethod", paymentMethod);
  formData.set("shipToAddress1", "1 Main St");
  formData.set("shipToCity", "Pittsburgh");
  formData.set("shipToCompany", "Acme");
  formData.set("shipToName", "Buyer");
  formData.set("shipToPhone", "555-0100");
  formData.set("shipToState", "PA");
  formData.set("shipToZipCode", "15222");
  formData.set("apEmail", "ap@acme.com");
  formData.set("poNumber", "PO-1001");
  return formData;
}

describe("checkout server action ownership", () => {
  beforeEach(() => {
    mocks.ensureStripeCustomerForAccount.mockReset();
    mocks.finalizeStripePaymentIntent.mockReset();
    mocks.getAppBaseUrl.mockReset();
    mocks.getCurrentSession.mockReset();
    mocks.getCustomerRequestByIdForCurrentSession.mockReset();
    mocks.getStripeClient.mockReset();
    mocks.purchaseQuote.mockReset();
    mocks.quoteCheckoutAmountCents.mockReset();
    mocks.recordStripeCheckoutSession.mockReset();
    mocks.redirect.mockClear();
    mocks.revalidatePath.mockReset();
    mocks.saveLocalUpload.mockReset();

    mocks.getCurrentSession.mockResolvedValue(customerSession());
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue(null);
  });

  it("blocks direct purchase POSTs for another customer's quote before mutating checkout or order state", async () => {
    await expect(purchaseQuoteAction("req_other", checkoutForm())).rejects.toThrow("Only priced quotes can be paid by card.");

    expect(mocks.getCustomerRequestByIdForCurrentSession).toHaveBeenCalledWith("req_other");
    expect(mocks.purchaseQuote).not.toHaveBeenCalled();
    expect(mocks.recordStripeCheckoutSession).not.toHaveBeenCalled();
    expect(mocks.saveLocalUpload).not.toHaveBeenCalled();
  });

  it("blocks direct Stripe checkout-session updates for another customer's quote", async () => {
    await expect(updateStripeElementsCheckoutSessionAction("req_other", "pi_other", checkoutForm())).rejects.toThrow(
      "Only priced quotes can be paid by card.",
    );

    expect(mocks.recordStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("blocks direct Stripe finalization for another customer's quote", async () => {
    await expect(finalizeStripeCardPaymentAction("req_other", "pi_other", checkoutForm())).rejects.toThrow("Only priced quotes can be paid by card.");

    expect(mocks.finalizeStripePaymentIntent).not.toHaveBeenCalled();
    expect(mocks.recordStripeCheckoutSession).not.toHaveBeenCalled();
  });

  it("lets an owning customer complete a purchase-order checkout and records the uploaded PO", async () => {
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue({
      customerQuotes: [{ quoteNumber: "LQ-1001" }],
      id: "req_owned",
      status: "QUOTED",
      title: "Precision bracket",
    });
    mocks.saveLocalUpload.mockResolvedValue({
      name: "PO-1001.pdf",
      sizeBytes: 12,
      storageKey: "customer-purchase-orders/PO-1001.pdf",
      type: "application/pdf",
    });
    mocks.purchaseQuote.mockResolvedValue({ id: "req_owned", status: "PURCHASED" });

    const formData = checkoutForm();
    formData.set("poFile", new File(["purchase order"], "PO-1001.pdf", { type: "application/pdf" }));

    await expect(purchaseQuoteAction("req_owned", formData)).rejects.toThrow("NEXT_REDIRECT:/orders");

    expect(mocks.saveLocalUpload).toHaveBeenCalledWith(expect.any(File), "customer-purchase-orders");
    expect(mocks.purchaseQuote).toHaveBeenCalledWith(
      "req_owned",
      expect.objectContaining({
        accountsPayableEmail: "ap@acme.com",
        customerPoNumber: "PO-1001",
        paymentMethod: "purchase-order",
        poAttachment: expect.objectContaining({ storageKey: "customer-purchase-orders/PO-1001.pdf" }),
      }),
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/orders");
  });
});
