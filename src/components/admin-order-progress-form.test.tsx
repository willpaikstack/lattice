import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildDraftRequest, submitDraftRequest, type LatticeRequest } from "@/lib/request-model";

import { AdminOrderProgressForm } from "./admin-order-progress-form";

function makeOrder(): LatticeRequest {
  const request = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Acme Manufacturing",
      dueDate: "2026-08-20",
      files: [{ name: "bracket.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [{ material: "6061 Aluminum", partName: "Bracket", quantity: 8 }],
      process: "CNC milling",
      requesterName: "Buyer",
      title: "Bracket production order",
    }),
  );

  return {
    ...request,
    status: "PURCHASED",
    operatorReview: { ...request.operatorReview, assignedOwner: "Adam" },
    supplierOrder: {
      ...request.supplierOrder,
      nextMilestone: "Carrier pickup",
      nextMilestoneDate: "2026-08-04",
      responsibleParty: "Lattice",
      status: "READY_TO_SHIP",
    },
  };
}

describe("AdminOrderProgressForm", () => {
  it("shows lifecycle context, customer preview, and conditional shipping fields", () => {
    render(<AdminOrderProgressForm order={makeOrder()} updateAction={vi.fn()} />);

    const publishButton = screen.getByRole("button", { name: "Publish update" });
    expect(screen.getByRole("list", { name: "Order lifecycle" })).toBeInTheDocument();
    expect(screen.getByText("Customer preview")).toBeInTheDocument();
    expect(publishButton).toBeDisabled();
    expect(screen.queryByLabelText("Tracking number")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "SHIPPED" } });

    expect(screen.getByDisplayValue("Customer delivery")).toBeInTheDocument();
    expect(screen.getByLabelText("Tracking number")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Customer update"), {
      target: { value: "The order has shipped and tracking is now available." },
    });

    expect(publishButton).toBeEnabled();
    expect(within(screen.getByRole("region", { name: "Customer preview" })).getByText("The order has shipped and tracking is now available.")).toBeInTheDocument();
  });

  it("hides the next milestone fields when delivery is complete", () => {
    render(<AdminOrderProgressForm order={makeOrder()} updateAction={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "DELIVERED" } });

    expect(screen.queryByLabelText("Next milestone")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Expected date")).not.toBeInTheDocument();
    expect(screen.getByText("Order delivered")).toBeInTheDocument();
  });
});
