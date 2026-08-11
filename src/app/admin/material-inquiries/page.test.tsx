import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/material-inquiries", () => ({
  listMaterialInquiries: vi.fn(async () => [
    {
      company: "ForgeWorks",
      createdAt: "2026-08-11T12:00:00.000Z",
      id: "inquiry-1",
      intendedUse: "Medical casting",
      materialName: "Cobalt chrome",
      notes: "ASTM documentation required.",
      operatorNotes: "",
      quantity: "250 annually",
      requesterEmail: "buyer@forgeworks.com",
      requesterName: "Avery Chen",
      specification: "ASTM F75",
      status: "NEW",
      stockForm: "Casting",
      updatedAt: "2026-08-11T12:00:00.000Z",
    },
  ]),
  updateMaterialInquiry: vi.fn(),
}));

import AdminMaterialInquiriesPage from "./page";

describe("AdminMaterialInquiriesPage", () => {
  it("presents submitted inquiries with a review workflow", async () => {
    render(await AdminMaterialInquiriesPage());

    expect(screen.getByRole("heading", { name: "Material inquiries" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cobalt chrome" })).toBeInTheDocument();
    expect(screen.getByText("ASTM F75")).toBeInTheDocument();
    expect(screen.getByLabelText("Workflow status")).toHaveValue("NEW");
    expect(screen.getByLabelText("Internal sourcing notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save review" })).toHaveAttribute("type", "submit");
  });
});
