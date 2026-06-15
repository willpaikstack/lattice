import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

import { buildStandardQuoteNotes } from "./quote-notes";
import { quotedLineForRequestItem, requestShipToLines, type LatticeRequest } from "./request-model";

export type CellValue = string | number | null;

export type SheetRow = CellValue[];

export type SheetModel = {
  columnWidths?: number[];
  name: string;
  rows: SheetRow[];
};

const latticeAddress = "169 Madison Ave, #17525\nNew York, NY 10016";
const latticeEmail = "mfg@latticeos.co";
const latticeWebsite = "Latticeos.co";
const latticePaymentTerms = "100% Payment in Advance";
const defaultSalesTaxRate = 0.0825;

const textStyle = 1;
const titleStyle = 2;
const labelStyle = 3;
const inputStyle = 4;
const headerStyle = 5;
const moneyStyle = 6;
const totalStyle = 7;
const noteStyle = 8;
const inputMoneyStyle = 9;

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

  return { dosDate, dosTime };
}

function createZip(files: Array<{ name: string; content: string | Buffer }>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = dosDateTime();

  files.forEach((file) => {
    const name = Buffer.from(file.name, "utf8");
    const content = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, "utf8");
    const checksum = crc32(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(content.length, 18);
    localHeader.writeUInt32LE(content.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, content);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(content.length, 20);
    centralHeader.writeUInt32LE(content.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + content.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function readZipEntries(buffer: Buffer) {
  let endOffset = -1;
  const searchStart = Math.max(0, buffer.length - 0xffff - 22);

  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }

  if (endOffset === -1) {
    throw new Error("Unable to find XLSX central directory.");
  }

  const entryCount = buffer.readUInt16LE(endOffset + 10);
  let centralOffset = buffer.readUInt32LE(endOffset + 16);
  const entries: Array<{ name: string; content: Buffer }> = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralOffset) !== 0x02014b50) {
      throw new Error("Invalid XLSX central directory entry.");
    }

    const method = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const nameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localOffset = buffer.readUInt32LE(centralOffset + 42);
    const nameStart = centralOffset + 46;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString("utf8");

    if (buffer.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error(`Invalid XLSX local file header for ${name}.`);
    }

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let content: Buffer;

    if (method === 0) {
      content = Buffer.from(compressed);
    } else if (method === 8) {
      content = zlib.inflateRawSync(compressed);
    } else {
      throw new Error(`Unsupported XLSX compression method ${method} for ${name}.`);
    }

    entries.push({ name, content });
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function xml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function preserveStyleAttributes(attributes: string) {
  return attributes.match(/\s+s="[^"]+"/)?.[0] ?? "";
}

function replaceCell(sheet: string, reference: string, replacement: (attributes: string, body: string) => string) {
  const cellPattern = new RegExp(`<x:c r="${reference}"([^>]*)\\s*\\/>|<x:c r="${reference}"([^>]*)>([\\s\\S]*?)<\\/x:c>`);

  return sheet.replace(cellPattern, (match, attributesSelfClosing: string | undefined, attributesWithBody: string | undefined, body: string | undefined) => {
    const attributes = attributesSelfClosing ?? attributesWithBody ?? "";
    return replacement(attributes, body ?? "");
  });
}

function setStringCell(sheet: string, reference: string, value: string) {
  return replaceCell(sheet, reference, (attributes) => `<x:c r="${reference}"${preserveStyleAttributes(attributes)} t="str"><x:v>${xml(value)}</x:v></x:c>`);
}

function setNumberCell(sheet: string, reference: string, value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return setStringCell(sheet, reference, "");
  }

  return replaceCell(sheet, reference, (attributes) => `<x:c r="${reference}"${preserveStyleAttributes(attributes)} t="n"><x:v>${value}</x:v></x:c>`);
}

function setFormulaCachedCell(sheet: string, reference: string, value: string | number | null) {
  return replaceCell(sheet, reference, (attributes, body) => {
    const formula = body.match(/<x:f[\s\S]*?<\/x:f>/)?.[0] ?? "";
    const valueXml = value === null ? "" : xml(value);
    const typeAttribute = typeof value === "string" ? ' t="str"' : ' t="n"';
    return `<x:c r="${reference}"${preserveStyleAttributes(attributes)}${typeAttribute}>${formula}<x:v>${valueXml}</x:v></x:c>`;
  });
}

function columnName(index: number) {
  let value = index + 1;
  let name = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function isMoneyCell(sheetName: string, rowIndex: number, columnIndex: number) {
  if (sheetName === "Quote PDF") {
    return (columnIndex >= 7 && columnIndex <= 8 && rowIndex >= 16 && rowIndex <= 45) || (columnIndex === 8 && rowIndex >= 47 && rowIndex <= 53);
  }

  if (sheetName === "Inputs") {
    return (columnIndex >= 7 && columnIndex <= 8 && rowIndex >= 24 && rowIndex <= 43) || (columnIndex === 1 && rowIndex >= 45 && rowIndex <= 51);
  }

  if (sheetName === "Supplier PO") {
    return (columnIndex >= 7 && columnIndex <= 8 && rowIndex >= 17 && rowIndex <= 26) || (columnIndex === 1 && rowIndex >= 28 && rowIndex <= 33);
  }

  if (sheetName === "Invoice") {
    return (columnIndex >= 4 && columnIndex <= 5 && rowIndex >= 15 && rowIndex <= 24) || (columnIndex === 1 && rowIndex >= 26 && rowIndex <= 30) || (columnIndex === 8 && rowIndex === 3);
  }

  return false;
}

export function isTemplateInputCell(sheetName: string, rowIndex: number, columnIndex: number) {
  if (sheetName === "Quote PDF" || sheetName.includes("Terms") || sheetName === "Vendor Patterns") {
    return false;
  }

  if (sheetName === "Inputs") {
    return (
      (columnIndex === 1 && ((rowIndex >= 2 && rowIndex <= 21) || (rowIndex >= 45 && rowIndex <= 53))) ||
      (rowIndex >= 24 && rowIndex <= 43 && columnIndex >= 1 && columnIndex <= 11 && columnIndex !== 8)
    );
  }

  if (sheetName === "Supplier PO") {
    return (
      (columnIndex === 1 && ((rowIndex >= 3 && rowIndex <= 14) || (rowIndex >= 28 && rowIndex <= 33) || (rowIndex >= 36 && rowIndex <= 40))) ||
      (rowIndex >= 17 && rowIndex <= 26 && columnIndex >= 1 && columnIndex <= 11 && columnIndex !== 8)
    );
  }

  if (sheetName === "Invoice") {
    return (
      ((rowIndex >= 3 && rowIndex <= 6) && [1, 5, 8].includes(columnIndex)) ||
      ((rowIndex >= 9 && rowIndex <= 12) && [0, 4].includes(columnIndex)) ||
      (rowIndex >= 15 && rowIndex <= 24 && columnIndex >= 0 && columnIndex <= 7 && columnIndex !== 5) ||
      (columnIndex === 1 && ((rowIndex >= 26 && rowIndex <= 30) || (rowIndex >= 32 && rowIndex <= 35)))
    );
  }

  return false;
}

function styleForCell(sheetName: string, rowIndex: number, columnIndex: number) {
  if (rowIndex === 0) {
    return titleStyle;
  }

  if (isTemplateInputCell(sheetName, rowIndex, columnIndex) && isMoneyCell(sheetName, rowIndex, columnIndex)) {
    return inputMoneyStyle;
  }

  if (isTemplateInputCell(sheetName, rowIndex, columnIndex)) {
    return inputStyle;
  }

  if (sheetName === "Quote PDF") {
    if (rowIndex === 15) return headerStyle;
    if (rowIndex === 53 && columnIndex >= 5) return totalStyle;
    if (isMoneyCell(sheetName, rowIndex, columnIndex)) return moneyStyle;
    if (rowIndex === 47 || rowIndex === 56) return labelStyle;
    if (rowIndex >= 58) return noteStyle;
  }

  if (sheetName === "Inputs") {
    if (rowIndex === 23) return headerStyle;
    if (columnIndex === 0 && ((rowIndex >= 2 && rowIndex <= 21) || (rowIndex >= 45 && rowIndex <= 53))) return labelStyle;
    if (columnIndex === 1 && ((rowIndex >= 2 && rowIndex <= 21) || (rowIndex >= 45 && rowIndex <= 53))) return inputStyle;
    if (isMoneyCell(sheetName, rowIndex, columnIndex)) return moneyStyle;
  }

  if (rowIndex === 2) {
    return headerStyle;
  }

  if (sheetName === "Invoice") {
    if (rowIndex === 8 || rowIndex === 14) return headerStyle;
    if (columnIndex === 0 && ((rowIndex >= 3 && rowIndex <= 6) || (rowIndex >= 26 && rowIndex <= 30) || (rowIndex >= 32 && rowIndex <= 35))) return labelStyle;
    if (columnIndex === 4 && rowIndex >= 3 && rowIndex <= 6) return labelStyle;
    if (columnIndex === 7 && rowIndex >= 3 && rowIndex <= 6) return labelStyle;
    if (rowIndex === 30 && columnIndex <= 1) return totalStyle;
    if (isMoneyCell(sheetName, rowIndex, columnIndex)) return moneyStyle;
  }

  return textStyle;
}

function columnWidthsForSheet(sheet: SheetModel) {
  if (sheet.columnWidths) {
    return sheet.columnWidths;
  }

  if (sheet.name === "Quote PDF") {
    return [6, 36, 4, 17, 17, 15, 8, 14, 15];
  }

  if (sheet.name === "Inputs") {
    return [22, 36, 18, 18, 18, 20, 10, 14, 14, 18, 32, 30];
  }

  if (sheet.name === "Terms") {
    return [22, 78];
  }

  if (sheet.name === "Vendor Patterns") {
    return [24, 58, 48];
  }

  const columnCount = Math.max(...sheet.rows.map((row) => row.length));
  return Array.from({ length: columnCount }, (_, index) => (index === 1 ? 34 : index === 2 ? 28 : index >= 7 ? 14 : 18));
}

function sheetXml(sheet: SheetModel) {
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const style = styleForCell(sheet.name, rowIndex, columnIndex);
          if ((value === null || value === "") && style !== inputStyle && style !== inputMoneyStyle) {
            return "";
          }

          const reference = `${columnName(columnIndex)}${rowIndex + 1}`;
          if (typeof value === "number") {
            return `<c r="${reference}" s="${style}"><v>${value}</v></c>`;
          }

          return `<c r="${reference}" s="${style}" t="inlineStr"><is><t>${xml(value ?? "")}</t></is></c>`;
        })
        .join("");

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const columnWidths = columnWidthsForSheet(sheet);
  const columns = columnWidths.map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>
  <cols>${columns}</cols>
  <sheetData>${rows}</sheetData>
</worksheet>`;
}

function workbookXml(sheets: SheetModel[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map((sheet, index) => `<sheet name="${xml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
  <calcPr calcMode="auto"/>
</workbook>`;
}

function workbookRelsXml(sheets: SheetModel[]) {
  const sheetRels = sheets
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function contentTypesXml(sheets: SheetModel[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="$#,##0.00"/></numFmts>
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF171717"/><name val="Aptos"/></font>
    <font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font>
    <font><b/><sz val="12"/><color rgb="FF171717"/><name val="Aptos"/></font>
  </fonts>
  <fills count="7">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF4F3424"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFE7DF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF0F0EE"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF244C63"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2"><border/><border><left style="thin"><color rgb="FFD8DDE6"/></left><right style="thin"><color rgb="FFD8DDE6"/></right><top style="thin"><color rgb="FFD8DDE6"/></top><bottom style="thin"><color rgb="FFD8DDE6"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFill="1" applyFont="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="6" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="164" fontId="2" fillId="2" borderId="1" applyNumberFormat="1" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
    <xf numFmtId="164" fontId="0" fillId="6" borderId="1" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function formatIsoDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function addDaysIso(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function latestLinePrice(request: LatticeRequest, lineItemId: string, partName: string) {
  const latest = request.customerQuotes.at(-1);
  const line = quotedLineForRequestItem(latest?.lineItems, { id: lineItemId, partName });
  if (line) {
    return line.unitPrice;
  }

  if (request.lineItems.length === 1 && request.quote.estimatedPriceCents !== null) {
    return request.quote.estimatedPriceCents / 100 / Math.max(request.lineItems[0]?.quantity ?? 1, 1);
  }

  return null;
}

function quoteSubtotal(request: LatticeRequest) {
  const latest = request.customerQuotes.at(-1);
  if (latest) {
    return latest.totalCents / 100;
  }

  return request.lineItems.reduce((sum, item) => {
    const unitPrice = latestLinePrice(request, item.id, item.partName) ?? 0;
    return sum + unitPrice * item.quantity;
  }, 0);
}

function productionRegion(request: LatticeRequest) {
  return request.quote.shippingMethod === "Domestic" ? "Domestic" : "Overseas";
}

function itemDetails(request: LatticeRequest, index: number) {
  const cadFiles = request.files.filter((file) => /\.(step|stp|iges|igs|sldprt|x_t|x_b|sat|ipt)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type));
  const drawingFiles = request.files.filter((file) => /\.(pdf|dwg|dxf|png|jpg|jpeg)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type));
  const lineItem = request.lineItems[index];

  return [`[Rev 1] ${cadFiles[index]?.name ?? lineItem.partName}`, drawingFiles[index]?.name, lineItem.partName].filter(Boolean).join("\n");
}

function templateItemDetails(request: LatticeRequest, index: number) {
  const lineItem = request.lineItems[index];
  if (!lineItem) {
    return "";
  }

  const cadFiles = request.files.filter((file) => /\.(step|stp|iges|igs|sldprt|x_t|x_b|sat|ipt)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type));
  const drawingFiles = request.files.filter((file) => /\.(pdf|dwg|dxf|png|jpg|jpeg)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type));
  const details = [
    cadFiles[index]?.name ?? lineItem.partName,
    drawingFiles[index]?.name,
    `Process: ${request.process || "TBD"}`,
    `Material: ${lineItem.material || "TBD"}`,
    `Finish: ${lineItem.surfaceFinish || "As machined / not specified"}`,
  ];

  if (lineItem.generalTolerance) {
    details.push(`Tolerance: ${lineItem.generalTolerance}`);
  }

  if (lineItem.qualityDocumentation?.length) {
    details.push(`Inspection/docs: ${lineItem.qualityDocumentation.join(", ")}`);
  }

  return details.filter(Boolean).join("\n");
}

function formatQuoteDateForTemplate(value: string | null | undefined) {
  return formatIsoDate(value);
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function leadTimeText(request: LatticeRequest) {
  const latest = request.customerQuotes.at(-1);

  if (latest?.leadTime) {
    return latest.leadTime;
  }

  return request.quote.leadTimeDays ? `${request.quote.leadTimeDays} business days` : "Pending";
}

function templateNotes(request: LatticeRequest) {
  const latest = request.customerQuotes.at(-1);
  const quoteDate = formatQuoteDateForTemplate(request.quote.quoteCreatedDate || latest?.quoteDate) || new Date().toISOString().slice(0, 10);
  const shipBy = request.quote.leadTimeDays ? addDaysIso(quoteDate, request.quote.leadTimeDays) : null;

  return ["Notes:", buildStandardQuoteNotes(quoteDate, shipBy)].join("\n");
}

function preparedForLines(request: LatticeRequest) {
  return [request.requesterName, request.requesterEmail, request.requesterPhone].filter(Boolean);
}

function shipToLines(request: LatticeRequest) {
  const lines = requestShipToLines({
    shipToAddress1: request.shipToAddress1,
    shipToAddress2: request.shipToAddress2,
    shipToCity: request.shipToCity,
    shipToCompany: request.shipToCompany || request.buyerCompany,
    shipToName: request.shipToName || request.requesterName,
    shipToPhone: request.shipToPhone || request.requesterPhone,
    shipToState: request.shipToState,
    shipToZipCode: request.shipToZipCode,
  });

  return lines.length ? lines : [request.requesterName, request.buyerCompany].filter(Boolean);
}

function patchWorkbookCalcMode(workbookXmlValue: string) {
  const calcPr = '<x:calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1" />';

  if (/<x:calcPr\b[\s\S]*?\/>/.test(workbookXmlValue)) {
    return workbookXmlValue.replace(/<x:calcPr\b[\s\S]*?\/>/, calcPr);
  }

  if (/<x:calcPr\b[\s\S]*?<\/x:calcPr>/.test(workbookXmlValue)) {
    return workbookXmlValue.replace(/<x:calcPr\b[\s\S]*?<\/x:calcPr>/, calcPr);
  }

  return workbookXmlValue.replace("</x:workbook>", `${calcPr}</x:workbook>`);
}

function buildCustomerQuoteFromExcelTemplate(request: LatticeRequest) {
  const templatePath = path.join(process.cwd(), "resources", "admin", "lattice-os-zintilon-quote-template.xlsx");
  const entries = readZipEntries(fs.readFileSync(templatePath));
  const latest = request.customerQuotes.at(-1);
  const quoteDate = formatQuoteDateForTemplate(request.quote.quoteCreatedDate || latest?.quoteDate) || new Date().toISOString().slice(0, 10);
  const validUntil = formatQuoteDateForTemplate(request.quote.quoteValidUntil || latest?.validUntil) || addDaysIso(quoteDate, 30);
  const subtotal = quoteSubtotal(request);
  const shipping = request.quote.shippingCostCents === null ? 0 : request.quote.shippingCostCents / 100;
  const salesTax = Math.round(subtotal * defaultSalesTaxRate * 100) / 100;
  const total = subtotal + shipping + salesTax;
  const preparedFor = preparedForLines(request).join("\n");
  const shipTo = shipToLines(request).join("\n");
  const shippingDetails = [request.quote.shippingMethod || "International", request.quote.shippingTerms || "Determined at checkout"].filter(Boolean).join(" / ");

  const patchedEntries = entries.map((entry) => {
    if (entry.name === "xl/workbook.xml") {
      return { ...entry, content: Buffer.from(patchWorkbookCalcMode(entry.content.toString("utf8")), "utf8") };
    }

    if (entry.name !== "xl/worksheets/sheet1.xml") {
      return entry;
    }

    let sheet = entry.content.toString("utf8");
    sheet = setStringCell(sheet, "I3", quoteReference(request));
    sheet = setStringCell(sheet, "I4", quoteDate);
    sheet = setStringCell(sheet, "I5", validUntil);
    sheet = setStringCell(sheet, "I6", latticePaymentTerms);
    sheet = setStringCell(sheet, "A10", preparedFor);
    sheet = setStringCell(sheet, "D10", shipTo);
    sheet = setStringCell(sheet, "A11", "");
    sheet = setStringCell(sheet, "D11", "");
    sheet = setStringCell(sheet, "G10", `Production speed: ${leadTimeText(request)}`);
    sheet = setStringCell(sheet, "G11", `Shipping: ${shippingDetails}`);

    request.lineItems.slice(0, 10).forEach((lineItem, index) => {
      const row = 16 + index;
      const unitPrice = latestLinePrice(request, lineItem.id, lineItem.partName);
      const lineTotal = unitPrice === null ? null : unitPrice * lineItem.quantity;

      sheet = setNumberCell(sheet, `A${row}`, index + 1);
      sheet = setStringCell(sheet, `B${row}`, templateItemDetails(request, index));
      sheet = setStringCell(sheet, `F${row}`, productionRegion(request));
      sheet = setNumberCell(sheet, `G${row}`, lineItem.quantity);
      sheet = setNumberCell(sheet, `H${row}`, unitPrice);
      sheet = setFormulaCachedCell(sheet, `I${row}`, lineTotal);
    });

    for (let index = request.lineItems.length; index < 10; index += 1) {
      const row = 16 + index;
      sheet = setNumberCell(sheet, `A${row}`, index + 1);
      sheet = setStringCell(sheet, `B${row}`, "");
      sheet = setStringCell(sheet, `F${row}`, "");
      sheet = setStringCell(sheet, `G${row}`, "");
      sheet = setStringCell(sheet, `H${row}`, "");
      sheet = setFormulaCachedCell(sheet, `I${row}`, null);
    }

    sheet = setStringCell(sheet, "A27", templateNotes(request));
    sheet = setFormulaCachedCell(sheet, "G13", `ORDER TOTAL $${formatMoney(total)}`);
    sheet = setFormulaCachedCell(sheet, "I27", subtotal);
    sheet = setNumberCell(sheet, "H28", shipping);
    sheet = setFormulaCachedCell(sheet, "I28", shipping);
    sheet = setStringCell(sheet, "F29", "Sales Tax");
    sheet = setNumberCell(sheet, "H29", salesTax);
    sheet = setFormulaCachedCell(sheet, "I29", salesTax);
    sheet = setStringCell(sheet, "F30", "");
    sheet = setStringCell(sheet, "H30", "");
    sheet = setStringCell(sheet, "I30", "");
    sheet = setFormulaCachedCell(sheet, "I31", total);

    return { ...entry, content: Buffer.from(sheet, "utf8") };
  });

  return createZip(patchedEntries);
}

function termsRows() {
  return [
    ["Clause", "Standard language"],
    ["Quote validity", "Price is valid through the valid-until date. Lead time is an estimate and may change if acceptance is delayed or supplier capacity changes."],
    ["3D vs drawing precedence", "If 2D drawing requirements conflict with the 3D file, Lattice will request clarification before release."],
    ["DFM changes", "Manual drilling, alternate stock thickness, tolerance-risk features, or reach limitations should be called out before customer acceptance."],
    ["Payment release", `${latticePaymentTerms}. Production does not begin until payment is received and final design release is complete.`],
    ["Taxes and duties", "Tax, tariffs, import duties, customs brokerage, and compliance fees are excluded unless explicitly listed in the quote total."],
    ["Inspection", "Standard dimensional inspection is included. CMM, FAIR, material certs, or special documentation must be quoted explicitly."],
    ["Shipping", "Shipping costs and delivery dates are estimates until final shipment booking unless the quote says landed cost is included."],
    ["Confidentiality", "Customer-provided drawings, CAD files, and technical information are used only for quotation, manufacturing review, and production of the quoted work."],
    ["Acceptance", "Customer acceptance may be provided by written approval, purchase order, or payment referencing the quote number."],
  ];
}

function vendorPatternRows() {
  return [
    ["Vendor set", "Useful pattern", "Lattice template response"],
    ["Zintilon / Jucheng / Best", "Excel-like quotation with contacts, line items, shipping, total, lead time, validity, and payment notes.", "Use a clean input sheet and customer-facing print sheet."],
    ["Xometry", "Deep per-part technical specification and value-engineering feedback.", "Use DFM / notes and customer-visible note columns per line item."],
    ["Fictiv", "Summary of order, production region, ship-by, delivery, shipping method, tax/tariff treatment, and DFM feedback.", "Put order total and logistics above line items."],
    ["Hubs / Protolabs Network", "Landed-cost framing, bill-to/ship-to, detailed specs, acceptance language, and terms.", "Separate tax, tariffs/duties, shipping, and total."],
    ["Kintec / Best Parts", "Compact table with dimensions, material, finish, lead time, and quote-specific notes.", "Dimensions and notes are first-class line item fields."],
  ];
}

export function buildXlsxWorkbook(sheets: SheetModel[]) {
  const files = [
    { name: "[Content_Types].xml", content: contentTypesXml(sheets) },
    { name: "_rels/.rels", content: relsXml() },
    { name: "xl/workbook.xml", content: workbookXml(sheets) },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRelsXml(sheets) },
    { name: "xl/styles.xml", content: stylesXml() },
    ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml(sheet) })),
  ];

  return createZip(files);
}

function buildSheets(request: LatticeRequest): SheetModel[] {
  const latest = request.customerQuotes.at(-1);
  const quoteDate = formatIsoDate(request.quote.quoteCreatedDate || latest?.quoteDate) || new Date().toISOString().slice(0, 10);
  const validUntil = formatIsoDate(request.quote.quoteValidUntil || latest?.validUntil) || addDaysIso(quoteDate, 30);
  const shipBy = request.quote.leadTimeDays ? addDaysIso(quoteDate, request.quote.leadTimeDays) : null;
  const standardNotes = buildStandardQuoteNotes(quoteDate, shipBy);
  const subtotal = quoteSubtotal(request);
  const shipping = request.quote.shippingCostCents === null ? 0 : request.quote.shippingCostCents / 100;
  const salesTax = Math.round(subtotal * defaultSalesTaxRate * 100) / 100;
  const total = subtotal + shipping + salesTax;
  const lineRows = request.lineItems.slice(0, 20).map((lineItem, index) => {
    const unitPrice = latestLinePrice(request, lineItem.id, lineItem.partName);
    const lineTotal = unitPrice === null ? null : unitPrice * lineItem.quantity;

    return [
      index + 1,
      itemDetails(request, index),
      request.process,
      lineItem.material,
      lineItem.surfaceFinish || "As machined / not specified",
      lineItem.generalTolerance || "",
      lineItem.quantity,
      unitPrice,
      lineTotal,
      productionRegion(request),
      [lineItem.notes, request.operatorReview.internalNotes].filter(Boolean).join("\n"),
      lineItem.qualityDocumentation?.join(", ") || "Standard dimensional inspection included.",
    ];
  });
  const paddedLines = [...lineRows, ...Array.from({ length: Math.max(0, 20 - lineRows.length) }, (_, index) => [lineRows.length + index + 1, "", "", "", "", "", null, null, null, "", "", ""])];
  const preparedFor = preparedForLines(request).join("\n");
  const shipTo = shipToLines(request).join("\n");

  const inputRows: SheetRow[] = [
    ["Lattice Customer Quote Template - Inputs"],
    [],
    ["Quote number", quoteReference(request)],
    ["Quote status", request.status === "QUOTED" || request.status === "PURCHASED" ? "Quoted" : "Draft from RFQ data"],
    ["Quote date", quoteDate],
    ["Valid until", validUntil],
    ["Prepared for", preparedFor],
    ["Ship to", shipTo],
    ["Bill to / ship to", shipTo],
    ["Prepared by", latest?.preparedBy || "Lattice OS"],
    ["Account manager", request.operatorReview.assignedOwner || "William Paik"],
    ["Account manager email", latticeEmail],
    ["Lattice address", latticeAddress],
    ["Lattice website", latticeWebsite],
    ["RFQ / project", latest?.projectName || request.title],
    ["Production region", productionRegion(request)],
    ["Production speed", latest?.leadTime || (request.quote.leadTimeDays ? `${request.quote.leadTimeDays} business days` : "")],
    ["Ship by", shipBy || "Pending"],
    ["Estimated delivery", request.quote.estimatedDeliveryDate || "TBD after checkout"],
    ["Shipping method", request.quote.shippingMethod || "International"],
    ["Shipping terms", request.quote.shippingTerms || "Determined at checkout"],
    ["Payment terms", latticePaymentTerms],
    [],
    ["Item", "Part details / file package", "Process", "Material", "Finish", "Dimensions / tolerance", "Qty", "Unit price", "Subtotal", "Production region", "DFM / notes", "Customer-visible note"],
    ...paddedLines,
    [],
    ["Part production subtotal", subtotal],
    ["Engineering / setup", 0],
    ["Shipping", shipping],
    ["Sales Tax", salesTax],
    ["Other fees", 0],
    ["Order total", total],
    ["Quote validity note", "Price is valid until the valid-until date; lead time is valid for 15 days unless otherwise stated."],
    ["Customer summary note", standardNotes],
  ];

  const quoteRows: SheetRow[] = [
    ["Lattice OS"],
    [latticeAddress, "", "", "", "", "", `${latticeEmail}\n${latticeWebsite}`],
    [`Quote ${quoteReference(request)}`],
    [`${inputRows[3][1]} | Created ${quoteDate} | Valid until ${validUntil}`],
    [],
    ["PREPARED FOR", "", "", "SHIP TO", "", "", "QUOTE DETAILS"],
    [
      preparedFor,
      "",
      "",
      shipTo,
      "",
      "",
      `Production speed: ${inputRows[16][1] || "Pending"}\nShip by: ${shipBy || "Pending"}\nEstimated delivery: ${request.quote.estimatedDeliveryDate || "TBD after checkout"}\nShipping: ${request.quote.shippingMethod || "International"}\nTerms: ${request.quote.shippingTerms || "Determined at checkout"}`,
    ],
    [],
    [],
    [],
    [],
    [],
    [`SUMMARY OF ORDER    ORDER TOTAL $${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    [],
    [],
    ["#", "Part details", "", "Process", "Material", "Finish", "Qty", "Unit price", "Subtotal"],
    ...paddedLines.slice(0, 10).flatMap((row) => [[row[0], row[1], "", row[2], row[3], row[4], row[6], row[7], row[8]], [], []]),
    [],
    ["NOTES", "", "", "", "", "Part production", "", "", subtotal],
    [standardNotes, "", "", "", "", "Engineering / setup", "", "", 0],
    ["", "", "", "", "", "Shipping", "", "", shipping],
    ["", "", "", "", "", "Sales Tax", "", "", salesTax],
    ["", "", "", "", "", "Other fees", "", "", 0],
    ["", "", "", "", "", "Order Total", "", "", total],
    [],
    [],
    ["MANUFACTURING ASSUMPTIONS AND ACCEPTANCE"],
    [],
    [
      `1. ${latticePaymentTerms}; production begins only after payment is received and final design release is complete.\n2. Customer-supplied CAD, drawings, quantities, material, finish, and inspection requirements are assumed complete and current.\n3. Any change to design, drawing callouts, material, quantity, shipping destination, or requested certifications may require repricing.\n4. Production lead time starts after written quote acceptance, payment, final design release, and closure of open DFM questions.\n5. Unless stated otherwise, tax, tariffs, import duties, customs brokerage, expedited freight, and special inspection documents are excluded.\n6. To accept, reply with written approval and complete payment referencing this quote number.`,
    ],
  ];

  return [
    { columnWidths: [6, 36, 4, 17, 17, 15, 8, 14, 15], name: "Quote PDF", rows: quoteRows },
    { columnWidths: [22, 36, 18, 18, 18, 20, 10, 14, 14, 18, 32, 30], name: "Inputs", rows: inputRows },
    { columnWidths: [22, 78], name: "Terms", rows: [["Standard Clause Library"], [], ...termsRows()] },
    { columnWidths: [24, 58, 48], name: "Vendor Patterns", rows: [["Vendor Quote Patterns Reviewed"], [], ...vendorPatternRows()] },
  ];
}

