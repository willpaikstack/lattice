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
    expect(screen.queryByText("Common grades / modes")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Request Quote" })).not.toBeInTheDocument();
  });

  it("lets each material category expand to show its material types", () => {
    render(<MaterialsPage />);

    const mildSteelButton = screen.getByRole("button", { name: /Mild steel/ });

    expect(mildSteelButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("heading", { name: "A36" })).not.toBeInTheDocument();

    fireEvent.click(mildSteelButton);

    expect(mildSteelButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Mild steel material types")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "A36" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1018" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1020" })).toBeInTheDocument();
  });
});
