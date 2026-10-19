import { buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion, type LatticeRequest } from "./request-model";
import { addBusinessDays, localDateKey } from "./quote-delivery-timing";

/** In-memory examples only: never read or write customer records. */
export function quoteTimingPreviewRequest(parts = 1, now = new Date()): LatticeRequest {
  const names = parts === 2 ? ["QA-AH-3-P1", "Mounting plate"] : ["QA-AH-3-P1"];
  const today = localDateKey(now);
  const request = submitDraftRequest(buildDraftRequest({
    buyerCompany: "Preview Manufacturing",
    requesterName: "Preview Customer",
    contact: { requesterEmail: "preview@example.com" },
    title: "Timing layout preview",
    process: "CNC Milling",
    files: names.map((name, index) => ({ name: `${name}.step`, type: "model/step", sizeBytes: 31_744, lineItemIndex: index })),
    lineItems: names.map((partName, index) => ({ partName, quantity: index === 0 ? 35 : 10, material: "A2 Tool Steel", surfaceFinish: "As machined (Ra 3.2 um / Ra 126 uin)", generalTolerance: "ISO 2768 Medium (m)", qualityDocumentation: ["Standard Inspection"] })),
  }));
  request.lineItems = request.lineItems.map((line, index) => ({ ...line, id: `preview-part-${index + 1}` }));
  const lines = request.lineItems.map((line, index) => ({ id: line.id, description: line.partName, process: "CNC Milling", material: line.material, finish: line.surfaceFinish ?? "", quantity: line.quantity, unitPrice: index === 0 ? 105 : 25, leadTimeDays: index === 0 ? 20 : 12 }));
  const totalCents = lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitPrice * 100), 0);
  const quote: CustomerQuoteVersion = {
    id: "preview-quote", versionNumber: 1, quoteNumber: "LQ-RFQ_43F1", quoteDate: today,
    validUntil: addBusinessDays(today, 15)!, customerCompany: request.buyerCompany, customerContact: request.requesterName,
    projectName: request.title, preparedBy: "Lattice", leadTime: "20 business days", shipping: "International", tax: "Calculated at checkout",
    notes: "Please see attached for the quote for your parts.", assumptions: "", clarifications: "", filesReviewed: "", lineItems: lines, totalCents, markdown: "", issuedAt: now.toISOString(),
  };
  return { ...request, id: "preview-timing-a", status: "QUOTED", createdAt: now.toISOString(), updatedAt: now.toISOString(),
    customerQuotes: [quote],
    quote: { ...request.quote, estimatedPriceCents: totalCents, leadTimeDays: 20, shippingCostCents: 45000, shippingMethod: "International", quoteCreatedDate: today, quoteValidUntil: quote.validUntil, estimatedDeliveryDate: addBusinessDays(today, 29)!, summary: quote.notes },
  };
}
