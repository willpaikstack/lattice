import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LandingPage from "./page";

describe("Landing page", () => {
  it("presents the quote-first public entry points", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: "More capacity. The same quality standard.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    for (const link of screen.getAllByRole("link", { name: "Get a quote" })) {
      expect(link).toHaveAttribute("href", "/simple-quote");
    }
    for (const label of ["Capabilities", "Materials", "Quality", "How it works"]) {
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
      expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Start your quote" })).toHaveAttribute("href", "/simple-quote");
    expect(screen.getByRole("heading", { name: "Quality you can verify." })).toBeInTheDocument();
  });
});
