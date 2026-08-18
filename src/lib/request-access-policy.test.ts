import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LatticeRequest } from "./request-model";

const mocks = vi.hoisted(() => {
  const state = {
    requests: [] as LatticeRequest[],
    session: null as null | {
      user: {
        email: string;
        id: string;
        name: string;
        role: "admin" | "customer" | "supplier";
        companyId: string | null;
        companyName: string | null;
        customerRole: "admin" | "member" | null;
        mustChangePassword: boolean;
        supportAdmin: { email: string; id: string; name: string } | null;
      };
    },
  };

  return {
    getCurrentSession: vi.fn(async () => state.session),
    getRequestById: vi.fn(async (id: string) => state.requests.find((request) => request.id === id) ?? null),
    listAdminRequests: vi.fn(async () => state.requests),
    state,
  };
});

vi.mock("./request-repository", () => ({
  getRequestById: mocks.getRequestById,
  listAdminRequests: mocks.listAdminRequests,
}));

vi.mock("./session", () => ({
  getCurrentSession: mocks.getCurrentSession,
}));

import {
  canCurrentSessionAccessStorageKey,
  canSessionAccessCustomerRequest,
  customerCompanyOwnsRequest,
  filterCustomerVisibleRequests,
  getCustomerRequestByIdForCurrentSession,
} from "./request-access-policy";

function session(role: "admin" | "customer" | "supplier", email: string, companyId: string | null = null) {
  return {
    user: {
      email,
      id: `${role}_${email}`,
      name: email,
      role,
      companyId,
      companyName: companyId ? `${companyId} company` : null,
      customerRole: role === "customer" ? ("member" as const) : null,
      mustChangePassword: false,
      supportAdmin: null,
    },
  };
}

function request(overrides: Partial<LatticeRequest> = {}) {
  return {
    customerPurchaseOrderAttachment: null,
    files: [],
    id: "req_test",
    buyerCompanyId: "company_acme",
    requesterEmail: "buyer@acme.com",
    supplierQuoteFiles: [],
    ...overrides,
  } as LatticeRequest;
}

