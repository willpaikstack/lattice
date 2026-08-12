import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MaterialFamilyPage from "./page";

describe("MaterialFamilyPage", () => {
  it("renders the selected Aluminum guide and its full catalog", async () => {
    const page = await MaterialFamilyPage({ params: Promise.resolve({ slug: "aluminum" }) });
    render(page);

    expect(screen.getByRole("heading", { level: 1, name: "Aluminum" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Materials/Aluminum");
    expect(screen.getByAltText("Aluminum round bar, plate, and a precision CNC-machined housing")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request aluminum parts" })).toHaveAttribute("href", "/requests/new");
    expect(screen.getByRole("heading", { name: "6061-T6" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "7075-T6" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "5052-H32" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2024-T3" })).toBeInTheDocument();
    expect(screen.getAllByText("Reference properties")).toHaveLength(4);
    expect(screen.getByText("T6 / T651 typical · 20°C")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Source" })[0]).toHaveAttribute("href", expect.stringContaining("6061-T6"));
    expect(screen.getByRole("link", { name: /View all 21 offerings/ })).toHaveAttribute("href", "#all-grades");
    expect(screen.getByRole("heading", { name: "All aluminum offerings" })).toBeInTheDocument();
  });

  it("uses the shared grade directory for non-aluminum families", async () => {
    const page = await MaterialFamilyPage({ params: Promise.resolve({ slug: "brass" }) });
    render(page);

    expect(screen.getByRole("heading", { name: "All brass grades" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Free-machining brass/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText("Available brass designations in this group; exact specification is confirmed during RFQ review.")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Brass 360/ })).toHaveTextContent("Good");
  });

  it("uses a functional-trait disclosure for both common and directory plastic grades", async () => {
    const page = await MaterialFamilyPage({ params: Promise.resolve({ slug: "plastics-polymers" }) });
    render(page);

    expect(screen.getByRole("heading", { level: 1, name: "Plastics / polymers" })).toBeInTheDocument();
    expect(screen.queryByText("Reference properties")).not.toBeInTheDocument();
    expect(screen.getAllByText("Behavior details").length).toBeGreaterThan(4);
    expect(screen.getAllByText("Behavior details").every((trigger) => !trigger.closest("details")?.open)).toBe(true);
    expect(screen.queryByText("Typical applications")).not.toBeInTheDocument();
    expect(screen.getByText(/confirm the specific resin grade and data sheet during RFQ/i)).toBeInTheDocument();
  });
});
