import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getPrismaClient: vi.fn(), auth: vi.fn(), clerkClient: vi.fn(), updateUser: vi.fn(), findOwner: vi.fn(), signedInRecoveryEmail: vi.fn() }));
vi.mock("./prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));
vi.mock("./workspace-user", () => ({ findWorkspaceUser: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, clerkClient: mocks.clerkClient }));
vi.mock("./password-reset-identity", () => ({ signedInRecoveryEmail: mocks.signedInRecoveryEmail }));
import { consumePasswordReset } from "./password-reset";
let tx: { passwordResetToken: { updateMany: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> }; user: { findUniqueOrThrow: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }; authAuditEvent: { create: ReturnType<typeof vi.fn> } };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: null });
  mocks.findOwner.mockResolvedValue({ clerkUserId: "clerk-linked" });
  mocks.signedInRecoveryEmail.mockResolvedValue("owner@example.com");
  tx = { passwordResetToken: { updateMany: vi.fn().mockResolvedValue({ count: 1 }), deleteMany: vi.fn() }, user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ clerkUserId: "clerk-linked" }), update: vi.fn() }, authAuditEvent: { create: vi.fn() } };
  mocks.getPrismaClient.mockResolvedValue({ user: { findUnique: mocks.findOwner }, passwordResetToken: { findUnique: vi.fn().mockResolvedValue({ id: "token-row", userId: "workspace-user", consumedAt: null, expiresAt: new Date(Date.now() + 60000) }) }, $transaction: async (operation: (value: typeof tx) => Promise<void>) => operation(tx) });
  mocks.clerkClient.mockResolvedValue({ users: { updateUser: mocks.updateUser } });
  mocks.updateUser.mockResolvedValue({});
});
describe("Clerk-backed password recovery", () => {
  it("updates the actual sign-in credential before completing the local password reset", async () => {
    await consumePasswordReset("synthetic-token", "Synthetic-passphrase-127");
    expect(mocks.updateUser).toHaveBeenCalledWith("clerk-linked", { password: "Synthetic-passphrase-127", signOutOfOtherSessions: true });
    expect(tx.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "workspace-user" }, data: expect.objectContaining({ mustChangePassword: false }) }));
    expect(tx.authAuditEvent.create).toHaveBeenCalled();
  });
  it("prevents a concurrent second claimant from changing either credential", async () => {
    tx.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
    await expect(consumePasswordReset("used-token", "Synthetic-passphrase-127")).rejects.toThrow("invalid or has expired");
    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(tx.user.update).not.toHaveBeenCalled();
  });
  it("rejects a signed-in identity's attempt to consume another account's token before claiming it", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-other" });
    await expect(consumePasswordReset("synthetic-token", "Synthetic-passphrase-127")).rejects.toMatchObject({ code: "invalid" });
    expect(mocks.signedInRecoveryEmail).toHaveBeenCalledOnce();
    expect(tx.passwordResetToken.updateMany).not.toHaveBeenCalled();
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
  it("allows the verified signed-in token owner to reset their own credential", async () => {
    mocks.auth.mockResolvedValue({ userId: "clerk-linked" });
    await consumePasswordReset("synthetic-token", "Synthetic-passphrase-127");
    expect(mocks.signedInRecoveryEmail).toHaveBeenCalledOnce();
    expect(mocks.findOwner).toHaveBeenCalledWith({ where: { id: "workspace-user" }, select: { clerkUserId: true } });
    expect(mocks.updateUser).toHaveBeenCalledWith("clerk-linked", expect.objectContaining({ signOutOfOtherSessions: true }));
  });
  it("never reports local success after a provider failure or for an unlinked identity", async () => {
    mocks.updateUser.mockRejectedValueOnce(new Error("Identity service unavailable"));
    await expect(consumePasswordReset("synthetic-token", "Synthetic-passphrase-127")).rejects.toMatchObject({ code: "service" });
    expect(tx.user.update).not.toHaveBeenCalled();
    tx.user.findUniqueOrThrow.mockResolvedValueOnce({ clerkUserId: null });
    await expect(consumePasswordReset("synthetic-token", "Synthetic-passphrase-127")).rejects.toMatchObject({ code: "service" });
  });
  it("distinguishes provider password-policy failures from expired tokens", async () => {
    mocks.updateUser.mockRejectedValueOnce({ errors: [{ code: "form_password_pwned" }] });
    await expect(consumePasswordReset("synthetic-token", "Synthetic-passphrase-127")).rejects.toMatchObject({ code: "password-policy" });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

});
