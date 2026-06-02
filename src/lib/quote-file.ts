import type { CustomerQuoteVersion, LatticeRequest } from "./request-model";

export type CustomerQuoteLineItem = {
  id: string;
  description: string;
  process: string;
  material: string;
  finish: string;
  quantity: number;
  unitPrice: number;
};

export type CustomerQuoteInput = {
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  customerCompany: string;
  customerContact: string;
  projectName: string;
  preparedBy: string;
  leadTime: string;
  shipping: string;
  tax: string;
  notes: string;
  assumptions: string;
  clarifications: string;
  filesReviewed: string;
  lineItems: CustomerQuoteLineItem[];
};

export function lineItemTotal(item: CustomerQuoteLineItem) {
  return item.quantity * item.unitPrice;
}

export function quoteSubtotal(lineItems: CustomerQuoteLineItem[]) {
  return lineItems.reduce((total, item) => total + lineItemTotal(item), 0);
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(value);
}

function listFromText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function quoteFileNamePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function customerQuoteFileName(quote: CustomerQuoteInput) {
  const quoteNumber = quoteFileNamePart(quote.quoteNumber) || "quote";
  const customer = quoteFileNamePart(quote.customerCompany) || "customer";

  return `${quoteNumber}-${customer}.md`;
}

export function customerQuotePdfFileName(quote: CustomerQuoteInput) {
  const quoteNumber = quoteFileNamePart(quote.quoteNumber) || "quote";
  const customer = quoteFileNamePart(quote.customerCompany) || "customer";

  return `${quoteNumber}-${customer}.pdf`;
}

function addDaysIsoFrom(dateValue: string, days: number) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildCustomerQuoteInputFromRequest(request: LatticeRequest): CustomerQuoteInput {
  const quoteDate = new Date().toISOString().slice(0, 10);

  return {
    assumptions: [
      "Customer-supplied CAD and drawings are complete and represent the latest revision.",
      "Pricing is based on the uploaded RFQ package and listed manufacturing requirements.",
      "Standard dimensional inspection is included unless additional documentation is listed.",
    ].join("\n"),
    clarifications: request.operatorReview.internalNotes,
    customerCompany: request.buyerCompany,
    customerContact: request.requesterName,
    filesReviewed: request.files.map((file) => file.name).join("\n"),
    leadTime: request.quote.leadTimeDays ? `${request.quote.leadTimeDays} business days` : "",
    lineItems: request.lineItems.map((item) => ({
      description: item.partName,
      finish: item.surfaceFinish ?? "",
      id: item.id,
      material: item.material,
      process: request.process,
      quantity: item.quantity,
      unitPrice: 0,
    })),
    notes: request.quote.summary || "Pricing includes manufacturing coordination, production, and standard inspection for the listed line items.",
    preparedBy: "Lattice",
    projectName: request.title,
    quoteDate,
    quoteNumber: `LQ-${request.id.slice(-8).toUpperCase()}`,
    shipping: "Billed at actual",
    tax: "Not included",
    validUntil: addDaysIsoFrom(quoteDate, 14),
  };
}

export function buildCustomerQuoteInputFromVersion(quote: CustomerQuoteVersion): CustomerQuoteInput {
  return {
    assumptions: quote.assumptions,
    clarifications: quote.clarifications,
    customerCompany: quote.customerCompany,
    customerContact: quote.customerContact,
    filesReviewed: quote.filesReviewed,
    leadTime: quote.leadTime,
    lineItems: quote.lineItems,
    notes: quote.notes,
    preparedBy: quote.preparedBy,
    projectName: quote.projectName,
    quoteDate: quote.quoteDate,
    quoteNumber: quote.quoteNumber,
    shipping: quote.shipping,
    tax: quote.tax,
    validUntil: quote.validUntil,
  };
}

export function buildCustomerQuoteMarkdown(quote: CustomerQuoteInput) {
  const subtotal = quoteSubtotal(quote.lineItems);
  const filesReviewed = listFromText(quote.filesReviewed);
  const assumptions = listFromText(quote.assumptions);
  const clarifications = listFromText(quote.clarifications);
  const hasClarifications = clarifications.length > 0;

  const lineRows = quote.lineItems.map((item, index) =>
    [
      index + 1,
      item.description || "Part / item",
      item.process || "TBD",
      item.material || "TBD",
      item.finish || "TBD",
      item.quantity,
      formatUsd(item.unitPrice),
      formatUsd(lineItemTotal(item)),
    ].join(" | "),
  );

  return `# Quote ${quote.quoteNumber || "[Quote number]"}

**Prepared for:** ${quote.customerCompany || "[Customer company]"}  
**Contact:** ${quote.customerContact || "[Customer contact]"}  
**Prepared by:** ${quote.preparedBy || "Lattice"}  
**RFQ / Project:** ${quote.projectName || "[Project name]"}  
**Quote date:** ${quote.quoteDate || "[Quote date]"}  
**Quote valid until:** ${quote.validUntil || "[Valid until]"}  

## Summary

Thank you for sending the design package for ${quote.projectName || "this project"}. Based on the supplied files, quantities, materials, and requested requirements, Lattice can support the work as quoted below.

${quote.notes.trim() ? `${quote.notes.trim()}\n` : ""}
## Design Package Reviewed

${filesReviewed.length ? filesReviewed.map((file) => `- ${file}`).join("\n") : "- [Design file / drawing reviewed]"}

## Quote Line Items

| Item | Part / Description | Process | Material | Finish | Qty | Unit Price | Line Total |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
${lineRows.join("\n")}

**Subtotal:** ${formatUsd(subtotal)}  
**Shipping:** ${quote.shipping || "Billed at actual"}  
**Tax:** ${quote.tax || "Not included"}  

## Total Quote

**Total:** ${formatUsd(subtotal)}

## Lead Time

Estimated production lead time is **${quote.leadTime || "[Lead time]"}** after written quote acceptance, purchase order approval, and final design release.

## Manufacturing Assumptions

${assumptions.length ? assumptions.map((assumption) => `- ${assumption}`).join("\n") : "- Customer-supplied CAD and drawings are complete and represent the latest revision."}

## Open Questions / Clarifications

${hasClarifications ? clarifications.map((clarification, index) => `${index + 1}. ${clarification}`).join("\n") : "No open questions at this time."}

## Acceptance

To accept this quote, reply with written approval and provide a purchase order referencing **Quote ${quote.quoteNumber || "[Quote number]"}**.
`;
}
