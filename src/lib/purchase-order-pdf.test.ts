import { describe, expect, it } from "vitest";

import { buildDraftRequest, submitDraftRequest, type LatticeRequest } from "./request-model";
import { buildRequestSupplierPurchaseOrderPdf, buildRequestSupplierPurchaseOrderPdfInput, supplierPurchaseOrderPdfFileName } from "./purchase-order-pdf";

function makePurchasedOrder(): LatticeRequest {
  const submitted = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: {
        shipToAddress1: "19 Morris Ave",
        shipToCity: "Brooklyn",
        shipToCompany: "Amogy",
        shipToName: "William Paik",
        shipToPhone: "+1 (929) 585-9892",
        shipToState: "NY",
        shipToZipCode: "11205",
      },
      dueDate: "2026-06-25",
      files: [{ name: "retainer.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [
        {
          material: "6061-T6 Aluminum",
          partName: "Retainer plate",
          quantity: 8,
          surfaceFinish: "As machined",
        },
      ],
      process: "CNC milling",
      requesterName: "William Paik",
      title: "Retainer plate production order",
    }),
  );

  return {
    ...submitted,
    status: "PURCHASED",
    updatedAt: "2026-06-14T12:00:00.000Z",
    customerQuotes: [
      {
        id: "customer_quote_1",
        versionNumber: 1,
        quoteNumber: "LQ-MQ9SEABV",
        quoteDate: "2026-06-14",
        validUntil: "2026-06-28",
        customerCompany: "Amogy Manufacturing",
        customerContact: "William Paik",
        projectName: "Retainer plate production order",
        preparedBy: "Lattice",
        leadTime: "12 business days",
        shipping: "International",
        tax: "0",
        notes: "",
        assumptions: "",
        clarifications: "",
        filesReviewed: "retainer.step",
        lineItems: [
          {
            id: submitted.lineItems[0].id,
            description: "Retainer plate",
            finish: "As machined",
            leadTimeDays: 12,
            material: "6061-T6 Aluminum",
            process: "CNC milling",
            quantity: 8,
            unitPrice: 475,
          },
        ],
        totalCents: 380000,
        markdown: "# Quote",
        issuedAt: "2026-06-14T12:00:00.000Z",
      },
    ],
    quote: {
      ...submitted.quote,
      estimatedPriceCents: 380000,
      leadTimeDays: 12,
      shippingTerms: "DDP",
    },
    supplierOrder: {
      ...submitted.supplierOrder,
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
        notes: "Selected supplier quote.",
        lineItems: [
          {
            id: submitted.lineItems[0].id,
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
  };
}

describe("supplier purchase order PDF", () => {
  it("builds DOC-002 supplier PO data from a selected structured shop quote", async () => {
    const order = makePurchasedOrder();
    const input = buildRequestSupplierPurchaseOrderPdfInput(order);

    expect(input).toMatchObject({
      poNumber: expect.stringMatching(/^LPO-/),
      relatedQuote: "LQ-MQ9SEABV",
      supplierContactLines: expect.arrayContaining(["Shenzhen Precision Manufacturing", "Country: China", "Attn: Li Wei"]),
      lineItems: [
        expect.objectContaining({
          item: "Retainer plate",
          quantity: 8,
          unitPrice: 300,
          amount: 2400,
        }),
      ],
    });
    expect(input?.otherCharges).toBe(0);
    expect(supplierPurchaseOrderPdfFileName(order)).toMatch(/^nexus-supplier-po-po-/);

    const pdf = await buildRequestSupplierPurchaseOrderPdf(order);

    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf?.byteLength).toBeGreaterThan(1000);
  });

  it("does not build a supplier PO when the selected shop quote has no structured lines", () => {
    const order = {
      ...makePurchasedOrder(),
      supplierQuotes: [
        {
          ...makePurchasedOrder().supplierQuotes[0],
          lineItems: [],
        },
      ],
    };

    expect(buildRequestSupplierPurchaseOrderPdfInput(order)).toBeNull();
    expect(buildRequestSupplierPurchaseOrderPdf(order)).toBeNull();
  });
});