export function customerQuoteXlsxFileName(request: LatticeRequest) {
  const quoteNumber = quoteReference(request)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const customer = request.buyerCompany
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${quoteNumber || "quote"}-${customer || "customer"}-template.xlsx`;
}

export function buildCustomerQuoteXlsx(request: LatticeRequest) {
  return buildCustomerQuoteFromExcelTemplate(request);
}

function blankCustomerQuoteTemplateRequest(): LatticeRequest {
  const placeholderRequest: LatticeRequest = {
    buyerCompany: "Customer company",
    createdAt: new Date().toISOString(),
    customerQuotes: [],
    customerPurchaseOrderAttachment: null,
    dueDate: "",
    files: [
      { id: "file-cad-placeholder", name: "part.step", sizeBytes: 0, type: "application/octet-stream" },
      { id: "file-drawing-placeholder", name: "drawing.pdf", sizeBytes: 0, type: "application/pdf" },
    ],
    guestAccessTokenExpiresAt: null,
    guestAccessTokenHash: "",
    id: "req_template",
    isArchived: false,
    lineItems: [
      {
        generalTolerance: "[Tolerance / dimensions]",
        id: "line-template-1",
        material: "[Material]",
        notes: "[DFM or process notes]",
        partName: "[Part name]",
        qualityDocumentation: ["[Inspection / docs]"],
        quantity: 0,
        surfaceFinish: "[Finish]",
      },
      {
        generalTolerance: "",
        id: "line-template-2",
        material: "",
        notes: "",
        partName: "",
        qualityDocumentation: [],
        quantity: 0,
        surfaceFinish: "",
      },
    ],
    operatorReview: {
      assignedOwner: "William Paik",
      completeness: "READY_FOR_REVIEW",
      internalNotes: "",
      supplierPackageNotes: "",
    },
    process: "[Process]",
    purchasePayment: {
      method: null,
      status: null,
      customerPoNumber: "",
      accountsPayableEmail: "",
      buyerCheckoutNotes: "",
      card: null,
      stripe: {
        amountCents: null,
        checkoutSessionId: "",
        currency: "",
        paidAt: null,
        paymentIntentId: "",
      },
    },
    quote: {
      estimatedDeliveryDate: "TBD after checkout",
      estimatedPriceCents: null,
      leadTimeDays: null,
      quoteCreatedDate: new Date().toISOString().slice(0, 10),
      quoteValidUntil: addDaysIso(new Date().toISOString().slice(0, 10), 30),
      shippingCostCents: null,
      shippingMethod: "International",
      shippingTerms: "Determined at checkout",
      summary: "Pricing includes manufacturing coordination, production, standard inspection, and shipment according to the terms below.",
    },
    revisionChangeLog: [],
    revisionNumber: 1,
    revisionOfRequestId: null,
    requestOrigin: "ACCOUNT",
    requesterEmail: "customer@example.com",
    requesterName: "Customer name, email, phone",
    requesterPhone: "+1 (555) 010-0000",
    shipToAddress1: "[Address 1]",
    shipToAddress2: "",
    shipToCity: "[City]",
    shipToCompany: "Customer company",
    shipToName: "Customer name",
    shipToPhone: "+1 (555) 010-0000",
    shipToState: "[State]",
    shipToZipCode: "[Zip]",
    status: "SUBMITTED",
    statusEvents: [],
    supplierOrder: {
      contactName: "",
      documents: [],
      notes: "",
      shopName: "",
      status: "AWAITING_ACKNOWLEDGMENT",
      trackingNumber: "",
      updates: [],
    },
    supplierQuoteFiles: [],
    supplierQuotes: [],
    title: "Project or RFQ title",
    updatedAt: new Date().toISOString(),
  };

  return placeholderRequest;
}

export function buildBlankCustomerQuoteTemplateSheets() {
  return buildSheets(blankCustomerQuoteTemplateRequest());
}

export function buildBlankCustomerQuoteTemplateXlsx() {
  return buildXlsxWorkbook(buildBlankCustomerQuoteTemplateSheets());
}
