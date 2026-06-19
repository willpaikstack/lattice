import { createRequire } from "node:module";

import { bundledFilesByLineItem, manufacturingReleaseDescription, manufacturingReleaseDescriptionForRequestLine } from "./document-line-item-details";
import { formatUsd } from "./quote-file";
import { quotedLineForRequestItem, requestShipToLines, type LatticeRequest, type RequestLineItem, type UploadedFile } from "./request-model";

const requireFromHere = createRequire(import.meta.url);
const PDFDocument = requireFromHere("pdfkit") as typeof import("pdfkit");

const letterWidth = 612;
const sellerName = "Nexus Manufacturing Technologies, Inc.";
const sellerAddress = ["169 Madison Ave, #17525", "New York, NY 10016"];
const sellerEmail = "mfg@latticeos.co";
const remittanceRows: Array<[string, string]> = [
  ["Account holder name", "Nexus Manufacturing Technologies Inc"],
  ["Bank name", "Fifth Third Bank, National Association"],
  ["Account number", "27001005816610508"],
  ["Routing number", "071919133"],
  ["Remittance email", sellerEmail],
];
const textColor = "#101820";
const mutedColor = "#54606d";
const ruleColor = "#1f2933";
const lightRuleColor = "#d7dce0";
const accentFill = "#f3f5f7";
const defaultSalesTaxRate = 0.0825;

export type InvoiceLineItem = {
  amount: number;
  description: string;
  item: string;
  notes?: string;
  quantity: number;
  unitPrice: number;
};

export type InvoicePdfInput = {
  amountPaid: number;
  billToLines: string[];
  customerNumber?: string;
  customerPo: string;
  dueDate?: string;
  invoiceDate: string;
  invoiceNumber: string;
  lineItems: InvoiceLineItem[];
  paymentTerms: string;
  quoteNumber?: string;
  shipToLines: string[];
  salesTaxAmount?: number;
  shippingAmount: number;
  shippingTerms?: string;
};

function createPdf(options: PDFKit.PDFDocumentOptions) {
  const doc = new PDFDocument(options);
  const chunks: Buffer[] = [];
  const done = new Promise<Uint8Array>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(new Uint8Array(Buffer.concat(chunks))));
    doc.on("error", reject);
  });

  return { doc, done };
}

