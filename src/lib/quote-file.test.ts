// @vitest-environment node

import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";
import { bundledFilesByLineItem, manufacturingReleaseDescriptionForRequestLine } from "./document-line-item-details";
import { buildRequestInvoicePdf, orderInvoicePdfFileName } from "./invoice-pdf";
import { buildCustomerQuoteMarkdown, customerQuoteFileName, customerQuotePdfFileName, formatUsd, quoteSubtotal, type CustomerQuoteInput } from "./quote-file";
import { buildCustomerQuotePdf, buildRequestQuotePdf } from "./quote-pdf";

const quote: CustomerQuoteInput = {
  assumptions: "General tolerances are +/- 0.005 in unless otherwise specified.\nStandard inspection is included.",
  clarifications: "Confirm material certification requirement.",
  customerCompany: "Apex Robotics",
  customerContact: "Maya Chen",
  filesReviewed: "bracket.step\nbracket.pdf",
  leadTime: "12-15 business days",
  lineItems: [
    {
      description: "Sensor bracket",
      finish: "Clear anodize",
      id: "line-1",
      material: "6061-T6 aluminum",
      process: "CNC machining",
      quantity: 50,
      unitPrice: 86,
    },
  ],
  notes: "Includes production coordination.",
  preparedBy: "Lattice",
  projectName: "Sensor Mount Bracket Pilot Run",
  quoteDate: "2026-05-26",
  quoteNumber: "LQ-2026-0142",
  shipping: "Billed at actual",
  tax: "Not included",
  validUntil: "2026-06-09",
};

