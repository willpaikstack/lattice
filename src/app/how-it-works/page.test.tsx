import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksPage from "./page";

describe("How it works page", () => {
  it("explains the managed-capacity workflow without exposing a public RFQ action", () => {
    render(<HowItWorksPage />);

    expect(screen.getByRole("heading", { name: "How Lattice works" })).toBeInTheDocument();
    expect(screen.getByText(/Lattice gives domestic manufacturers access to qualified global production capacity/i)).toBeInTheDocument();
    expect(screen.getByText("01 · The problem")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Demand is growing faster than shop capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "More customer demand. Not enough productive capacity." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Global capacity exists. Making it trustworthy is the hard part." })).toBeInTheDocument();
    expect(screen.getByText("02 · The solution")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Add capacity without building it yourself." })).toBeInTheDocument();
    expect(screen.getByText(/Lattice gives manufacturers another production path when internal capacity is constrained/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "How the workflow works" })).toBeInTheDocument();
    expect(screen.getByText(/cannot fit the schedule or available capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/Finding a supplier is only the first step. Knowing whether it can consistently meet your drawings/i)).toBeInTheDocument();
    expect(screen.getByText(/Lattice handles the work required to make global capacity usable/i)).toBeInTheDocument();
    expect(screen.getByText("Demand exists. Customers are ready to buy. But the capacity to fulfill that demand does not.")).toHaveClass("font-semibold");
    expect(screen.getByText("You get access to additional capacity without having to build and manage an overseas supply chain yourself.")).toHaveClass("font-semibold");
    expect(screen.getByRole("heading", { name: "Send us the job" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "We build the supply plan" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "We manage production" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Review quality before shipment" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Start with predictable, lower-risk overflow work." })).toBeInTheDocument();
    expect(screen.getByText("More capacity")).toBeInTheDocument();
    expect(screen.getByText("One accountable partner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Global manufacturing shouldn't require building a global supply chain." })).toBeInTheDocument();
    expect(screen.getByText(/conducting factory audits, validating processes, managing quality, and navigating communication and logistics across borders/i)).toBeInTheDocument();
    expect(screen.getByText(/developed the operating discipline required to make it dependable/i)).toBeInTheDocument();
    for (const backlogLink of screen.getAllByRole("link", { name: "Talk to us about your backlog" })) {
      expect(backlogLink).toHaveAttribute("href", "/waiting-list");
    }
    expect(screen.queryByRole("link", { name: /quote/i })).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "On this page" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The problem" })).toHaveAttribute("href", "#problem");
    expect(screen.getByRole("link", { name: "The solution" })).toHaveAttribute("href", "#solution");
    expect(screen.getByRole("link", { name: "Good first job" })).toHaveAttribute("href", "#start-with");

    const capacityConstraints = screen.getByText(/cannot fit the schedule or available capacity/i);
    const expansionConstraints = screen.getByText(/Adding capacity is not simple/i);
    expect(capacityConstraints.compareDocumentPosition(expansionConstraints) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const firstJob = screen.getByRole("heading", { name: "Start with predictable, lower-risk overflow work." });
    const workflow = screen.getByRole("heading", { name: "How the workflow works" });
    expect(firstJob.compareDocumentPosition(workflow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const originStory = screen.getByRole("heading", { name: "Global manufacturing shouldn't require building a global supply chain." });
    const closingCta = screen.getByText("Have work you can't fit on the floor?");
    expect(originStory.compareDocumentPosition(closingCta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
