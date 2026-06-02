import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "./page";

describe("Login page", () => {
  it("presents an invite-only login form", async () => {
    render(await LoginPage({}));

    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Log in form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Email")).toHaveAttribute("name", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Password")).toHaveAttribute("name", "password");
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Request an invite" })).toHaveAttribute(
      "href",
      "/waiting-list",
    );
  });

  it("shows an error for invalid credentials", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ error: "invalid-credentials" }) }));

    expect(screen.getByText("The email or password is incorrect.")).toBeInTheDocument();
  });
});
