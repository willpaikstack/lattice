import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), request: vi.fn(), prisma: vi.fn(), findFirst: vi.fn(), create: vi.fn(), revalidate: vi.fn(), isMock: vi.fn(), createMock: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/request-access-policy", () => ({ getCustomerRequestByIdForCurrentSession: mocks.request }));
vi.mock("@/lib/prisma", () => ({ getPrismaClient: mocks.prisma }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/mock-quote-renewals", () => ({ isMockQuoteRenewal: mocks.isMock, createMockQuoteRenewal: mocks.createMock }));
import { requestQuoteRenewal } from "./actions";

describe("quote renewal requests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isMock.mockReturnValue(false);
    mocks.session.mockResolvedValue({ user: { id: "user_a", role: "customer", email: "test@example.com" } });
    mocks.request.mockResolvedValue({ id: "request_a", buyerCompanyId: "company_a", title: "Test RFQ", status: "QUOTED", quote: {}, customerQuotes: [{ id: "quote_a", quoteNumber: "LQ-TEST", versionNumber: 1, issuedAt: "2026-01-01T00:00:00Z", validUntil: "2026-01-20" }] });
    mocks.prisma.mockResolvedValue({ customerSupportRequest: { findFirst: mocks.findFirst, create: mocks.create } });
    mocks.findFirst.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "ticket_a" });
  });

  it("saves an owning customer's request to the operator queue without renewing the quote itself", async () => {
    const data = new FormData(); data.set("notes", "Need 20 parts now");
    await expect(requestQuoteRenewal("request_a", "quote_a", data)).resolves.toEqual({ id: "ticket_a" });
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ requestId: "request_a", companyId: "company_a", userId: "user_a", issueType: "QUOTE_RENEWAL", message: expect.stringContaining("Need 20 parts now"), emailDelivery: "NOT_REQUESTED" }) });
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/support");
  });

  it("rejects a request hidden by company ownership", async () => {
    mocks.request.mockResolvedValue(null);
    await expect(requestQuoteRenewal("request_b", "quote_a", new FormData())).rejects.toThrow("not available");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects stale quote versions and still-valid quotes", async () => {
    await expect(requestQuoteRenewal("request_a", "old_quote", new FormData())).rejects.toThrow("changed");
    const request = await mocks.request(); request.customerQuotes[0].validUntil = "2099-01-01";
    await expect(requestQuoteRenewal("request_a", "quote_a", new FormData())).rejects.toThrow("still valid");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns the existing open request on retry", async () => {
    mocks.findFirst.mockResolvedValue({ id: "existing_ticket" });
    await expect(requestQuoteRenewal("request_a", "quote_a", new FormData())).resolves.toEqual({ id: "existing_ticket" });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("keeps synthetic demo renewal requests out of the database", async () => {
    const request = await mocks.request(); request.id = "demo_expired";
    await expect(requestQuoteRenewal("demo_expired", "quote_a", new FormData())).rejects.toThrow("Demo quotes");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("lets local admin demo renewals use isolated storage without database writes", async () => {
    const request = await mocks.request(); request.id = "demo_expired"; request.buyerCompanyId = null;
    mocks.session.mockResolvedValue({ user: { id: "admin_a", role: "admin", email: "admin@example.com" } });
    mocks.isMock.mockReturnValue(true);
    mocks.createMock.mockResolvedValue({ id: "mock_ticket_a" });
    await expect(requestQuoteRenewal("demo_expired", "quote_a", new FormData())).resolves.toEqual({ id: "mock_ticket_a" });
    expect(mocks.prisma).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
