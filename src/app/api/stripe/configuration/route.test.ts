import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), readiness: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/stripe", () => ({ getStripeMerchantReadiness: mocks.readiness }));
import { GET } from "./route";
describe("Stripe configuration access", () => {
  beforeEach(() => { mocks.session.mockReset(); mocks.readiness.mockReset(); });
  it("rejects customers before reading merchant data", async () => {
    mocks.session.mockResolvedValue({ user: { role: "customer" } });
    expect((await GET()).status).toBe(403);
    expect(mocks.readiness).not.toHaveBeenCalled();
  });
  it("returns readiness only to the admin and hides provider errors", async () => {
    mocks.session.mockResolvedValue({ user: { role: "admin" } });
    mocks.readiness.mockResolvedValue({ ready: true, accountId: "acct_expected" });
    expect(await (await GET()).json()).toEqual({ ready: true, accountId: "acct_expected" });
    mocks.readiness.mockRejectedValue(new Error("private credential detail"));
    const result = await GET();
    expect(result.status).toBe(503);
    expect(JSON.stringify(await result.json())).not.toContain("private credential");
  });
});
