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
    expect(screen.getByRole("navigation", { name: "Equipment sections" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CNC Milling 32" })).toHaveAttribute("href", "#cnc-milling");
    expect(screen.getByRole("button", { name: "5-axis" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Laser cutting" })).toBeInTheDocument();
    expect(screen.getByText("Hermle C650")).toBeInTheDocument();
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.getByText("ZEISS ACCURA 9/16/8")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Image source" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /View .* details/ })[0]);

    expect(screen.getByRole("heading", { name: "Coverage notes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welding & Joining" })).toBeInTheDocument();
    expect(screen.getByText("Supplier data sheets")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Jingdiao JDGR200T high-speed machining center/ })).toHaveAttribute("href", "https://en.jingdiao.com/resource/JDGR/JDGR200T.pdf");
    expect(screen.getAllByRole("link", { name: "Image source" }).length).toBe(1);
    expect(screen.getAllByRole("link", { name: /Open .* machine page/ }).length).toBe(1);
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

  it("toggles machine details inside a compact equipment row", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });

    fireEvent.change(within(millingSection).getByLabelText("Search"), { target: { value: "Hermle C650" } });

    expect(within(millingSection).queryByText("1050 x 900 x 600 mm")).not.toBeInTheDocument();

    fireEvent.click(within(millingSection).getByRole("button", { name: "View Hermle C650 details" }));

    expect(within(millingSection).getByText("1050 x 900 x 600 mm")).toBeInTheDocument();
    expect(within(millingSection).getByRole("button", { name: "Hide Hermle C650 details" })).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(within(millingSection).getByRole("button", { name: "Hide Hermle C650 details" }));

    expect(within(millingSection).queryByText("1050 x 900 x 600 mm")).not.toBeInTheDocument();
  });
});
