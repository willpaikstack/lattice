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
      estimatedDeliveryDate: "2026-07-05",
      estimatedPriceCents: 381500,
      leadTimeDays: 15,
      quoteCreatedDate: "2026-06-15",
      quoteValidUntil: "2026-07-15",
      shippingCostCents: 25000,
      shippingMethod: "International",
      shippingTerms: "DDP customer address",
      summary: "Accepted production quote.",
    },
    customerPurchaseOrderAttachment: {
      id: "customer_po_file_1",
      name: "amogy-po-1047.pdf",
      sizeBytes: 8192,
      type: "application/pdf",
      storageKey: "customer-purchase-orders/2026-06-15/amogy-po-1047.pdf",
      uploadedAt: "2026-06-15T12:00:00.000Z",
    },
    purchasePayment: {
      method: "PURCHASE_ORDER",
      status: "PENDING_REVIEW",
      customerPoNumber: "AMOGY-PO-1047",
      accountsPayableEmail: "ap@amogy.co",
      buyerCheckoutNotes: "Route invoice through AP.",
      card: null,
      stripe: {
        amountCents: null,
        checkoutSessionId: "",
        currency: "",
        paidAt: null,
        paymentIntentId: "",
      },
    },
    supplierOrder: {
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
      ).supplierOrder,
      shopName: "Shenzhen Precision Manufacturing",
      contactName: "Li Wei",
    },
    supplierQuotes: [
      {
        id: "supplier_quote_1",
        shopName: "Shenzhen Precision Manufacturing",
        country: "China",
        contactName: "Li Wei",
        status: "SELECTED",
        priceCents: 240000,
        leadTimeDays: 12,
        notes: "Selected shop quote.",
        lineItems: [
          {
            id: "line_item_1",
            description: "Retainer plate",
            drawingRevision: "Rev A",
            finish: "As machined",
            inspection: "Dimensional inspection report",
            leadTimeDays: 12,
            material: "6061-T6 Aluminum",
            process: "CNC milling",
            quantity: 8,
            supplierNotes: "Deburr all edges.",
            unitPrice: 300,
          },
        ],
        quotedAt: "2026-06-14T12:00:00.000Z",
        isSelected: true,
      },
    ],
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
          showSupplierQuoteFiles: true,
          supplierPurchaseOrderHref: `/admin/orders/${order.id}/supplier-purchase-order.pdf`,
          supplierPurchaseOrderPreviewHref: `/admin/orders/${order.id}/supplier-purchase-order.pdf?preview=1`,
          supplierQuoteReturnTo: `/admin/orders/${order.id}`,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Back to placed orders" })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getAllByRole("link", { name: "View invoice" })[0]).toHaveAttribute("href", `/admin/orders/${order.id}/invoice.pdf?preview=1`);
    expect(screen.getByRole("link", { name: "Download invoice" })).toHaveAttribute("href", `/admin/orders/${order.id}/invoice.pdf`);
    expect(screen.queryByRole("link", { name: "Help with order" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reorder parts" })).not.toBeInTheDocument();
    expect(screen.getByText("Customer purchase order")).toBeInTheDocument();
    expect(screen.getAllByText("amogy-po-1047.pdf").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Download PO" })[0]).toHaveAttribute(
      "href",
      "/api/local-files/customer-purchase-orders/2026-06-15/amogy-po-1047.pdf?name=amogy-po-1047.pdf",
    );
    expect(screen.getByText("Chinese shop quote")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View supplier PO" })[0]).toHaveAttribute("href", `/admin/orders/${order.id}/supplier-purchase-order.pdf?preview=1`);
    expect(screen.getAllByRole("link", { name: "Download supplier PO" })[0]).toHaveAttribute("href", `/admin/orders/${order.id}/supplier-purchase-order.pdf`);
    expect(screen.getByText("Supplier quote total")).toBeInTheDocument();
  });

  it("shows a supplier PO pending message when the selected shop quote is not structured", () => {
    const order = {
      ...makePurchasedOrder(),
      supplierQuotes: [
        {
          ...makePurchasedOrder().supplierQuotes[0],
          lineItems: [],
        },
      ],
    };

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
          showSupplierQuoteFiles: true,
          supplierPurchaseOrderHref: `/admin/orders/${order.id}/supplier-purchase-order.pdf`,
          supplierPurchaseOrderPreviewHref: `/admin/orders/${order.id}/supplier-purchase-order.pdf?preview=1`,
          supplierQuoteReturnTo: `/admin/orders/${order.id}`,
        }}
      />,
    );

    expect(screen.getByText("Supplier PO pending structured shop quote. Enter supplier line pricing and lead times before issuing this document.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View supplier PO" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Download supplier PO" })).not.toBeInTheDocument();
  });
});
