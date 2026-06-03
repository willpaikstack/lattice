// @vitest-environment node

import { describe, expect, it } from "vitest";

import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest } from "./request-model";
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

    const pdf = await buildRequestQuotePdf(request);
    const pdfText = new TextDecoder().decode(pdf);

    expect(pdfText.startsWith("%PDF-1.3")).toBe(true);
    expect(pdfText).toContain("/Type /Page");
    expect(pdfText).toContain("/Font");
    expect(pdf.byteLength).toBeGreaterThan(4_000);
  });
});
