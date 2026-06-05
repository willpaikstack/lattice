import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import zlib from "node:zlib";

import { formatUsd, lineItemTotal, quoteSubtotal, type CustomerQuoteInput } from "./quote-file";
import { addDaysIso, buildStandardQuoteNotes } from "./quote-notes";
import { quotedLineForRequestItem, requestShipToLines, type LatticeRequest, type RequestLineItem, type UploadedFile } from "./request-model";

type QuotePdfOptions = {
  pricingPending?: boolean;
  statusLabel?: string;
};

const letterWidth = 612;
const letterHeight = 792;
const requireFromHere = createRequire(import.meta.url);
const PDFDocument = requireFromHere("pdfkit") as typeof import("pdfkit");
let regularFont = "Helvetica";
let boldFont = "Helvetica-Bold";
const quoteTextColor = "#101820";
const quoteMutedColor = "#3f4652";
const quoteRuleColor = "#1f2933";
const quoteLightRuleColor = "#d7dce0";
const quoteLinkColor = "#1473e6";
const sellerDisplayName = "Nexus Manufacturing Technologies, Inc.";
const latticeAddress = "169 Madison Ave, #17525\nNew York, NY 10016";
const latticeEmail = "mfg@latticeos.co";
const latticeWebsite = "Latticeos.co";
const latticePaymentTerms = "100% Payment in Advance";
const defaultSalesTaxRate = 0.0825;

function registerQuoteFonts(doc: PDFKit.PDFDocument) {
  const regularPath = "/System/Library/Fonts/Supplemental/Arial.ttf";
  const boldPath = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

  try {
    if (fs.existsSync(regularPath) && fs.existsSync(boldPath)) {
      doc.registerFont("LatticeQuoteRegular", regularPath);
      doc.registerFont("LatticeQuoteBold", boldPath);
      regularFont = "LatticeQuoteRegular";
      boldFont = "LatticeQuoteBold";
    }
  } catch {
    regularFont = "Helvetica";
    boldFont = "Helvetica-Bold";
  }
}

function safeText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function safeMultilineText(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .trim();
}

