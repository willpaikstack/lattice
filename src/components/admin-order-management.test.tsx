import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildDraftRequest, submitDraftRequest, type LatticeRequest } from "@/lib/request-model";

import { AdminOrderManagement } from "./admin-order-management";
import { BuyerOrderDetail } from "./buyer-order-detail";

function makePurchasedOrder(): LatticeRequest {
  return {
    ...submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        dueDate: "2026-06-20",
        files: [{ name: "retainer.step", sizeBytes: 2048, type: "model/step" }],
        lineItems: [
          {
            material: "6061-T6 Aluminum",
            partName: "Retainer plate",
            quantity: 8,
          },
        ],
        process: "CNC milling",
        requesterName: "William Paik",
        title: "Retainer plate production order",
      }),
    ),
    quote: {
      estimatedPriceCents: 381500,
      leadTimeDays: 15,
      quoteSummary: "Accepted production quote.",
    },
    status: "PURCHASED",
  };
}

describe("AdminOrderManagement", () => {
  it("opens placed order rows in the admin order detail route", () => {
    const order = makePurchasedOrder();

    render(<AdminOrderManagement orders={[order]} />);

    expect(screen.getByRole("link", { name: "Manage order for Retainer plate production order" })).toHaveAttribute("href", `/admin/orders/${order.id}`);
  });

  it("shows an archive action for each placed order row", () => {
    const order = makePurchasedOrder();

    render(<AdminOrderManagement archiveAction={vi.fn()} orders={[order]} />);

    expect(screen.getByRole("button", { name: "Archive order for Retainer plate production order" })).toBeEnabled();
  });
});

describe("BuyerOrderDetail route overrides", () => {
  it("uses admin route targets when rendered from the admin order detail page", () => {
    const order = makePurchasedOrder();

    render(
      <BuyerOrderDetail
        order={order}
        routeConfig={{
          backHref: "/admin/orders",
          backLabel: "Back to placed orders",
          helpHref: null,
          invoiceHref: `/admin/orders/${order.id}/invoice.pdf`,
          invoicePreviewHref: `/admin/orders/${order.id}/invoice.pdf?preview=1`,
          reorderHref: null,
          supplierQuoteReturnTo: `/admin/orders/${order.id}`,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Back to placed orders" })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getAllByRole("link", { name: "View invoice" })[0]).toHaveAttribute("href", `/admin/orders/${order.id}/invoice.pdf?preview=1`);
    expect(screen.getByRole("link", { name: "Download invoice" })).toHaveAttribute("href", `/admin/orders/${order.id}/invoice.pdf`);
    expect(screen.queryByRole("link", { name: "Help with order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reorder parts" })).not.toBeInTheDocument();
  });
});
