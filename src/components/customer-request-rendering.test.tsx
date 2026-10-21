import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { customerSafeRequest } from "@/lib/customer-request";
import { privateMarker, privateRequestFixture } from "@/test-fixtures/customer-request";
import { BuyerQuoteDetail } from "./buyer-quote-detail";
import { BuyerQuoteCheckout } from "./buyer-quote-checkout";
import { BuyerOrderDetail } from "./buyer-order-detail";
import { BuyerQuotes } from "./buyer-quotes";
import { BuyerOrders } from "./buyer-orders";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
afterEach(cleanup);

describe("customer screens with the reduced request contract", () => {
  it("renders quote lists and keeps the customer quote link", () => {
    const request = customerSafeRequest(privateRequestFixture());
    const view = render(<BuyerQuotes requests={[request]} />);
    expect(screen.getByRole("link", { name: `Open quote detail for ${request.title}` })).toHaveAttribute("href", `/quotes/${request.id}`);
    expect(view.container.textContent).not.toContain(privateMarker);
  });

  it("renders quote detail and the preserved customer pricing and CAD download", () => {
    const request = customerSafeRequest(privateRequestFixture());
    const view = render(<BuyerQuoteDetail request={request} />);
    expect(screen.getAllByText("QA-AH-3-P1").length).toBeGreaterThan(0);
    expect(view.container.querySelector('a[href*="rfq/customer-part.step"]')).not.toBeNull();
    expect(view.container.textContent).not.toContain(privateMarker);
  });

  it("renders checkout with the customer's PO reference", () => {
    const request = customerSafeRequest(privateRequestFixture());
    const view = render(<BuyerQuoteCheckout request={request} hostedCheckout placeOrderAction={vi.fn()} />);
    expect(screen.getByDisplayValue("CUSTOMER-PO-1")).toBeInTheDocument();
    expect(view.container.textContent).not.toContain(privateMarker);
  });

  it("renders order lists with the saved tracking number", () => {
    const source = privateRequestFixture(); source.status = "PURCHASED";
    const view = render(<BuyerOrders orders={[customerSafeRequest(source)]} />);
    expect(screen.getByText(/1Z999AA10123456784/)).toBeInTheDocument();
    expect(view.container.textContent).not.toContain(privateMarker);
  });

  it("renders order detail without supplier quotes and retains quality downloads and refund status", () => {
    const source = privateRequestFixture(); source.status = "PURCHASED";
    const view = render(<BuyerOrderDetail order={customerSafeRequest(source)} />);
    expect(screen.getByText("Inspection report")).toBeInTheDocument();
    expect(view.container.querySelector('a[href*="orders/quality/inspection.pdf"]')).not.toBeNull();
    expect(screen.getByText("Partially refunded")).toBeInTheDocument();
    expect(view.container.textContent).not.toContain(privateMarker);
  });
});
