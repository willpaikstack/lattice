import { RequestForm, type RequestFormInitialState } from "@/components/request-form";
import type { LatticeRequest } from "@/lib/request-model";
import { getRequestById } from "@/lib/request-repository";
import {
  generalToleranceOptions,
  processOptions,
  qualityDocumentationOptions,
  type RfqOption,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "@/lib/rfq-options";

type NewRequestPageProps = {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function orderReference(request: LatticeRequest) {
  return `PO-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function reorderInitialState(order: LatticeRequest): RequestFormInitialState {
  const primaryLineItem = order.lineItems[0];
  const primaryFile = order.files[0];
  const drawingFile = order.files.find((file) => file !== primaryFile && /pdf|drawing|dxf|dwg|png|jpg|jpeg/i.test(`${file.name} ${file.type}`));

  return {
    buyerCompany: order.buyerCompany,
    customerPo: "",
    dueDate: dueDateFromToday(order.quote.leadTimeDays ? order.quote.leadTimeDays + 7 : 21),
    fileName: primaryFile?.name ?? "",
    generalTolerance: optionValueFromLabel(generalToleranceOptions, primaryLineItem?.generalTolerance, "iso_2768_medium_m"),
    material: optionValueFromLabel(rfqMaterialOptions, primaryLineItem?.material, "ss_304"),
    notes: compactLines([
      primaryLineItem?.notes,
      `Reorder from ${orderReference(order)} / ${quoteReference(order)}.`,
      order.files.length > 1 ? `Original files: ${order.files.map((file) => file.name).join(", ")}` : null,
      order.lineItems.length > 1 ? `Original order had ${order.lineItems.length} line items; confirm all parts before submitting.` : null,
    ]),
    partName: primaryLineItem?.partName ?? order.title,
    process: optionValueFromLabel(processOptions, order.process, "cnc_milling"),
    projectName: `${order.title} reorder`,
    qualityDocumentation: primaryLineItem?.qualityDocumentation?.length
      ? primaryLineItem.qualityDocumentation.map((label) => optionValueFromLabel(qualityDocumentationOptions, label, "standard_inspection"))
      : ["standard_inspection"],
    quantity: String(primaryLineItem?.quantity ?? 1),
    requesterName: order.requesterName,
    surfaceFinish: optionValueFromLabel(surfaceFinishOptions, primaryLineItem?.surfaceFinish, "as_machined_ra_3_2"),
    technicalDrawingName: drawingFile?.name ?? "",
  };
}

function draftInitialState(draft: LatticeRequest): RequestFormInitialState {
  const primaryLineItem = draft.lineItems[0];
  const primaryFile = draft.files[0];
  const drawingFile = draft.files.find((file) => file !== primaryFile && /pdf|drawing|dxf|dwg|png|jpg|jpeg/i.test(`${file.name} ${file.type}`));

  return {
    buyerCompany: draft.buyerCompany,
    customerPo: "",
    dueDate: draft.dueDate || dueDateFromToday(14),
    fileName: primaryFile?.name ?? "",
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
  };
}

export default async function NewRequestPage({ searchParams }: NewRequestPageProps) {
  const params = searchParams ? await searchParams : {};
  const reorderId = firstParam(params.reorder);
  const draftId = firstParam(params.draft);
  const reorderSource = reorderId ? await getRequestById(reorderId) : null;
  const draftSource = draftId ? await getRequestById(draftId) : null;
  const editableDraft = draftSource?.status === "DRAFT" ? draftSource : null;
  const initialState = reorderSource ? reorderInitialState(reorderSource) : editableDraft ? draftInitialState(editableDraft) : undefined;

  return (
    <RequestForm
      initialState={initialState}
      localDraftId={draftId}
      prefillNotice={
        reorderSource
          ? `Reorder draft prepared from ${orderReference(reorderSource)}. Review the copied part, files, material, tolerance, finish, quantity, and timing before submitting.`
          : editableDraft
            ? "Incomplete RFQ reopened. Finish the missing details, then click Request Quote when it is ready for Lattice review."
          : undefined
      }
    />
  );
}
