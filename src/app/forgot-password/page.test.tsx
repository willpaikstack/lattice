import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ForgotPasswordPage from "./page";

describe("Forgot password page", () => {
  it("presents a reset request form", async () => {
    render(await ForgotPasswordPage({}));

    expect(screen.getByRole("heading", { name: "Forgot password" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Forgot password form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
    expect(screen.getByRole("button", { name: "Send reset instructions" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });

  it("shows the sent confirmation without exposing account existence", async () => {
    render(await ForgotPasswordPage({ searchParams: Promise.resolve({ status: "sent" }) }));

    expect(screen.getByText("If that account exists, reset instructions have been sent.")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Forgot password form" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
  });
});