function safeText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safeText(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function invoiceTemplateInput(): InvoicePdfInput {
  const lineItems = [
    {
      amount: 1665.92,
      description: manufacturingReleaseDescription({
        drawing: "Rev A",
        finish: "As machined",
        inspection: "Dimensional report and production photos",
        leadTime: "12 business days",
        material: "6061-T6 aluminum",
        note: "Final CAD and drawing package released for production.",
        process: "CNC machining",
      }),
      item: "aluminum_plate.step",
      quantity: 8,
      unitPrice: 208.24,
    },
    {
      amount: 687.12,
      description: manufacturingReleaseDescription({
        drawing: "Rev A",
        finish: "Clear anodize",
        inspection: "Material cert and final inspection photos",
        leadTime: "14 business days",
        material: "6061-T6 aluminum",
        note: "Machine to supplied model and drawing callouts.",
        process: "CNC machining",
      }),
      item: "tubesheet_retainer_plate.step",
      quantity: 4,
      unitPrice: 171.78,
    },
  ];

  return {
    amountPaid: 0,
    billToLines: ["Customer legal name", "Attn: Accounts Payable", "19 Morris Ave", "Brooklyn, NY 11205", "ap@example.com"],
    customerNumber: "CUST-[####]",
    customerPo: "[####]",
    dueDate: "2026-06-03",
    invoiceDate: "2026-05-04",
    invoiceNumber: "INV-[######]",
    lineItems,
    paymentTerms: "100% Payment in Advance",
    quoteNumber: "Q-[######]",
    shipToLines: ["Receiving contact", "Customer company", "19 Morris Ave", "Brooklyn, NY 11205", "+1 (555) 010-0000"],
    shippingAmount: 185,
    shippingTerms: "DDP Customer Address",
  };
}

function centsToUsd(cents: number) {
  return Math.round(cents) / 100;
}

function orderReference(order: LatticeRequest) {
  if (order.purchasePayment.customerPoNumber) {
    return order.purchasePayment.customerPoNumber;
  }

  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function invoiceReference(order: LatticeRequest) {
  return `INV-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function quoteReference(order: LatticeRequest) {
  return order.customerQuotes.at(-1)?.quoteNumber ?? `Q-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function orderedDate(order: LatticeRequest) {
  const purchasedEvent = order.statusEvents.findLast((event) => event.to === "PURCHASED");
  return (purchasedEvent?.at ?? order.updatedAt).slice(0, 10);
}

function invoiceLineForOrderItem(order: LatticeRequest, item: RequestLineItem, drawingFile?: UploadedFile | null, cadFile?: UploadedFile | null): InvoiceLineItem {
  const latestQuote = order.customerQuotes.at(-1);
  const quotedLine = quotedLineForRequestItem(latestQuote?.lineItems, item);
  const quantity = quotedLine?.quantity || item.quantity || 0;
  const unitPrice = quotedLine?.unitPrice ?? (order.lineItems.length === 1 && order.quote.estimatedPriceCents !== null && quantity > 0 ? centsToUsd(order.quote.estimatedPriceCents) / quantity : 0);

  return {
    amount: unitPrice * quantity,
    description: manufacturingReleaseDescriptionForRequestLine(order, item, drawingFile),
    item: cadFile?.name || quotedLine?.description || item.partName,
    quantity,
    unitPrice,
  };
}

export function orderInvoicePdfFileName(order: LatticeRequest) {
  const invoiceNumber = invoiceReference(order).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const company = safeText(order.buyerCompany).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "customer";
  return `${invoiceNumber}-${company}.pdf`;
}

function invoiceInputForOrder(order: LatticeRequest): InvoicePdfInput {
  const invoiceDate = orderedDate(order);
  const billToLines = [order.requesterName, order.buyerCompany, order.requesterEmail, order.requesterPhone].map(safeText).filter(Boolean);
  const shipToLines = requestShipToLines({
    shipToAddress1: order.shipToAddress1,
    shipToAddress2: order.shipToAddress2,
    shipToCity: order.shipToCity,
    shipToCompany: order.shipToCompany || order.buyerCompany,
    shipToName: order.shipToName || order.requesterName,
    shipToPhone: order.shipToPhone || order.requesterPhone,
    shipToState: order.shipToState,
    shipToZipCode: order.shipToZipCode,
  }).map(safeText).filter(Boolean);

  return {
    amountPaid: 0,
    billToLines: billToLines.length ? billToLines : [order.buyerCompany || "Customer"],
    customerNumber: `CUST-${order.buyerCompany.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "PENDING"}`,
    customerPo: orderReference(order),
    dueDate: invoiceDate,
    invoiceDate,
    invoiceNumber: invoiceReference(order),
    lineItems: bundledFilesByLineItem(order).map(({ cadFile, drawingFile, lineItem }) => invoiceLineForOrderItem(order, lineItem, drawingFile, cadFile)),
    paymentTerms: "100% Payment in Advance",
    quoteNumber: quoteReference(order),
    shipToLines: shipToLines.length ? shipToLines : [order.shipToCompany || order.buyerCompany || "Ship-to pending"],
    shippingAmount: centsToUsd(order.quote.shippingCostCents ?? 0),
    shippingTerms: order.quote.shippingTerms || undefined,
  };
}

function metadataColumn(doc: PDFKit.PDFDocument, rows: Array<[string, string]>, x: number, y: number, width: number) {
  let cursorY = y;

  rows.forEach(([label, value]) => {
    const labelText = `${label}:`;
    const cleanValue = safeText(value) || "-";
    const labelWidth = doc.font("Helvetica").fontSize(8.2).widthOfString(labelText) + 5;
    const valueWidth = Math.max(48, width - labelWidth);

    doc.font("Helvetica").fontSize(8.2).fillColor(mutedColor).text(labelText, x, cursorY, { width: labelWidth });
    doc.font("Helvetica-Bold").fontSize(8.4).fillColor(textColor).text(cleanValue, x + labelWidth, cursorY, { lineGap: 0.5, width: valueWidth });
    cursorY += Math.max(13, doc.heightOfString(cleanValue, { lineGap: 0.5, width: valueWidth }) + 3);
  });

  return cursorY;
}

function addressBlock(doc: PDFKit.PDFDocument, title: string, lines: string[], x: number, y: number, width: number) {
  doc.font("Helvetica-Bold").fontSize(9).fillColor(textColor).text(title, x, y, { width });
  doc.moveTo(x, y + 14).lineTo(x + width, y + 14).lineWidth(0.8).stroke(ruleColor);
  let cursorY = y + 25;

  lines.forEach((line, index) => {
    const cleanLine = safeText(line);
    doc
      .font(index === 0 ? "Helvetica-Bold" : "Helvetica")
      .fontSize(9)
      .fillColor(cleanLine.includes("@") ? "#1473e6" : textColor)
      .text(cleanLine || " ", x, cursorY, { width });
    cursorY += 13;
  });
}

function drawRemittancePage(doc: PDFKit.PDFDocument, invoice: InvoicePdfInput) {
  const left = 42;
  const right = letterWidth - 42;
  const width = right - left;

  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(15).fillColor(textColor).text("Remittance instructions", left, 44, { width });
  doc.moveTo(left, 76).lineTo(right, 76).lineWidth(1).stroke(ruleColor);

  const sectionY = 104;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor).text("ACH / direct deposit", left, sectionY, { width: 220 });
  doc.font("Helvetica").fontSize(9);
  remittanceRows.forEach(([label, value], index) => {
    const rowY = sectionY + 28 + index * 18;
    doc.font("Helvetica").fillColor(mutedColor).text(label, left, rowY, { width: 148 });
    doc.font("Helvetica-Bold").fillColor(textColor).text(value, left + 158, rowY, { width: width - 158 });
  });

  const refsY = sectionY + 28 + remittanceRows.length * 18 + 24;
  doc.rect(left, refsY, width, 68).fill(accentFill);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor).text("Payment reference requirements", left + 18, refsY + 16, { width: width - 36 });
  doc.font("Helvetica").fontSize(9).fillColor(textColor);
  [
    `Invoice ID: ${invoice.invoiceNumber}`,
    `Customer PO: ${invoice.customerPo}`,
  ].forEach((line, index) => {
    doc.text(line, left + 18, refsY + 38 + index * 14, { width: width - 36 });
  });

  const termsY = 426;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor).text("Invoice terms", left, termsY, { width });
  doc.moveTo(left, termsY + 16).lineTo(right, termsY + 16).lineWidth(0.8).stroke(ruleColor);
  doc.font("Helvetica").fontSize(8.4).fillColor(textColor);
  [
    "Payment terms are 100% Payment in Advance and should reference the invoice ID and customer PO number.",
    "Invoice line items reflect the accepted quote, customer PO, shipment milestone, or approved change order listed on the invoice.",
    "Sales tax, freight, customs brokerage, duties, or other pass-through charges are billed only when listed on the invoice or required by accepted purchasing terms.",
    "Invoice disputes must identify the affected line item, reason, and supporting documentation so Nexus can reconcile the order record.",
  ].forEach((term, index) => {
    doc.text(term, left, termsY + 30 + index * 34, { lineGap: 1.5, width });
  });
}

