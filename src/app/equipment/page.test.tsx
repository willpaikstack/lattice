import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EquipmentPage from "./page";

describe("EquipmentPage", () => {
  it("renders the vendor equipment list with customer-facing machine details", () => {
    render(<EquipmentPage />);

    expect(screen.getByRole("heading", { name: "Vendor Equipment" })).toBeInTheDocument();
    expect(screen.getByText("155")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("56")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CNC Milling" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CNC Lathe" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "QC & Inspection" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Manual Machines" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sheet Metal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Finishing" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Search").length).toBe(6);
    expect(screen.getAllByLabelText("Sort").length).toBe(6);
    expect(screen.getByRole("button", { name: "5-axis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Laser cutting" })).toBeInTheDocument();
    expect(screen.getByText("Hermle C650")).toBeInTheDocument();
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.getByText("Iron 25 mm; aluminum 16 mm; stainless 20 mm; copper/brass within 12 mm")).toBeInTheDocument();
    expect(screen.getByText("1050 x 900 x 600 mm")).toBeInTheDocument();
    expect(screen.getByText("ZEISS ACCURA 9/16/8")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended additional sections" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welding & Joining" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Image source" }).length).toBeGreaterThan(1);
    expect(screen.getAllByRole("link", { name: /Open .* machine page/ }).length).toBeGreaterThan(1);
    expect(screen.getByRole("link", { name: "Start an RFQ" })).toHaveAttribute("href", "/requests/new");
  });

  it("filters and sorts equipment within each section", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });

    fireEvent.change(within(millingSection).getByLabelText("Search"), { target: { value: "Hermle C650" } });

    expect(within(millingSection).getByText("Hermle C650")).toBeInTheDocument();
    expect(within(millingSection).queryByText("Hermle C400")).not.toBeInTheDocument();
    expect(within(millingSection).getByText("1 of 32 unique make/model cards")).toBeInTheDocument();

    fireEvent.change(within(millingSection).getByLabelText("Search"), { target: { value: "" } });
    fireEvent.click(within(millingSection).getByRole("button", { name: "Large envelope" }));

    expect(within(millingSection).getByText("KMC KMC1250")).toBeInTheDocument();
    expect(within(millingSection).queryByText("Hermle C250")).not.toBeInTheDocument();
  });
});
