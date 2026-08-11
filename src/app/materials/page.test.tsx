import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MaterialsPage from "./page";

describe("MaterialsPage", () => {
  it("renders the family-first material atlas", () => {
    render(<MaterialsPage />);

    expect(screen.getByRole("heading", { name: "Materials" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by grade, alloy, or family")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Request an unlisted material/ })).toHaveAttribute("href", "/requests/new");
    expect(screen.getByLabelText("Material families")).toHaveClass("lg:grid-cols-3");
    expect(screen.getByRole("heading", { name: "Aluminum" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Aluminum 21 offerings/ })).toHaveAttribute("href", "/materials/aluminum");
    expect(screen.getByText("21 offerings")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Plastics / polymers" })).toBeInTheDocument();
    expect(screen.queryByText("View grades")).not.toBeInTheDocument();
  });

  it("filters families by grade as the buyer searches", () => {
    render(<MaterialsPage />);

    fireEvent.change(screen.getByPlaceholderText("Search by grade, alloy, or family"), { target: { value: "PEEK" } });

    expect(screen.getByRole("heading", { name: "Plastics / polymers" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Aluminum" })).not.toBeInTheDocument();
  });

});