describe("quote file helpers", () => {
  it("calculates totals and customer-facing markdown", () => {
    expect(quoteSubtotal(quote.lineItems)).toBe(4300);
    expect(formatUsd(4300)).toBe("$4,300.00");

    const markdown = buildCustomerQuoteMarkdown(quote);

    expect(markdown).toContain("# Quote LQ-2026-0142");
    expect(markdown).toContain("**Prepared for:** Apex Robotics");
    expect(markdown).toContain("Sensor bracket | CNC machining | 6061-T6 aluminum | Clear anodize | 50 | $86.00 | $4,300.00");
    expect(markdown).toContain("**Total:** $4,300.00");
    expect(markdown).toContain("1. Confirm material certification requirement.");
  });

  it("creates a stable markdown filename", () => {
    expect(customerQuoteFileName(quote)).toBe("lq-2026-0142-apex-robotics.md");
  });

  it("creates a stable PDF filename and PDF document", async () => {
    expect(customerQuotePdfFileName(quote)).toBe("lq-2026-0142-apex-robotics.pdf");

    const pdf = await buildCustomerQuotePdf(quote, { statusLabel: "Quoted" });
    const pdfText = new TextDecoder().decode(pdf);

    expect(pdfText.startsWith("%PDF-1.3")).toBe(true);
    expect(pdfText).toContain("/Type /Page");
    expect(pdfText).toContain("/Font");
    expect(pdf.byteLength).toBeGreaterThan(2_000);
  });

  it("creates a customer-facing order-summary PDF from a quoted request", async () => {
    const request = applyOperatorStatusUpdate(
      submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Apex Robotics",
          dueDate: "2026-06-10",
          files: [
            { name: "aluminum-plate.step", sizeBytes: 73_000, type: "application/octet-stream" },
            { name: "aluminum-plate-drawing.pdf", sizeBytes: 104_000, type: "application/pdf" },
          ],
          lineItems: [
            {
              generalTolerance: "ISO 2768 Medium (m)",
              material: "6061-T6 Aluminum",
              partName: "Aluminum Plate",
              qualityDocumentation: ["Standard Inspection"],
              quantity: 4,
              surfaceFinish: "As machined",
            },
          ],
          process: "CNC Milling",
          requesterName: "Maya Chen",
          title: "Aluminum Plate",
        }),
      ),
      {
        estimatedPriceCents: 50279,
        leadTimeDays: 15,
        quoteSummary: "Pricing includes production and standard inspection.",
        shippingCostCents: 32500,
        shippingMethod: "International",
        status: "QUOTED",
      },
    );
    const [{ drawingFile, lineItem }] = bundledFilesByLineItem(request);
    const description = manufacturingReleaseDescriptionForRequestLine(request, lineItem, drawingFile);

    expect(description).toBe(
      [
        "CNC Milling / 6061-T6 Aluminum / As machined",
        "Drawing: aluminum-plate-drawing.pdf; lead time: 15 business days",
        "Inspection/docs: Standard Inspection",
        "Final CAD and drawing package released for production.",
      ].join("\n"),
    );

    const pdf = await buildRequestQuotePdf(request);
    const pdfText = new TextDecoder().decode(pdf);

    expect(pdfText.startsWith("%PDF-1.3")).toBe(true);
    expect(pdfText).toContain("/Type /Page");
    expect(pdfText).toContain("/Font");
    expect(pdf.byteLength).toBeGreaterThan(4_000);
  });

  it("creates an invoice PDF from a purchased order", async () => {
    const quotedRequest = applyOperatorStatusUpdate(
      submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Apex Robotics",
          contact: {
            requesterEmail: "maya@example.com",
            requesterPhone: "+1 555 010 1000",
            shipToAddress1: "19 Morris Ave",
            shipToCity: "Brooklyn",
            shipToCompany: "Apex Robotics Receiving",
            shipToName: "Maya Chen",
            shipToState: "NY",
            shipToZipCode: "11205",
          },
          dueDate: "2026-06-10",
          files: [{ name: "aluminum-plate.step", sizeBytes: 73_000, type: "application/octet-stream" }],
          lineItems: [
            {
              material: "6061-T6 Aluminum",
              partName: "Aluminum Plate",
              quantity: 4,
              surfaceFinish: "As machined",
            },
          ],
          process: "CNC Milling",
          requesterName: "Maya Chen",
          title: "Aluminum Plate",
        }),
      ),
      {
        estimatedPriceCents: 50279,
        leadTimeDays: 15,
        quoteSummary: "Pricing includes production and standard inspection.",
        shippingCostCents: 32500,
        shippingMethod: "International",
        status: "QUOTED",
      },
    );
    const order = {
      ...quotedRequest,
      customerQuotes: [
        {
          assumptions: "",
          clarifications: "",
          customerCompany: quotedRequest.buyerCompany,
          customerContact: quotedRequest.requesterName,
          filesReviewed: "aluminum-plate.step",
          id: "quote_version_1",
          issuedAt: "2026-06-05T11:00:00.000Z",
          leadTime: "15 business days",
          lineItems: [
            {
              description: "Aluminum Plate",
              finish: "As machined",
              id: quotedRequest.lineItems[0].id,
              material: "6061-T6 Aluminum",
              process: "CNC Milling",
              quantity: 4,
              unitPrice: 125.7,
            },
          ],
          markdown: "",
          notes: "",
          preparedBy: "Lattice",
          projectName: quotedRequest.title,
          quoteDate: "2026-06-05",
          quoteNumber: "Q-100001",
          shipping: "DDP Customer Address",
          tax: "",
          totalCents: 50280,
          validUntil: "2026-07-05",
          versionNumber: 1,
        },
      ],
      quote: {
        ...quotedRequest.quote,
        shippingTerms: "DDP Customer Address",
      },
      status: "PURCHASED" as const,
      statusEvents: [
        ...quotedRequest.statusEvents,
        {
          actor: "buyer" as const,
          at: "2026-06-05T12:00:00.000Z",
          from: "QUOTED" as const,
          id: "event_purchase",
          to: "PURCHASED" as const,
        },
      ],
      updatedAt: "2026-06-05T12:00:00.000Z",
    };
    const [{ drawingFile, lineItem }] = bundledFilesByLineItem(order);
    const description = manufacturingReleaseDescriptionForRequestLine(order, lineItem, drawingFile);

    expect(description).toBe(
      [
        "CNC Milling / 6061-T6 Aluminum / As machined",
        "Drawing: Final released drawing; lead time: 15 business days",
        "Inspection/docs: Standard Inspection",
        "Final CAD and drawing package released for production.",
      ].join("\n"),
    );

    expect(orderInvoicePdfFileName(order)).toMatch(/^inv-/);

    const pdf = await buildRequestInvoicePdf(order);
    const pdfText = new TextDecoder().decode(pdf);

    expect(pdfText.startsWith("%PDF-1.3")).toBe(true);
    expect(pdfText).toContain("/Type /Page");
    expect(pdfText).toContain("/Font");
    expect(pdfText).toContain(Buffer.from("Quote Number").toString("hex"));
    expect(pdfText).toContain(Buffer.from("Q-100001").toString("hex"));
    expect(pdfText).toContain(Buffer.from("Shipping ").toString("hex"));
    expect(pdfText).toContain(Buffer.from("DDP Customer Ad").toString("hex"));
    expect(pdf.byteLength).toBeGreaterThan(3_000);
  });
});
