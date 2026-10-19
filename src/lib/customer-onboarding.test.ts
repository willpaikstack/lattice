import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: null as null | { user: { role: string; companyId: string | null; id: string; supportAdmin?: object } }, upsert: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: async () => mocks.session }));
vi.mock("@/lib/prisma", () => ({ getPrismaClient: async () => ({ customerOnboardingProgress: { upsert: mocks.upsert } }) }));
import { completeCustomerOnboarding } from "@/app/(workspace)/onboarding/actions";
describe("customer tour completion authorization", () => {
  beforeEach(() => { mocks.upsert.mockReset(); mocks.session = { user: { role: "customer", companyId: "company_a", id: "user_a" } }; });
  it("derives ownership and the terminal step on the server", async () => {
    await completeCustomerOnboarding();
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_companyId: { userId: "user_a", companyId: "company_a" } },
      update: { step: 406, completedAt: expect.any(Date) },
    }));
  });
  it("rejects admins, support sessions and customers without a company", async () => {
    mocks.session!.user.role = "admin";
    await expect(completeCustomerOnboarding()).rejects.toThrow("Customer membership required");
    mocks.session!.user.role = "customer"; mocks.session!.user.supportAdmin = { id: "operator" };
    await expect(completeCustomerOnboarding()).rejects.toThrow("Customer membership required");
    delete mocks.session!.user.supportAdmin; mocks.session!.user.companyId = null;
    await expect(completeCustomerOnboarding()).rejects.toThrow("Customer membership required");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
