import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksPage from "./page";

describe("How it works page", () => {
  it("explains the invite-only workflow without exposing a public RFQ action", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { name: "How Lattice works" })).toBeInTheDocument();
    expect(screen.getByText("01 · The problem")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demand is growing faster than shop capacity." })).toBeInTheDocument();
    expect(screen.getByText("02 · The solution")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lattice bridges the gap." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How the workflow works" })).toBeInTheDocument();
    expect(screen.getByText("Share the work that needs coverage")).toBeInTheDocument();
    expect(screen.getAllByText("Review before shipment").length).toBeGreaterThan(0);
    for (const requestAccountLink of screen.getAllByRole("link", { name: "Request an account" })) {
      expect(requestAccountLink).toHaveAttribute("href", "/waiting-list");
    }
    expect(screen.queryByRole("link", { name: /quote/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The problem" })).toHaveAttribute("href", "#problem");
    expect(screen.getByRole("link", { name: "The solution" })).toHaveAttribute("href", "#solution");
  });
});