function quoteContactFields(request: LatticeRequest) {
  return {
    preparedForLines: [request.requesterName, request.requesterEmail, request.requesterPhone].map(safeText).filter(Boolean),
    shipToLines: requestShipToLines({
      shipToAddress1: request.shipToAddress1,
      shipToAddress2: request.shipToAddress2,
      shipToCity: request.shipToCity,
      shipToCompany: request.shipToCompany || request.buyerCompany,
      shipToName: request.shipToName || request.requesterName,
      shipToPhone: request.shipToPhone || request.requesterPhone,
      shipToState: request.shipToState,
      shipToZipCode: request.shipToZipCode,
    }).map(safeText).filter(Boolean),
  };
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

function formatShortDate(value: string | null) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function listFromText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function decodeXmlText(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readTemplateZipEntry(buffer: Buffer, targetName: string) {
  let endOffset = -1;
  const searchStart = Math.max(0, buffer.length - 0xffff - 22);

  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }

  if (endOffset === -1) {
    return null;
  }

  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    const method = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const nameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localOffset = buffer.readUInt32LE(centralOffset + 42);
    const nameStart = centralOffset + 46;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");

    if (name === targetName) {
      const localNameLength = buffer.readUInt16LE(localOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = buffer.subarray(dataStart, dataStart + compressedSize);

      if (method === 0) {
        return Buffer.from(compressed).toString("utf8");
      }

      if (method === 8) {
        return zlib.inflateRawSync(compressed).toString("utf8");
      }

      return null;
    }

    centralOffset += 46 + nameLength + extraLength + commentLength;
  }

  return null;
}

function templateColumnText(column: string, rowStart: number, rowEnd: number) {
  const templatePath = path.join(process.cwd(), "resources", "admin", "lattice-os-zintilon-quote-template.xlsx");

  try {
    const sheetXml = readTemplateZipEntry(fs.readFileSync(templatePath), "xl/worksheets/sheet1.xml");

    if (!sheetXml) {
      return [];
    }

    const values: string[] = [];
    for (let row = rowStart; row <= rowEnd; row += 1) {
      const match = sheetXml.match(new RegExp(`<x:c r="${column}${row}"[^>]*>([\\s\\S]*?)<\\/x:c>`));
      const rawValue = match?.[1]?.match(/<x:v>([\s\S]*?)<\/x:v>/)?.[1];
      const value = rawValue ? decodeXmlText(rawValue).trim() : "";

      if (value) {
        values.push(value);
      }
    }

    return values;
  } catch {
    return [];
  }
}

function templateManufacturingAssumptions() {
  return templateColumnText("A", 36, 42)
    .filter((line, index, lines) => line !== lines[index - 1])
    .join("\n")
    .trim();
}

function templateGeneralTerms() {
  return templateColumnText("A", 46, 392).filter((line, index, lines) => line !== lines[index - 1]);
}

function termsCompanyText(value: string) {
  return value
    .replace(/\bLattice OS\b/gi, sellerDisplayName)
    .replace(/\bLattice\b/g, "Nexus");
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
  return quotedLineForRequestItem(request.customerQuotes.at(-1)?.lineItems, item);
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

function ensureSpace(doc: PDFKit.PDFDocument, neededHeight: number, topY = 42) {
  if (doc.y + neededHeight > letterHeight - 46) {
    doc.addPage();
    doc.y = topY;
  }
}

export function buildCustomerQuotePdf(quote: CustomerQuoteInput, options: QuotePdfOptions = {}) {
  const { doc, done } = createPdf({ compress: false, margin: 54, size: "LETTER" });
  registerQuoteFonts(doc);
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
  registerQuoteFonts(doc);
  const left = 36;
  const right = letterWidth - 36;
  const width = right - left;
  const latestQuote = request.customerQuotes.at(-1);
  const subtotalCents = quoteSubtotalCents(request);
  const shippingCents = request.quote.shippingCostCents;
  const salesTaxCents = subtotalCents === null ? null : Math.round(subtotalCents * defaultSalesTaxRate);
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (salesTaxCents ?? 0);
  const quoteDate = request.quote.quoteCreatedDate || latestQuote?.quoteDate || latestQuote?.issuedAt.slice(0, 10) || request.updatedAt.slice(0, 10);
  const validUntil = request.quote.quoteValidUntil || latestQuote?.validUntil || addDaysIso(quoteDate, 30);
  const productionSpeed = request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days (${productionRegion(request)})` : latestQuote?.leadTime || "Pending";
  const shipBy = request.quote.leadTimeDays ? addDaysIso(quoteDate, request.quote.leadTimeDays) : null;
  const estimatedDelivery = request.quote.estimatedDeliveryDate || request.dueDate;
  const shippingMethod = request.quote.shippingMethod || "International";
  const notes = buildStandardQuoteNotes(quoteDate, shipBy);
  const contactFields = quoteContactFields(request);

  function quoteDetailItem(label: string, value: string, x: number, itemY: number, itemWidth: number, align: "left" | "right" = "left") {
    const labelWidth = Math.min(86, itemWidth * 0.56);

    doc.fillColor(quoteTextColor).font(regularFont).fontSize(8.4).text(label, x, itemY, { align, width: labelWidth });
    doc.font(regularFont).fontSize(8.4).text(value || "Pending", x + labelWidth, itemY, {
      align: "right",
      width: itemWidth - labelWidth,
    });
  }

  function quoteMetadataPanel(x: number, panelY: number, panelWidth: number) {
    const rows = [
      ["Quote No.", quoteReference(request), true],
      ["Quote Date", formatDate(quoteDate), false],
      ["Valid Until", formatDate(validUntil), false],
    ] as const;
    const labelWidth = 62;
    const rowHeight = 17;

    doc.font(boldFont).fontSize(8.8).fillColor(quoteTextColor).text("Quote Details", x, panelY, { width: panelWidth });
    doc.lineWidth(0.8).moveTo(x, panelY + 15).lineTo(x + panelWidth, panelY + 15).stroke(quoteRuleColor);
    rows.forEach(([label, value, isPrimary], index) => {
      const rowY = panelY + 25 + index * rowHeight;

      doc.font(regularFont).fontSize(8.4).fillColor(quoteTextColor).text(label, x, rowY, { width: labelWidth });
      doc
        .font(isPrimary ? boldFont : regularFont)
        .fontSize(isPrimary ? 8.8 : 8.4)
        .fillColor(quoteTextColor)
        .text(value || "Pending", x + labelWidth, rowY, {
          align: "right",
          width: panelWidth - labelWidth,
        });
    });
  }

  function contactBlock(label: string, lines: string[], x: number, blockY: number, blockWidth: number) {
    doc.fillColor(quoteTextColor).font(boldFont).fontSize(8.8).text(label, x, blockY, { width: blockWidth });
    doc.lineWidth(0.8).moveTo(x, blockY + 15).lineTo(x + blockWidth, blockY + 15).stroke(quoteRuleColor);
    let lineY = blockY + 25;
    lines.forEach((line, index) => {
      const value = safeText(line);
      doc
        .font(index === 0 ? boldFont : regularFont)
        .fontSize(8.8)
        .fillColor(value.includes("@") ? quoteLinkColor : quoteTextColor)
        .text(value, x, lineY, { lineGap: 1, width: blockWidth });
      lineY += Math.max(13, doc.heightOfString(value || " ", { lineGap: 1, width: blockWidth }) + 2);
    });
  }

  function ensureTemplateSpace(neededHeight: number) {
    if (y + neededHeight > letterHeight - 44) {
      doc.addPage();
      y = 42;
    }
  }

  doc.fillColor(quoteTextColor);
  doc.font(boldFont).fontSize(14).text(sellerDisplayName, left, 42, { width: 350 });
  doc.font(regularFont).fontSize(8.6).text(latticeAddress, left, 68, { lineGap: 2, width: 220 });
  doc.text(latticeEmail, left, 104, { width: 220 });
  doc.text(latticeWebsite, left, 118, { width: 220 });

  quoteMetadataPanel(right - 174, 42, 174);

  let y = 154;
  const preparedWidth = 160;
  const shipWidth = 165;
  const shipX = left + 183;
  const detailsPanelX = left + 366;
  const detailsPanelWidth = right - detailsPanelX;
  contactBlock("Prepared For", contactFields.preparedForLines, left, y, preparedWidth);
  contactBlock("Ship to", contactFields.shipToLines, shipX, y, shipWidth);

  doc.font(boldFont).fontSize(8.8).fillColor(quoteTextColor).text("Production Details", detailsPanelX, y, { width: detailsPanelWidth });
  doc.lineWidth(0.8).moveTo(detailsPanelX, y + 15).lineTo(detailsPanelX + detailsPanelWidth, y + 15).stroke(quoteRuleColor);
  quoteDetailItem("Lead Time", productionSpeed, detailsPanelX, y + 25, detailsPanelWidth);
  quoteDetailItem("Ship by[1]", formatShortDate(shipBy), detailsPanelX, y + 43, detailsPanelWidth);
  quoteDetailItem("Method", safeText(shippingMethod), detailsPanelX, y + 61, detailsPanelWidth);
  quoteDetailItem("Delivery", formatShortDate(estimatedDelivery), detailsPanelX, y + 79, detailsPanelWidth);

  y += 136;
  doc.fillColor(quoteTextColor).font(boldFont).fontSize(8.8).text("Summary of order", left, y, { width: 260 });
  doc.font(regularFont).fontSize(12.2).text(`Order total ${formatPriceCents(totalCents)}`, left + 300, y - 3, { align: "right", width: width - 300 });
  y += 23;
  doc.lineWidth(0.8).moveTo(left, y).lineTo(right, y).stroke(quoteRuleColor);
  y += 15;

  const columns = {
    index: { width: 30, x: left + 12 },
    details: { width: 255, x: left + 48 },
    production: { width: 72, x: left + 318 },
    quantity: { width: 34, x: right - 150 },
    unit: { width: 62, x: right - 108 },
    subtotal: { width: 50, x: right - 50 },
  };

  doc.font(boldFont).fontSize(8.2).fillColor(quoteTextColor);
  doc.text("#", columns.index.x, y);
  doc.text("Part details", columns.details.x, y, { width: columns.details.width });
  doc.text("Production", columns.production.x, y, { width: columns.production.width });
  doc.text("Qty", columns.quantity.x, y, { align: "right", width: columns.quantity.width });
  doc.text("Unit price", columns.unit.x, y, { align: "right", width: columns.unit.width });
  doc.text("Subtotal", columns.subtotal.x, y, { align: "right", width: columns.subtotal.width });
  y += 17;
  doc.lineWidth(0.8).moveTo(left, y).lineTo(right, y).stroke(quoteRuleColor);
  y += 14;

  bundledFilesByLineItem(request).forEach(({ cadFile, drawingFile, lineItem }, index) => {
    const fileName = cadFile?.name || lineItem.partName;
    const drawingName = drawingFile ? `Drawing: ${drawingFile.name}` : "";
    const detailLines = [
      fileName,
      drawingName,
      `Process: ${request.process}`,
      `Material: ${lineItem.material}`,
      `Finish: ${lineItem.surfaceFinish || "As machined / not specified"}`,
      lineItem.qualityDocumentation?.length ? `Inspection: ${lineItem.qualityDocumentation.join(", ")}` : "",
    ].filter(Boolean);
    const detailsText = detailLines.join("\n");

    doc.font(regularFont).fontSize(8.7);
    const rowHeight = Math.max(66, doc.heightOfString(detailsText, { lineGap: 2, width: columns.details.width }) + 16);

    if (y + rowHeight > letterHeight - 50) {
      doc.addPage();
      y = 42;
    }

    const rowTop = y;
    doc.font(regularFont).fontSize(8.7).fillColor(quoteTextColor).text(String(index + 1), columns.index.x, rowTop, { width: columns.index.width });
    doc.font(boldFont).fontSize(8.9).text(safeText(lineItem.partName), columns.details.x, rowTop, { width: columns.details.width });
    doc.font(regularFont).fontSize(8.4).text(detailsText, columns.details.x, rowTop + 13, { lineGap: 2, width: columns.details.width });
    doc.font(regularFont).fontSize(8.7).text(productionRegion(request), columns.production.x, rowTop, { width: columns.production.width });
    doc.text(String(lineItem.quantity), columns.quantity.x, rowTop, { align: "right", width: columns.quantity.width });
    doc.text(formatPriceCents(lineItemUnitCents(request, lineItem)), columns.unit.x, rowTop, { align: "right", width: columns.unit.width });
    doc.text(formatPriceCents(lineItemTotalCents(request, lineItem)), columns.subtotal.x, rowTop, { align: "right", width: columns.subtotal.width });

    y += rowHeight + 4;
    doc.lineWidth(0.45).moveTo(left, y).lineTo(right, y).stroke(quoteLightRuleColor);
    y += 10;
  });

  ensureTemplateSpace(180);
  const totalsX = right - 220;
  doc.font(boldFont).fontSize(8.8).fillColor(quoteTextColor).text("Notes:", left, y, { width: 48 });
  doc.font(regularFont).fontSize(8.5).fillColor(quoteTextColor).text(safeMultilineText(notes), left + 54, y, { lineGap: 2, width: 260 });
  const totalsRows: Array<[string, string, boolean?]> = [
    ["Part production", formatPriceCents(subtotalCents)],
    ["Shipping", shippingCents === null ? "Billed at actual" : formatPriceCents(shippingCents)],
    ["Sales Tax", formatPriceCents(salesTaxCents)],
    ["Order Total", formatPriceCents(totalCents), true],
  ];
  totalsRows.forEach(([label, value, bold], index) => {
    const rowY = y + index * 22;
    doc.font(bold ? boldFont : regularFont).fontSize(bold ? 10.5 : 8.6).fillColor(quoteTextColor).text(label, totalsX, rowY, { width: 125 });
    doc.text(value, totalsX + 125, rowY, { align: "right", width: 95 });
  });
  y += Math.max(126, doc.heightOfString(safeMultilineText(notes), { lineGap: 2, width: 260 }) + 26);

  ensureTemplateSpace(108);
  doc.fillColor(quoteTextColor).font(boldFont).fontSize(8.8).text("Manufacturing assumptions and acceptance", left, y, { width });
  y += 15;
  doc.lineWidth(0.8).moveTo(left, y).lineTo(right, y).stroke(quoteRuleColor);
  y += 14;
  const templateAssumptions = listFromText(templateManufacturingAssumptions());
  const assumptions = templateAssumptions.length
    ? templateAssumptions
    : [
        `${latticePaymentTerms}; production begins only after payment is received and final design release is complete.`,
        "Customer-supplied CAD, drawings, quantities, material, finish, and inspection requirements are assumed complete and current.",
        "Any change to design, drawing callouts, material, quantity, shipping destination, or requested certifications may require repricing.",
        "Production lead time starts after written quote acceptance, payment, final design release, and closure of open DFM questions.",
        "Unless stated otherwise, tax, tariffs, import duties, customs brokerage, expedited freight, and special inspection documents are excluded.",
        `To accept, reply with written approval and complete payment referencing ${quoteReference(request)}.`,
      ];
  doc.font(regularFont).fontSize(8.1).fillColor(quoteTextColor);
  assumptions.forEach((assumption) => {
    ensureTemplateSpace(22);
    doc.text(assumption, left, y, { lineGap: 2, width });
    y += doc.heightOfString(assumption, { lineGap: 2, width }) + 5;
  });

  y += 14;
  ensureTemplateSpace(70);
  doc.fillColor(quoteTextColor).font(boldFont).fontSize(8.8).text("General terms and conditions of sale", left, y, { width });
  y += 15;
  doc.lineWidth(0.8).moveTo(left, y).lineTo(right, y).stroke(quoteRuleColor);
  y += 14;
  const terms = templateGeneralTerms();
  const renderedTerms = terms.length
    ? terms
    : [
        'General Terms and Conditions of Sale',
        `These general terms and conditions of sale apply to any purchase of goods and services by a customer from ${sellerDisplayName}.`,
        "Seller's quotation, order confirmation, and these terms control the sale unless a separate written agreement is signed by Seller.",
        "Payment is due according to the terms stated in the quote. Production may be held until payment and final design release are complete.",
        "Customer is responsible for accurate drawings, CAD files, specifications, quantities, and shipping information.",
      ];
  const normalizedTerms = renderedTerms.map(termsCompanyText);
  const contactBlockStart = normalizedTerms.findLastIndex((term) => safeText(term) === sellerDisplayName);
  const termsWithoutContactBlock = contactBlockStart >= 0 ? normalizedTerms.slice(0, contactBlockStart) : normalizedTerms;
  doc.font(regularFont).fontSize(6.8).fillColor(quoteTextColor);
  termsWithoutContactBlock.forEach((term) => {
    const textHeight = doc.heightOfString(term, { lineGap: 1.2, width });
    ensureTemplateSpace(textHeight + 8);
    doc.text(term, left, y, { lineGap: 1.2, width });
    y += textHeight + 4;
  });

  y += 4;
  ensureTemplateSpace(72);
  doc.font(boldFont).fontSize(7.2).fillColor(quoteTextColor).text(sellerDisplayName, left, y, { width });
  y += 11;
  doc.font(regularFont).fontSize(7.2).text("169 Madison Ave, #17525", left, y, { width });
  y += 10;
  doc.text("New York, NY 10016", left, y, { width });
  y += 10;
  doc.text(latticeEmail, left, y, { width });
  y += 10;
  doc.text(latticeWebsite, left, y, { width });
  y += 18;
  doc
    .font(regularFont)
    .fontSize(6.8)
    .text(`Further contact information, including country specific contact information, may be found on ${latticeWebsite}.`, left, y, {
      lineGap: 1.2,
      width,
    });

  doc.end();
  return done;
}
