import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginPanel } from "@/components/login-panel";
import LoginPage from "./page";

describe("Login page", () => {
  it("presents work email and password together in the sign in form", async () => {
    render(await LoginPage({}));

    expect(screen.getByRole("heading", { name: "Sign in to Lattice" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Sign in form" })).toBeInTheDocument();
    expect(screen.getByLabelText("Work email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Request an invite" })).toHaveAttribute(
      "href",
      "/waiting-list",
    );
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "mailto:support@latticeos.co");
  });

  it("shows an error for invalid credentials", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ error: "invalid-credentials" }) }));

    expect(screen.getByRole("alert")).toHaveTextContent("The email or password is incorrect");
  });

  it("preserves a safe next path for password login", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ email: "will@latticeos.co", next: "/admin/vendors" }) }));

    expect(screen.getByDisplayValue("/admin/vendors")).toHaveAttribute("name", "next");
  });

  it("routes a configured Workspace domain to its SSO method", () => {
    render(
      <LoginPanel
        initialEmail="buyer@acme.com"
        initialErrorMessage=""
        next="/quotes"
        ssoEnabled
      />,
    );

    expect(screen.getByRole("link", { name: "Continue with Google Workspace" })).toHaveAttribute(
      "href",
      "/api/auth/google?email=buyer%40acme.com&next=%2Fquotes",
    );
  });

  it("keeps password controls and recovery available without an intermediate step", () => {
    render(
      <LoginPanel
        initialEmail="will@latticeos.co"
        initialErrorMessage=""
        next="/dashboard"
        ssoEnabled={false}
      />,
    );

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password?email=will%40latticeos.co",
    );
  });
});
