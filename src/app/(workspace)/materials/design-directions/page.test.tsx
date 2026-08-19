import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MaterialsDesignDirectionsPage from "./page";

describe("MaterialsDesignDirectionsPage", () => {
  it("renders three alternative materials page directions using catalog data", () => {
    render(<MaterialsDesignDirectionsPage />);

    expect(screen.getByRole("heading", { name: /Three directions for proving material supply/i })).toBeInTheDocument();
    expect(screen.getByText("Direction 01 / Network Proof")).toBeInTheDocument();
    expect(screen.getByText("Direction 02 / Spec Finder")).toBeInTheDocument();
    expect(screen.getByText("Direction 03 / Reliability Narrative")).toBeInTheDocument();
    expect(screen.getAllByText(/Stainless steel/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Inconel\/Incoloy/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Start RFQ/i })).toHaveAttribute("href", "/requests/new");
  });
});
