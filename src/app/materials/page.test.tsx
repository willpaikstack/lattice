import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MaterialsPage from "./page";

describe("MaterialsPage", () => {
  it("renders the Bubble-style material catalog intro and stainless grade sub-cards", () => {
    render(<MaterialsPage />);

    expect(screen.getByRole("heading", { name: "Material Catalog" })).toBeInTheDocument();
    expect(screen.getByText(/consolidated purchasing power/)).toBeInTheDocument();
    expect(screen.getByText("The result:")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Stainless steel/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /Mild steel/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("heading", { name: "SS 304" })).toBeInTheDocument();
    expect(screen.getByText("S31600")).toBeInTheDocument();
    expect(screen.getByText("Common Specs: ASTM B169")).toBeInTheDocument();
    expect(screen.getByLabelText("Stainless steel grouped material grades")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "300 series austenitic" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Duplex and super duplex" })).toBeInTheDocument();
    expect(screen.queryByText("Common grades / modes")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Request Quote" })).not.toBeInTheDocument();
  });

  it("lets each material category expand to show researched grade cards", () => {
    render(<MaterialsPage />);

    const mildSteelButton = screen.getByRole("button", { name: /Mild steel/ });

    expect(mildSteelButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "ASTM A36" })).not.toBeInTheDocument();

    fireEvent.click(mildSteelButton);

    expect(mildSteelButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Mild steel grade cards")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ASTM A36" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AISI 1018" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "AISI 1020" })).toBeInTheDocument();
    expect(screen.getAllByText("Common Specs: ASTM A108 / ASTM A29").length).toBeGreaterThanOrEqual(1);
  });

  it("renders imported material grades inside customer-facing material cards without vendor labels", () => {
    render(<MaterialsPage />);

    expect(screen.queryByRole("heading", { name: "Vendor material offerings" })).not.toBeInTheDocument();
    expect(screen.queryByText("Source-tracked coverage")).not.toBeInTheDocument();
    expect(screen.queryByText("Saky Steel")).not.toBeInTheDocument();
    expect(screen.queryByText("Tianjin ZYTC Alloy Technology Co., Ltd")).not.toBeInTheDocument();
    expect(screen.queryByText("Zintilon")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Plastics \/ polymers/ }));
    expect(screen.getByText("PPS+40%GF")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Inconel\/Incoloy/ }));
    expect(screen.getByText("MP35N")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Titanium/ }));
    expect(screen.getByText("Grade 5 / 6Al-4V")).toBeInTheDocument();
  });
});
