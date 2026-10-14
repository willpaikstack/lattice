import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), requests: vi.fn(), orders: vi.fn(), request: vi.fn(), customers: vi.fn(), customer: vi.fn(), waiting: vi.fn(), inquiries: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error("NEXT_REDIRECT:"+url); }, notFound: () => { throw new Error("not found"); }, useRouter: vi.fn() }));
vi.mock("@/lib/request-repository", () => ({ listAdminRequests: mocks.requests, listAdminOrders: mocks.orders, getRequestById: mocks.request }));
vi.mock("@/lib/customer-profiles", () => ({ listCustomerProfiles: mocks.customers, getCustomerProfile: mocks.customer }));
vi.mock("@/lib/waiting-list", () => ({ listWaitingListEntries: mocks.waiting }));
vi.mock("@/lib/material-inquiries", () => ({ listMaterialInquiries: mocks.inquiries }));
vi.mock("@/components/admin-quote-management", () => ({ AdminQuoteManagement: () => null }));
vi.mock("@/components/admin-customer-management", () => ({ AdminCustomerManagement: () => null }));
vi.mock("@/components/admin-orders-table", () => ({ AdminOrdersTable: () => null }));
vi.mock("@/components/buyer-order-detail", () => ({ BuyerOrderDetail: () => null }));
vi.mock("@/components/admin-order-progress-form", () => ({ AdminOrderProgressForm: () => null }));
const pages = [
  ["quotes", () => import("./(workspace)/admin/quotes/page")],
  ["customers", () => import("./(workspace)/admin/customers/page")],
  ["orders", () => import("./(workspace)/admin/orders/page")],
  ["order detail", () => import("./(workspace)/admin/orders/[requestId]/page")],
  ["customer detail", () => import("./(workspace)/admin/customers/[companyId]/page")],
  ["vendors", () => import("./(workspace)/admin/vendors/page")],
  ["vendor detail", () => import("./(workspace)/admin/vendors/[vendorId]/page")],
] as const;
beforeEach(() => { vi.clearAllMocks(); });
describe("admin data never loads for unauthorized page renders", () => {
  for (const [label, load] of pages) it.each([null, { user: { role: "customer", companyId: "B" } }])(`${label} stops before private queries (%j)`, async session => {
    mocks.session.mockResolvedValue(session);
    const { default: Page } = await load();
    const render = Page as (props: unknown) => Promise<unknown>;
    await expect(render({ params: Promise.resolve({ requestId: "private", companyId: "A", vendorId: "private" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT:"+(session ? "/dashboard" : "/login"));
    for (const query of [mocks.requests,mocks.orders,mocks.request,mocks.customers,mocks.customer,mocks.waiting]) expect(query).not.toHaveBeenCalled();
  });
});
