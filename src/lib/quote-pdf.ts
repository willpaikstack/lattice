import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { formatUsd, lineItemTotal, quoteSubtotal, type CustomerQuoteInput } from "./quote-file";
import type { LatticeRequest, RequestLineItem, UploadedFile } from "./request-model";

type QuotePdfOptions = {
  pricingPending?: boolean;
  statusLabel?: string;
};

const letterWidth = 612;
const letterHeight = 792;
const requireFromHere = createRequire(import.meta.url);
const PDFDocument = requireFromHere("pdfkit") as typeof import("pdfkit");
const regularFont = "Helvetica";
const boldFont = "Helvetica-Bold";
const latticeAddress = "169 Madison Ave, #17525\nNew York, NY 10016";
const latticeEmail = "mfg@latticeos.co";
const latticeWebsite = "Latticeos.co";
const latticePaymentTerms = "100% Payment in Advance";
const latticeBannerPath = path.join(process.cwd(), "resources", "admin", "brand", "lattice-os-signature-banner.png");

function safeText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

function formatMaybePending(value: number, pending: boolean) {
  return pending ? "Pending" : formatUsd(value);
}

function formatPriceCents(cents: number | null) {
  return cents === null ? "Pending" : formatUsd(cents / 100);
}

function localDate(value: string | null) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return dateOnlyMatch ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])) : new Date(value);
}

function formatDate(value: string | null) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function addDaysIso(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function listFromText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isDrawingFile(file: UploadedFile) {
  return /\.(pdf|dwg|dxf|png|jpg|jpeg)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type);
}

function isCadFile(file: UploadedFile) {
  return /\.(step|stp|iges|igs|sldprt|x_t|x_b|sat|ipt)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type);
}

function bundledFilesByLineItem(request: LatticeRequest) {
  const cadFiles = request.files.filter(isCadFile);
  const drawingFiles = request.files.filter(isDrawingFile);

  return request.lineItems.map((lineItem, index) => ({
    cadFile: cadFiles[index] ?? null,
    drawingFile: drawingFiles[index] ?? null,
    lineItem,
  }));
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function customerLineForItem(request: LatticeRequest, item: RequestLineItem) {
  return request.customerQuotes.at(-1)?.lineItems.find((line) => line.description === item.partName || line.id === item.id) ?? null;
}

function lineItemTotalCents(request: LatticeRequest, item: RequestLineItem) {
  const customerLine = customerLineForItem(request, item);

  if (customerLine) {
    return Math.round(customerLine.unitPrice * customerLine.quantity * 100);
  }

  if (request.lineItems.length === 1) {
    return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  }

  return null;
}

function lineItemUnitCents(request: LatticeRequest, item: RequestLineItem) {
  const total = lineItemTotalCents(request, item);

  if (total === null || item.quantity <= 0) {
    return null;
  }

  return Math.round(total / item.quantity);
}

function quoteSubtotalCents(request: LatticeRequest) {
  const latestCustomerQuote = request.customerQuotes.at(-1);

  if (latestCustomerQuote) {
    return latestCustomerQuote.totalCents;
  }

  return request.quote.estimatedPriceCents;
}

function productionRegion(request: LatticeRequest) {
  return request.quote.shippingMethod === "Domestic" ? "Domestic" : "Overseas";
}

function configurationText(request: LatticeRequest, item: RequestLineItem) {
  return [request.process, item.material, item.generalTolerance, item.surfaceFinish || "No finish (as machined)", ...(item.qualityDocumentation ?? [])].filter(Boolean).join(", ");
}

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number, topY = 42) {
  if (doc.y + neededHeight > letterHeight - 46) {
    doc.addPage();
    doc.y = topY;
  }
}

function mutedLabel(doc: PDFKit.PDFDocument, value: string, x: number, y: number, width: number) {
  doc.font(boldFont).fontSize(7.5).fillColor("#6b7280").text(safeText(value).toUpperCase(), x, y, { width });
  doc.fillColor("#111111");
}

