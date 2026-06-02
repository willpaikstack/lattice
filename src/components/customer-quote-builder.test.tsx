import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildDraftRequest, submitDraftRequest } from "../lib/request-model";
import { buildCustomerQuoteInputFromRequest } from "../lib/quote-file";

import { CustomerQuoteBuilder } from "./customer-quote-builder";

describe("CustomerQuoteBuilder", () => {
  it("renders editable quote inputs and generated customer preview", () => {
    render(<CustomerQuoteBuilder />);

    expect(screen.getByLabelText("Quote number")).toHaveDisplayValue("LQ-2026-0142");
    expect(screen.getByLabelText("Customer company")).toHaveDisplayValue("Apex Robotics");
    expect(screen.getByText("$2,300.00")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue(/# Quote LQ-2026-0142/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "50" } });

    expect(screen.getByText("$4,600.00")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue(/50 \| \$92.00 \| \$4,600.00/).length).toBeGreaterThan(0);
  });

  it("adds a second line item", () => {
    render(<CustomerQuoteBuilder />);

    fireEvent.click(screen.getByRole("button", { name: "Add line" }));

    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("can start from an existing RFQ package", () => {
    const request = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Hydrogen skid bracket RFQ",
        process: "CNC milling",
        dueDate: "2026-06-20",
        lineItems: [{ partName: "Mounting bracket", quantity: 24, material: "6061-T6 Aluminum", surfaceFinish: "As machined" }],
        files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
      }),
    );

    render(<CustomerQuoteBuilder initialQuote={buildCustomerQuoteInputFromRequest(request)} requestId={request.id} saveAction={() => undefined} />);

    expect(screen.getByLabelText("Customer company")).toHaveDisplayValue("Amogy Manufacturing");
    expect(screen.getByLabelText("Customer contact")).toHaveDisplayValue("William Paik");
    expect(screen.getByLabelText("Project / RFQ")).toHaveDisplayValue("Hydrogen skid bracket RFQ");
    expect(screen.getByLabelText("Part / description")).toHaveDisplayValue("Mounting bracket");
    expect(screen.getByLabelText("Quantity")).toHaveDisplayValue("24");
    expect(screen.getByLabelText("Files reviewed")).toHaveDisplayValue("mounting-bracket.step");
    expect(screen.getByText(`Linked RFQ: ${request.id}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save to RFQ" })).toBeInTheDocument();
  });
});
