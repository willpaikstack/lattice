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
    expect(screen.getByRole("link", { name: "Capabilities" })).toHaveAttribute("href", "/capabilities");
    expect(screen.getByRole("link", { name: "Materials" })).toHaveAttribute("href", "/materials");
    expect(screen.getByRole("link", { name: "Quality" })).toHaveAttribute("href", "/quality-documentation");
    expect(screen.getByRole("link", { name: "Start your quote" })).toHaveAttribute("href", "/simple-quote");
    expect(screen.getByRole("heading", { name: "Quality you can verify." })).toBeInTheDocument();
  });
});
