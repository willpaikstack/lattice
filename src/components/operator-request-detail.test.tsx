import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "../lib/request-model";

import { BuyerOrders } from "./buyer-orders";
import { BuyerQuoteDetail } from "./buyer-quote-detail";
import { BuyerQuotes } from "./buyer-quotes";
import { OperatorQueue } from "./operator-queue";
import { OperatorRequestDetail } from "./operator-request-detail";
import { SupplierOrderDetail } from "./supplier-order-detail";
import { SupplierOrders } from "./supplier-orders";

function makeSubmittedRequest() {
  return submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Hydrogen skid bracket RFQ",
      process: "CNC milling",
      dueDate: "2026-06-20",
      lineItems: [
        {
          partName: "Mounting bracket",
          quantity: 24,
          material: "6061-T6 Aluminum",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined (Ra 3.2 µm / Ra 126 µin)",
          qualityDocumentation: ["Standard Inspection"],
          notes: "Include inspection report and deburr all edges.",
        },
      ],
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
    }),
  );
}

function makeQuotedRequest() {
  return applyOperatorStatusUpdate(makeSubmittedRequest(), {
    status: "QUOTED",
    assignedOwner: "Adam",
    internalNotes: "Ready for buyer review.",
    supplierPackageNotes: "Supplier package complete.",
    estimatedPriceCents: 182500,
    leadTimeDays: 15,
    quoteSummary: "Quoted at $1,825 with a 15 day lead time.",
  });
}

describe("OperatorQueue", () => {
  it("links each request to its operator review detail page", () => {
    const request = makeSubmittedRequest();

    render(<OperatorQueue requests={[request]} />);

    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", `/operator/requests/${request.id}`);
  });
});

describe("OperatorRequestDetail", () => {
  it("renders buyer intake, files, line items, and the review checklist", () => {
    render(<OperatorRequestDetail request={makeSubmittedRequest()} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByText("Amogy Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("William Paik")).toBeInTheDocument();
    expect(screen.getAllByText("Mounting bracket").length).toBeGreaterThan(0);
    expect(screen.getByText(/6061-T6 Aluminum/)).toBeInTheDocument();
    expect(screen.getByText(/ISO 2768 Medium/)).toBeInTheDocument();
    expect(screen.getByText(/Quality docs: Standard Inspection/)).toBeInTheDocument();
    expect(screen.getByText("mounting-bracket.step")).toBeInTheDocument();
    expect(screen.getByText("Confirm every CAD/drawing file is readable and matched to a line item.")).toBeInTheDocument();
    expect(screen.getByText("Save review decision")).toBeDisabled();
    expect(screen.getByLabelText("Assigned owner")).toBeInTheDocument();
    expect(screen.getByLabelText("Estimated quote price")).toBeInTheDocument();
    expect(screen.getByLabelText("Lead time days")).toBeInTheDocument();
    expect(screen.getByText(/No supplier package notes yet/)).toBeInTheDocument();
  });
});

describe("BuyerQuotes", () => {
  it("renders submitted RFQs as buyer quote tracker rows", () => {
    const request = makeSubmittedRequest();

    render(<BuyerQuotes requests={[request]} />);

    expect(screen.getByRole("link", { name: "Hydrogen skid bracket RFQ" })).toHaveAttribute("href", `/quotes/${request.id}`);
    expect(screen.getByText("Submitted")).toBeInTheDocument();
    expect(screen.getByText(/Your RFQ was received/)).toBeInTheDocument();
    expect(screen.getByText(/Mounting bracket/)).toBeInTheDocument();
  });
});

describe("BuyerQuoteDetail", () => {
  it("renders priced quote details and enables purchase conversion", () => {
    render(<BuyerQuoteDetail request={makeQuotedRequest()} purchaseAction={() => undefined} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByText("$1,825.00")).toBeInTheDocument();
    expect(screen.getByText("15 days")).toBeInTheDocument();
    expect(screen.getByText("Quoted at $1,825 with a 15 day lead time.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convert to Order" })).toBeEnabled();
  });
});

describe("BuyerOrders", () => {
  it("renders purchased quotes as order rows", () => {
    render(<BuyerOrders orders={[{ ...makeQuotedRequest(), status: "PURCHASED" }]} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByText("$1,825.00")).toBeInTheDocument();
    expect(screen.getByText(/Awaiting supplier acknowledgment/)).toBeInTheDocument();
  });
});

describe("SupplierOrders", () => {
  it("links purchased orders to the supplier management page", () => {
    const order = { ...makeQuotedRequest(), status: "PURCHASED" as const };

    render(<SupplierOrders orders={[order]} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute("href", `/supplier/orders/${order.id}`);
    expect(screen.getByText("Awaiting acknowledgment")).toBeInTheDocument();
  });
});

describe("SupplierOrderDetail", () => {
  it("renders production controls, package details, and document/timeline sections", () => {
    render(<SupplierOrderDetail order={{ ...makeQuotedRequest(), status: "PURCHASED" }} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByLabelText("Production status")).toBeInTheDocument();
    expect(screen.getByLabelText("Document type")).toBeInTheDocument();
    expect(screen.getByText("Supplier package complete.")).toBeInTheDocument();
    expect(screen.getByText(/Required docs: Standard Inspection/)).toBeInTheDocument();
    expect(screen.getByText("Save supplier update")).toBeDisabled();
  });
});