function summaryAmountRow(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, width: number, bold = false) {
  doc.font(bold ? boldFont : regularFont).fontSize(bold ? 14 : 9).fillColor("#111111");
  doc.text(safeText(label), x, y, { width: width * 0.58 });
  doc.text(safeText(value), x + width * 0.58, y, { align: "right", width: width * 0.42 });
}

function drawLatticeBanner(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
  if (fs.existsSync(latticeBannerPath)) {
    doc.image(latticeBannerPath, x, y, { width });
    return;
  }

  doc.font(boldFont).fontSize(15).fillColor("#111111").text("Lattice OS", x, y + 8, { width });
}

export function buildCustomerQuotePdf(quote: CustomerQuoteInput, options: QuotePdfOptions = {}) {
  const { doc, done } = createPdf({ compress: false, margin: 54, size: "LETTER" });
  const subtotal = quoteSubtotal(quote.lineItems);
  const pricingPending = options.pricingPending ?? quote.lineItems.every((item) => item.unitPrice <= 0);

  doc.font(boldFont).fontSize(11).text("Lattice OS");
  doc.moveDown(0.4);
  doc.fontSize(24).text(`Quote ${safeText(quote.quoteNumber) || "Pending"}`);
  if (options.statusLabel) {
    doc.moveDown(0.15);
    doc.fontSize(11).text(safeText(options.statusLabel));
  }

  doc.moveDown(1);
  doc.font(regularFont).fontSize(10);
  [
    ["Prepared for", quote.customerCompany],
    ["Contact", quote.customerContact],
    ["RFQ / Project", quote.projectName],
    ["Prepared by", quote.preparedBy || "Lattice OS"],
    ["Quote date", quote.quoteDate],
    ["Valid until", quote.validUntil],
  ].forEach(([label, value]) => doc.text(`${label}: ${safeText(value) || "Pending"}`));

  doc.moveDown(1.2);
  doc.font(boldFont).fontSize(10).text("SUMMARY");
  doc.moveTo(54, doc.y + 4).lineTo(letterWidth - 54, doc.y + 4).stroke("#111111");
  doc.moveDown(1);
  doc.font(regularFont).fontSize(10).text(safeText(quote.notes) || `Lattice quote package for ${safeText(quote.projectName) || "this project"}.`, { lineGap: 2 });

  doc.moveDown(1.2);
  doc.font(boldFont).fontSize(10).text("COMMERCIALS");
  doc.moveDown(0.5);
  doc.font(regularFont).fontSize(10);
  doc.text(`Subtotal: ${formatMaybePending(subtotal, pricingPending)}`);
  doc.text(`Shipping: ${safeText(quote.shipping) || "Billed at actual"}`);
  doc.text(`Tax: ${safeText(quote.tax) || "Excluded unless explicitly listed"}`);
  doc.text(`Total: ${formatMaybePending(subtotal, pricingPending)}`);
  doc.text(`Lead time: ${safeText(quote.leadTime) || "Pending"}`);

  doc.moveDown(1.2);
  doc.font(boldFont).fontSize(10).text("LINE ITEMS");
  doc.moveDown(0.5);
  quote.lineItems.forEach((item, index) => {
    ensureSpace(doc, 84);
    doc.font(boldFont).fontSize(10).text(`${index + 1}. ${safeText(item.description) || "Part / item"}`);
    doc.font(regularFont).fontSize(9);
    doc.text(`Process: ${safeText(item.process) || "TBD"}`);
    doc.text(`Material: ${safeText(item.material) || "TBD"}`);
    doc.text(`Finish: ${safeText(item.finish) || "TBD"}`);
    doc.text(`Qty: ${item.quantity}    Unit price: ${formatMaybePending(item.unitPrice, pricingPending)}    Line total: ${formatMaybePending(lineItemTotal(item), pricingPending)}`);
    doc.moveDown(0.6);
  });

  doc.moveDown(0.8);
  doc.font(boldFont).fontSize(10).text("DESIGN PACKAGE REVIEWED");
  doc.font(regularFont).fontSize(9);
  const files = listFromText(quote.filesReviewed);
  (files.length ? files : ["Design file / drawing reviewed"]).forEach((file) => doc.text(`- ${safeText(file)}`));

  doc.moveDown(0.8);
  doc.font(boldFont).fontSize(10).text("MANUFACTURING ASSUMPTIONS");
  doc.font(regularFont).fontSize(9);
  const assumptions = listFromText(quote.assumptions);
  (assumptions.length ? assumptions : ["Customer-supplied CAD and drawings are complete and represent the latest revision."]).forEach((assumption) =>
    doc.text(`- ${safeText(assumption)}`, { lineGap: 2 }),
  );

  doc.end();
  return done;
}

