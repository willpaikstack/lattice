import { formatUsd, lineItemTotal, quoteSubtotal, type CustomerQuoteInput } from "./quote-file";

type QuotePdfOptions = {
  pricingPending?: boolean;
  statusLabel?: string;
};

const pageWidth = 612;
const pageHeight = 792;
const margin = 54;
const contentWidth = pageWidth - margin * 2;

function pdfText(value: string) {
  return value
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function plainText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function listFromText(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function wrapText(value: string, maxWidth: number, fontSize: number) {
  const words = plainText(value).split(" ").filter(Boolean);
  const maxCharacters = Math.max(18, Math.floor(maxWidth / (fontSize * 0.52)));
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxCharacters) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

function formatMaybePending(value: number, pending: boolean) {
  return pending ? "Pending" : formatUsd(value);
}

function buildPageContent(lines: string[]) {
  return lines.join("\n");
}

function makePdf(objects: string[]) {
  const encoder = new TextEncoder();
  const header = "%PDF-1.4\n";
  let body = "";
  const offsets: number[] = [0];
  let byteOffset = encoder.encode(header).length;

  objects.forEach((object, index) => {
    offsets[index + 1] = byteOffset;
    const entry = `${index + 1} 0 obj\n${object}\nendobj\n`;
    body += entry;
    byteOffset += encoder.encode(entry).length;
  });

  const xrefOffset = byteOffset;
  const xrefRows = offsets.map((offset, index) => (index === 0 ? "0000000000 65535 f " : `${String(offset).padStart(10, "0")} 00000 n `));
  const trailer = `xref\n0 ${objects.length + 1}\n${xrefRows.join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return encoder.encode(`${header}${body}${trailer}`);
}

export function buildCustomerQuotePdf(quote: CustomerQuoteInput, options: QuotePdfOptions = {}) {
  const content: string[] = [];
  const pages: string[] = [];
  let y = pageHeight - margin;

  function pushPage() {
    pages.push(buildPageContent(content.splice(0, content.length)));
    y = pageHeight - margin;
  }

  function ensureSpace(requiredHeight: number) {
    if (y - requiredHeight < margin) {
      pushPage();
    }
  }

  function text(value: string, x = margin, size = 10, font = "F1") {
    ensureSpace(size + 4);
    content.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`);
    y -= size + 4;
  }

  function wrapped(value: string, x = margin, width = contentWidth, size = 10, font = "F1") {
    const lines = wrapText(value, width, size);
    ensureSpace(lines.length * (size + 4));
    lines.forEach((line) => {
      content.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(line)}) Tj ET`);
      y -= size + 4;
    });
  }

  function section(title: string) {
    y -= 8;
    text(title.toUpperCase(), margin, 9, "F2");
    content.push(`${margin} ${y + 8} m ${pageWidth - margin} ${y + 8} l S`);
  }

  function detail(label: string, value: string) {
    wrapped(`${label}: ${value || "Pending"}`, margin, contentWidth, 10, "F1");
  }

  const subtotal = quoteSubtotal(quote.lineItems);
  const pricingPending = options.pricingPending ?? quote.lineItems.every((item) => item.unitPrice <= 0);

  text("Lattice OS", margin, 11, "F2");
  text(`Quote ${quote.quoteNumber || "Pending"}`, margin, 24, "F2");
  if (options.statusLabel) {
    text(options.statusLabel, margin, 11, "F2");
  }

  y -= 8;
  detail("Prepared for", quote.customerCompany);
  detail("Contact", quote.customerContact);
  detail("RFQ / Project", quote.projectName);
  detail("Prepared by", quote.preparedBy || "Lattice");
  detail("Quote date", quote.quoteDate);
  detail("Valid until", quote.validUntil);

  section("Summary");
  wrapped(
    quote.notes ||
      `Lattice quote package for ${quote.projectName || "this project"}, including uploaded manufacturing data, line-item requirements, supplier basis, and production assumptions.`,
  );

  section("Commercials");
  detail("Subtotal", formatMaybePending(subtotal, pricingPending));
  detail("Shipping", quote.shipping || "Billed at actual");
  detail("Tax", quote.tax || "Not included");
  detail("Total", formatMaybePending(subtotal, pricingPending));
  detail("Lead time", quote.leadTime || "Pending");

  section("Line Items");
  quote.lineItems.forEach((item, index) => {
    ensureSpace(70);
    text(`${index + 1}. ${item.description || "Part / item"}`, margin, 11, "F2");
    detail("Process", item.process || "TBD");
    detail("Material", item.material || "TBD");
    detail("Finish", item.finish || "TBD");
    detail("Quantity", String(item.quantity));
    detail("Unit price", formatMaybePending(item.unitPrice, pricingPending));
    detail("Line total", formatMaybePending(lineItemTotal(item), pricingPending));
    y -= 4;
  });

  section("Design Package Reviewed");
  const files = listFromText(quote.filesReviewed);
  (files.length ? files : ["Design file / drawing reviewed"]).forEach((file) => wrapped(`- ${file}`));

  section("Manufacturing Assumptions");
  const assumptions = listFromText(quote.assumptions);
  (assumptions.length ? assumptions : ["Customer-supplied CAD and drawings are complete and represent the latest revision."]).forEach((assumption) =>
    wrapped(`- ${assumption}`),
  );

  const clarifications = listFromText(quote.clarifications);
  if (clarifications.length) {
    section("Open Questions");
    clarifications.forEach((clarification, index) => wrapped(`${index + 1}. ${clarification}`));
  }

  section("Acceptance");
  wrapped(`To accept this quote, reply with written approval and reference Quote ${quote.quoteNumber || "Pending"}.`);

  pushPage();

  const pageObjects: string[] = [];
  const contentObjects: string[] = [];
  const firstPageObjectNumber = 4;
  const firstContentObjectNumber = firstPageObjectNumber + pages.length;

  pages.forEach((page, index) => {
    const contentObjectNumber = firstContentObjectNumber + index;
    pageObjects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 ${firstContentObjectNumber + pages.length} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
    contentObjects.push(`<< /Length ${new TextEncoder().encode(page).length} >>\nstream\n${page}\nendstream`);
  });

  const boldFontObjectNumber = firstContentObjectNumber + pages.length;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids ${pages.map((_, index) => `${firstPageObjectNumber + index} 0 R`).join(" ")} /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ...pageObjects,
    ...contentObjects,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];

  if (boldFontObjectNumber !== objects.length) {
    throw new Error("PDF object numbering mismatch");
  }

  return makePdf(objects);
}
