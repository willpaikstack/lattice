import type { CustomerRequest } from "./customer-request";
import { processLabel, readTargetDeliveryDate, type ManufacturingDetails } from "./rfq-manufacturing";
import type { RequestFormInitialState } from "@/components/request-form";

import { materialOfferingFor } from "./material-quote-offerings";
import { canonicalMaterialValue } from "@/lib/rfq-material-search";
import {
  generalToleranceOptions,
  processOptions,
  qualityDocumentationOptions,
  type RfqOption,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "@/lib/rfq-options";


function optionValueFromLabel(options: RfqOption[], label: string | undefined, fallback: string) {
  if (!label?.trim()) {
    return fallback;
  }

  const normalized = label.trim().toLowerCase();
  // Prefer exact matches before legacy fuzzy labels: the tighter-than label
  // contains the ±0.005 label but represents a different requirement.
  const exact = options.find(option => [option.value, option.label, option.bubbleValue].some(value => value?.toLowerCase() === normalized));
  if (exact) return exact.value;
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

export function quoteReference(request: CustomerRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

export function orderReference(request: CustomerRequest) {
  return `PO-${request.id.replace(/^req_/, "").toUpperCase()}`;
}

function isDrawingFile(file: CustomerRequest["files"][number]) {
  return /pdf|drawing|dxf|dwg|png|jpg|jpeg/i.test(`${file.name} ${file.type}`);
}

function isCadFile(file: CustomerRequest["files"][number]) {
  return !isDrawingFile(file);
}

function drawingRequiredFlags(notes: string | undefined, saved?: ManufacturingDetails["drawingRequirements"]) {
  const lines = new Set((notes ?? "").split(/\r?\n/).map(line => line.trim().toLowerCase()));
  const selected = (key: keyof NonNullable<typeof saved>, label: string) => saved ? saved[key] === true : lines.has(`${label} requested; drawing required.`);
  return {
    engineeringFits: selected("engineeringFits", "engineering fits"),
    sharpInternalCorners: selected("sharpInternalCorners", "sharp internal corners"),
    partMarkings: selected("partMarkings", "part markings"),
    threads: selected("threads", "threads"),
    drawingSpecificTolerances: selected("drawingSpecificTolerances", "drawing-specific tolerances"),
    tightLinearTolerance: selected("tightLinearTolerance", "linear tolerance tighter than general tolerance"),
  };
}

function lineItemNotesWithoutGeneratedDrawingPrompts(notes: string | undefined) {
  const generatedPrompts = new Set([
    "Drawing-specific tolerances requested; drawing required.",
    "Specific drawing callouts take precedence over general tolerances. Lattice must review conflicting requirements before quoting.",
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

export function isResumeCandidate(request: CustomerRequest) {
  return (
    !request.isArchived &&
    (request.status === "DRAFT" ||
      request.status === "SUBMITTED" ||
      request.status === "NEEDS_INFO" ||
      request.status === "READY_FOR_SUPPLIER_RFQ")
  );
}

function copiedRequestInitialState(
  request: CustomerRequest,
  {
    notes,
    projectName,
  }: {
    notes: Array<string | null | undefined>;
    projectName: string;
  },
): RequestFormInitialState {
  const cadFiles = request.files.filter(isCadFile);
  const drawingFiles = request.files.filter(isDrawingFile);
  const lineItems = request.lineItems.map((lineItem, index) => {
    const cadFile = cadFiles.find(file => file.lineItemIndex === index) ?? (cadFiles.every(file => file.lineItemIndex == null) ? cadFiles[index] : undefined);
    const drawingFile = drawingFiles.find(file => file.lineItemIndex === index) ?? (drawingFiles.every(file => file.lineItemIndex == null) ? drawingFiles[index] : undefined);

    return {
      process: optionValueFromLabel(processOptions, processLabel(lineItem.manufacturingDetails?.process || request.process), "cnc_milling"),
      customerPartNumber: lineItem.manufacturingDetails?.customerPartNumber ?? "",
      cadRevision: lineItem.manufacturingDetails?.cadRevision ?? "",
      drawingRevision: lineItem.manufacturingDetails?.drawingRevision ?? "",
      targetDeliveryDate: readTargetDeliveryDate(lineItem.manufacturingDetails),
      fileHistory: [],
      cadMetadata: lineItem.manufacturingDetails?.cadMetadata,
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
      material: lineItem.manufacturingDetails?.materialKey && materialOfferingFor(lineItem.manufacturingDetails.materialKey)
        ? canonicalMaterialValue(lineItem.manufacturingDetails.materialKey)
        : canonicalMaterialValue(optionValueFromLabel(rfqMaterialOptions, lineItem.material, "")),
      notes: lineItemNotesWithoutGeneratedDrawingPrompts(lineItem.notes),
      qualityDocumentation: lineItem.qualityDocumentation?.length
        ? lineItem.qualityDocumentation.map((label) => optionValueFromLabel(qualityDocumentationOptions, label, "standard_inspection"))
        : ["standard_inspection"],
      quantity: String(lineItem.quantity ?? 1),
      surfaceFinish: optionValueFromLabel(surfaceFinishOptions, lineItem.surfaceFinish, "as_machined_ra_3_2"),
      technicalDrawingName: drawingFile?.name ?? "",
      technicalDrawingSizeBytes: drawingFile?.sizeBytes ?? 0,
      technicalDrawingStorageKey: drawingFile?.storageKey,
      technicalDrawingType: drawingFile?.type ?? "",
      ...drawingRequiredFlags(lineItem.notes, lineItem.manufacturingDetails?.drawingRequirements),
    };
  });
  const primaryInitialLineItem = lineItems[0];

  return {
    restrictionStatus: request.intakeDeclaration?.restrictionStatus ?? "unconfirmed",
    restrictionPolicyVersion: request.intakeDeclaration?.policyVersion ?? "",
    endUse: request.intakeDeclaration?.endUse ?? "",
    endUseNotes: request.intakeDeclaration?.endUseNotes ?? "",
    fileName: primaryInitialLineItem?.fileName ?? "",
    generalTolerance: primaryInitialLineItem?.generalTolerance ?? "iso_2768_medium_m",
    lineItems,
    material: primaryInitialLineItem?.material ?? "",
    notes: compactLines(notes),
    projectName,
    qualityDocumentation: primaryInitialLineItem?.qualityDocumentation ?? ["standard_inspection"],
    quantity: primaryInitialLineItem?.quantity ?? "1",
    surfaceFinish: primaryInitialLineItem?.surfaceFinish ?? "as_machined_ra_3_2",
    technicalDrawingName: primaryInitialLineItem?.technicalDrawingName ?? "",
  };
}

export function reorderInitialState(order: CustomerRequest): RequestFormInitialState {
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

export function draftInitialState(draft: CustomerRequest): RequestFormInitialState {
  return copiedRequestInitialState(draft, { notes: [draft.lineItems[0]?.notes], projectName: draft.title });
}
