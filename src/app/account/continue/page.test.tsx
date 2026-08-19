import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  defaultHomeForRole: vi.fn(() => "/dashboard"),
  getAccountSettings: vi.fn(),
  hasCompletedAddressOnboarding: vi.fn(),
  getCurrentSession: vi.fn(),
  getPasswordSetupState: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth-crypto", () => ({ defaultHomeForRole: mocks.defaultHomeForRole }));
vi.mock("@/lib/account-settings", () => ({
  getAccountSettings: mocks.getAccountSettings,
  hasCompletedAddressOnboarding: mocks.hasCompletedAddressOnboarding,
}));
vi.mock("@/lib/session", () => ({
  getCurrentSession: mocks.getCurrentSession,
  getPasswordSetupState: mocks.getPasswordSetupState,
}));

import AccountContinuePage from "./page";

describe("AccountContinuePage", () => {
  it("sends a newly provisioned account directly to password setup before a workspace route renders", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({ session: { user: { mustChangePassword: true } }, status: "ready" });

    await expect(AccountContinuePage()).rejects.toThrow("redirect:/account/set-password");
    expect(mocks.getCurrentSession).not.toHaveBeenCalled();
  });

  it("sends a completed account to its role-specific workspace", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({ status: "already-complete" });
    mocks.getCurrentSession.mockResolvedValue({ user: { role: "customer" } });
    mocks.getAccountSettings.mockResolvedValue({});
    mocks.hasCompletedAddressOnboarding.mockReturnValue(true);

    await expect(AccountContinuePage()).rejects.toThrow("redirect:/dashboard");
    expect(mocks.defaultHomeForRole).toHaveBeenCalledWith("customer");
  });

  it("sends a new customer without operational addresses to setup before the workspace", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({ status: "already-complete" });
    mocks.getCurrentSession.mockResolvedValue({ user: { role: "customer" } });
    mocks.getAccountSettings.mockResolvedValue({});
    mocks.hasCompletedAddressOnboarding.mockReturnValue(false);

    await expect(AccountContinuePage()).rejects.toThrow("redirect:/account/settings?onboarding=addresses");
  });
});
