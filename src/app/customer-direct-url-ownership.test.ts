import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LatticeRequest } from "@/lib/request-model";

const mocks = vi.hoisted(() => ({
  buildRequestInvoicePdf: vi.fn(),
  createStripeElementsCheckoutSessionForRequest: vi.fn(),
  getAccountSettings: vi.fn(),
  getCustomerRequestByIdForCurrentSession: vi.fn(),
  listStripePaymentCards: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  orderInvoicePdfFileName: vi.fn(),
  requireRouteRole: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/components/buyer-quote-detail", () => ({
  BuyerQuoteDetail: () => null,
}));

vi.mock("@/components/buyer-quote-checkout", () => ({
  BuyerQuoteCheckout: () => null,
}));

vi.mock("@/components/buyer-order-detail", () => ({
  BuyerOrderDetail: () => null,
}));

vi.mock("@/lib/account-settings", () => ({
  getAccountSettings: mocks.getAccountSettings,
  listStripePaymentCards: mocks.listStripePaymentCards,
}));

vi.mock("@/lib/invoice-pdf", () => ({
  buildRequestInvoicePdf: mocks.buildRequestInvoicePdf,
  orderInvoicePdfFileName: mocks.orderInvoicePdfFileName,
}));

vi.mock("@/lib/request-access-policy", () => ({
  getCustomerRequestByIdForCurrentSession: mocks.getCustomerRequestByIdForCurrentSession,
}));

vi.mock("@/lib/route-authorization", () => ({
  requireRouteRole: mocks.requireRouteRole,
}));

vi.mock("@/lib/stripe-checkout", () => ({
  createStripeElementsCheckoutSessionForRequest: mocks.createStripeElementsCheckoutSessionForRequest,
}));

import * as OrderInvoiceRoute from "./(workspace)/orders/[requestId]/invoice.pdf/route";
import OrderDetailPage from "./(workspace)/orders/[requestId]/page";
import QuoteCheckoutPage from "./(workspace)/quotes/[requestId]/checkout/page";
import QuoteDetailPage from "./(workspace)/quotes/[requestId]/page";

function paramsFor(requestId: string) {
  return {
    params: Promise.resolve({ requestId }),
  };
}

function searchParamsFor(values: { payment?: string } = {}) {
  return Promise.resolve(values);
}

function request(overrides: Partial<LatticeRequest> = {}) {
  return {
    customerQuotes: [],
    id: "req_owned",
    requesterEmail: "buyer@acme.com",
    status: "QUOTED",
    title: "Owned RFQ",
    ...overrides,
  } as LatticeRequest;
}

describe("customer direct URL ownership", () => {
  beforeEach(() => {
    mocks.buildRequestInvoicePdf.mockReset();
    mocks.createStripeElementsCheckoutSessionForRequest.mockReset();
    mocks.getAccountSettings.mockReset();
    mocks.getCustomerRequestByIdForCurrentSession.mockReset();
    mocks.listStripePaymentCards.mockReset();
    mocks.notFound.mockClear();
    mocks.orderInvoicePdfFileName.mockReset();
    mocks.requireRouteRole.mockReset();

    mocks.getAccountSettings.mockResolvedValue({
      billing: { email: "ap@acme.com" },
      phone: "555-0100",
      shipping: {},
    });
    mocks.listStripePaymentCards.mockResolvedValue([]);
    mocks.requireRouteRole.mockResolvedValue(null);
  });

  it("returns not-found for another customer's quote detail URL", async () => {
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue(null);

    await expect(QuoteDetailPage(paramsFor("req_other"))).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.getCustomerRequestByIdForCurrentSession).toHaveBeenCalledWith("req_other");
  });

  it("returns not-found for another customer's checkout URL before creating payment state", async () => {
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue(null);

    await expect(
      QuoteCheckoutPage({
        ...paramsFor("req_other"),
        searchParams: searchParamsFor(),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.createStripeElementsCheckoutSessionForRequest).not.toHaveBeenCalled();
  });

  it("returns not-found for another customer's order detail URL", async () => {
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue(null);

    await expect(OrderDetailPage(paramsFor("req_other"))).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("returns not-found for another customer's invoice PDF URL before rendering bytes", async () => {
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue(null);

    await expect(OrderInvoiceRoute.GET(new Request("http://localhost/orders/req_other/invoice.pdf"), paramsFor("req_other"))).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mocks.buildRequestInvoicePdf).not.toHaveBeenCalled();
  });

  it("serves an owned customer invoice PDF after role and ownership checks pass", async () => {
    const ownedOrder = request({ id: "req_owned", status: "PURCHASED" });
    mocks.getCustomerRequestByIdForCurrentSession.mockResolvedValue(ownedOrder);
    mocks.buildRequestInvoicePdf.mockResolvedValue(Buffer.from("pdf-bytes"));
    mocks.orderInvoicePdfFileName.mockReturnValue("invoice.pdf");

    const response = await OrderInvoiceRoute.GET(new Request("http://localhost/orders/req_owned/invoice.pdf?preview=1"), paramsFor("req_owned"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe('inline; filename="invoice.pdf"');
    await expect(response.text()).resolves.toBe("pdf-bytes");
  });
});
