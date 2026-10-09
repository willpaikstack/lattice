import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), readiness: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/stripe", () => ({ getStripeMerchantReadiness: mocks.readiness }));
import { GET } from "./route";
beforeEach(() => { vi.resetAllMocks(); });
it("requires admin access before checking Stripe", async () => {
  mocks.session.mockResolvedValue({ user: { role: "customer" } });
  expect((await GET()).status).toBe(403);
  expect(mocks.readiness).not.toHaveBeenCalled();
});
it("reports an allowlisted credential diagnostic without leaking Stripe error text", async () => {
  mocks.session.mockResolvedValue({ user: { role: "admin" } });
  mocks.readiness.mockRejectedValue({ type: "StripeAuthenticationError", message: "Invalid API Key provided: sensitive_test_value" });
  const response = await GET();
  expect(response.status).toBe(503);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const body = await response.json();
  expect(body.errorCode).toBe("STRIPE_AUTHENTICATION_FAILED");
  expect(JSON.stringify(body)).not.toContain("sensitive_test_value");
});
