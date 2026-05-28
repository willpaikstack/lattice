import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoginPage from "./page";

describe("Login page", () => {
  it("presents an invite-only login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Log in form" })).toHaveAttribute("action", "/dashboard");
    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Continue" })).toHaveAttribute("type", "submit");
    expect(screen.getByRole("link", { name: "Join the waiting list" })).toHaveAttribute(
      "href",
      "/waiting-list",
    );
  });
});
