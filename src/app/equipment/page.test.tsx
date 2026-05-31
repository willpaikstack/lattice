import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EquipmentPage from "./page";

describe("EquipmentPage", () => {
  it("renders the vendor equipment list with customer-facing machine details", () => {
    render(<EquipmentPage />);

    expect(screen.getByRole("heading", { name: "Vendor Equipment" })).toBeInTheDocument();
    expect(screen.getByText("Your Resources")).toBeInTheDocument();
    expect(screen.queryByText("Production machines")).not.toBeInTheDocument();
    expect(screen.queryByText("Sheet metal equipment")).not.toBeInTheDocument();
    expect(screen.queryByText("ZEISS CMMs")).not.toBeInTheDocument();
    expect(screen.queryByText("Unique equipment cards")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CNC Milling" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "CNC Lathe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "QC & Inspection" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Manual Machines" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sheet Metal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Finishing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "EDM" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Die Casting" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Additive Manufacturing" })).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Search")).toHaveLength(1);
    expect(screen.getAllByLabelText("Sort")).toHaveLength(1);
    expect(screen.getByRole("navigation", { name: "Equipment sections" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CNC Milling" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sheet Metal" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "5-axis" })).toBeInTheDocument();
    expect(screen.getByText("Hermle C650")).toBeInTheDocument();
    expect(screen.queryByText("Dazu MPS3015C 6000W")).not.toBeInTheDocument();
    expect(screen.queryByText("ZEISS ACCURA 9/16/8")).not.toBeInTheDocument();
    expect(screen.queryByText("SLA450 / SLA600 / SLA800 / SLA1400 / SLA9400 fleet")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sheet Metal" }));

    expect(screen.getByRole("button", { name: "CNC Milling" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Sheet Metal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Sheet Metal" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "CNC Milling" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Laser cutting" })).toBeInTheDocument();
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.queryByText("Hermle C650")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "CNC Milling" }));

    expect(screen.queryByRole("heading", { name: "Coverage notes" })).not.toBeInTheDocument();
    expect(screen.getByText("Verified Machine")).toBeInTheDocument();
    expect(screen.getByText("Supplier Data Sheet")).toBeInTheDocument();
    expect(screen.getByText("Source / Provenance")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Jingdiao JDGR200T high-speed machining center/ })).toHaveAttribute("href", "https://en.jingdiao.com/resource/JDGR/JDGR200T.pdf");
    expect(screen.getByRole("link", { name: "View machine on manufacturer site" })).toHaveAttribute("href", "https://en.jingdiao.com/machines/high-speed-machining-centers/5-axis-series/jdgr200t");
    expect(screen.queryByRole("heading", { name: "Need a process match?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start an RFQ" })).not.toBeInTheDocument();
  });

  it("filters and sorts equipment within each section", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });

    fireEvent.change(within(millingSection).getByLabelText("Search"), { target: { value: "Hermle C650" } });

    expect(within(millingSection).getByText("Hermle C650")).toBeInTheDocument();
    expect(within(millingSection).queryByText("Hermle C400")).not.toBeInTheDocument();
    expect(within(millingSection).getByText("1 of 36 unique make/model cards")).toBeInTheDocument();

    fireEvent.change(within(millingSection).getByLabelText("Search"), { target: { value: "" } });
    fireEvent.click(within(millingSection).getByRole("button", { name: "Large envelope" }));

    expect(within(millingSection).getByText("KMC KMC1250")).toBeInTheDocument();
    expect(within(millingSection).queryByText("Hermle C250")).not.toBeInTheDocument();
  });

  it("toggles machine details inside a compact equipment row", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });

    fireEvent.change(within(millingSection).getByLabelText("Search"), { target: { value: "Hermle C650" } });

    expect(within(millingSection).getByText("Hermle C650")).toBeInTheDocument();

    fireEvent.click(within(millingSection).getByRole("button", { name: "View Hermle C650 details" }));

    expect(within(millingSection).getByText("Work Envelope")).toBeInTheDocument();
    expect(within(millingSection).getByRole("button", { name: "Hide Hermle C650 details" })).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(within(millingSection).getByRole("button", { name: "Hide Hermle C650 details" }));

    expect(within(millingSection).getByRole("button", { name: "View Hermle C650 details" })).toHaveAttribute("aria-expanded", "false");
  });
});
