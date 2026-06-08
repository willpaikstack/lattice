import { createRequire } from "node:module";

import { formatUsd } from "./quote-file";

const requireFromHere = createRequire(import.meta.url);
const PDFDocument = requireFromHere("pdfkit") as typeof import("pdfkit");

const letterWidth = 612;
const sellerName = "Nexus Manufacturing Technologies, Inc.";
const sellerAddress = ["169 Madison Ave, #17525", "New York, NY 10016"];
const sellerEmail = "mfg@latticeos.co";
const textColor = "#101820";
const mutedColor = "#54606d";
const ruleColor = "#1f2933";
const lightRuleColor = "#d7dce0";
const accentFill = "#f3f5f7";

type PurchaseOrderLineItem = {
  amount: number;
  description: string;
  drawingRevision: string;
  finish: string;
  inspection: string;
  item: string;
  leadTime: string;
  material: string;
  process: string;
  quantity: number;
  supplierNotes: string;
  unitPrice: number;
};

type PurchaseOrderPdfInput = {
  customerProject: string;
  destinationLines: string[];
  incoterms: string;
  latticeContact: string;
  lineItems: PurchaseOrderLineItem[];
  otherCharges: number;
  paymentTerms: string;
  poDate: string;
  poNumber: string;
  relatedQuote: string;
  releaseDate: string;
  requiredShipDate: string;
  supplierContactLines: string[];
  toolingAmount: number;
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

function purchaseOrderTemplateInput(): PurchaseOrderPdfInput {
  return {
    customerProject: "Customer project / accepted RFQ package",
    destinationLines: ["Freight forwarder or consignee", "Receiving address / consolidation address", "Contact: [name / phone / email]"],
    incoterms: "FOB China / final terms per awarded supplier quote",
    latticeContact: "William Paik / mfg@latticeos.co",
    lineItems: [
      {
        amount: 1040,
        description: "Final CAD and drawing package released for production.",
        drawingRevision: "Rev A",
        finish: "As machined",
        inspection: "Dimensional report and production photos",
        item: "aluminum_plate.step",
        leadTime: "12 business days",
        material: "6061-T6 aluminum",
        process: "CNC machining",
        quantity: 8,
        supplierNotes: "Confirm all tapped holes before production.",
        unitPrice: 130,
      },
      {
        amount: 548,
        description: "Machine to supplied model and drawing callouts.",
        drawingRevision: "Rev A",
        finish: "Clear anodize",
        inspection: "Material cert and final inspection photos",
        item: "tubesheet_retainer_plate.step",
        leadTime: "14 business days",
        material: "6061-T6 aluminum",
        process: "CNC machining",
        quantity: 4,
        supplierNotes: "Hold shipment until finish sample is approved.",
        unitPrice: 137,
      },
    ],
    otherCharges: 165,
    paymentTerms: "Deposit / balance by wire after quality release",
    poDate: "2026-05-04",
    poNumber: "LPO-[YYYY]-[####]",
    relatedQuote: "LQ-[####]",
    releaseDate: "2026-05-04",
    requiredShipDate: "2026-05-22",
    supplierContactLines: ["Chinese machine shop legal name", "Attn: Supplier contact", "email / WeChat / phone"],
    toolingAmount: 120,
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

function drawTermsPage(doc: PDFKit.PDFDocument, purchaseOrder: PurchaseOrderPdfInput) {
  const left = 42;
  const right = letterWidth - 42;
  const width = right - left;

  doc.addPage();
  doc.font("Helvetica-Bold").fontSize(15).fillColor(textColor).text("Supplier PO terms", left, 44, { width });
  doc.font("Helvetica").fontSize(9).fillColor(mutedColor).text("Supplier must manufacture only from the final released package listed on this purchase order.", left, 66, { width });
  doc.moveTo(left, 92).lineTo(right, 92).lineWidth(1).stroke(ruleColor);

  const checklistY = 118;
  doc.rect(left, checklistY, width, 118).fill(accentFill);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor).text("Release checklist", left + 18, checklistY + 16, { width: width - 36 });
  doc.font("Helvetica").fontSize(8.8).fillColor(textColor);
  [
    "Final CAD and drawings are attached or linked.",
    "Customer revision, quantity, material, finish, and inspection scope match the accepted quote.",
    "Any DFM change, deviation, or substituted process requires written Lattice approval before production.",
    `Required ship date: ${formatDate(purchaseOrder.requiredShipDate)}.`,
  ].forEach((line, index) => {
    doc.text(line, left + 18, checklistY + 40 + index * 18, { width: width - 36 });
  });

  const termsY = 276;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(textColor).text("Standard supplier terms", left, termsY, { width });
  doc.moveTo(left, termsY + 16).lineTo(right, termsY + 16).lineWidth(0.8).stroke(ruleColor);
  doc.font("Helvetica").fontSize(8.4).fillColor(textColor);
  [
    "File control: supplier must manufacture only from the final CAD, drawing, revision, quantity, and notes listed on this PO or attached release package.",
    "Change control: supplier may not change material, finish, process, tolerance approach, quantity, shipment method, or subcontracted process without written Lattice approval.",
    "Quality: supplier must inspect critical dimensions and provide requested inspection records, photos, material certificates, or finish certificates before shipment when listed.",
    "Nonconformance: supplier must notify Lattice before shipment if any part does not meet drawing, finish, cosmetic, packing, or documentation requirements.",
    "Confidentiality: customer CAD, drawings, specifications, and order information may be used only for quoting and producing this Lattice order.",
    "Payment release: final payment may be held until required quality documents, photos, shipment records, and corrective actions are complete.",
    "Shipment: supplier is responsible for accurate packing list, commercial invoice support details when needed, export-ready packaging, and handoff according to agreed terms.",
  ].forEach((term, index) => {
    doc.text(term, left, termsY + 32 + index * 48, { lineGap: 1.5, width });
  });
}

export function buildSupplierPurchaseOrderTemplatePdf() {
  const purchaseOrder = purchaseOrderTemplateInput();
  const subtotal = purchaseOrder.lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = subtotal + purchaseOrder.toolingAmount + purchaseOrder.otherCharges;
  const { doc, done } = createPdf({ compress: false, margin: 42, size: "LETTER" });
  const left = 42;
  const right = letterWidth - 42;
  const width = right - left;
  const sideX = left + 278;
  const sideColumnWidth = 232;
  const companyY = 88;
  const headerRuleY = 218;
  const metadataRows: Array<[string, string]> = [
    ["PO number", purchaseOrder.poNumber],
    ["PO date", formatDate(purchaseOrder.poDate)],
    ["Release date", formatDate(purchaseOrder.releaseDate)],
    ["Required ship date", formatDate(purchaseOrder.requiredShipDate)],
    ["Related quote", purchaseOrder.relatedQuote],
    ["Payment terms", purchaseOrder.paymentTerms],
  ];

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(mutedColor).text("SUPPLIER RELEASE DOCUMENT", left, 42, {
    characterSpacing: 0.8,
    lineBreak: false,
    width: 270,
  });
  doc.font("Helvetica-Bold").fontSize(28).fillColor(textColor).text("Purchase Order", left, 56, {
    lineBreak: false,
    width: 270,
  });
  doc.font("Helvetica-Bold").fontSize(13).fillColor(textColor).text(sellerName, left, companyY, { width: 250 });
  doc.font("Helvetica").fontSize(8.7).fillColor(textColor).text([...sellerAddress, sellerEmail].join("\n"), left, 110, { lineGap: 2, width: 220 });
  metadataColumn(doc, metadataRows, sideX, companyY, sideColumnWidth);

  const addressY = headerRuleY + 24;
  addressBlock(doc, "Supplier / factory", purchaseOrder.supplierContactLines, left, addressY, 232);
  addressBlock(doc, "Destination / consignee", purchaseOrder.destinationLines, sideX, addressY, sideColumnWidth);

  const releaseY = addressY + 104;
  doc.rect(left, releaseY, width, 64).fill(accentFill);
  metadataColumn(
    doc,
    [
      ["Lattice contact", purchaseOrder.latticeContact],
      ["Customer project", purchaseOrder.customerProject],
      ["Incoterms / shipping terms", purchaseOrder.incoterms],
    ],
    left + 16,
    releaseY + 15,
    width - 32,
  );

  let y = releaseY + 94;
  doc.rect(left, y, width, 28).fill(accentFill);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(textColor);
  doc.text("#", left + 8, y + 10, { width: 20 });
  doc.text("Part / file package", left + 34, y + 10, { width: 118 });
  doc.text("Manufacturing release details", left + 160, y + 10, { width: 214 });
  doc.text("Qty", right - 154, y + 10, { align: "right", width: 30 });
  doc.text("Unit price", right - 114, y + 10, { align: "right", width: 56 });
  doc.text("Subtotal", right - 50, y + 10, { align: "right", width: 50 });
  y += 42;

  purchaseOrder.lineItems.forEach((item, index) => {
    const detail = [
      `${item.process} / ${item.material} / ${item.finish}`,
      `Drawing: ${item.drawingRevision}; lead time: ${item.leadTime}`,
      `Inspection/docs: ${item.inspection}`,
      item.description,
      item.supplierNotes,
    ].join("\n");
    const rowHeight = Math.max(76, doc.heightOfString(detail, { lineGap: 2, width: 214 }) + 18);

    doc.font("Helvetica").fontSize(8.8).fillColor(textColor).text(String(index + 1), left + 8, y, { width: 20 });
    doc.font("Helvetica-Bold").text(safeText(item.item), left + 34, y, { width: 118 });
    doc.font("Helvetica").fontSize(8.1).text(detail, left + 160, y, { lineGap: 2, width: 214 });
    doc.font("Helvetica").fontSize(8.8).text(String(item.quantity), right - 154, y, { align: "right", width: 30 });
    doc.text(formatUsd(item.unitPrice), right - 114, y, { align: "right", width: 56 });
    doc.font("Helvetica-Bold").text(formatUsd(item.amount), right - 50, y, { align: "right", width: 50 });
    y += rowHeight;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.45).stroke(lightRuleColor);
    y += 12;
  });

  const totalsX = right - 224;
  y = Math.max(y, 608);
  [
    ["Part production subtotal", formatUsd(subtotal), false],
    ["Tooling / setup", formatUsd(purchaseOrder.toolingAmount), false],
    ["Freight / documentation / other", formatUsd(purchaseOrder.otherCharges), false],
    ["Supplier PO total", formatUsd(total), true],
  ].forEach(([label, value, isTotal], index) => {
    const rowY = y + index * 23;
    doc.font(isTotal ? "Helvetica-Bold" : "Helvetica").fontSize(isTotal ? 11 : 9).fillColor(textColor).text(String(label), totalsX, rowY, {
      height: 16,
      lineBreak: false,
      width: 132,
    });
    doc.text(String(value), totalsX + 132, rowY, {
      align: "right",
      height: 16,
      lineBreak: false,
      width: 92,
    });
  });

  doc.font("Helvetica-Bold").fontSize(8.8).fillColor(textColor).text("Supplier instruction", left, y, {
    height: 16,
    lineBreak: false,
    width: 130,
  });
  doc
    .font("Helvetica")
    .fontSize(8.4)
    .text("Confirm PO acceptance, schedule, inspection documents, and any DFM questions before starting production.", left, y + 16, {
      height: 40,
      lineGap: 1.5,
      width: 270,
    });
  doc.text("Do not ship nonconforming parts without written Lattice approval.", left, y + 52, {
    height: 28,
    width: 270,
  });

  drawTermsPage(doc, purchaseOrder);

  doc.end();
  return done;
}
