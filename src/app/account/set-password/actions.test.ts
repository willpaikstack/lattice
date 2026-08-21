import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  completeForcedPasswordChange: vi.fn(),
  getPasswordSetupState: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/session", () => ({
  getPasswordSetupState: mocks.getPasswordSetupState,
}));
vi.mock("@/lib/workspace-user-admin", () => ({ completeForcedPasswordChange: mocks.completeForcedPasswordChange }));

import { setTemporaryPasswordAction } from "./actions";

function formData() {
  const data = new FormData();
  data.set("password", "new-password-for-test");
  data.set("confirmation", "new-password-for-test");
  return data;
}

describe("setTemporaryPasswordAction", () => {
  it("shows a password-policy message when Clerk rejects the new password", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({
      session: { user: { email: "carmen@example.com", id: "user_1", name: "Carmen", role: "customer" } },
      status: "ready",
    });
    mocks.completeForcedPasswordChange.mockRejectedValue(Object.assign(new Error("policy"), { code: "password-policy" }));

    await expect(setTemporaryPasswordAction(formData())).rejects.toThrow("redirect:/account/set-password?error=password-policy");
  });

  it("uses a generic safe message for an unexpected setup failure", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({
      session: { user: { email: "carmen@example.com", id: "user_1", name: "Carmen", role: "customer" } },
      status: "ready",
    });
    mocks.completeForcedPasswordChange.mockRejectedValue(new Error("upstream failure"));

    await expect(setTemporaryPasswordAction(formData())).rejects.toThrow("redirect:/account/set-password?error=service");
  });

  it("returns through the Clerk-backed account continuation check after setting the password", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({
      session: { user: { email: "carmen@example.com", id: "user_1", name: "Carmen", role: "customer" } },
      status: "ready",
    });
    mocks.completeForcedPasswordChange.mockResolvedValue(undefined);

    await expect(setTemporaryPasswordAction(formData())).rejects.toThrow("redirect:/account/continue");
  });
});
