import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "./page";

describe("Landing page", () => {
  it("presents the invite-only entry points", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Lattice OS" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Request access" })).toHaveAttribute(
      "href",
      "/waiting-list",
    );
  });
});
