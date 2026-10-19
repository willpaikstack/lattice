import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ signedInRecoveryEmail: vi.fn() }));
vi.mock("@/lib/password-reset-identity", () => ({ signedInRecoveryEmail: mocks.signedInRecoveryEmail }));

import ForgotPasswordPage from "./page";

describe("Forgot password page", () => {
  beforeEach(() => mocks.signedInRecoveryEmail.mockResolvedValue(null));
  it("presents a reset request form", async () => {
    render(await ForgotPasswordPage({}));

    expect(screen.getByRole("heading", { name: "Reset your password" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Forgot password form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
    expect(screen.getByRole("button", { name: "Send reset instructions" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });

  it("shows the sent confirmation without exposing account existence", async () => {
    render(await ForgotPasswordPage({ searchParams: Promise.resolve({ status: "sent" }) }));

    expect(screen.getByText("If that account exists, reset instructions are on the way.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Forgot password form" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Try another email" })).toHaveAttribute("href", "/forgot-password");
  });

  it("locks signed-in recovery to the verified account email despite a different query email", async () => {
    mocks.signedInRecoveryEmail.mockResolvedValue("owner@example.com");
    render(await ForgotPasswordPage({ searchParams: Promise.resolve({ email: "other@example.com" }) }));
    expect(screen.getByLabelText("Email")).toHaveValue("owner@example.com");
    expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
    expect(screen.queryByRole("link", { name: "Try another email" })).not.toBeInTheDocument();
  });
});
