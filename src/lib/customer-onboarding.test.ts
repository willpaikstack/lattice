import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: null as null | { user: { role: string; companyId: string | null; id: string; supportAdmin?: object } }, upsert: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: async () => mocks.session }));
vi.mock("@/lib/prisma", () => ({ getPrismaClient: async () => ({ customerOnboardingProgress: { upsert: mocks.upsert } }) }));
import { saveCustomerOnboarding } from "@/app/(workspace)/onboarding/actions";
describe("customer tour progress authorization", () => {
  beforeEach(() => { mocks.upsert.mockReset(); mocks.session = { user: { role: "customer", companyId: "company_a", id: "user_a" } }; });
  it("derives progress ownership from the signed-in membership", async () => {
    await saveCustomerOnboarding(2);
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_companyId: { userId: "user_a", companyId: "company_a" } }, update: { step: 2, completedAt: null } }));
  });
  it("does not let an admin or support session alter customer progress", async () => {
    mocks.session!.user.role = "admin";
    await expect(saveCustomerOnboarding(1)).rejects.toThrow("Customer membership required");
    mocks.session!.user.role = "customer"; mocks.session!.user.supportAdmin = { id: "operator" };
    await expect(saveCustomerOnboarding(1)).rejects.toThrow("Customer membership required");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("rejects out-of-range steps before saving", async () => {
    await expect(saveCustomerOnboarding(5)).rejects.toThrow("Invalid tour step");
    await expect(saveCustomerOnboarding(1.5)).rejects.toThrow("Invalid tour step");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it("saves a terminal skip/completion and resets completion on replay", async () => {
    await saveCustomerOnboarding(4, true);
    expect(mocks.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ update: { step: 4, completedAt: expect.any(Date) } }));
    await saveCustomerOnboarding(0);
    expect(mocks.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ update: { step: 0, completedAt: null } }));
  });
});
