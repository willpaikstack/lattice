import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "../lib/request-model";

import { AdminQuoteManagement } from "./admin-quote-management";
import { BuyerOrders } from "./buyer-orders";
import { BuyerOrderDetail } from "./buyer-order-detail";
import { BuyerOrderHelp } from "./buyer-order-help";
import { BuyerQuoteDetail } from "./buyer-quote-detail";
import { BuyerQuoteCheckout } from "./buyer-quote-checkout";
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
    const request = makeSubmittedRequest();

    render(<OperatorRequestDetail request={request} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByText("Amogy Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("William Paik")).toBeInTheDocument();
    expect(screen.getAllByText("Mounting bracket").length).toBeGreaterThan(0);
    expect(screen.getByText(/6061-T6 Aluminum/)).toBeInTheDocument();
    expect(screen.getByText(/ISO 2768 Medium/)).toBeInTheDocument();
    expect(screen.getByText(/Quality docs: Standard Inspection/)).toBeInTheDocument();
    expect(screen.getAllByText("mounting-bracket.step").length).toBeGreaterThan(0);
    expect(screen.getByText("Confirm every CAD/drawing file is readable and matched to a line item.")).toBeInTheDocument();
    expect(screen.getByText("Save review decision")).toBeDisabled();
    expect(screen.getByLabelText("Assigned owner")).toBeInTheDocument();
    expect(screen.getByLabelText("Estimated quote price")).toBeInTheDocument();
    expect(screen.getByLabelText("Lead time days")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage quote submission" })).toHaveAttribute("href", "/admin/quotes");
    expect(screen.getByText(/No supplier package notes yet/)).toBeInTheDocument();
  });
});

describe("AdminQuoteManagement", () => {
  it("opens an RFQ command drawer with review controls and intake context", () => {
    const request = makeSubmittedRequest();

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "Open RFQ" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("RFQ command center")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByText("Review controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toHaveDisplayValue("Submitted");
    expect(screen.getByLabelText("Assigned owner")).toBeInTheDocument();
    expect(screen.getByLabelText("Customer quote summary")).toBeInTheDocument();
    expect(screen.getByText("Buyer intake")).toBeInTheDocument();
    expect(screen.getAllByText("mounting-bracket.step").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Save review decision" })).toBeEnabled();
  });

  it("opens quote issuance inside the admin command drawer", () => {
    const request = makeSubmittedRequest();

    render(<AdminQuoteManagement requests={[request]} saveQuoteAction={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "Issue quote" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Customer quote")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote number")).toHaveDisplayValue(/LQ-/);
    expect(screen.getByLabelText("Customer company")).toHaveDisplayValue("Amogy Manufacturing");
    expect(screen.getByRole("button", { name: "Save to RFQ" })).toBeInTheDocument();
  });
});

describe("BuyerQuotes", () => {
  it("renders submitted RFQs as buyer quote tracker rows", () => {
    const request = makeSubmittedRequest();

    render(<BuyerQuotes requests={[request]} />);

    expect(screen.getByRole("link", { name: "Open quote detail for Hydrogen skid bracket RFQ" })).toHaveAttribute("href", `/quotes/${request.id}`);
    expect(screen.getByText("Configuring Quote")).toBeInTheDocument();
    expect(screen.getByText(/Your RFQ was received/)).toBeInTheDocument();
    expect(screen.getByText(/Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByText(/6061-T6 Aluminum/)).toBeInTheDocument();
  });
});

describe("BuyerQuoteDetail", () => {
  it("renders priced quote details and enables purchase conversion", () => {
    const quotedRequest = makeQuotedRequest();
    const requestWithCustomerQuote = {
      ...quotedRequest,
      customerQuotes: [
        {
          id: "customer_quote_1",
          versionNumber: 1,
          quoteNumber: "LQ-1001",
          quoteDate: "2026-06-02",
          validUntil: "2026-06-16",
          customerCompany: quotedRequest.buyerCompany,
          customerContact: quotedRequest.requesterName,
          projectName: quotedRequest.title,
          preparedBy: "Lattice",
          leadTime: "15 business days",
          shipping: "Billed at actual",
          tax: "Not included",
          notes: "Saved customer quote notes.",
          assumptions: "CAD is latest revision.",
          clarifications: "",
          filesReviewed: "mounting-bracket.step",
          lineItems: [
            {
              id: "line_1",
              description: "Mounting bracket",
              process: "CNC milling",
              material: "6061-T6 Aluminum",
              finish: "As machined",
              quantity: 24,
              unitPrice: 76.0416666667,
            },
          ],
          totalCents: 182500,
          markdown: "# Quote LQ-1001",
          issuedAt: "2026-06-02T12:00:00.000Z",
        },
      ],
    };

    render(<BuyerQuoteDetail checkoutHref={`/quotes/${requestWithCustomerQuote.id}/checkout`} request={requestWithCustomerQuote} />);

    expect(screen.getByRole("heading", { name: "LQ-1001" })).toBeInTheDocument();
    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
    expect(screen.getAllByText("Quote Received").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$1,825.00").length).toBeGreaterThan(0);
    expect(screen.getByText("15 days (Standard)")).toBeInTheDocument();
    expect(screen.getByText("Saved customer quote notes.")).toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept quote" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Download quote PDF" })).toHaveAttribute("href", `/quotes/${requestWithCustomerQuote.id}/quote.pdf`);
    expect(screen.getByText("Quote activity")).toBeInTheDocument();
    expect(screen.getByText("Quote basis")).toBeInTheDocument();
    expect(screen.getByText(/Standard Inspection/)).toBeInTheDocument();
    expect(screen.getAllByText("mounting-bracket.step").length).toBeGreaterThan(0);
  });

  it("renders checkout fields before placing an order", () => {
    const quotedRequest = makeQuotedRequest();

    render(<BuyerQuoteCheckout request={quotedRequest} placeOrderAction={() => undefined} />);

    expect(screen.getByRole("heading", { name: /Checkout for/ })).toBeInTheDocument();
    expect(screen.getByText("Delivery address")).toBeInTheDocument();
    expect(screen.getByText("Shipping and import method")).toBeInTheDocument();
    expect(screen.getByText("Customs and compliance")).toBeInTheDocument();
    expect(screen.getByText("Payment and purchasing")).toBeInTheDocument();
    expect(screen.getByText("End use")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("PO-1047")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Place order/ })).toBeInTheDocument();
  });
});

