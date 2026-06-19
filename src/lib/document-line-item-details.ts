import type { LatticeRequest, RequestLineItem, UploadedFile } from "./request-model";

function isDrawingFile(file: UploadedFile) {
  return /\.(pdf|dwg|dxf|png|jpg|jpeg)$/i.test(file.name) || /pdf|image|drawing|dwg|dxf/i.test(file.type);
}

function isCadFile(file: UploadedFile) {
  return /\.(step|stp|iges|igs|sldprt|x_t|x_b|sat|ipt)$/i.test(file.name) || /step|cad|iges|solidworks|parasolid/i.test(file.type);
}

export function bundledFilesByLineItem(request: LatticeRequest) {
  const cadFiles = request.files.filter(isCadFile);
  const drawingFiles = request.files.filter(isDrawingFile);

  return request.lineItems.map((lineItem, index) => ({
    cadFile: cadFiles[index] ?? null,
    drawingFile: drawingFiles[index] ?? null,
    lineItem,
  }));
}

function clean(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function leadTimeText(request: LatticeRequest, lineItem: RequestLineItem) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = latestQuote?.lineItems.find((line) => line.id === lineItem.id || line.description === lineItem.partName);

  if (quotedLine?.leadTimeDays) {
    return `${quotedLine.leadTimeDays} business days`;
  }

  if (request.quote.leadTimeDays) {
    return `${request.quote.leadTimeDays} business days`;
  }

  if (latestQuote?.leadTime) {
    return latestQuote.leadTime;
  }

  return "";
}

export function manufacturingReleaseDescription(input: {
  drawing: string;
  finish: string;
  inspection: string;
  leadTime?: string;
  material: string;
  note: string;
  process: string;
}) {
  return [
    `${clean(input.process) || "TBD"} / ${clean(input.material) || "TBD"} / ${clean(input.finish) || "As machined / not specified"}`,
    [`Drawing: ${clean(input.drawing) || "Final released drawing"}`, input.leadTime ? `lead time: ${clean(input.leadTime)}` : ""].filter(Boolean).join("; "),
    `Inspection/docs: ${clean(input.inspection) || "Standard Inspection"}`,
    clean(input.note) || "Final CAD and drawing package released for production.",
  ].join("\n");
}

export function manufacturingReleaseDescriptionForRequestLine(request: LatticeRequest, lineItem: RequestLineItem, drawingFile?: UploadedFile | null) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLine = latestQuote?.lineItems.find((line) => line.id === lineItem.id || line.description === lineItem.partName);
  const process = clean(quotedLine?.process || request.process || "TBD");
  const material = clean(quotedLine?.material || lineItem.material || "TBD");
  const finish = clean(quotedLine?.finish || lineItem.surfaceFinish || "As machined / not specified");
  const drawing = clean(drawingFile?.name || "Final released drawing");
  const leadTime = clean(leadTimeText(request, lineItem));
  const inspection = lineItem.qualityDocumentation?.length ? lineItem.qualityDocumentation.map(clean).filter(Boolean).join(", ") : "Standard Inspection";
  const note = clean(lineItem.notes || latestQuote?.notes || "Final CAD and drawing package released for production.");

  return manufacturingReleaseDescription({
    drawing,
    finish,
    inspection,
    leadTime,
    material,
    note,
    process,
  });
}
