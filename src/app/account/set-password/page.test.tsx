import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPasswordSetupState: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  getPasswordSetupState: mocks.getPasswordSetupState,
}));

vi.mock("./actions", () => ({
  setTemporaryPasswordAction: vi.fn(),
}));

import SetPasswordPage from "./page";

describe("SetPasswordPage", () => {
  beforeEach(() => {
    mocks.getPasswordSetupState.mockReset();
  });

  it("renders password fields only for a provisioned account with an active temporary password", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({
      session: { user: { mustChangePassword: true } },
      status: "ready",
    });

    render(await SetPasswordPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Choose your password" })).toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save password and continue" })).toBeInTheDocument();
  });

  it("shows a recovery explanation instead of redirecting an unprovisioned user", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({ status: "not-provisioned" });

    render(await SetPasswordPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Your account is not provisioned" })).toBeInTheDocument();
    expect(screen.getByText(/has not been granted access/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign out" })).toHaveAttribute("href", "/api/logout");
  });

  it("explains when the temporary password has expired", async () => {
    mocks.getPasswordSetupState.mockResolvedValue({ status: "expired" });

    render(await SetPasswordPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "Your temporary password expired" })).toBeInTheDocument();
    expect(screen.getByText(/issue a new password/i)).toBeInTheDocument();
  });
});
