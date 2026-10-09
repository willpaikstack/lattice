import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  company: vi.fn(),
  findUser: vi.fn(),
  updateUser: vi.fn(),
  clerkUpdate: vi.fn(),
  deliver: vi.fn(),
}));

vi.mock("./prisma", () => ({ getPrismaClient: async () => ({
  company: { findUnique: mocks.company },
  user: { findFirst: mocks.findUser, update: mocks.updateUser },
}) }));
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: async () => ({ users: { updateUser: mocks.clerkUpdate } }) }));
vi.mock("./customer-invitation-delivery", () => ({ deliverCustomerInvitation: mocks.deliver }));

import { resetCustomerUserPasswordAndSendInvitation } from "./workspace-user-admin";

const company = { id: "company_test", name: "Controlled test company" };
const user = {
  id: "user_test", companyId: company.id, clerkUserId: "clerk_test",
  email: "customer@example.com", name: "Test Customer", passwordHash: "old-hash",
  mustChangePassword: false, temporaryPasswordExpiresAt: null as Date | null,
};

describe("customer password reset and invitation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00Z"));
    mocks.company.mockResolvedValue(company);
    mocks.findUser.mockResolvedValue(user);
    mocks.updateUser.mockImplementation(async ({ data }) => ({ ...user, ...data }));
    mocks.clerkUpdate.mockResolvedValue({});
    mocks.deliver.mockResolvedValue({ invitationId: "invite_test", status: "sent" });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it("sends the rotated password with the persisted fresh expiry for a previously activated account", async () => {
    const result = await resetCustomerUserPasswordAndSendInvitation(company.id, user.id);
    const delivered = mocks.deliver.mock.calls[0][0];
    const saved = mocks.updateUser.mock.calls[0][0].data;

    expect(delivered.expiresAt).toEqual(new Date("2026-10-12T12:00:00Z"));
    expect(delivered.expiresAt).toEqual(saved.temporaryPasswordExpiresAt);
    expect(result.user.mustChangePassword).toBe(true);
    expect(result.user.temporaryPasswordExpiresAt).toEqual(delivered.expiresAt);
    expect(mocks.clerkUpdate).toHaveBeenCalledWith(user.clerkUserId, {
      password: delivered.temporaryPassword, signOutOfOtherSessions: true,
    });
    expect(delivered.temporaryPassword).toMatch(/^Lattice-/);
    expect(saved.passwordHash).not.toBe(user.passwordHash);
    expect(JSON.stringify(result)).not.toContain(delivered.temporaryPassword);
  });

  it("uses the new expiry when resending a previous temporary invitation", async () => {
    mocks.findUser.mockResolvedValue({ ...user, mustChangePassword: true,
      temporaryPasswordExpiresAt: new Date("2026-10-08T12:00:00Z") });

    await resetCustomerUserPasswordAndSendInvitation(company.id, user.id);

    expect(mocks.deliver).toHaveBeenCalledWith(expect.objectContaining({
      expiresAt: new Date("2026-10-12T12:00:00Z"),
    }));
  });

  it("preserves a linked existing sign-in when resending instructions", async () => {
    mocks.findUser.mockResolvedValue({ ...user, mustChangePassword: true, passwordHash: null });

    await resetCustomerUserPasswordAndSendInvitation(company.id, user.id);

    expect(mocks.clerkUpdate).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.deliver.mock.calls[0][0]).not.toHaveProperty("temporaryPassword");
  });
});