describe("request access policy", () => {
  beforeEach(() => {
    mocks.state.requests = [];
    mocks.state.session = null;
    mocks.getCurrentSession.mockClear();
    mocks.getRequestById.mockClear();
    mocks.listAdminRequests.mockClear();
  });

  it("allows customer company ownership", () => {
    expect(customerCompanyOwnsRequest("company_acme", request())).toBe(true);
    expect(customerCompanyOwnsRequest("company_other", request())).toBe(false);
    expect(customerCompanyOwnsRequest(null, request())).toBe(false);
    expect(customerCompanyOwnsRequest("company_acme", request({ buyerCompanyId: null }))).toBe(false);
  });

  it("filters customer-visible requests while leaving admin support access broad", () => {
    const acme = request({ id: "req_acme", buyerCompanyId: "company_acme", requesterEmail: "buyer@acme.com" });
    const other = request({ id: "req_other", buyerCompanyId: "company_other", requesterEmail: "buyer@otherco.com" });

    expect(filterCustomerVisibleRequests([acme, other], session("customer", "coworker@acme.com", "company_acme")).map((item) => item.id)).toEqual(["req_acme"]);
    expect(filterCustomerVisibleRequests([acme, other], session("admin", "will@latticeos.co")).map((item) => item.id)).toEqual(["req_acme", "req_other"]);
    expect(filterCustomerVisibleRequests([acme, other], session("supplier", "shop@example.com"))).toEqual([]);
  });

  it("blocks customer sessions from another company's direct request lookup", async () => {
    mocks.state.requests = [request({ id: "req_other", buyerCompanyId: "company_other", requesterEmail: "owner@otherco.com" })];
    mocks.state.session = session("customer", "buyer@acme.com", "company_acme");

    await expect(getCustomerRequestByIdForCurrentSession("req_other")).resolves.toBeNull();
    expect(canSessionAccessCustomerRequest(mocks.state.session, mocks.state.requests[0])).toBe(false);
  });

  it("allows admin sessions to retrieve customer requests for support", async () => {
    const ownedRequest = request({ id: "req_other", requesterEmail: "owner@otherco.com" });
    mocks.state.requests = [ownedRequest];
    mocks.state.session = session("admin", "will@latticeos.co");

    await expect(getCustomerRequestByIdForCurrentSession("req_other")).resolves.toBe(ownedRequest);
  });

  it("lets owning customers download submitted RFQ files but blocks other customers", async () => {
    mocks.state.requests = [
      request({
        files: [{ id: "file_1", name: "part.step", sizeBytes: 10, storageKey: "rfq/2026-06-18/part.step", type: "model/step" }],
        buyerCompanyId: "company_acme",
        requesterEmail: "buyer@acme.com",
      }),
    ];

    mocks.state.session = session("customer", "coworker@acme.com", "company_acme");
    await expect(canCurrentSessionAccessStorageKey("rfq/2026-06-18/part.step")).resolves.toEqual({ authenticated: true, authorized: true });

    mocks.state.session = session("customer", "buyer@otherco.com", "company_other");
    await expect(canCurrentSessionAccessStorageKey("rfq/2026-06-18/part.step")).resolves.toEqual({ authenticated: true, authorized: false });
  });

  it("lets owning customers download customer PO attachments but blocks other customers and suppliers", async () => {
    mocks.state.requests = [
      request({
        customerPurchaseOrderAttachment: {
          id: "po_file_1",
          name: "acme-po.pdf",
          sizeBytes: 10,
          storageKey: "customer-purchase-orders/2026-06-18/acme-po.pdf",
          type: "application/pdf",
          uploadedAt: "2026-06-18T12:00:00.000Z",
        },
        buyerCompanyId: "company_acme",
        requesterEmail: "buyer@acme.com",
      }),
    ];

    mocks.state.session = session("customer", "coworker@acme.com", "company_acme");
    await expect(canCurrentSessionAccessStorageKey("customer-purchase-orders/2026-06-18/acme-po.pdf")).resolves.toEqual({ authenticated: true, authorized: true });

    mocks.state.session = session("customer", "buyer@otherco.com", "company_other");
    await expect(canCurrentSessionAccessStorageKey("customer-purchase-orders/2026-06-18/acme-po.pdf")).resolves.toEqual({ authenticated: true, authorized: false });

    mocks.state.session = session("supplier", "shop@example.com");
    await expect(canCurrentSessionAccessStorageKey("customer-purchase-orders/2026-06-18/acme-po.pdf")).resolves.toEqual({ authenticated: true, authorized: false });
  });

  it("allows admin sessions to download customer-visible local files", async () => {
    mocks.state.requests = [
      request({
        customerPurchaseOrderAttachment: {
          id: "po_file_1",
          name: "acme-po.pdf",
          sizeBytes: 10,
          storageKey: "customer-purchase-orders/2026-06-18/acme-po.pdf",
          type: "application/pdf",
          uploadedAt: "2026-06-18T12:00:00.000Z",
        },
        files: [{ id: "file_1", name: "part.step", sizeBytes: 10, storageKey: "rfq/2026-06-18/part.step", type: "model/step" }],
        buyerCompanyId: "company_acme",
        requesterEmail: "buyer@acme.com",
      }),
    ];
    mocks.state.session = session("admin", "will@latticeos.co");

    await expect(canCurrentSessionAccessStorageKey("rfq/2026-06-18/part.step")).resolves.toEqual({ authenticated: true, authorized: true });
    await expect(canCurrentSessionAccessStorageKey("customer-purchase-orders/2026-06-18/acme-po.pdf")).resolves.toEqual({ authenticated: true, authorized: true });
  });

  it("keeps supplier quote attachments admin-only", async () => {
    mocks.state.requests = [
      request({
        buyerCompanyId: "company_acme",
        requesterEmail: "buyer@acme.com",
        supplierQuoteFiles: [
          {
            id: "supplier_file_1",
            name: "shop.pdf",
            sizeBytes: 10,
            storageKey: "supplier-quotes/2026-06-18/shop.pdf",
            type: "application/pdf",
            uploadedAt: "2026-06-18T12:00:00.000Z",
          },
        ],
      }),
    ];

    mocks.state.session = session("customer", "buyer@acme.com", "company_acme");
    await expect(canCurrentSessionAccessStorageKey("supplier-quotes/2026-06-18/shop.pdf")).resolves.toEqual({ authenticated: true, authorized: false });

    mocks.state.session = session("admin", "will@latticeos.co");
    await expect(canCurrentSessionAccessStorageKey("supplier-quotes/2026-06-18/shop.pdf")).resolves.toEqual({ authenticated: true, authorized: true });
  });

  it("treats unknown storage keys as authenticated but unauthorized", async () => {
    mocks.state.session = session("customer", "buyer@acme.com", "company_acme");

    await expect(canCurrentSessionAccessStorageKey("rfq/2026-06-18/missing.step")).resolves.toEqual({ authenticated: true, authorized: false });
  });

  it("keeps draft upload previews available to customer/admin sessions", async () => {
    mocks.state.session = session("customer", "buyer@acme.com");

    await expect(canCurrentSessionAccessStorageKey("rfq-drafts/2026-06-18/draft.step")).resolves.toEqual({ authenticated: true, authorized: true });
  });
});
