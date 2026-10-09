import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn(), admins: vi.fn(), session: vi.fn(), revalidate: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("./prisma", () => ({ getPrismaClient: async () => ({ customerEmailEvent: mocks, user: { findMany: mocks.admins } }) }));
vi.mock("./session", () => ({ getCurrentSession: mocks.session }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { deliverCustomerEmailEvent, queueCustomerLifecycleEmail } from "./customer-lifecycle-email";
import { retryCustomerEmail } from "@/app/(workspace)/admin/support/actions";
import type { LatticeRequest } from "./request-model";
describe("durable lifecycle email delivery", () => {
  beforeEach(() => {
    vi.resetAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
    mocks.findUnique.mockResolvedValue({ key: "event", recipient: "buyer@example.com", subject: "Quote ready", body: "Review your quote", status: "FAILED" });
    mocks.upsert.mockImplementation(async ({ create }) => ({ ...create, status: "PENDING" }));
  });
  it("does not send or increment attempts without delivery configuration", async () => {
    vi.stubEnv("RESEND_API_KEY", ""); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(deliverCustomerEmailEvent("event")).rejects.toThrow("not configured");
    expect(fetcher).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it("never resends a delivered event", async () => {
    mocks.findUnique.mockResolvedValue({ key: "event", status: "SENT" });
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await deliverCustomerEmailEvent("event"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("retries with the same provider idempotency key and records delivery", async () => {
    vi.stubEnv("RESEND_API_KEY", "fake_test_configuration");
    const fetcher = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal("fetch", fetcher);
    await deliverCustomerEmailEvent("event");
    expect(fetcher.mock.calls[0][1].headers["Idempotency-Key"]).toBe("event");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { attempts: { increment: 1 }, status: "SENT", deliveredAt: expect.any(Date) } }));
  });
  it("records a network failure for operator recovery", async () => {
    vi.stubEnv("RESEND_API_KEY", "fake_test_configuration"); vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    await expect(deliverCustomerEmailEvent("event")).rejects.toThrow("timeout");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { attempts: { increment: 1 }, status: "FAILED", deliveredAt: null } }));
  });
  it("sends quality approval notices to the owning company admins", async () => {
    vi.stubEnv("RESEND_API_KEY", ""); mocks.admins.mockResolvedValue([{ email: "admin@example.com" }]);
    await queueCustomerLifecycleEmail({ id: "rfq_a", buyerCompanyId: "company_a", requesterEmail: "member@example.com", title: "Part" } as LatticeRequest, "QUALITY_APPROVAL_REQUESTED", "version1");
    expect(mocks.admins).toHaveBeenCalledWith({ where: { companyId: "company_a", role: "CUSTOMER_ADMIN" }, select: { email: true } });
    expect(mocks.upsert.mock.calls[0][0].create.recipient).toBe("admin@example.com");
  });
  it("denies customer access to delivery retries", async () => {
    mocks.session.mockResolvedValue({ user: { role: "customer" } });
    const form = new FormData(); form.set("key", "event");
    await expect(retryCustomerEmail(form)).rejects.toThrow("Admin access required");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("queues other company admins even when one delivery fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "fake_test_configuration");
    mocks.admins.mockResolvedValue([{ email: "first@example.com" }, { email: "second@example.com" }]);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await queueCustomerLifecycleEmail({ id: "rfq_a", buyerCompanyId: "company_a", requesterEmail: "member@example.com", title: "Part" } as LatticeRequest, "QUALITY_APPROVAL_REQUESTED", "version1");
    expect(mocks.upsert.mock.calls.map(([arg]) => arg.create.recipient)).toEqual(["first@example.com", "second@example.com"]);
    expect(mocks.update).toHaveBeenCalledTimes(2);
  });
});
