import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AccountAddress, BillingContact, PaymentCard } from "@/lib/account-settings-shared";
import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "../lib/request-model";

import { AdminQuoteManagement } from "./admin-quote-management";
import { BuyerOrders } from "./buyer-orders";
import { BuyerOrderDetail } from "./buyer-order-detail";
import { BuyerOrderHelp } from "./buyer-order-help";
import { BuyerQuoteDetail } from "./buyer-quote-detail";
import { BuyerQuoteCheckout } from "./buyer-quote-checkout";
import { BuyerQuotes } from "./buyer-quotes";
import { SupplierOrderDetail } from "./supplier-order-detail";
import { SupplierOrders } from "./supplier-orders";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockRequestIdParam: string | null = null;

const checkoutShippingAddress: AccountAddress = {
  address1: "19 Morris Ave",
  address2: "",
  city: "Brooklyn",
  company: "Amogy",
  name: "William Paik",
  state: "NY",
  zipCode: "11205",
};
const checkoutBillingContact: BillingContact = { email: "accounts@amogy.example", invoiceRoutingNotes: "" };
const checkoutCards: PaymentCard[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "requestId" ? mockRequestIdParam : null),
  }),
}));

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
  mockRequestIdParam = null;
});

function makeSubmittedRequest() {
  return submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: {
        shipToAddress1: checkoutShippingAddress.address1,
        shipToAddress2: checkoutShippingAddress.address2,
        shipToCity: checkoutShippingAddress.city,
        shipToCompany: checkoutShippingAddress.company,
        shipToName: checkoutShippingAddress.name,
        shipToState: checkoutShippingAddress.state,
        shipToZipCode: checkoutShippingAddress.zipCode,
      },
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
      files: [
        { name: "mounting-bracket.step", sizeBytes: 2048, storageKey: "rfq/request-1/mounting-bracket.step", type: "model/step" },
        { name: "mounting-bracket.pdf", sizeBytes: 4096, storageKey: "rfq/request-1/mounting-bracket.pdf", type: "application/pdf" },
      ],
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


describe("AdminQuoteManagement", () => {
  it("keeps draft RFQs out of the active queue and opens the draft tab", () => {
    const draft = { ...makeSubmittedRequest(), id: "draft_one", status: "DRAFT" as const, title: "Draft bracket" };
    render(<AdminQuoteManagement requests={[draft, makeSubmittedRequest()]} />);
    expect(screen.queryByText("Draft bracket")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Drafts (1)" }));
    expect(screen.getByText("Draft bracket")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open draft for Draft bracket" })).toBeInTheDocument();
  });
  it("shows an RFQ inspector with its package and supplier basis", () => {
    const request = makeSubmittedRequest();
    render(<AdminQuoteManagement requests={[request]} />);
    const inspector = screen.getByRole("complementary", { name: `RFQ inspector: ${request.title}` });
    expect(within(inspector).getByText("Supplier basis")).toBeInTheDocument();
    expect(within(inspector).getByRole("button", { name: "Prepare customer quote" })).toBeInTheDocument();
  });
  it("filters the review queue by search", () => {
    render(<AdminQuoteManagement requests={[makeSubmittedRequest()]} />);
    fireEvent.change(screen.getByRole("searchbox", { name: "Search quote submissions" }), { target: { value: "no matching RFQ" } });
    expect(screen.getByText(/0 submissions/)).toBeInTheDocument();
  });
  it("opens the workbench from the inspector", () => {
    render(<AdminQuoteManagement requests={[makeSubmittedRequest()]} />);
    fireEvent.click(screen.getByRole("button", { name: "Prepare customer quote" }));
    expect(screen.getByRole("navigation", { name: "RFQ queue" })).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("view=quote"), { scroll: false });
  });
  it("selects a valid deep-linked RFQ in the inspector", () => {
    const request = makeSubmittedRequest(); mockRequestIdParam = request.id;
    render(<AdminQuoteManagement requests={[request]} />);
    expect(screen.getByRole("complementary", { name: `RFQ inspector: ${request.title}` })).toBeInTheDocument();
  });
  it("keeps closed RFQs in archive and hides decision controls", () => {
    const request = { ...makeSubmittedRequest(), status: "CLOSED" as const };
    render(<AdminQuoteManagement requests={[request]} updateDecisionAction={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Archive (1)" }));
    expect(screen.queryByRole("button", { name: "Request information" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View RFQ details" })).toBeInTheDocument();
  });
});

describe("BuyerQuotes", () => {
  it("renders submitted RFQs as buyer quote tracker rows", () => {
    const request = makeSubmittedRequest();

    render(<BuyerQuotes requests={[request]} />);

    expect(screen.getByRole("link", { name: "Open quote detail for Hydrogen skid bracket RFQ" })).toHaveAttribute("href", `/quotes/${request.id}`);
    expect(screen.getByText("Quote Requested")).toBeInTheDocument();
    expect(screen.queryByText("Lattice is reviewing the RFQ package.")).not.toBeInTheDocument();
    expect(screen.getByText(/Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByText(/6061-T6 Aluminum/)).toBeInTheDocument();
  });
});

describe("BuyerQuoteDetail", () => {
  it("lets customers edit and resubmit pending RFQs before pricing is ready", () => {
    const request = makeSubmittedRequest();

    render(<BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} />);

    expect(screen.getAllByText("Supplier network review in progress").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "Lattice is gathering feedback from its supplier network to prepare accurate pricing and lead time for this order.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("What happens next")).toBeInTheDocument();
    expect(screen.queryByText("No action needed")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lattice is checking the RFQ package before supplier outreach." })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit and resubmit request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Download quote PDF" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change" })).toHaveAttribute("href", `/account/settings?edit=shipping&request=${request.id}`);
  });

  it("shows the operator note when more information is requested", () => {
    const request = applyOperatorStatusUpdate(makeSubmittedRequest(), {
      internalNotes: "Please upload the latest drawing with thread callouts before we can quote accurately.",
      status: "NEEDS_INFO",
    });

    render(<BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} />);

    expect(screen.getAllByText("More information requested").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Please upload the latest drawing with thread callouts before we can quote accurately.").length).toBeGreaterThan(0);
  });

  it("fills an incomplete RFQ shipping snapshot from the customer's saved shipping address", () => {
    const request = {
      ...makeSubmittedRequest(),
      shipToAddress1: "",
      shipToCity: "",
      shipToState: "",
      shipToZipCode: "",
    };

    render(
      <BuyerQuoteDetail
        checkoutHref={`/quotes/${request.id}/checkout`}
        request={request}
        savedShippingAddress={{
          address1: "75 Varick St",
          address2: "Dock 3",
          city: "New York",
          company: "Lattice Receiving",
          name: "Receiving Team",
          state: "NY",
          zipCode: "10013",
        }}
      />,
    );

    expect(screen.getByText("Receiving Team")).toBeInTheDocument();
    expect(screen.getByText("Lattice Receiving")).toBeInTheDocument();
    expect(screen.getByText("75 Varick St")).toBeInTheDocument();
    expect(screen.getByText("Dock 3")).toBeInTheDocument();
    expect(screen.getByText("New York, NY 10013")).toBeInTheDocument();
  });

  it("shows no-quote copy and reason when an RFQ is closed with an operator note", () => {
    const request = applyOperatorStatusUpdate(makeSubmittedRequest(), {
      internalNotes: "We are unable to quote this RFQ because the required process is outside our supplier network.",
      status: "CLOSED",
    });

    render(<BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} />);

    expect(screen.getAllByText("No quote").length).toBeGreaterThan(0);
    expect(screen.getByText("Unable to quote this RFQ")).toBeInTheDocument();
    expect(screen.getAllByText("We are unable to quote this RFQ because the required process is outside our supplier network.").length).toBeGreaterThan(0);
  });

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
    expect(screen.getAllByText("Quote received").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$1,825.00").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Parts and pricing" })).toBeInTheDocument();
    expect(screen.getByTestId("quote-line-items-responsive")).toHaveClass("overflow-x-auto");
    expect(screen.queryByRole("link", { name: "Modify quote request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Edit configuration" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Configure via drawing" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Unit price").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Line total").length).toBeGreaterThan(0);
    expect(screen.getByText("$76.04/ea")).toBeInTheDocument();
    expect(screen.getAllByText("Preview pending").length).toBeGreaterThan(0);
    const fileLinks = screen.getAllByRole("link", { name: "mounting-bracket.step" });
    expect(fileLinks[0]).toHaveAttribute(
      "href",
      "/api/local-files/rfq/request-1/mounting-bracket.step?name=mounting-bracket.step&type=model%2Fstep",
    );
    expect(fileLinks[0]).toHaveAttribute("download", "mounting-bracket.step");
    expect(screen.getByText("Saved customer quote notes.")).toBeInTheDocument();
    expect(screen.getByText("Shipping address")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change" })).toHaveAttribute("href", "/account/settings?edit=shipping");
    const shippingAddressSection = screen.getByText("Shipping address").closest("div");
    expect(shippingAddressSection).not.toBeNull();
    expect(within(shippingAddressSection as HTMLElement).getByText(checkoutShippingAddress.name)).toBeInTheDocument();
    expect(screen.getByText(checkoutShippingAddress.company)).toBeInTheDocument();
    expect(screen.getByText(checkoutShippingAddress.address1)).toBeInTheDocument();
    expect(screen.getByText(`${checkoutShippingAddress.city}, ${checkoutShippingAddress.state} ${checkoutShippingAddress.zipCode}`)).toBeInTheDocument();
    expect(screen.queryByText("123 Main Street")).not.toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept quote" })).toBeEnabled();
    expect(screen.queryByRole("link", { name: "Edit and resubmit quote" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download quote PDF" })).toHaveAttribute("href", `/quotes/${requestWithCustomerQuote.id}/quote.pdf`);
    expect(screen.getByText("Quote activity")).toBeInTheDocument();
    expect(screen.queryByText("Quote basis")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Standard Inspection/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("mounting-bracket.step").length).toBeGreaterThan(0);
    expect(screen.queryByText("Chinese shop quote")).not.toBeInTheDocument();
    expect(screen.queryByText(/internal pricing traceability/i)).not.toBeInTheDocument();

    expect(screen.queryByRole("checkbox", { name: "Select all line items" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Mounting bracket" })).not.toBeInTheDocument();
  });

  it("shows customers the latest updated quote version", () => {
    const quotedRequest = makeQuotedRequest();
    const requestWithUpdatedCustomerQuote = {
      ...quotedRequest,
      quote: {
        ...quotedRequest.quote,
        estimatedPriceCents: 212400,
        shippingCostCents: 45800,
        shippingMethod: "",
        shippingTerms: "",
        summary: "Updated customer-visible quote notes.",
      },
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
          notes: "Original customer quote notes.",
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
              unitPrice: 76.04,
            },
          ],
          totalCents: 182500,
          markdown: "# Quote LQ-1001",
          issuedAt: "2026-06-02T12:00:00.000Z",
        },
        {
          id: "customer_quote_2",
          versionNumber: 2,
          quoteNumber: "LQ-1002",
          quoteDate: "2026-06-08",
          validUntil: "2026-07-08",
          customerCompany: quotedRequest.buyerCompany,
          customerContact: quotedRequest.requesterName,
          projectName: quotedRequest.title,
          preparedBy: "Lattice",
          leadTime: "",
          shipping: "$458.00",
          tax: "Not included",
          notes: "Updated customer-visible quote notes.",
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
              unitPrice: 88.5,
            },
          ],
          totalCents: 212400,
          markdown: "# Quote LQ-1002",
          issuedAt: "2026-06-08T12:00:00.000Z",
        },
      ],
    };

    render(<BuyerQuoteDetail checkoutHref={`/quotes/${requestWithUpdatedCustomerQuote.id}/checkout`} request={requestWithUpdatedCustomerQuote} />);

    expect(screen.getByRole("heading", { name: "LQ-1002" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "LQ-1001" })).not.toBeInTheDocument();
    expect(screen.getAllByText("$2,124.00").length).toBeGreaterThan(0);
    expect(screen.getByText("$88.50/ea")).toBeInTheDocument();
    expect(screen.getByText("Updated customer-visible quote notes.")).toBeInTheDocument();
    expect(screen.queryByText("Original customer quote notes.")).not.toBeInTheDocument();
    expect(screen.getByText("$458.00")).toBeInTheDocument();
  });

  it("renders checkout fields before placing an order", () => {
    const baseQuotedRequest = makeQuotedRequest();
    const quotedRequest = {
      ...baseQuotedRequest,
      quote: {
        ...baseQuotedRequest.quote,
        shippingCostCents: 45800,
        shippingMethod: "International",
      },
      customerQuotes: [
        {
          ...baseQuotedRequest.customerQuotes.at(-1)!,
          totalCents: 381528,
        },
      ],
    };

    render(
      <BuyerQuoteCheckout
        request={quotedRequest}
        placeOrderAction={() => undefined}
        accountsPayableEmail={checkoutBillingContact.email}
        cards={checkoutCards}
        receivingPhone="+1 (310) 617-4533"
        shippingAddress={checkoutShippingAddress}
      />,
    );

    expect(screen.getByRole("heading", { name: /Checkout for/ })).toBeInTheDocument();
    expect(screen.getByText("Delivery address")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Amogy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("19 Morris Ave")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Brooklyn")).toBeInTheDocument();
    expect(screen.getByDisplayValue("NY")).toBeInTheDocument();
    expect(screen.getByDisplayValue("11205")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("William Paik").length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue("+1 (310) 617-4533")).toBeInTheDocument();
    expect(screen.getByText("Shipping and import method")).toBeInTheDocument();
    expect(screen.getByText("Customs and compliance")).toBeInTheDocument();
    expect(screen.getByText("Payment and purchasing")).toBeInTheDocument();
    expect(screen.getByText("End use")).toBeInTheDocument();
    expect(screen.getByText("Pay securely with Stripe")).toBeInTheDocument();
    expect(screen.getByText("Purchase order")).toBeInTheDocument();
    expect(screen.getByText("No saved Stripe cards are on file. Enter card details above to pay this quote.")).toBeInTheDocument();
    expect(screen.getByText("Shipping (International)")).toBeInTheDocument();
    expect(screen.getByText("$458.00")).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("$4,273.28")).toBeInTheDocument();
    expect(screen.queryByText("$35.00")).not.toBeInTheDocument();
    expect(screen.queryByText("$338.61")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("PO-1047")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pay with Stripe/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox", { name: /I accept the quote basis/ }));

    expect(screen.getByRole("button", { name: /Pay with Stripe/ })).toBeDisabled();
  });

  it("keeps purchase-order payment and unapproved tax exemption unavailable", () => {
    render(<BuyerQuoteCheckout request={makeQuotedRequest()} placeOrderAction={() => undefined} accountsPayableEmail={checkoutBillingContact.email} cards={checkoutCards} receivingPhone="555-0101" shippingAddress={checkoutShippingAddress} />);
    expect(screen.getByRole("radio", { name: /Purchase order/ })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Tax exempt certificate on file" })).toBeDisabled();
    expect(screen.queryByPlaceholderText("PO-1047")).not.toBeInTheDocument();
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
    const baseQuotedRequest = makeQuotedRequest();
    const quotedRequest = {
      ...baseQuotedRequest,
      quote: {
        ...baseQuotedRequest.quote,
        shippingCostCents: 45800,
        shippingMethod: "International",
      },
      customerQuotes: [
        {
          ...baseQuotedRequest.customerQuotes.at(-1)!,
          totalCents: 381528,
        },
      ],
    };
    const order = {
      ...quotedRequest,
      status: "PURCHASED" as const,
      supplierOrder: {
        ...quotedRequest.supplierOrder,
        status: "IN_PRODUCTION" as const,
        shopName: "Shenzhen Precision Manufacturing",
        contactName: "Li Wei",
        notes: "Material ordered and machining scheduled.",
        trackingNumber: "1Z999AA10123456784",
      },
    };

    render(<BuyerOrderDetail order={order} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getAllByText("In production").length).toBeGreaterThan(0);
    expect(screen.getByText("Lattice manufacturing network")).toBeInTheDocument();
    expect(screen.queryByText("Shenzhen Precision Manufacturing")).not.toBeInTheDocument();
    expect(screen.getAllByText("1Z999AA10123456784").length).toBeGreaterThan(0);
    expect(screen.getAllByText("UPS").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Track package/ })).toHaveAttribute(
      "href",
      "https://www.ups.com/track?tracknum=1Z999AA10123456784",
    );
    expect(screen.getByText(/Required docs: Standard Inspection/)).toBeInTheDocument();
    expect(screen.getByText("mounting-bracket.step")).toBeInTheDocument();
    expect(screen.getByText(/Quality documents will appear here/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View invoice" })).toHaveAttribute("href", `/orders/${order.id}/invoice.pdf?preview=1`);
    expect(screen.getByRole("link", { name: "Download invoice" })).toHaveAttribute("href", `/orders/${order.id}/invoice.pdf`);
    expect(screen.getByRole("link", { name: "Reorder parts" })).toHaveAttribute("href", `/requests/new?reorder=${order.id}`);
    expect(screen.queryByText("Chinese shop quote")).not.toBeInTheDocument();
    expect(screen.getByText("Shipping (International)")).toBeInTheDocument();
    expect(screen.getByText("$458.00")).toBeInTheDocument();
    expect(screen.getByText("Tax")).toBeInTheDocument();
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText("$4,273.28")).toBeInTheDocument();
    expect(screen.queryByText("$35.00")).not.toBeInTheDocument();
    expect(screen.queryByText("$338.61")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help with order" })).toHaveAttribute("href", `/orders/${order.id}/help`);
  });

  it("renders an order-specific help request page", async () => {
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
    expect(screen.getByText("Lattice manufacturing network")).toBeInTheDocument();
    expect(screen.queryByText("Shenzhen Precision Manufacturing")).not.toBeInTheDocument();
    expect(screen.getByText("mounting-bracket.step")).toBeInTheDocument();
    expect(screen.getByLabelText("Issue type")).toHaveDisplayValue("Production or delivery update");
    expect(screen.getByLabelText("Message")).toBeRequired();

    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Can you check whether this will still ship on time?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send help request" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Help request sent" })).toBeInTheDocument());
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
    const order = { ...makeQuotedRequest(), status: "PURCHASED" as const };

    render(<SupplierOrderDetail order={order} />);

    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.getByLabelText("Production status")).toBeInTheDocument();
    expect(screen.getByLabelText("Document type")).toBeInTheDocument();
    expect(screen.getByText("Supplier package complete.")).toBeInTheDocument();
    expect(screen.getByText(/Required docs: Standard Inspection/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View invoice" })).toHaveAttribute("href", `/supplier/orders/${order.id}/invoice.pdf?preview=1`);
    expect(screen.getByRole("link", { name: "Download invoice" })).toHaveAttribute("href", `/supplier/orders/${order.id}/invoice.pdf`);
    expect(screen.getByRole("link", { name: "Preview PDF" })).toHaveAttribute("href", `/supplier/orders/${order.id}/invoice.pdf?preview=1`);
    expect(screen.getByRole("link", { name: "Download PDF" })).toHaveAttribute("href", `/supplier/orders/${order.id}/invoice.pdf`);
    expect(screen.getByText("Save supplier update")).toBeDisabled();
  });
});

vi.mock("@/app/(workspace)/orders/[requestId]/help/actions", () => ({ submitOrderSupport: vi.fn(async () => ({ id: "support_test" })) }));
