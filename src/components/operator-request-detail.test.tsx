import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialBillingContact, initialCards, initialShippingAddress } from "@/lib/account-settings-shared";
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

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockRequestIdParam: string | null = null;

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
        shipToAddress1: initialShippingAddress.address1,
        shipToAddress2: initialShippingAddress.address2,
        shipToCity: initialShippingAddress.city,
        shipToCompany: initialShippingAddress.company,
        shipToName: initialShippingAddress.name,
        shipToState: initialShippingAddress.state,
        shipToZipCode: initialShippingAddress.zipCode,
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
  it("shows customer draft quotes in a separate admin table", () => {
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Aluminum plates for reactor weld fixture",
      process: "CNC milling",
      dueDate: "2026-06-16",
      lineItems: [
        {
          partName: "Aluminum Plate",
          quantity: 1,
          material: "SS 304",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined",
          qualityDocumentation: ["CMM Inspection with Dimensional Report"],
        },
      ],
      files: [{ name: "Aluminum Plate.STEP", sizeBytes: 2048, type: "model/step" }],
    });

    render(
      <AdminQuoteManagement
        customerProfileHrefs={{ "Amogy Manufacturing": "/admin/customers/company_amogy" }}
        requests={[draft, makeSubmittedRequest()]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Draft quotes not yet requested" })).toBeInTheDocument();
    expect(screen.getByText("Aluminum plates for reactor weld fixture")).toBeInTheDocument();
    expect(screen.getByText("Aluminum Plate")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open draft" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open draft for Aluminum plates for reactor weld fixture" }));
    expect(mockPush).toHaveBeenCalledWith(`/requests/new?draft=${draft.id}`);
    expect(screen.getAllByRole("link", { name: "Open customer page for Amogy Manufacturing" }).map((link) => link.getAttribute("href"))).toEqual([
      "/admin/customers/company_amogy",
      "/admin/customers/company_amogy",
    ]);
    expect(screen.getByText("Showing 1 draft")).toBeInTheDocument();
  });

  it("groups requested quotes by customer-facing status and keeps archived quotes behind the archived filter", () => {
    const submittedRequest = {
      ...makeSubmittedRequest(),
      id: "req_submitted",
      title: "Submitted bracket RFQ",
      updatedAt: "2026-06-11T14:30:00.000Z",
    };
    const needsInfoRequest = {
      ...applyOperatorStatusUpdate(makeSubmittedRequest(), {
        assignedOwner: "William",
        internalNotes: "Need drawing clarification.",
        status: "NEEDS_INFO",
      }),
      id: "req_needs_info",
      title: "Needs info fixture RFQ",
      updatedAt: "2026-06-11T15:30:00.000Z",
    };
    const supplierReadyRequest = {
      ...applyOperatorStatusUpdate(makeSubmittedRequest(), {
        assignedOwner: "William",
        internalNotes: "Supplier package ready.",
        status: "READY_FOR_SUPPLIER_RFQ",
      }),
      id: "req_supplier_ready",
      title: "Supplier ready plate RFQ",
      updatedAt: "2026-06-11T16:30:00.000Z",
    };
    const quotedRequest = {
      ...makeQuotedRequest(),
      id: "req_quoted",
      title: "Quoted retainer RFQ",
      updatedAt: "2026-06-11T17:30:00.000Z",
    };
    const archivedRequest = {
      ...applyOperatorStatusUpdate(makeSubmittedRequest(), {
        assignedOwner: "William",
        internalNotes: "Closed by admin.",
        status: "CLOSED",
      }),
      id: "req_archived",
      title: "Archived tooling RFQ",
      updatedAt: "2026-06-11T18:30:00.000Z",
    };

    render(<AdminQuoteManagement requests={[submittedRequest, needsInfoRequest, supplierReadyRequest, quotedRequest, archivedRequest]} updateStatusAction={() => undefined} />);

    expect(screen.getAllByText("RFQ details").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Last edited").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Package").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Quote status").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Quote Requested" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Quote Received" }).length).toBeGreaterThan(0);
    expect(screen.getByText("Submitted bracket RFQ")).toBeInTheDocument();
    expect(screen.getByText("Needs info fixture RFQ")).toBeInTheDocument();
    expect(screen.getByText("Supplier ready plate RFQ")).toBeInTheDocument();
    expect(screen.getByText("Quoted retainer RFQ")).toBeInTheDocument();
    expect(screen.getByText("Needs info")).toBeInTheDocument();
    expect(screen.getByText("Supplier ready")).toBeInTheDocument();
    expect(screen.getAllByText("1 part / Qty 24").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 files - 1 CAD / 1 drawing").length).toBeGreaterThan(0);
    expect(screen.queryByText("Archived tooling RFQ")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Archived" }));

    expect(screen.getByRole("heading", { name: "Archived" })).toBeInTheDocument();
    expect(screen.getByText("Archived tooling RFQ")).toBeInTheDocument();
    expect(screen.queryByText("Submitted bracket RFQ")).not.toBeInTheDocument();
  });

  it("opens a minimal RFQ review drawer with files, part details, and quote feedback", () => {
    const request = makeSubmittedRequest();

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    fireEvent.click(screen.getByRole("link", { name: "Manage quote submission for Hydrogen skid bracket RFQ" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("RFQ response")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Review customer RFQ package" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Attach supplier quote" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Selected Chinese shop quote" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Enter pricing and lead time" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Issue customer quote" })).toBeInTheDocument();
    expect(document.querySelector('input[name="supplierQuoteFile"]')).toBeInTheDocument();
    expect(screen.getByLabelText("Upload supplier quote file")).toHaveClass("sr-only");
    expect(screen.getByText("Upload supplier quote")).toBeInTheDocument();
    expect(screen.getByText("PDF, spreadsheet, image, or document from the shop")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload quote" })).not.toBeInTheDocument();
    expect(screen.getAllByText("mounting-bracket.step").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /mounting-bracket.step/ })).toHaveAttribute(
      "href",
      "/api/local-files/rfq/request-1/mounting-bracket.step?name=mounting-bracket.step&type=model%2Fstep",
    );
    expect(screen.getByRole("link", { name: /mounting-bracket.step/ })).toHaveAttribute("download", "mounting-bracket.step");
    expect(screen.getByRole("link", { name: /mounting-bracket.pdf/ })).toHaveAttribute(
      "href",
      "/api/local-files/rfq/request-1/mounting-bracket.pdf?name=mounting-bracket.pdf&type=application%2Fpdf",
    );
    expect(screen.getByRole("link", { name: /mounting-bracket.pdf/ })).toHaveAttribute("download", "mounting-bracket.pdf");
    expect(screen.getAllByText("Part").length).toBeGreaterThan(0);
    expect(screen.getByText("Specs")).toBeInTheDocument();
    expect(screen.getByText("Uploaded files")).toBeInTheDocument();
    expect(screen.getAllByText("Qty").length).toBeGreaterThan(0);
    expect(screen.getByText(/Material:/)).toBeInTheDocument();
    expect(screen.getByText(/Finish:/)).toBeInTheDocument();
    expect(screen.getByText(/Tolerance:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit price - Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lead time days - Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supplier unit price - Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supplier lead time days - Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supplier drawing revision - Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Supplier notes - Mounting bracket/)).toBeInTheDocument();
    expect(screen.getByLabelText("Shipping cost")).toBeInTheDocument();
    expect(screen.getByLabelText("Shipping speed")).toBeInTheDocument();
    expect(screen.getByLabelText("Shipping terms")).toBeInTheDocument();
    expect(screen.getByLabelText("Estimated delivery date")).toBeInTheDocument();
    expect(screen.getByLabelText("Quote valid until")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Issue customer quote" })).toBeEnabled();
  });

  it("opens the quote drawer from a valid requestId search param", async () => {
    const request = makeSubmittedRequest();
    mockRequestIdParam = request.id;

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("replaces a stale requestId search param with the clean quote list URL", async () => {
    const request = makeSubmittedRequest();
    mockRequestIdParam = "req_missing";

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/admin/quotes", { scroll: false });
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reloads the quote list when the browser restores it from back-forward cache", () => {
    const reload = vi.fn();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: "/admin/quotes",
        reload,
      },
    });

    render(<AdminQuoteManagement requests={[makeSubmittedRequest()]} updateStatusAction={() => undefined} />);

    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

    expect(reload).toHaveBeenCalled();
  });

  it("lets admins remove an attached supplier quote file from the RFQ drawer", () => {
    const request = {
      ...makeSubmittedRequest(),
      supplierQuoteFiles: [
        {
          id: "supplier_quote_file_1",
          name: "Jucheng Precision Quote.pdf",
          sizeBytes: 316000,
          storageKey: "supplier-quotes/2026-06-11/jucheng-precision-quote.pdf",
          type: "application/pdf",
          uploadedAt: "2026-06-11T23:21:00.000Z",
        },
      ],
    };

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    fireEvent.click(screen.getByRole("link", { name: "Manage quote submission for Hydrogen skid bracket RFQ" }));

    expect(screen.getByText("Jucheng Precision Quote.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download supplier quote Jucheng Precision Quote.pdf" })).toHaveAttribute(
      "href",
      "/api/local-files/supplier-quotes/2026-06-11/jucheng-precision-quote.pdf?name=Jucheng%20Precision%20Quote.pdf&type=application%2Fpdf",
    );
    fireEvent.click(screen.getByRole("button", { name: "Preview supplier quote Jucheng Precision Quote.pdf" }));
    expect(screen.getByRole("dialog", { name: "Supplier quote PDF viewer for Jucheng Precision Quote.pdf" })).toBeInTheDocument();
    expect(screen.getByTitle("Preview Jucheng Precision Quote.pdf")).toHaveAttribute(
      "src",
      "/api/local-files/supplier-quotes/2026-06-11/jucheng-precision-quote.pdf?name=Jucheng%20Precision%20Quote.pdf&type=application%2Fpdf&preview=1",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close supplier quote PDF viewer" }));
    expect(screen.queryByRole("dialog", { name: "Supplier quote PDF viewer for Jucheng Precision Quote.pdf" })).not.toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: "Remove supplier quote Jucheng Precision Quote.pdf" });
    const removeForm = removeButton.closest("form");

    expect(removeForm).toHaveAttribute("action", "/api/supplier-quote-files/remove");
    expect(within(removeForm as HTMLFormElement).getByDisplayValue(request.id)).toHaveAttribute("name", "requestId");
    expect(within(removeForm as HTMLFormElement).getByDisplayValue("supplier_quote_file_1")).toHaveAttribute("name", "fileId");
    expect(within(removeForm as HTMLFormElement).getByDisplayValue(`/admin/quotes?requestId=${request.id}`)).toHaveAttribute("name", "returnTo");
  });

  it("allows admins to edit submitted customer quotes in the admin drawer", () => {
    const baseRequest = makeQuotedRequest();
    const quotedRequest = {
      ...baseRequest,
      quote: {
        ...baseRequest.quote,
        estimatedDeliveryDate: "2026-06-24",
        quoteCreatedDate: "2026-06-02",
        quoteValidUntil: "2026-07-02",
        shippingCostCents: 12500,
        shippingMethod: "International",
        shippingTerms: "DDP",
        summary: "Pricing includes manufacturing coordination.",
      },
      customerQuotes: [
        {
          assumptions: "Customer-supplied CAD is complete.",
          clarifications: "",
          customerCompany: "Amogy Manufacturing",
          customerContact: "William Paik",
          filesReviewed: "mounting-bracket.step",
          id: "customer_quote_1",
          issuedAt: "2026-06-02T12:00:00.000Z",
          leadTime: "15 business days",
          lineItems: [
            {
              description: "Mounting bracket",
              finish: "As machined",
              id: "quoted-line-1",
              material: "6061-T6 Aluminum",
              process: "CNC milling",
              quantity: 24,
              unitPrice: 76.04,
            },
          ],
          markdown: "Quote markdown",
          notes: "Pricing includes manufacturing coordination.",
          preparedBy: "Lattice",
          projectName: "Hydrogen skid bracket RFQ",
          quoteDate: "2026-06-02",
          quoteNumber: "LQ-1001",
          shipping: "International / DDP - $125.00",
          tax: "Excluded",
          totalCents: 182500,
          validUntil: "2026-07-02",
          versionNumber: 1,
        },
      ],
    };

    render(<AdminQuoteManagement requests={[quotedRequest]} updateStatusAction={() => undefined} />);

    fireEvent.click(screen.getByRole("link", { name: "Manage quote submission for Hydrogen skid bracket RFQ" }));

    expect(screen.getByText("This quote has already been issued to the customer. Values below show the latest saved customer quote version.")).toBeInTheDocument();
    expect(screen.getByText("Latest saved version: customer quote v1.")).toBeInTheDocument();
    expect(screen.getByText("$76.04")).toBeInTheDocument();
    expect(screen.getByText("15 business days")).toBeInTheDocument();
    expect(screen.getByText("$125.00")).toBeInTheDocument();
    expect(screen.getByText("International")).toBeInTheDocument();
    expect(screen.getByText("DDP")).toBeInTheDocument();
    expect(screen.getByText("Jun 24, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jul 2, 2026")).toBeInTheDocument();
    expect(screen.getByText("Pricing includes manufacturing coordination.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Unit price - Mounting bracket/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Lead time days - Mounting bracket/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Shipping cost")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Shipping speed")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Shipping terms")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Estimated delivery date")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Quote valid until")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Customer note")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Update quote to customer" })).not.toBeInTheDocument();
    expect(document.querySelector('input[name="supplierQuoteFile"]')).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View quote PDF" })).toHaveAttribute("href", `/admin/quotes/${quotedRequest.id}/quote.pdf`);
    expect(screen.getByRole("link", { name: "View quote PDF" })).toHaveAttribute("target", "_blank");

    fireEvent.click(screen.getByRole("button", { name: "Edit quote" }));

    expect(screen.getByText("Editing this issued quote will save a new customer quote version and update the buyer-facing quote.")).toBeInTheDocument();
    expect(screen.getByText("Latest saved version: customer quote v1. Saving creates v2.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Unit price - Mounting bracket/)).toHaveValue("76.04");
    expect(screen.getByLabelText(/Lead time days - Mounting bracket/)).toHaveValue("15");
    expect(screen.getByLabelText("Shipping cost")).toHaveValue("125.00");
    expect(screen.getByLabelText("Shipping speed")).toHaveValue("International");
    expect(screen.getByLabelText("Shipping terms")).toHaveValue("DDP");
    expect(screen.getByLabelText("Estimated delivery date")).toHaveValue("2026-06-24");
    expect(screen.getByLabelText("Quote valid until")).toHaveValue("2026-07-02");
    expect(screen.getByLabelText("Customer note")).toHaveValue("Pricing includes manufacturing coordination.");
    expect(screen.getByRole("button", { name: "Save updated quote" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancel edit" })).toBeInTheDocument();
  });

  it("opens the RFQ drawer when the quote submission card is clicked", () => {
    const request = makeSubmittedRequest();

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    fireEvent.click(screen.getByRole("link", { name: "Manage quote submission for Hydrogen skid bracket RFQ" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
  });

  it("closes the RFQ drawer when the backdrop is clicked", () => {
    const request = makeSubmittedRequest();

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    fireEvent.click(screen.getByRole("link", { name: "Manage quote submission for Hydrogen skid bracket RFQ" }));
    fireEvent.click(screen.getByRole("dialog"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("presentation"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the RFQ drawer from an admin quote deep link", async () => {
    const request = makeSubmittedRequest();
    mockRequestIdParam = request.id;

    render(<AdminQuoteManagement requests={[request]} updateStatusAction={() => undefined} />);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hydrogen skid bracket RFQ" })).toBeInTheDocument();
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

    expect(screen.getAllByText("Lattice review in progress").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Lattice is checking the RFQ package before supplier outreach." })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Edit and resubmit request" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Download quote PDF" })).not.toBeInTheDocument();
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
    expect(screen.getByText("Summary of order")).toBeInTheDocument();
    expect(screen.getByTestId("quote-line-items-scroll")).toHaveClass("overflow-x-auto");
    expect(screen.getByRole("link", { name: "Select files or drag and drop here to upload" })).toHaveAttribute("href", `/requests/new?revise=${requestWithCustomerQuote.id}`);
    expect(screen.queryByRole("link", { name: "Configure via drawing" })).not.toBeInTheDocument();
    expect(screen.getByText(/Price/)).toBeInTheDocument();
    expect(screen.getByText("$76.04/ea")).toBeInTheDocument();
    expect(screen.getByText("Preview pending")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "mounting-bracket.step" })).toHaveAttribute(
      "href",
      "/api/local-files/rfq/request-1/mounting-bracket.step?name=mounting-bracket.step&type=model%2Fstep",
    );
    expect(screen.getByRole("link", { name: "mounting-bracket.step" })).toHaveAttribute("download", "mounting-bracket.step");
    expect(screen.getByText("Saved customer quote notes.")).toBeInTheDocument();
    expect(screen.getByText("Shipping address")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change" })).toHaveAttribute("href", "/account/settings?edit=shipping");
    const shippingAddressSection = screen.getByText("Shipping address").closest("div");
    expect(shippingAddressSection).not.toBeNull();
    expect(within(shippingAddressSection as HTMLElement).getByText(initialShippingAddress.name)).toBeInTheDocument();
    expect(screen.getByText(initialShippingAddress.company)).toBeInTheDocument();
    expect(screen.getByText(initialShippingAddress.address1)).toBeInTheDocument();
    expect(screen.getByText(`${initialShippingAddress.city}, ${initialShippingAddress.state} ${initialShippingAddress.zipCode}`)).toBeInTheDocument();
    expect(screen.queryByText("123 Main Street")).not.toBeInTheDocument();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Accept quote" })).toBeEnabled();
    expect(screen.queryByRole("link", { name: "Edit and resubmit quote" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download quote PDF" })).toHaveAttribute("href", `/quotes/${requestWithCustomerQuote.id}/quote.pdf`);
    expect(screen.getByText("Quote activity")).toBeInTheDocument();
    expect(screen.queryByText("Quote basis")).not.toBeInTheDocument();
    expect(screen.getByText(/Standard Inspection/)).toBeInTheDocument();
    expect(screen.getAllByText("mounting-bracket.step").length).toBeGreaterThan(0);
    expect(screen.queryByText("Chinese shop quote")).not.toBeInTheDocument();
    expect(screen.queryByText(/internal pricing traceability/i)).not.toBeInTheDocument();

    const selectAllCheckbox = screen.getByRole("checkbox", { name: "Select all line items" });
    const lineItemCheckbox = screen.getByRole("checkbox", { name: "Select Mounting bracket" });
    expect(selectAllCheckbox).not.toBeChecked();
    expect(lineItemCheckbox).not.toBeChecked();

    fireEvent.click(selectAllCheckbox);
    expect(selectAllCheckbox).toBeChecked();
    expect(lineItemCheckbox).toBeChecked();

    fireEvent.click(lineItemCheckbox);
    expect(selectAllCheckbox).not.toBeChecked();
    expect(lineItemCheckbox).not.toBeChecked();
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
        accountsPayableEmail={initialBillingContact.email}
        cards={initialCards}
        receivingPhone="+1 (310) 617-4533"
        shippingAddress={initialShippingAddress}
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

  it("shows PO number, AP email, and upload controls when purchase order checkout is selected", () => {
    const quotedRequest = {
      ...makeQuotedRequest(),
      quote: {
        ...makeQuotedRequest().quote,
        shippingCostCents: 45800,
        shippingMethod: "International",
      },
      customerQuotes: [
        {
          ...makeQuotedRequest().customerQuotes.at(-1)!,
          totalCents: 381528,
        },
      ],
    };

    render(
      <BuyerQuoteCheckout
        request={quotedRequest}
        placeOrderAction={() => undefined}
        accountsPayableEmail={initialBillingContact.email}
        cards={initialCards}
        receivingPhone="+1 (310) 617-4533"
        shippingAddress={initialShippingAddress}
      />,
    );

    fireEvent.click(screen.getByText("Purchase order"));

    expect(screen.getByPlaceholderText("PO-1047")).toBeInTheDocument();
    expect(screen.getByDisplayValue(initialBillingContact.email)).toBeInTheDocument();
    expect(screen.getByText("Upload PO document")).toBeInTheDocument();
  });

  it("confirms the selected PO file before order placement", () => {
    const quotedRequest = makeQuotedRequest();

    render(
      <BuyerQuoteCheckout
        request={quotedRequest}
        placeOrderAction={() => undefined}
        accountsPayableEmail={initialBillingContact.email}
        cards={initialCards}
        receivingPhone="+1 (310) 617-4533"
        shippingAddress={initialShippingAddress}
      />,
    );

    fireEvent.click(screen.getByText("Purchase order"));
    fireEvent.change(screen.getByLabelText("Purchase order file"), {
      target: {
        files: [new File(["purchase order"], "amogy-po-1047.pdf", { type: "application/pdf" })],
      },
    });

    expect(screen.getByText("PO document selected")).toBeInTheDocument();
    expect(screen.getByText(/amogy-po-1047\.pdf/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Purchase order file"), {
      target: {
        files: [],
      },
    });

    expect(screen.getByText("PO document selected")).toBeInTheDocument();
    expect(screen.getByText(/amogy-po-1047\.pdf/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove PO file" }));

    expect(screen.getByText("Upload PO document")).toBeInTheDocument();
    expect(screen.queryByText(/amogy-po-1047\.pdf/)).not.toBeInTheDocument();
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
    expect(screen.getAllByRole("link", { name: "View invoice" }).map((link) => link.getAttribute("href"))).toEqual([
      `/orders/${order.id}/invoice.pdf?preview=1`,
      `/orders/${order.id}/invoice.pdf?preview=1`,
    ]);
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
