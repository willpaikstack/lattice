import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EquipmentExplorer } from "./equipment-explorer";
import { getEquipmentExplorerData } from "@/lib/equipment-explorer-data";

const equipment = getEquipmentExplorerData();
describe("EquipmentExplorer", () => {
  it("browses, searches, exposes evidence and recovers from empty results", () => {
    render(<EquipmentExplorer equipment={equipment} />);
    expect(screen.getAllByRole("article")).toHaveLength(12);
    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Hermle C400" } });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Specifications & sources" }));
    const evidence = screen.getByRole("region", { name: /Hermle C400 specifications and sources/ });
    expect(within(evidence).getByText(/EQ-[A-F0-9]{8}/)).toBeInTheDocument();
    expect(within(evidence).getByRole("heading", { name: "Public technical references" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "impossible-model" } });
    expect(screen.getByText("No equipment matches these filters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show all equipment" }));
    expect(screen.getByRole("heading", { name: "All network equipment" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Turning/ }));
    expect(screen.getAllByRole("article")).toHaveLength(11);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
  it("paginates and resets the page when filters change", () => {
    Element.prototype.scrollIntoView = vi.fn();
    render(<EquipmentExplorer equipment={equipment} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Showing 13–24 of 76")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "5-axis" } });
    expect(screen.getByText(/Showing 1–12/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Public technical reference"));
    for (const article of screen.getAllByRole("article")) {
      fireEvent.click(within(article).getByRole("button", { name: "Specifications & sources" }));
      expect(within(article).getByRole("heading", { name: "Public technical references" })).toBeInTheDocument();
    }
  });
});
