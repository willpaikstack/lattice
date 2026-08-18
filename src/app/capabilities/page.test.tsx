import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CapabilitiesPage from "./page";

describe("CapabilitiesPage", () => {
  it("shows documented capability alongside production-environment proof", () => {
    const { container } = render(<CapabilitiesPage />);

    expect(screen.getByRole("heading", { name: "Fabrication capabilities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Built around real production environments." })).toBeInTheDocument();
    expect(screen.getByText(/inspection infrastructure Lattice can bring to support your production work/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Explore our capabilities." })).toBeInTheDocument();
    expect(screen.getByText("CNC milling")).toBeInTheDocument();
    expect(screen.getByText("CNC turning")).toBeInTheDocument();
    expect(screen.getByText("Network scale")).toBeInTheDocument();
    expect(screen.getByText("590+")).toBeInTheDocument();
    expect(screen.getByText("42,000 m²")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /press brake line/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Show An operator running a CNC machining center/i })).toBeInTheDocument();
    expect(screen.getByText("Inspection-ready production")).toBeInTheDocument();
    for (const iconName of ["multi-axis", "rotational-turning", "supporting-tools", "inspection-scan", "manufacturing-network"]) {
      expect(container.querySelector(`[data-capability-icon="${iconName}"] svg`)).toBeInTheDocument();
    }
    expect(screen.getByRole("img", { name: /coordinate-measuring-machine inspection laboratory/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /CNC machining centers arranged along a production-floor aisle/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Show A technician completing a sheet metal finishing operation/i }));
    const selectedHero = screen.getByRole("img", { name: /A technician completing a sheet metal finishing operation/i });
    expect(selectedHero).toBeInTheDocument();
    expect(selectedHero).toHaveAttribute("src", expect.stringContaining("finishing-detail.png"));
    expect(screen.queryByRole("link", { name: /Request access/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /How Lattice works/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Discuss a job/ })).not.toBeInTheDocument();
  });
});
