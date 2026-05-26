import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "./page";

describe("Landing page", () => {
  it("presents the invite-only entry points", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Lattice" })).toBeInTheDocument();
    expect(screen.getByText("Invite-only manufacturing procurement")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Join waiting list" })).toHaveAttribute(
      "href",
      "mailto:hello@latticeos.com?subject=Join%20the%20Lattice%20waiting%20list",
    );
  });
});