describe("BuyerOrders", () => {
  it("links purchased quotes to buyer order detail pages", () => {
    const order = { ...makeQuotedRequest(), status: "PURCHASED" as const };

    render(<BuyerOrders orders={[order]} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View order details for Hydrogen skid bracket RFQ" })).toHaveAttribute("href", `/orders/${order.id}`);
    expect(screen.getByText("$1,825")).toBeInTheDocument();
    expect(screen.getAllByText(/Awaiting supplier acknowledgment/).length).toBeGreaterThan(0);
  });

  it("filters purchased orders by search text without status filter buttons", () => {
    const awaitingOrder = { ...makeQuotedRequest(), status: "PURCHASED" as const };
    const productionOrder = {
      ...makeQuotedRequest(),
      id: "production_order",
      status: "PURCHASED" as const,
      supplierOrder: {
        ...awaitingOrder.supplierOrder,
        status: "IN_PRODUCTION" as const,
      },
      title: "Pump housing production order",
    };

    render(<BuyerOrders orders={[awaitingOrder, productionOrder]} />);

    expect(screen.queryByLabelText("Order status filters")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Production" })).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search order, part, supplier..."), {
      target: { value: "pump" },
    });

    expect(screen.getByText("Pump housing production order")).toBeInTheDocument();
    expect(screen.queryByText("Hydrogen skid bracket RFQ")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search order, part, supplier..."), {
      target: { value: "" },
    });

    expect(screen.getByText("Pump housing production order")).toBeInTheDocument();
    expect(screen.getByText("Hydrogen skid bracket RFQ")).toBeInTheDocument();
  });
});

describe("BuyerOrderDetail", () => {
  it("renders granular buyer order tracking details", () => {
    const quotedRequest = makeQuotedRequest();
    const order = {
      ...quotedRequest,
      status: "PURCHASED" as const,
      supplierOrder: {
        ...quotedRequest.supplierOrder,
        status: "IN_PRODUCTION" as const,
        shopName: "Shenzhen Precision Manufacturing",
        contactName: "Li Wei",
        notes: "Material ordered and machining scheduled.",
        trackingNumber: "1Z999",
      },
    };

    render(<BuyerOrderDetail order={order} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByText("In production")).toBeInTheDocument();
    expect(screen.getByText("Shenzhen Precision Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("1Z999")).toBeInTheDocument();
    expect(screen.getByText(/Required docs: Standard Inspection/)).toBeInTheDocument();
    expect(screen.getByText("mounting-bracket.step")).toBeInTheDocument();
    expect(screen.getByText(/Quality documents will appear here/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reorder parts" })).toHaveAttribute("href", `/requests/new?reorder=${order.id}`);
    expect(screen.getAllByRole("link", { name: "Help with order" }).map((link) => link.getAttribute("href"))).toEqual([
      `/orders/${order.id}/help`,
      `/orders/${order.id}/help`,
    ]);
  });

  it("renders an order-specific help request page", () => {
    const quotedRequest = makeQuotedRequest();
    const order = {
      ...quotedRequest,
      status: "PURCHASED" as const,
      supplierOrder: {
        ...quotedRequest.supplierOrder,
        status: "IN_PRODUCTION" as const,
        shopName: "Shenzhen Precision Manufacturing",
      },
    };

    render(<BuyerOrderHelp order={order} />);

    expect(screen.getByRole("heading", { name: "Request help with this order" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to order" })).toHaveAttribute("href", `/orders/${order.id}`);
    expect(screen.getByText("Shenzhen Precision Manufacturing")).toBeInTheDocument();
    expect(screen.getByText("mounting-bracket.step")).toBeInTheDocument();
    expect(screen.getByLabelText("Issue type")).toHaveDisplayValue("Production or delivery update");
    expect(screen.getByLabelText("Message")).toBeRequired();

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Can you check whether this will still ship on time?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send help request" }));

    expect(screen.getByRole("heading", { name: "Help request sent" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to order" })).toHaveAttribute("href", `/orders/${order.id}`);
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
