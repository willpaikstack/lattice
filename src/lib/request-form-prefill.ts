import type { RequestFormInitialState } from "@/components/request-form";
import type { LatticeRequest } from "@/lib/request-model";
import {
  generalToleranceOptions,
  processOptions,
  qualityDocumentationOptions,
  type RfqOption,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "@/lib/rfq-options";

function dueDateFromToday(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}

function optionValueFromLabel(options: RfqOption[], label: string | undefined, fallback: string) {
  if (!label?.trim()) {
    return fallback;
  }

  const normalized = label.trim().toLowerCase();
  const match = options.find((option) => {
    const optionLabel = option.label.toLowerCase();
    const optionValue = option.value.toLowerCase();
    const bubbleValue = option.bubbleValue?.toLowerCase();

    return (
      optionLabel === normalized ||
      optionValue === normalized ||
      bubbleValue === normalized ||
      optionLabel.startsWith(normalized) ||
      normalized.startsWith(optionLabel) ||
      optionLabel.includes(normalized) ||
      normalized.includes(optionLabel)
    );
  });

  return match?.value ?? fallback;
}

function compactLines(lines: Array<string | null | undefined>) {
  return lines.map((line) => line?.trim()).filter(Boolean).join("\n");
}

export function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

export function orderReference(request: LatticeRequest) {
  return `PO-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function isDrawingFile(file: LatticeRequest["files"][number]) {
  return /pdf|drawing|dxf|dwg|png|jpg|jpeg/i.test(`${file.name} ${file.type}`);
}

function isCadFile(file: LatticeRequest["files"][number]) {
  return !isDrawingFile(file);
}

function drawingRequiredFlags(notes: string | undefined) {
  const normalized = notes?.toLowerCase() ?? "";

  return {
    engineeringFits: normalized.includes("engineering fits"),
    sharpInternalCorners: normalized.includes("sharp internal corners"),
    partMarkings: normalized.includes("part markings"),
    threads: normalized.includes("threads requested") || normalized.includes("threads;"),
    tightLinearTolerance: normalized.includes("linear tolerance tighter"),
  };
}

function lineItemNotesWithoutGeneratedDrawingPrompts(notes: string | undefined) {
  const generatedPrompts = new Set([
    "Part markings requested; drawing required.",
    "Linear tolerance tighter than general tolerance requested; drawing required.",
    "Threads requested; drawing required.",
    "Engineering fits requested; drawing required.",
    "Sharp internal corners requested; drawing required.",
  ]);

  return (notes ?? "")
    .split(/\r?\n/)
    .filter((line) => !generatedPrompts.has(line.trim()))
    .join("\n")
    .trim();
}

export function isResumeCandidate(request: LatticeRequest) {
  return (
    !request.isArchived &&
    (request.status === "DRAFT" ||
      request.status === "SUBMITTED" ||
      request.status === "NEEDS_INFO" ||
      request.status === "READY_FOR_SUPPLIER_RFQ")
  );
}

function copiedRequestInitialState(
  request: LatticeRequest,
  {
    notes,
    projectName,
  }: {
    notes: Array<string | null | undefined>;
    projectName: string;
  },
): RequestFormInitialState {
  const primaryLineItem = request.lineItems[0];
  const cadFiles = request.files.filter(isCadFile);
  const drawingFiles = request.files.filter(isDrawingFile);
  const lineItems = request.lineItems.map((lineItem, index) => {
    const cadFile = cadFiles[index];
    const drawingFile = drawingFiles[index];

    return {
      cadPreview: cadFile?.cadPreviewUrn
        ? {
            status: "ready" as const,
            fileName: cadFile.name,
            urn: cadFile.cadPreviewUrn,
          }
        : undefined,
      fileName: cadFile?.name ?? "",
      fileSizeBytes: cadFile?.sizeBytes ?? 0,
      fileStorageKey: cadFile?.storageKey,
      fileType: cadFile?.type ?? "",
      generalTolerance: optionValueFromLabel(generalToleranceOptions, lineItem.generalTolerance, "iso_2768_medium_m"),
      material: optionValueFromLabel(rfqMaterialOptions, lineItem.material, "ss_304"),
      notes: lineItemNotesWithoutGeneratedDrawingPrompts(lineItem.notes),
      partName: lineItem.partName,
      qualityDocumentation: lineItem.qualityDocumentation?.length
        ? lineItem.qualityDocumentation.map((label) => optionValueFromLabel(qualityDocumentationOptions, label, "standard_inspection"))
        : ["standard_inspection"],
      quantity: String(lineItem.quantity ?? 1),
      surfaceFinish: optionValueFromLabel(surfaceFinishOptions, lineItem.surfaceFinish, "as_machined_ra_3_2"),
      technicalDrawingName: drawingFile?.name ?? "",
      technicalDrawingSizeBytes: drawingFile?.sizeBytes ?? 0,
      technicalDrawingStorageKey: drawingFile?.storageKey,
      technicalDrawingType: drawingFile?.type ?? "",
      ...drawingRequiredFlags(lineItem.notes),
    };
  });
  const primaryInitialLineItem = lineItems[0];

  return {
    buyerCompany: request.buyerCompany,
    customerPo: "",
    dueDate: dueDateFromToday(request.quote.leadTimeDays ? request.quote.leadTimeDays + 7 : 21),
    fileName: primaryInitialLineItem?.fileName ?? "",
    generalTolerance: primaryInitialLineItem?.generalTolerance ?? "iso_2768_medium_m",
    lineItems,
    material: primaryInitialLineItem?.material ?? "ss_304",
    notes: compactLines(notes),
    partName: primaryLineItem?.partName ?? request.title,
    process: optionValueFromLabel(processOptions, request.process, "cnc_milling"),
    projectName,
    qualityDocumentation: primaryInitialLineItem?.qualityDocumentation ?? ["standard_inspection"],
    quantity: primaryInitialLineItem?.quantity ?? "1",
    requesterName: request.requesterName,
    surfaceFinish: primaryInitialLineItem?.surfaceFinish ?? "as_machined_ra_3_2",
    technicalDrawingName: primaryInitialLineItem?.technicalDrawingName ?? "",
  };
}

export function reorderInitialState(order: LatticeRequest): RequestFormInitialState {
  const primaryLineItem = order.lineItems[0];

  return copiedRequestInitialState(order, {
    notes: [
      primaryLineItem?.notes,
      `Reorder from ${orderReference(order)} / ${quoteReference(order)}.`,
      order.files.length > 1 ? `Original files: ${order.files.map((file) => file.name).join(", ")}` : null,
      order.lineItems.length > 1 ? `Original order had ${order.lineItems.length} line items; confirm all parts before submitting.` : null,
    ],
    projectName: `${order.title} reorder`,
  });
}

export function draftInitialState(draft: LatticeRequest): RequestFormInitialState {
  const primaryLineItem = draft.lineItems[0];
  const primaryFile = draft.files[0];
  const drawingFile = draft.files.find((file) => file !== primaryFile && isDrawingFile(file));

  return {
    buyerCompany: draft.buyerCompany,
    customerPo: "",
    cadPreview: primaryFile?.cadPreviewUrn
      ? {
          status: "ready",
          fileName: primaryFile.name,
          urn: primaryFile.cadPreviewUrn,
        }
      : undefined,
    dueDate: draft.dueDate || dueDateFromToday(14),
    fileName: primaryFile?.name ?? "",
    fileSizeBytes: primaryFile?.sizeBytes ?? 0,
    fileStorageKey: primaryFile?.storageKey,
    fileType: primaryFile?.type ?? "",
    generalTolerance: optionValueFromLabel(generalToleranceOptions, primaryLineItem?.generalTolerance, "iso_2768_medium_m"),
    material: optionValueFromLabel(rfqMaterialOptions, primaryLineItem?.material, "ss_304"),
    notes: primaryLineItem?.notes ?? "",
    partName: primaryLineItem?.partName ?? draft.title,
    process: optionValueFromLabel(processOptions, draft.process, "cnc_milling"),
    projectName: draft.title,
    qualityDocumentation: primaryLineItem?.qualityDocumentation?.length
      ? primaryLineItem.qualityDocumentation.map((label) => optionValueFromLabel(qualityDocumentationOptions, label, "standard_inspection"))
      : ["standard_inspection"],
    quantity: String(primaryLineItem?.quantity ?? 1),
    requesterName: draft.requesterName,
    surfaceFinish: optionValueFromLabel(surfaceFinishOptions, primaryLineItem?.surfaceFinish, "as_machined_ra_3_2"),
    technicalDrawingName: drawingFile?.name ?? "",
    technicalDrawingSizeBytes: drawingFile?.sizeBytes ?? 0,
    technicalDrawingStorageKey: drawingFile?.storageKey,
    technicalDrawingType: drawingFile?.type ?? "",
  };
}