function buildInvoicePdf(invoice: InvoicePdfInput) {
  const subtotal = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const salesTax = invoice.salesTaxAmount ?? Math.round(subtotal * defaultSalesTaxRate * 100) / 100;
  const total = subtotal + invoice.shippingAmount + salesTax;
  const amountDue = total - invoice.amountPaid;
  const { doc, done } = createPdf({ compress: false, margin: 42, size: "LETTER" });
  const left = 42;
  const right = letterWidth - 42;
  const width = right - left;

  const shipToX = left + 278;
  const sideColumnWidth = 232;
  const metaX = shipToX;
  const companyY = 88;
  // Quote Number traces Customer RFQ -> Nexus Quote -> Customer PO -> Invoice.
  // Shipping Terms define delivery responsibility and should match the accepted quotation and purchase order.
  const metadataRows: Array<[string, string]> = [
    ["Invoice ID", invoice.invoiceNumber],
    ["Invoice date", formatDate(invoice.invoiceDate)],
    ["Payment terms", invoice.paymentTerms],
    ...(invoice.dueDate ? [["Due date", formatDate(invoice.dueDate)] as [string, string]] : []),
    ...(invoice.customerNumber ? [["Customer ID", invoice.customerNumber] as [string, string]] : []),
    ...(invoice.quoteNumber ? [["Quote Number", invoice.quoteNumber] as [string, string]] : []),
    ["Customer PO", invoice.customerPo],
    ...(invoice.shippingTerms ? [["Shipping Terms", invoice.shippingTerms] as [string, string]] : []),
  ];
  const headerRuleY = 202;

  metadataColumn(doc, metadataRows, metaX, companyY, sideColumnWidth);

  doc.font("Helvetica-Bold").fontSize(28).fillColor(textColor).text("Invoice", left, 42, { width: 220 });
  doc.font("Helvetica-Bold").fontSize(13).fillColor(textColor).text(sellerName, left, companyY, { width: 250 });
  doc.font("Helvetica").fontSize(8.7).fillColor(textColor).text([...sellerAddress, sellerEmail].join("\n"), left, 110, { lineGap: 2, width: 220 });

  const addressY = headerRuleY + 24;
  addressBlock(doc, "Bill To", invoice.billToLines, left, addressY, 232);
  addressBlock(doc, "Ship To", invoice.shipToLines, shipToX, addressY, sideColumnWidth);

  let y = addressY + 132;
  doc.rect(left, y, width, 28).fill(accentFill);
  doc.font("Helvetica-Bold").fontSize(8.2).fillColor(textColor);
  doc.text("#", left + 10, y + 10, { width: 24 });
  doc.text("Item", left + 42, y + 10, { width: 142 });
  doc.text("Description", left + 194, y + 10, { width: 188 });
  doc.text("Qty", right - 172, y + 10, { align: "right", width: 32 });
  doc.text("Unit price", right - 130, y + 10, { align: "right", width: 62 });
  doc.text("Amount", right - 58, y + 10, { align: "right", width: 58 });
  y += 42;

  invoice.lineItems.forEach((item, index) => {
    const rowY = y;
    const detail = [item.description, item.notes].filter(Boolean).join("\n");
    const rowHeight = Math.max(58, doc.heightOfString(detail, { lineGap: 2, width: 188 }) + 18);

    doc.font("Helvetica").fontSize(8.8).fillColor(textColor).text(String(index + 1), left + 10, rowY, { width: 24 });
    doc.font("Helvetica-Bold").text(safeText(item.item), left + 42, rowY, { width: 142 });
    doc.font("Helvetica").fontSize(8.2).text(detail, left + 194, rowY, { lineGap: 2, width: 188 });
    doc.font("Helvetica").fontSize(8.8).text(String(item.quantity), right - 172, rowY, { align: "right", width: 32 });
    doc.text(formatUsd(item.unitPrice), right - 130, rowY, { align: "right", width: 62 });
    doc.font("Helvetica-Bold").text(formatUsd(item.amount), right - 58, rowY, { align: "right", width: 58 });
    y += rowHeight;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.45).stroke(lightRuleColor);
    y += 12;
  });

  const totalsX = right - 224;
  y = Math.max(y, 590);
  [
    ["Subtotal", formatUsd(subtotal), false],
    ["Shipping / freight", formatUsd(invoice.shippingAmount), false],
    ["Sales tax", formatUsd(salesTax), false],
    ["Amount paid", formatUsd(invoice.amountPaid), false],
    ["Amount due", formatUsd(amountDue), true],
  ].forEach(([label, value, isTotal], index) => {
    const rowY = y + index * 24;
    doc.font(isTotal ? "Helvetica-Bold" : "Helvetica").fontSize(isTotal ? 11 : 9).fillColor(textColor).text(String(label), totalsX, rowY, { width: 118 });
    doc.text(String(value), totalsX + 118, rowY, { align: "right", width: 106 });
  });

  doc.font("Helvetica-Bold").fontSize(8.8).fillColor(textColor).text("Payment note", left, y, { width: 120 });
  doc
    .font("Helvetica")
    .fontSize(8.4)
    .text("Please reference invoice ID and customer PO number with payment.", left, y + 16, {
      lineGap: 1.5,
      width: 270,
    });
  doc.text("ACH payment instructions are listed on the remittance page.", left, y + 50, { width: 270 });

  drawRemittancePage(doc, invoice);

  doc.end();
  return done;
}

export function buildDomesticInvoiceTemplatePdf() {
  return buildInvoicePdf(invoiceTemplateInput());
}

export function buildRequestInvoicePdf(order: LatticeRequest) {
  return buildInvoicePdf(invoiceInputForOrder(order));
}
