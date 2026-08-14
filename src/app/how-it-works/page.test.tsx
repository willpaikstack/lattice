import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksPage from "./page";

describe("How it works page", () => {
  it("explains the invite-only workflow without exposing a public RFQ action", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { name: "How Lattice works" })).toBeInTheDocument();
    expect(screen.getByText(/Lattice gives domestic manufacturers access to qualified global production capacity/i)).toBeInTheDocument();
    expect(screen.getByText("01 · The problem")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demand is growing faster than shop capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "More customer demand. Not enough productive capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Global capacity exists. Making it trustworthy is the hard part." })).toBeInTheDocument();
    expect(screen.getByText("02 · The solution")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "You keep control of the requirements. Lattice manages the supply chain." })).toBeInTheDocument();
    expect(screen.getByText(/Your drawings, specifications, material requirements, inspection requirements, and delivery expectations define the job/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How the workflow works" })).toBeInTheDocument();
    expect(screen.getByText(/cannot fit the schedule or available capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/Finding an overseas machine shop is easy. Qualifying the right supplier/i)).toBeInTheDocument();
    expect(screen.getByText(/Lattice handles the work required to make global capacity usable/i)).toBeInTheDocument();
    expect(screen.getByText("Share the work that needs coverage")).toBeInTheDocument();
    expect(screen.getAllByText("Review before shipment").length).toBeGreaterThan(0);
    for (const requestAccountLink of screen.getAllByRole("link", { name: "Request an account" })) {
      expect(requestAccountLink).toHaveAttribute("href", "/waiting-list");
    }
    expect(screen.queryByRole("link", { name: /quote/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The problem" })).toHaveAttribute("href", "#problem");
    expect(screen.getByRole("link", { name: "The solution" })).toHaveAttribute("href", "#solution");

    const capacityConstraints = screen.getByText(/cannot fit the schedule or available capacity/i);
    const sustainedDemand = screen.getByText(/Domestic manufacturers are seeing sustained demand/i);
    expect(screen.getByText("Lattice was built to give shops another option.")).toHaveClass("font-semibold");
    expect(screen.getByText(/Skilled machinists are difficult to hire, new employees take time to train/i)).toBeInTheDocument();
    expect(capacityConstraints.compareDocumentPosition(sustainedDemand) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  });
});