export function buildRequestQuotePdf(request: LatticeRequest) {
  const { doc, done } = createPdf({ compress: false, margin: 36, size: "LETTER" });
  const left = 36;
  const right = letterWidth - 36;
  const width = right - left;
  const latestQuote = request.customerQuotes.at(-1);
  const subtotalCents = quoteSubtotalCents(request);
  const shippingCents = request.quote.shippingCostCents;
  const taxCents = subtotalCents === null ? null : 0;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (taxCents ?? 0);
  const quoteDate = request.quote.quoteCreatedDate || latestQuote?.quoteDate || latestQuote?.issuedAt.slice(0, 10) || request.updatedAt.slice(0, 10);
  const validUntil = request.quote.quoteValidUntil || latestQuote?.validUntil || addDaysIso(quoteDate, 14);
  const leadTime = request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days (${productionRegion(request)})` : latestQuote?.leadTime || "Pending";
  const estimatedDelivery = request.quote.estimatedDeliveryDate || request.dueDate;
  const shippingTerms = request.quote.shippingTerms || "Determined at Checkout";
  const shippingMethod = request.quote.shippingMethod || "International";

  doc.fillColor("#111111");
  drawLatticeBanner(doc, left, 36, 205);
  doc.font(boldFont).fontSize(9).text(`Quote ID: ${quoteReference(request)}`, left, 108);
  doc.font(regularFont).fontSize(8).text(latticeAddress, left, 124, { lineGap: 2 }).text(latticeEmail, left, 158).text(latticeWebsite, left, 172);
  doc.text(`Created on: ${formatDate(quoteDate)}`, right - 190, 42, { width: 190 });
  doc.text(`Quote valid until: ${formatDate(validUntil)}`, right - 190, 56, { width: 190 });
  doc.fontSize(7.5).text("For quote inquiries, contact Lattice OS", right - 190, 82, { width: 190 });
  doc.font(boldFont).fontSize(8).text("Lattice OS Manufacturing", right - 190, 98, { width: 190 });
  doc.font(regularFont).fontSize(7.5).text(latticeEmail, right - 190, 112, { width: 190 }).text(latticeWebsite, right - 190, 126, { width: 190 });

  const infoY = 164;
  mutedLabel(doc, "Prepared For", left, infoY, 130);
  doc.font(boldFont).fontSize(9).text(safeText(request.requesterName), left, infoY + 18, { width: 135 });
  doc.font(regularFont).fontSize(8).text(safeText(request.buyerCompany), left, infoY + 32, { width: 135 });

  mutedLabel(doc, "Ship to", left + 160, infoY, 145);
  doc.font(boldFont).fontSize(9).text(safeText(request.buyerCompany), left + 160, infoY + 18, { width: 145 });
  doc.font(regularFont).fontSize(8).text("Ship-to address to be confirmed at checkout.", left + 160, infoY + 32, { lineGap: 2, width: 145 });

  mutedLabel(doc, "Order production speed", left + 345, infoY, 150);
  doc.font(regularFont).fontSize(8).text(safeText(leadTime), left + 345, infoY + 18, { width: 150 });
  mutedLabel(doc, "Estimated delivery", left + 345, infoY + 40, 150);
  doc.font(regularFont).fontSize(8).text(formatDate(estimatedDelivery), left + 345, infoY + 58, { width: 150 });
  mutedLabel(doc, "Shipping method", left + 345, infoY + 80, 150);
  doc.font(regularFont).fontSize(8).text(safeText(shippingMethod), left + 345, infoY + 98, { width: 150 });
  mutedLabel(doc, "Shipping terms", left + 345, infoY + 120, 150);
  doc.font(regularFont).fontSize(8).text(safeText(shippingTerms), left + 345, infoY + 138, { width: 150 });
  mutedLabel(doc, "Payment terms", left + 345, infoY + 160, 150);
  doc.font(regularFont).fontSize(8).text(latticePaymentTerms, left + 345, infoY + 178, { width: 150 });

  let y = 340;
  doc.rect(left, y, width, 42).fill("#f0f0f0");
  doc.fillColor("#111111").font(boldFont).fontSize(17).text("SUMMARY OF ORDER", left + 12, y + 13, { width: 260 });
  doc.text(`ORDER TOTAL ${formatPriceCents(totalCents)}`, left + 300, y + 13, { align: "right", width: width - 312 });
  y += 70;

  const columns = {
    details: { width: 258, x: left + 52 },
    index: { width: 30, x: left + 12 },
    production: { width: 62, x: left + 328 },
    quantity: { width: 24, x: right - 148 },
    subtotal: { width: 50, x: right - 50 },
    unit: { width: 58, x: right - 112 },
  };

  doc.font(boldFont).fontSize(7.8);
  doc.text("#", columns.index.x, y);
  doc.text("Part details (Prototype)", columns.details.x, y, { width: columns.details.width });
  doc.text("Production region", columns.production.x, y, { width: columns.production.width });
  doc.text("Qty", columns.quantity.x, y, { align: "right", width: columns.quantity.width });
  doc.text("Unit price", columns.unit.x, y, { align: "right", width: columns.unit.width });
  doc.text("Subtotal", columns.subtotal.x, y, { align: "right", width: columns.subtotal.width });
  y += 26;
  doc.lineWidth(2.4).moveTo(left, y).lineTo(right, y).stroke("#111111");
  y += 20;

  bundledFilesByLineItem(request).forEach(({ cadFile, drawingFile, lineItem }, index) => {
    const fileLines = [cadFile ? `[Rev 1] ${cadFile.name}` : `[Rev 1] ${lineItem.partName}`, drawingFile?.name].filter(Boolean).map((line) => safeText(line));
    const config = safeText(configurationText(request, lineItem));
    const detailsHeight = fileLines.reduce((height, line) => height + doc.heightOfString(line, { width: columns.details.width }), 0) + doc.heightOfString(lineItem.partName, { width: columns.details.width }) + doc.heightOfString(config, { width: columns.details.width }) + 18;
    const rowHeight = Math.max(104, detailsHeight + 24);

    if (y + rowHeight > letterHeight - 70) {
      doc.addPage();
      y = 54;
    }

    const rowTop = y;
    doc.font(regularFont).fontSize(8.6).fillColor("#111111").text(String(index + 1), columns.index.x, rowTop, { width: columns.index.width });
    let detailY = rowTop;
    fileLines.forEach((line) => {
      doc.font(boldFont).fontSize(9.5).text(line, columns.details.x, detailY, { width: columns.details.width });
      detailY += doc.heightOfString(line, { width: columns.details.width }) + 3;
    });
    doc.font(boldFont).fontSize(9.5).text(safeText(lineItem.partName), columns.details.x, detailY, { width: columns.details.width });
    detailY += doc.heightOfString(lineItem.partName, { width: columns.details.width }) + 3;
    doc.font(regularFont).fontSize(9).text(config, columns.details.x, detailY, { lineGap: 1, width: columns.details.width });

    doc.font(regularFont).fontSize(8.6).text(productionRegion(request), columns.production.x, rowTop, { width: columns.production.width });
    doc.text(String(lineItem.quantity), columns.quantity.x, rowTop, { align: "right", width: columns.quantity.width });
    doc.text(formatPriceCents(lineItemUnitCents(request, lineItem)), columns.unit.x, rowTop, { align: "right", width: columns.unit.width });
    doc.text(formatPriceCents(lineItemTotalCents(request, lineItem)), columns.subtotal.x, rowTop, { align: "right", width: columns.subtotal.width });

    y += rowHeight;
    doc.lineWidth(0.7).moveTo(left, y).lineTo(right, y).stroke("#a8a8a8");
    y += 20;
  });

  const notes = latestQuote?.notes || request.quote.summary || "Pricing includes manufacturing coordination, production, and standard inspection for the listed line items.";
  const summaryBoxWidth = 220;
  const summaryBoxX = right - summaryBoxWidth;
  const summaryBoxY = Math.max(y + 20, letterHeight - 200);

  if (summaryBoxY + 150 > letterHeight - 46) {
    doc.addPage();
    y = 54;
  } else {
    y += 24;
  }

  doc.font(boldFont).fontSize(12).text("Notes", left, y);
  doc.font(regularFont).fontSize(10).text(safeText(notes), left, y + 20, { lineGap: 2, width: 330 });
  doc.font(boldFont).fontSize(9).text("Payment terms", left, y + 82, { width: 330 });
  doc.font(regularFont).fontSize(9).text(latticePaymentTerms, left, y + 98, { width: 330 });
  doc.text(`Quote ID: ${quoteReference(request)}`, left, letterHeight - 74, { width: 250 });

  doc.rect(summaryBoxX, y, summaryBoxWidth, 132).fill("#f0f0f0");
  doc.fillColor("#111111");
  summaryAmountRow(doc, "Part production", formatPriceCents(subtotalCents), summaryBoxX + 18, y + 24, summaryBoxWidth - 36);
  summaryAmountRow(doc, `Shipping (${shippingMethod})`, shippingCents === null ? "Billed at actual" : formatPriceCents(shippingCents), summaryBoxX + 18, y + 50, summaryBoxWidth - 36);
  summaryAmountRow(doc, "Tax", formatPriceCents(taxCents), summaryBoxX + 18, y + 76, summaryBoxWidth - 36);
  summaryAmountRow(doc, "Order Total", formatPriceCents(totalCents), summaryBoxX + 18, y + 104, summaryBoxWidth - 36, true);

  doc.addPage();
  doc.font(boldFont).fontSize(13).text("FILES REVIEWED", left, 54);
  doc.moveDown(0.6);
  doc.font(regularFont).fontSize(9);
  request.files.forEach((file) => doc.text(safeText(file.name), { lineGap: 2 }));

  doc.moveDown(1.4);
  doc.font(boldFont).fontSize(13).text("TERMS AND CONDITIONS");
  doc.moveDown(0.8);
  doc.font(regularFont).fontSize(9);
  [
    `${latticePaymentTerms}. Production begins only after payment is received and final design release is complete.`,
    "Lead time is defined as production days following quote acceptance, purchase order approval, and final design release.",
    "Engineering changes to material, quantity, part design, or drawing requirements may require Lattice to reassess cost and lead time.",
    "Unless otherwise stated, tax, tariffs, import duties, customs brokerage, and special inspection documents are excluded from the quoted total.",
    "Customer is responsible for providing accurate customs, end-use, destination, ship-to, and purchasing information before checkout.",
  ].forEach((term, index) => {
    doc.text(`${index + 1}. ${term}`, { lineGap: 3 });
    doc.moveDown(0.4);
  });

  doc.end();
  return done;
}
