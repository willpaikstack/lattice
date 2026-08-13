import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksPage from "./page";

describe("How it works page", () => {
  it("explains the invite-only workflow without exposing a public RFQ action", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { name: "How Lattice extends your capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From overflow to delivery, in four clear steps." })).toBeInTheDocument();
    expect(screen.getByText("Share the work that needs coverage")).toBeInTheDocument();
    expect(screen.getByText("Review before shipment")).toBeInTheDocument();
    for (const requestAccountLink of screen.getAllByRole("link", { name: "Request an account" })) {
      expect(requestAccountLink).toHaveAttribute("href", "/waiting-list");
    }
    expect(screen.queryByRole("link", { name: /quote/i })).not.toBeInTheDocument();
  });
});
