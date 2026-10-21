import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import { privateMarker, privateRequestFixture } from "@/test-fixtures/customer-request";
import type { LatticeRequest } from "@/lib/request-model";

const mocks = vi.hoisted(() => ({
  session: vi.fn(), getRequestById: vi.fn(), listBuyerQuotes: vi.fn(), listBuyerOrders: vi.fn(), archiveDraftRequest: vi.fn(),
  support: { findMany: vi.fn(async () => []), findFirst: vi.fn(async () => null) },
}));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@clerk/nextjs/server", () => ({ currentUser: async () => null }));
vi.mock("@/lib/request-repository", () => ({ getRequestById: mocks.getRequestById, listBuyerQuotes: mocks.listBuyerQuotes, listBuyerOrders: mocks.listBuyerOrders, listAdminRequests: async () => [], archiveDraftRequest: mocks.archiveDraftRequest }));
vi.mock("@/lib/prisma", () => ({ getPrismaClient: async () => ({ customerSupportRequest: mocks.support }) }));
vi.mock("@/lib/account-settings", () => ({ getAccountSettings: async () => ({ companyName: "Preview Manufacturing", shipping: {}, billingAddress: {}, billing: { email: "ap@example.test", invoiceRoutingNotes: "" } }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); }, redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
// Keep each route's actual data loading and prop construction. Its client child
// remains an element whose complete serializable props can be inspected below.
vi.mock("@/components/buyer-quotes", () => ({ BuyerQuotes: () => null }));
vi.mock("@/components/buyer-orders", () => ({ BuyerOrders: () => null }));
vi.mock("@/components/buyer-quote-detail", () => ({ BuyerQuoteDetail: () => null }));
vi.mock("@/components/buyer-quote-checkout", () => ({ BuyerQuoteCheckout: () => null }));
vi.mock("@/components/buyer-order-detail", () => ({ BuyerOrderDetail: () => null }));
vi.mock("@/components/buyer-order-help", () => ({ BuyerOrderHelp: () => null }));
vi.mock("@/components/request-form", () => ({ RequestForm: () => null }));
vi.mock("@/components/customer-dashboard-view", () => ({ CustomerDashboardView: () => null }));

import QuotesPage from "./(workspace)/quotes/page";
import QuotePage from "./(workspace)/quotes/[requestId]/page";
import CheckoutPage from "./(workspace)/quotes/[requestId]/checkout/page";
import OrdersPage from "./(workspace)/orders/page";
import OrderPage from "./(workspace)/orders/[requestId]/page";
import HelpPage from "./(workspace)/orders/[requestId]/help/page";
import ShippedPage from "./(workspace)/shipped/page";
import NewRequestPage from "./(workspace)/requests/new/page";
import DashboardPage from "./(workspace)/dashboard/page";
import NotificationsPage from "./(workspace)/notifications/page";
import { GET as notificationResponse } from "./api/customer-notifications/route";
import { POST as archiveResponse } from "./api/requests/[requestId]/archive/route";

const params = () => ({ params: Promise.resolve({ requestId: "req_privacy" }) });
const routes = [
  ["quotes", "QUOTED", () => QuotesPage()],
  ["quote detail", "QUOTED", () => QuotePage(params())],
  ["checkout", "QUOTED", () => CheckoutPage({ ...params(), searchParams: Promise.resolve({}) })],
  ["orders", "PURCHASED", () => OrdersPage()],
  ["order detail", "PURCHASED", () => OrderPage(params())],
  ["order help", "PURCHASED", () => HelpPage(params())],
  ["shipped", "PURCHASED", () => ShippedPage()],
  ["draft continuation", "DRAFT", () => NewRequestPage({ searchParams: Promise.resolve({ draft: "req_privacy" }) })],
  ["reorder", "PURCHASED", () => NewRequestPage({ searchParams: Promise.resolve({ reorder: "req_privacy" }) })],
  ["dashboard", "QUOTED", () => DashboardPage()],
  ["notifications", "QUOTED", () => NotificationsPage()],
] as const;

describe.each(["admin", "member"] as const)("customer %s browser boundary", customerRole => {
  let source: LatticeRequest;
  beforeEach(() => {
    source = privateRequestFixture();
    const foreign = { ...source, id: "req_foreign", buyerCompanyId: "company_b", title: "FOREIGN_COMPANY_CANARY" };
    mocks.session.mockResolvedValue({ user: { id: "customer_a", role: "customer", customerRole, companyId: "company_a", name: "Buyer", email: "buyer@example.test" } });
    mocks.getRequestById.mockImplementation(async (id: string) => id === source.id ? source : foreign);
    mocks.listBuyerQuotes.mockImplementation(async () => [source, foreign]);
    mocks.listBuyerOrders.mockImplementation(async () => [source, foreign]);
  });

  it.each(routes)("%s excludes internal data from the full element payload", async (_name, status, render) => {
    source.status = status;
    const tree = await render();
    const serialized = JSON.stringify(tree, (_key, value) => isValidElement(value) ? { props: value.props } : value);
    expect(serialized).not.toContain(privateMarker);
    expect(serialized).not.toContain("FOREIGN_COMPANY_CANARY");
    expect(serialized).not.toContain('"supplierQuotes"');
    expect(serialized).not.toContain('"supplierQuoteFiles"');
    expect(serialized).not.toContain('"guestAccessTokenHash"');
    expect(serialized).not.toContain("123456789");
    expect(serialized).not.toContain("9876.54321");
    expect(tree).toBeTruthy();
    expect(source.supplierQuotes[0].notes).toContain(privateMarker);
  });

  it("excludes internal data from notification JSON", async () => {
    const response = await notificationResponse();
    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain(privateMarker);
  });

  it("returns only a receipt when archiving a draft", async () => {
    source.status = "DRAFT";
    mocks.archiveDraftRequest.mockResolvedValue({ ...source, isArchived: true });
    const response = await archiveResponse(new Request("https://lattice.test/api/requests/req_privacy/archive", { method: "POST", body: JSON.stringify({ reason: "Customer canceled" }) }), params());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ request: { id: source.id } });
  });

  it("still denies a foreign-company detail URL before constructing customer props", async () => {
    await expect(QuotePage({ params: Promise.resolve({ requestId: "req_foreign" }) })).rejects.toThrow("NOT_FOUND");
  });
});
