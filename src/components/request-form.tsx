"use client";

import {
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CadUploadPreview,
  type CadUploadPreviewState,
} from "@/components/cad-upload-preview";
import { CustomSelect } from "@/components/custom-select";
import type { DraftRequestInput, LatticeRequest } from "@/lib/request-model";
import {
  generalToleranceOptions,
  optionLabel,
  processOptions,
  qualityDocumentationOptions,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "../lib/rfq-options";

type ProjectFormState = {
  buyerCompany: string;
  requesterName: string;
  customerPo: string;
  projectName: string;
  process: string;
  dueDate: string;
};

type LineItemState = {
  id: string;
  partName: string;
  quantity: string;
  material: string;
  generalTolerance: string;
  surfaceFinish: string;
  qualityDocumentation: string[];
  notes: string;
  fileName: string;
  fileSizeBytes: number;
  fileStorageKey?: string;
  fileType: string;
  technicalDrawingName: string;
  technicalDrawingSizeBytes: number;
  technicalDrawingStorageKey?: string;
  technicalDrawingType: string;
  partMarkings: boolean;
  tightLinearTolerance: boolean;
  threads: boolean;
  engineeringFits: boolean;
  sharpInternalCorners: boolean;
  selectedFile: File | null;
  selectedDrawingFile: File | null;
  cadPreview: CadUploadPreviewState;
};

type InitialLineItemState = Partial<
  Omit<
    LineItemState,
    "id" | "selectedFile" | "selectedDrawingFile" | "cadPreview"
  >
> & {
  cadPreview?: CadUploadPreviewState;
};

type LegacyInitialState = Partial<ProjectFormState & InitialLineItemState> & {
  lineItems?: InitialLineItemState[];
  revisionSourceQuoteReference?: string;
  revisionSourceRequestId?: string;
  revisionSourceRevisionNumber?: number;
};

export type RequestFormInitialState = LegacyInitialState;

type RequestFormProps = {
  initialState?: RequestFormInitialState;
  localDraftId?: string;
  prefillNotice?: string;
};

const cadFileTypes = "STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT";
const cadAccept = ".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt";
const drawingAccept = ".pdf,.dxf,.dwg,.png,.jpg,.jpeg";
const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";

type LineItemField = keyof Omit<
  LineItemState,
  "id" | "selectedFile" | "selectedDrawingFile" | "cadPreview"
>;
type LineItemFlag =
  | "partMarkings"
  | "tightLinearTolerance"
  | "threads"
  | "engineeringFits"
  | "sharpInternalCorners";

const makeProjectInitialState = (): ProjectFormState => ({
  buyerCompany: "Amogy Manufacturing",
  requesterName: "William Paik",
  customerPo: "",
  projectName: "",
  process: "cnc_milling",
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
});

const makeLineItemInitialState = (id: string): LineItemState => ({
  id,
  partName: "",
  quantity: "1",
  material: "ss_304",
  generalTolerance: "iso_2768_medium_m",
  surfaceFinish: "as_machined_ra_3_2",
  qualityDocumentation: ["standard_inspection"],
  notes: "",
  fileName: "",
  fileSizeBytes: 0,
  fileStorageKey: undefined,
  fileType: "",
  technicalDrawingName: "",
  technicalDrawingSizeBytes: 0,
  technicalDrawingStorageKey: undefined,
  technicalDrawingType: "",
  partMarkings: false,
  tightLinearTolerance: false,
  threads: false,
  engineeringFits: false,
  sharpInternalCorners: false,
  selectedFile: null,
  selectedDrawingFile: null,
  cadPreview: { status: "empty" },
});

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
      {hint ? (
        <span className="text-xs font-normal leading-5 text-slate-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-blue-100 placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-4";

function suggestedNameFromFile(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function drawingCanPreview(file: File | null) {
  if (!file) {
    return false;
  }

  return file.type === "application/pdf" || file.type.startsWith("image/");
}

function lineItemHasCadBytes(lineItem: LineItemState) {
  return Boolean((lineItem.selectedFile && lineItem.selectedFile.size > 0) || lineItem.fileStorageKey);
}

function lineItemHasDrawingBytes(lineItem: LineItemState) {
  return !lineItem.technicalDrawingName.trim() || Boolean((lineItem.selectedDrawingFile && lineItem.selectedDrawingFile.size > 0) || lineItem.technicalDrawingStorageKey);
}

function initialCadPreview(
  initialState?: InitialLineItemState,
): CadUploadPreviewState {
  if (!initialState?.fileName?.trim()) {
    return { status: "empty" };
  }

  const persistedPreview = initialState.cadPreview;
  if (persistedPreview?.status === "processing") {
    return persistedPreview.fileName === initialState.fileName
      ? persistedPreview
      : {
          status: "reference_only",
          fileName: initialState.fileName,
          message:
            "This saved request only has the CAD filename. Upload the CAD file again to generate a live 3D preview.",
        };
  }

  if (persistedPreview?.status === "ready") {
    return persistedPreview.fileName === initialState.fileName
      ? persistedPreview
      : {
          status: "reference_only",
          fileName: initialState.fileName,
          message:
            "This saved request only has the CAD filename. Upload the CAD file again to generate a live 3D preview.",
        };
  }

  return {
    status: "reference_only",
    fileName: initialState.fileName,
    message: initialState.fileStorageKey
      ? "This CAD file is saved with the RFQ. Upload a replacement only if you want to change it."
      : "This saved request only has the CAD filename. Upload the CAD file again to generate a live 3D preview.",
  };
}

function lineItemFromInitialState(
  initialState?: RequestFormInitialState,
): LineItemState {
  return lineItemFromInitialLineItem(initialState, "line-1");
}

function lineItemFromInitialLineItem(
  initialState: InitialLineItemState | undefined,
  id: string,
): LineItemState {
  return {
    ...makeLineItemInitialState(id),
    partName: initialState?.partName ?? "",
    quantity: initialState?.quantity ?? "1",
    material: initialState?.material ?? "ss_304",
    generalTolerance: initialState?.generalTolerance ?? "iso_2768_medium_m",
    surfaceFinish: initialState?.surfaceFinish ?? "as_machined_ra_3_2",
    qualityDocumentation: initialState?.qualityDocumentation ?? [
      "standard_inspection",
    ],
    notes: initialState?.notes ?? "",
    fileName: initialState?.fileName ?? "",
    fileSizeBytes: initialState?.fileSizeBytes ?? 0,
    fileStorageKey: initialState?.fileStorageKey,
    fileType: initialState?.fileType ?? "",
    technicalDrawingName: initialState?.technicalDrawingName ?? "",
    technicalDrawingSizeBytes: initialState?.technicalDrawingSizeBytes ?? 0,
    technicalDrawingStorageKey: initialState?.technicalDrawingStorageKey,
    technicalDrawingType: initialState?.technicalDrawingType ?? "",
    partMarkings: initialState?.partMarkings ?? false,
    tightLinearTolerance: initialState?.tightLinearTolerance ?? false,
    threads: initialState?.threads ?? false,
    engineeringFits: initialState?.engineeringFits ?? false,
    sharpInternalCorners: initialState?.sharpInternalCorners ?? false,
    cadPreview: initialCadPreview(initialState),
  };
}

function persistedCadPreview(
  preview: CadUploadPreviewState,
): RequestFormInitialState["cadPreview"] {
  if (preview.status === "processing" || preview.status === "ready") {
    return preview;
  }

  return undefined;
}

type StoredIncompleteRfq = {
  id: string;
  initialState: RequestFormInitialState;
  request: LatticeRequest;
  updatedAt: string;
};

function readIncompleteRfqs() {
  if (typeof window === "undefined" || !window.localStorage?.getItem) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(incompleteRfqStorageKey) ?? "[]");
    return Array.isArray(parsed) ? (parsed as StoredIncompleteRfq[]) : [];
  } catch {
    return [];
  }
}

function writeIncompleteRfqs(drafts: StoredIncompleteRfq[]) {
  if (typeof window === "undefined" || !window.localStorage?.setItem) {
    return;
  }

  window.localStorage.setItem(incompleteRfqStorageKey, JSON.stringify(drafts));
}

function removeIncompleteRfq(id: string) {
  writeIncompleteRfqs(readIncompleteRfqs().filter((draft) => draft.id !== id));
}

function normalizedValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join(", ") : (value ?? "").trim();
}

function pushChange(changes: string[], label: string, before: string | string[] | undefined, after: string | string[] | undefined) {
  const previous = normalizedValue(before);
  const next = normalizedValue(after);

  if (previous !== next) {
    changes.push(`${label}: ${previous || "blank"} -> ${next || "blank"}`);
  }
}

function buildRevisionChangeLog(
  source: RequestFormInitialState,
  currentProject: ProjectFormState,
  currentLineItems: LineItemState[],
) {
  const changes: string[] = [];

  pushChange(changes, "Quote name", source.projectName, currentProject.projectName);
  pushChange(changes, "Needed by", source.dueDate, currentProject.dueDate);
  pushChange(changes, "Manufacturing process", source.process, currentProject.process);
  pushChange(changes, "Customer PO", source.customerPo, currentProject.customerPo);

  const sourceLineItems = source.lineItems?.length ? source.lineItems : [source];
  const count = Math.max(sourceLineItems.length, currentLineItems.length);

  for (let index = 0; index < count; index += 1) {
    const sourceLine = sourceLineItems[index];
    const currentLine = currentLineItems[index];
    const prefix = `Line ${index + 1}`;

    if (!sourceLine && currentLine) {
      changes.push(`${prefix}: added ${currentLine.partName || currentLine.fileName || "new part"}`);
      continue;
    }

    if (sourceLine && !currentLine) {
      changes.push(`${prefix}: removed ${sourceLine.partName || sourceLine.fileName || "part"}`);
      continue;
    }

    if (!sourceLine || !currentLine) {
      continue;
    }

    pushChange(changes, `${prefix} part name`, sourceLine.partName, currentLine.partName);
    pushChange(changes, `${prefix} quantity`, sourceLine.quantity, currentLine.quantity);
    pushChange(changes, `${prefix} material`, sourceLine.material, currentLine.material);
    pushChange(changes, `${prefix} tolerance`, sourceLine.generalTolerance, currentLine.generalTolerance);
    pushChange(changes, `${prefix} finish`, sourceLine.surfaceFinish, currentLine.surfaceFinish);
    pushChange(changes, `${prefix} quality docs`, sourceLine.qualityDocumentation, currentLine.qualityDocumentation);
    pushChange(changes, `${prefix} CAD file`, sourceLine.fileName, currentLine.fileName);
    pushChange(changes, `${prefix} drawing`, sourceLine.technicalDrawingName, currentLine.technicalDrawingName);
    pushChange(changes, `${prefix} notes`, sourceLine.notes, currentLine.notes);
  }

  return changes.length ? changes : ["Resubmitted for review with no field-level changes detected."];
}

function makeLocalDraftId() {
  return `local_draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function TechnicalDrawingReviewModal({
  lineItem,
  drawingPreviewUrl,
  onClose,
  onRemove,
  updateLineItem,
  updateLineItemFlag,
}: {
  lineItem: LineItemState;
  drawingPreviewUrl: string | null;
  onClose: () => void;
  onRemove: () => void;
  updateLineItem: (
    id: string,
    field: LineItemField,
    value: string | string[],
  ) => void;
  updateLineItemFlag: (id: string, field: LineItemFlag, value: boolean) => void;
}) {
  const drawingType = lineItem.selectedDrawingFile?.type ?? "";
  const canRenderPreview =
    Boolean(drawingPreviewUrl) &&
    (drawingType === "application/pdf" || drawingType.startsWith("image/"));

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-6"
      role="dialog"
    >
      <div className="grid w-full max-w-[1320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-[620px] bg-slate-100 p-4">
          <div className="flex h-full min-h-[590px] items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white">
            {canRenderPreview && drawingPreviewUrl ? (
              drawingType === "application/pdf" ? (
                <object
                  aria-label={`Preview of ${lineItem.technicalDrawingName}`}
                  className="h-[76vh] min-h-[590px] w-full"
                  data={drawingPreviewUrl}
                  type="application/pdf"
                >
                  <p className="p-6 text-sm text-slate-600">
                    {lineItem.technicalDrawingName}
                  </p>
                </object>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`Preview of ${lineItem.technicalDrawingName}`}
                  className="max-h-[76vh] w-full object-contain"
                  src={drawingPreviewUrl}
                />
              )
            ) : (
              <div className="max-w-md px-6 text-center">
                <p className="text-lg font-semibold text-slate-950">
                  {lineItem.technicalDrawingName}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This drawing type is attached, but the browser cannot preview
                  it inline.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="flex min-h-[620px] flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Technical Drawing Specifications
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Avoid delays and get an accurate price by selecting specifications
              shown on your technical drawing.
            </p>
            <p className="mt-3 break-all text-xs font-medium text-slate-400">
              {lineItem.technicalDrawingName}
            </p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <CustomSelect
              label="General Tolerance"
              value={lineItem.generalTolerance}
              onChange={(value) =>
                updateLineItem(lineItem.id, "generalTolerance", value)
              }
              options={generalToleranceOptions}
              required
            />

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>Linear tolerances tighter than the general tolerance</span>
              <span className="flex items-center gap-2 font-normal text-slate-700">
                <input
                  checked={lineItem.tightLinearTolerance}
                  onChange={(event) =>
                    updateLineItemFlag(
                      lineItem.id,
                      "tightLinearTolerance",
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span>Yes</span>
              </span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>Engineering Fits</span>
              <span className="text-sm font-normal text-slate-500">
                For example: holes and shafts such as H7, k6
              </span>
              <span className="flex items-center gap-2 font-normal text-slate-700">
                <input
                  aria-label="Engineering Fits"
                  checked={lineItem.engineeringFits}
                  onChange={(event) =>
                    updateLineItemFlag(
                      lineItem.id,
                      "engineeringFits",
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span>Yes</span>
              </span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>Threads</span>
              <span className="flex items-center gap-2 font-normal text-slate-700">
                <input
                  aria-label="Threads"
                  checked={lineItem.threads}
                  onChange={(event) =>
                    updateLineItemFlag(
                      lineItem.id,
                      "threads",
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span>Yes</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={onRemove}
              type="button"
            >
              Remove Drawing
            </button>
            <button
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Done
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadCadDropZone({
  compact = false,
  label,
  onFileSelected,
}: {
  compact?: boolean;
  label: string;
  onFileSelected: (file: File | null) => void;
}) {
  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    onFileSelected(event.dataTransfer.files[0] ?? null);
  }

  return (
    <section
      className={`rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 text-center transition ${compact ? "py-16" : "py-24"}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white text-2xl text-slate-400">
        ^
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-950">
        Drag & drop CAD files here, or browse
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Suggested File Types: {cadFileTypes}
      </p>
      <label className="mt-5 inline-flex cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        <span>{label}</span>
        <input
          aria-label={label}
          className="sr-only"
          type="file"
          accept={cadAccept}
          onChange={(event) => onFileSelected(event.target.files?.[0] ?? null)}
        />
      </label>
    </section>
  );
}

function LineItemConfigurationCard({
  index,
  lineItem,
  canRemove,
  updateLineItem,
  updateLineItemFlag,
  onRemove,
  onCadStatus,
  onCadFileSelected,
  onDrawingSelected,
  onReviewDrawing,
}: {
  index: number;
  lineItem: LineItemState;
  canRemove: boolean;
  updateLineItem: (
    id: string,
    field: LineItemField,
    value: string | string[],
  ) => void;
  updateLineItemFlag: (id: string, field: LineItemFlag, value: boolean) => void;
  onRemove: (id: string) => void;
  onCadStatus: (id: string, state: CadUploadPreviewState) => void;
  onCadFileSelected: (id: string, file: File | null) => void;
  onDrawingSelected: (id: string, file: File | null) => void;
  onReviewDrawing: (id: string) => void;
}) {
  const needsCadUpload = !lineItemHasCadBytes(lineItem);
  const needsDrawingUpload = !lineItemHasDrawingBytes(lineItem);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Line item {index + 1}
        </p>
      </div>
      <div className="grid lg:grid-cols-[0.95fr_1fr]">
        <div className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-[520px]">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    CAD file preview
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {lineItem.partName || lineItem.fileName}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                  {lineItem.fileName.split(".").pop()?.toUpperCase() ?? "CAD"}
                </span>
              </div>
              <CadUploadPreview
                onReplacementFileSelected={(file) =>
                  onCadFileSelected(lineItem.id, file)
                }
                onStatus={(state) => onCadStatus(lineItem.id, state)}
                state={lineItem.cadPreview}
              />
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Technical drawing
              </p>
              <p className="mt-2 break-all">
                {lineItem.technicalDrawingName ||
                  "Upload a technical drawing (Required for some part specifications)"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <label className="inline-flex cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <span>
                    {lineItem.technicalDrawingName
                      ? "Replace drawing"
                      : "Choose drawing"}
                  </span>
                  <input
                    aria-label={`Technical drawing for line item ${index + 1}`}
                    className="sr-only"
                    type="file"
                    accept={drawingAccept}
                    onChange={(event) =>
                      onDrawingSelected(
                        lineItem.id,
                        event.target.files?.[0] ?? null,
                      )
                    }
                  />
                </label>
                {lineItem.technicalDrawingName ? (
                  <button
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => onReviewDrawing(lineItem.id)}
                    type="button"
                  >
                    Review drawing specs
                  </button>
                ) : null}
              </div>
              {needsDrawingUpload ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm font-medium leading-6 text-amber-900">
                  This is only a saved drawing filename. Upload the drawing
                  again if it should be included in the RFQ package.
                </p>
              ) : null}
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Inspections & Certificates
              </h3>
              <div className="mt-3">
                <CustomSelect
                  label="Quality documentation"
                  value={
                    lineItem.qualityDocumentation[0] ?? "standard_inspection"
                  }
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "qualityDocumentation", [
                      value,
                    ])
                  }
                  options={qualityDocumentationOptions}
                  required
                  showSearch
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 flex justify-end gap-4">
            <label className="cursor-pointer text-sm font-medium text-slate-500 transition hover:text-slate-950">
              <span>Replace</span>
              <input
                className="sr-only"
                type="file"
                accept={cadAccept}
                onChange={(event) =>
                  onCadFileSelected(
                    lineItem.id,
                    event.target.files?.[0] ?? null,
                  )
                }
              />
            </label>
            {canRemove ? (
              <button
                className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
                onClick={() => onRemove(lineItem.id)}
                type="button"
              >
                Remove
              </button>
            ) : null}
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="break-all text-3xl font-semibold tracking-tight text-slate-950">
                {lineItem.fileName}
              </h3>
              <div className="mt-6 grid gap-5">
                <CustomSelect
                  label="Material"
                  value={lineItem.material}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "material", value)
                  }
                  options={rfqMaterialOptions}
                  required
                  showSearch
                />
                <Field label="Quantity">
                  <input
                    className={inputClass}
                    min="1"
                    type="number"
                    value={lineItem.quantity}
                    onChange={(event) =>
                      updateLineItem(
                        lineItem.id,
                        "quantity",
                        event.target.value,
                      )
                    }
                  />
                </Field>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Finish
              </h3>
              <div className="mt-6 grid gap-5">
                <CustomSelect
                  label="Surface Finish"
                  value={lineItem.surfaceFinish}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "surfaceFinish", value)
                  }
                  options={surfaceFinishOptions}
                  required
                  showSearch
                />
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    checked={lineItem.partMarkings}
                    onChange={(event) =>
                      updateLineItemFlag(
                        lineItem.id,
                        "partMarkings",
                        event.target.checked,
                      )
                    }
                    type="checkbox"
                  />
                  <span>Part Markings</span>
                  <span className="font-normal text-slate-500">
                    Yes (drawing required)
                  </span>
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Tolerances
              </h3>
              <div className="mt-6 grid gap-5">
                <CustomSelect
                  label="General Tolerances"
                  value={lineItem.generalTolerance}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "generalTolerance", value)
                  }
                  options={generalToleranceOptions}
                  required
                />
                {[
                  [
                    "tightLinearTolerance",
                    "Linear Tolerance Tighter Than General Tolerance",
                    lineItem.tightLinearTolerance,
                  ],
                  ["threads", "Threads", lineItem.threads],
                  [
                    "engineeringFits",
                    "Engineering Fits",
                    lineItem.engineeringFits,
                  ],
                  [
                    "sharpInternalCorners",
                    "Sharp Internal Corners",
                    lineItem.sharpInternalCorners,
                  ],
                ].map(([field, label, checked]) => (
                  <label
                    className="grid gap-2 text-sm font-medium text-slate-700"
                    key={String(field)}
                  >
                    <span>{label}</span>
                    <span className="flex items-center gap-2">
                      <input
                        checked={Boolean(checked)}
                        onChange={(event) =>
                          updateLineItemFlag(
                            lineItem.id,
                            field as LineItemFlag,
                            event.target.checked,
                          )
                        }
                        type="checkbox"
                      />
                      <span className="font-normal text-slate-600">
                        Yes (drawing required)
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Part / line item name">
                  <input
                    className={inputClass}
                    placeholder="Bracket A"
                    value={lineItem.partName}
                    onChange={(event) =>
                      updateLineItem(
                        lineItem.id,
                        "partName",
                        event.target.value,
                      )
                    }
                  />
                </Field>
                <Field label="File reference">
                  <input
                    className={inputClass}
                    placeholder="part.step / drawing.pdf"
                    value={lineItem.fileName}
                    onChange={(event) =>
                      updateLineItem(
                        lineItem.id,
                        "fileName",
                        event.target.value,
                      )
                    }
                  />
                </Field>
              </div>
              {needsCadUpload ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium leading-6 text-amber-900">
                  This is only a saved filename. Upload the CAD file again so
                  Lattice can store the actual STEP/part bytes for quoting.
                </p>
              ) : null}
              <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">
                <span>Manufacturing notes</span>
                <textarea
                  className={`${inputClass} min-h-32`}
                  placeholder="Tolerances, finish, deburr, inspection notes..."
                  value={lineItem.notes}
                  onChange={(event) =>
                    updateLineItem(lineItem.id, "notes", event.target.value)
                  }
                />
              </label>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RequestForm({
  initialState,
  localDraftId,
  prefillNotice,
}: RequestFormProps = {}) {
  const localDraftInitialState =
    !initialState && localDraftId
      ? readIncompleteRfqs().find((draft) => draft.id === localDraftId)?.initialState
      : undefined;
  const resolvedInitialState = initialState ?? localDraftInitialState;
  const [projectForm, setProjectForm] = useState<ProjectFormState>(() => ({
    ...makeProjectInitialState(),
    ...resolvedInitialState,
  }));
  const [lineItems, setLineItems] = useState<LineItemState[]>(() =>
    resolvedInitialState?.lineItems?.length
      ? resolvedInitialState.lineItems.map((lineItem, index) => lineItemFromInitialLineItem(lineItem, `line-${index + 1}`))
      : [lineItemFromInitialState(resolvedInitialState)],
  );
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<LatticeRequest | null>(
    null,
  );
  const [activeLocalDraftId, setActiveLocalDraftId] = useState<string | null>(
    localDraftId ?? null,
  );
  const [drawingReviewLineItemId, setDrawingReviewLineItemId] = useState<
    string | null
  >(null);
  const activeDrawingLineItem =
    lineItems.find((lineItem) => lineItem.id === drawingReviewLineItemId) ??
    null;
  const drawingPreviewUrl = useMemo(() => {
    if (
      !activeDrawingLineItem?.selectedDrawingFile ||
      !drawingCanPreview(activeDrawingLineItem.selectedDrawingFile) ||
      typeof URL === "undefined" ||
      !URL.createObjectURL
    ) {
      return null;
    }

    return URL.createObjectURL(activeDrawingLineItem.selectedDrawingFile);
  }, [activeDrawingLineItem]);
  const configuredLineItems = lineItems.filter((lineItem) =>
    lineItem.fileName.trim(),
  );
  const hasCadFile = configuredLineItems.length > 0;

  const isReady = useMemo(
    () =>
      projectForm.dueDate &&
      projectForm.projectName.trim() &&
      projectForm.process.trim() &&
      configuredLineItems.length > 0 &&
      configuredLineItems.every(
        (lineItem) =>
          lineItem.partName.trim() &&
          lineItem.material.trim() &&
          lineItem.generalTolerance.trim() &&
          lineItem.surfaceFinish.trim() &&
          Number(lineItem.quantity) > 0 &&
          lineItem.fileName.trim() &&
          lineItemHasCadBytes(lineItem) &&
          lineItemHasDrawingBytes(lineItem),
      ),
    [configuredLineItems, projectForm],
  );

  function updateProject(field: keyof ProjectFormState, value: string) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function updateLineItem(
    id: string,
    field: LineItemField,
    value: string | string[],
  ) {
    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id ? { ...lineItem, [field]: value } : lineItem,
      ),
    );
  }

  function updateLineItemFlag(id: string, field: LineItemFlag, value: boolean) {
    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id ? { ...lineItem, [field]: value } : lineItem,
      ),
    );
  }

  function ensureLocalDraftId() {
    if (activeLocalDraftId) {
      return activeLocalDraftId;
    }

    const draftId = makeLocalDraftId();
    setActiveLocalDraftId(draftId);
    return draftId;
  }

  useEffect(() => {
    if (!hasCadFile || createdRequest) {
      return;
    }

    const primaryLineItem = configuredLineItems[0];
    if (!primaryLineItem) {
      return;
    }

    const draftId = activeLocalDraftId;
    if (!draftId) {
      return;
    }

    const timestamp = new Date().toISOString();
    const lineItemsForResume = configuredLineItems.map((lineItem) => ({
      fileName: lineItem.fileName,
      fileSizeBytes: lineItem.selectedFile?.size ?? lineItem.fileSizeBytes,
      fileStorageKey: lineItem.selectedFile ? undefined : lineItem.fileStorageKey,
      fileType: lineItem.selectedFile?.type || lineItem.fileType,
      generalTolerance: lineItem.generalTolerance,
      material: lineItem.material,
      notes: lineItem.notes,
      engineeringFits: lineItem.engineeringFits,
      partName: lineItem.partName,
      partMarkings: lineItem.partMarkings,
      qualityDocumentation: lineItem.qualityDocumentation,
      quantity: lineItem.quantity,
      sharpInternalCorners: lineItem.sharpInternalCorners,
      surfaceFinish: lineItem.surfaceFinish,
      technicalDrawingName: lineItem.technicalDrawingName,
      technicalDrawingSizeBytes: lineItem.selectedDrawingFile?.size ?? lineItem.technicalDrawingSizeBytes,
      technicalDrawingStorageKey: lineItem.selectedDrawingFile ? undefined : lineItem.technicalDrawingStorageKey,
      technicalDrawingType: lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType,
      threads: lineItem.threads,
      tightLinearTolerance: lineItem.tightLinearTolerance,
      cadPreview: persistedCadPreview(lineItem.cadPreview),
    }));
    const initialStateForResume: RequestFormInitialState = {
      buyerCompany: projectForm.buyerCompany,
      customerPo: projectForm.customerPo,
      dueDate: projectForm.dueDate,
      fileName: primaryLineItem.fileName,
      generalTolerance: primaryLineItem.generalTolerance,
      material: primaryLineItem.material,
      notes: primaryLineItem.notes,
      partName: primaryLineItem.partName,
      process: projectForm.process,
      projectName: projectForm.projectName,
      qualityDocumentation: primaryLineItem.qualityDocumentation,
      quantity: primaryLineItem.quantity,
      requesterName: projectForm.requesterName,
      revisionSourceQuoteReference: resolvedInitialState?.revisionSourceQuoteReference,
      revisionSourceRequestId: resolvedInitialState?.revisionSourceRequestId,
      revisionSourceRevisionNumber: resolvedInitialState?.revisionSourceRevisionNumber,
      surfaceFinish: primaryLineItem.surfaceFinish,
      technicalDrawingName: primaryLineItem.technicalDrawingName,
      cadPreview: persistedCadPreview(primaryLineItem.cadPreview),
      lineItems: lineItemsForResume,
    };
    const requestTitle =
      projectForm.projectName.trim() ||
      primaryLineItem.partName.trim() ||
      primaryLineItem.fileName.trim() ||
      "Incomplete RFQ";
    const request: LatticeRequest = {
      id: draftId,
      buyerCompany: projectForm.buyerCompany,
      requesterEmail: "",
      requesterName: projectForm.requesterName,
      requesterPhone: "",
      shipToAddress1: "",
      shipToAddress2: "",
      shipToCity: "",
      shipToCompany: projectForm.buyerCompany,
      shipToName: projectForm.requesterName,
      shipToPhone: "",
      shipToState: "",
      shipToZipCode: "",
      title: requestTitle,
      process: optionLabel(processOptions, projectForm.process),
      dueDate: projectForm.dueDate,
      status: "DRAFT",
      lineItems: configuredLineItems.map((lineItem) => ({
        id: lineItem.id,
        partName: lineItem.partName || lineItem.fileName,
        quantity: Number(lineItem.quantity) || 1,
        material: optionLabel(rfqMaterialOptions, lineItem.material),
        generalTolerance: optionLabel(generalToleranceOptions, lineItem.generalTolerance),
        surfaceFinish: optionLabel(surfaceFinishOptions, lineItem.surfaceFinish),
        qualityDocumentation: lineItem.qualityDocumentation.map((value) => optionLabel(qualityDocumentationOptions, value)),
        notes: lineItem.notes,
      })),
      files: configuredLineItems.flatMap((lineItem) => [
        {
          id: `${lineItem.id}-file`,
          name: lineItem.fileName,
          sizeBytes: lineItem.selectedFile?.size ?? lineItem.fileSizeBytes,
          storageKey: lineItem.selectedFile ? undefined : lineItem.fileStorageKey,
          type: lineItem.selectedFile?.type || lineItem.fileType || "reference/name-only",
        },
        ...(lineItem.technicalDrawingName
          ? [
              {
                id: `${lineItem.id}-drawing`,
                name: lineItem.technicalDrawingName,
                sizeBytes: lineItem.selectedDrawingFile?.size ?? lineItem.technicalDrawingSizeBytes,
                storageKey: lineItem.selectedDrawingFile ? undefined : lineItem.technicalDrawingStorageKey,
                type: lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType || "reference/name-only",
              },
            ]
          : []),
      ]),
      operatorReview: {
        completeness: "READY_FOR_REVIEW",
        assignedOwner: null,
        internalNotes: "",
        supplierPackageNotes: "",
      },
      supplierOrder: {
        status: "AWAITING_ACKNOWLEDGMENT",
        shopName: "China supplier team",
        contactName: "",
        notes: "",
        trackingNumber: "",
        documents: [],
        updates: [],
      },
      supplierQuotes: [],
      customerQuotes: [],
      quote: {
        estimatedPriceCents: null,
        leadTimeDays: null,
        shippingCostCents: null,
        shippingMethod: "",
        shippingTerms: "",
        estimatedDeliveryDate: "",
        quoteCreatedDate: "",
        quoteValidUntil: "",
        summary: "",
      },
      revisionChangeLog: resolvedInitialState?.revisionSourceRequestId
        ? buildRevisionChangeLog(resolvedInitialState, projectForm, configuredLineItems)
        : [],
      revisionNumber: resolvedInitialState?.revisionSourceRequestId ? (resolvedInitialState.revisionSourceRevisionNumber ?? 1) + 1 : 1,
      revisionOfRequestId: resolvedInitialState?.revisionSourceRequestId ?? null,
      statusEvents: [
        {
          id: `${draftId}-event-draft`,
          from: null,
          to: "DRAFT",
          actor: "buyer",
          at: timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const nextDraft: StoredIncompleteRfq = {
      id: draftId,
      initialState: initialStateForResume,
      request,
      updatedAt: timestamp,
    };
    const otherDrafts = readIncompleteRfqs().filter((draft) => draft.id !== draftId);
    writeIncompleteRfqs([nextDraft, ...otherDrafts].slice(0, 12));
  }, [activeLocalDraftId, configuredLineItems, createdRequest, hasCadFile, projectForm]);

  const updateCadPreview = useCallback(
    (id: string, state: CadUploadPreviewState) => {
      setLineItems((current) =>
        current.map((lineItem) =>
          lineItem.id === id ? { ...lineItem, cadPreview: state } : lineItem,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (
      !drawingPreviewUrl ||
      typeof URL === "undefined" ||
      !URL.revokeObjectURL
    ) {
      return;
    }

    return () => URL.revokeObjectURL(drawingPreviewUrl);
  }, [drawingPreviewUrl]);

  function applyCadFileToLineItem(id: string, file: File | null) {
    if (file) {
      ensureLocalDraftId();
    }

    setLineItems((current) =>
      current.map((lineItem) => {
        if (lineItem.id !== id) {
          return lineItem;
        }

        const fileName = file?.name ?? "";
        const suggestedName = fileName ? suggestedNameFromFile(fileName) : "";

        return {
          ...lineItem,
          selectedFile: file,
          fileName,
          fileSizeBytes: file?.size ?? 0,
          fileStorageKey: undefined,
          fileType: file?.type ?? "",
          partName: lineItem.partName.trim() || suggestedName,
          cadPreview: file
            ? { status: "uploading", fileName: file.name }
            : { status: "empty" },
        };
      }),
    );

    if (file?.name) {
      setProjectForm((current) => ({
        ...current,
        projectName:
          current.projectName.trim() || suggestedNameFromFile(file.name),
      }));
    }
  }

  async function startCadPreview(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/cad-previews", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (payload.preview?.status === "configuration_required") {
        updateCadPreview(id, {
          status: "configuration_required",
          fileName: file.name,
          message: payload.preview.message,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start CAD preview");
      }

      updateCadPreview(id, {
        status: "processing",
        fileName: file.name,
        urn: payload.preview.urn,
        progress: "queued",
      });
    } catch (caught) {
      updateCadPreview(id, {
        status: "failed",
        fileName: file.name,
        message:
          caught instanceof Error
            ? caught.message
            : "Unable to start CAD preview",
      });
    }
  }

  async function handleCadFileSelected(id: string, file: File | null) {
    applyCadFileToLineItem(id, file);

    if (!file) {
      return;
    }

    await startCadPreview(id, file);
  }

  function handleNewCadFileSelected(file: File | null) {
    if (!file) {
      return;
    }

    ensureLocalDraftId();
    const id = `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fileName = file.name;
    const suggestedName = suggestedNameFromFile(fileName);
    setLineItems((current) => [
      ...current,
      {
        ...makeLineItemInitialState(id),
        selectedFile: file,
        fileName,
        fileSizeBytes: file.size,
        fileType: file.type,
        partName: suggestedName,
        cadPreview: { status: "uploading", fileName },
      },
    ]);
    void startCadPreview(id, file);
  }

  function handleTechnicalDrawingSelected(id: string, file: File | null) {
    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id
          ? {
              ...lineItem,
              selectedDrawingFile: file,
              technicalDrawingName: file?.name ?? "",
              technicalDrawingSizeBytes: file?.size ?? 0,
              technicalDrawingStorageKey: undefined,
              technicalDrawingType: file?.type ?? "",
            }
          : lineItem,
      ),
    );
    setDrawingReviewLineItemId(file ? id : null);
  }

  function removeTechnicalDrawing(id: string) {
    handleTechnicalDrawingSelected(id, null);
  }

  function removeLineItem(id: string) {
    setLineItems((current) => current.filter((lineItem) => lineItem.id !== id));
    if (drawingReviewLineItemId === id) {
      setDrawingReviewLineItemId(null);
    }
  }

  function drawingRequiredNotes(lineItem: LineItemState) {
    const generatedNotes = [
      lineItem.partMarkings ? "Part markings requested; drawing required." : null,
      lineItem.tightLinearTolerance ? "Linear tolerance tighter than general tolerance requested; drawing required." : null,
      lineItem.threads ? "Threads requested; drawing required." : null,
      lineItem.engineeringFits ? "Engineering fits requested; drawing required." : null,
      lineItem.sharpInternalCorners ? "Sharp internal corners requested; drawing required." : null,
    ].filter((note): note is string => Boolean(note));

    return generatedNotes.filter((note) => !lineItem.notes.includes(note));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const missingCadBytes = configuredLineItems.find(
      (lineItem) => !lineItemHasCadBytes(lineItem),
    );

    if (missingCadBytes) {
      setError(
        `${missingCadBytes.fileName} is only a saved filename. Upload the CAD file again before submitting so its bytes can be stored.`,
      );
      return;
    }

    const missingDrawingBytes = configuredLineItems.find(
      (lineItem) => !lineItemHasDrawingBytes(lineItem),
    );

    if (missingDrawingBytes) {
      setError(
        `${missingDrawingBytes.technicalDrawingName} is only a saved filename. Upload the drawing again before submitting so its bytes can be stored.`,
      );
      return;
    }

    const input: DraftRequestInput = {
      buyerCompany: projectForm.buyerCompany,
      requesterName: projectForm.requesterName,
      title: projectForm.projectName,
      process: optionLabel(processOptions, projectForm.process),
      dueDate: projectForm.dueDate,
      revision: resolvedInitialState?.revisionSourceRequestId
        ? {
            changeLog: buildRevisionChangeLog(resolvedInitialState, projectForm, configuredLineItems),
            revisionNumber: (resolvedInitialState.revisionSourceRevisionNumber ?? 1) + 1,
            sourceQuoteReference: resolvedInitialState.revisionSourceQuoteReference,
            sourceRequestId: resolvedInitialState.revisionSourceRequestId,
          }
        : undefined,
      lineItems: configuredLineItems.map((lineItem, index) => {
        const noteLines = [
          index === 0 && projectForm.customerPo.trim()
            ? `Customer PO#: ${projectForm.customerPo.trim()}`
            : null,
          lineItem.notes.trim() ? lineItem.notes.trim() : null,
          ...drawingRequiredNotes(lineItem),
        ].filter(Boolean);

        return {
          partName: lineItem.partName,
          quantity: Number(lineItem.quantity),
          material: optionLabel(rfqMaterialOptions, lineItem.material),
          generalTolerance: optionLabel(
            generalToleranceOptions,
            lineItem.generalTolerance,
          ),
          surfaceFinish: optionLabel(
            surfaceFinishOptions,
            lineItem.surfaceFinish,
          ),
          qualityDocumentation: lineItem.qualityDocumentation.map((value) =>
            optionLabel(qualityDocumentationOptions, value),
          ),
          notes: noteLines.join("\n"),
        };
      }),
      files: configuredLineItems.flatMap((lineItem) => [
        {
          name: lineItem.fileName,
          sizeBytes: lineItem.selectedFile?.size ?? lineItem.fileSizeBytes,
          storageKey: lineItem.selectedFile ? undefined : lineItem.fileStorageKey,
          type: lineItem.selectedFile?.type || lineItem.fileType || "reference/name-only",
        },
        ...(lineItem.technicalDrawingName
          ? [
              {
                name: lineItem.technicalDrawingName,
                sizeBytes: lineItem.selectedDrawingFile?.size ?? lineItem.technicalDrawingSizeBytes,
                storageKey: lineItem.selectedDrawingFile ? undefined : lineItem.technicalDrawingStorageKey,
                type:
                  lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType || "reference/name-only",
              },
            ]
          : []),
      ]),
    };
    const uploadedFiles = configuredLineItems.flatMap((lineItem) => [
      lineItem.selectedFile,
      ...(lineItem.technicalDrawingName ? [lineItem.selectedDrawingFile] : []),
    ]);
    const formData = new FormData();

    formData.append("request", JSON.stringify(input));
    uploadedFiles.forEach((file, index) => {
      if (file) {
        formData.append(`file-${index}`, file);
      }
    });

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit request");
      }

      setCreatedRequest(payload.request);
      if (activeLocalDraftId) {
        removeIncompleteRfq(activeLocalDraftId);
      }
      setActiveLocalDraftId(null);
      setProjectForm(makeProjectInitialState());
      setLineItems([makeLineItemInitialState("line-1")]);
      setDrawingReviewLineItemId(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to submit request",
      );
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c8c8c]">
          Request Quote
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          Create a manufacturable RFQ package.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Send the part file, target quantity, material, and timing so Lattice
          can turn it into a clean RFQ package for review.
        </p>
        {prefillNotice ? (
          <p className="mt-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-blue-800">
            {prefillNotice}
          </p>
        ) : null}
      </section>

      <div>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          {activeDrawingLineItem?.technicalDrawingName ? (
            <TechnicalDrawingReviewModal
              lineItem={activeDrawingLineItem}
              drawingPreviewUrl={drawingPreviewUrl}
              onClose={() => setDrawingReviewLineItemId(null)}
              onRemove={() => removeTechnicalDrawing(activeDrawingLineItem.id)}
              updateLineItem={updateLineItem}
              updateLineItemFlag={updateLineItemFlag}
            />
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
              Quote Setup
            </h3>
            <div className="mt-5 max-w-2xl">
              <Field
                label="Quote name"
                hint="Use a name that will be easy to recognize in quotes, orders, and admin review."
              >
                <input
                  aria-label="Quote name"
                  className={inputClass}
                  placeholder="Aluminum plate reorder"
                  value={projectForm.projectName}
                  onChange={(event) =>
                    updateProject("projectName", event.target.value)
                  }
                />
              </Field>
            </div>
          </section>

          <div className="border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Upload CAD file
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload the part file first so Lattice can build the RFQ around
                the actual geometry, material, and production requirements.
              </p>
            </div>
          </div>

          {!hasCadFile ? (
            <UploadCadDropZone
              label="Choose CAD file"
              onFileSelected={(file) =>
                void handleCadFileSelected(lineItems[0].id, file)
              }
            />
          ) : null}

          {configuredLineItems.map((lineItem, index) => (
            <LineItemConfigurationCard
              key={lineItem.id}
              index={index}
              lineItem={lineItem}
              canRemove={configuredLineItems.length > 1}
              updateLineItem={updateLineItem}
              updateLineItemFlag={updateLineItemFlag}
              onRemove={removeLineItem}
              onCadStatus={updateCadPreview}
              onCadFileSelected={(id, file) =>
                void handleCadFileSelected(id, file)
              }
              onDrawingSelected={handleTechnicalDrawingSelected}
              onReviewDrawing={setDrawingReviewLineItemId}
            />
          ))}

          {hasCadFile ? (
            <UploadCadDropZone
              compact
              label="Upload another CAD file"
              onFileSelected={handleNewCadFileSelected}
            />
          ) : null}

          {hasCadFile ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                Customer Details
              </h3>
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Customer PO#">
                  <input
                    className={inputClass}
                    placeholder="PO-1047"
                    value={projectForm.customerPo}
                    onChange={(event) =>
                      updateProject("customerPo", event.target.value)
                    }
                  />
                </Field>
                <Field label="Company Name">
                  <input
                    className={inputClass}
                    value={projectForm.buyerCompany}
                    onChange={(event) =>
                      updateProject("buyerCompany", event.target.value)
                    }
                  />
                </Field>
                <Field label="Requester name">
                  <input
                    className={inputClass}
                    value={projectForm.requesterName}
                    onChange={(event) =>
                      updateProject("requesterName", event.target.value)
                    }
                  />
                </Field>
                <CustomSelect
                  label="Manufacturing process"
                  value={projectForm.process}
                  onChange={(value) => updateProject("process", value)}
                  options={processOptions}
                  required
                />
                <Field label="Needed by">
                  <input
                    className={inputClass}
                    type="date"
                    value={projectForm.dueDate}
                    onChange={(event) =>
                      updateProject("dueDate", event.target.value)
                    }
                  />
                </Field>
              </div>
            </section>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </p>
          ) : null}

          {hasCadFile ? (
            <div className="border-t border-slate-100 pt-6">
              <button
                className="rounded-lg bg-[#262626] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#cfcfcf] disabled:text-white"
                disabled={!isReady}
                type="submit"
              >
                Request Quote
              </button>
            </div>
          ) : null}
        </form>

        {createdRequest ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
            <p className="font-semibold">Submitted to queue</p>
            <p className="mt-1">{createdRequest.title}</p>
            <p className="mt-1 text-emerald-700">
              Status: {createdRequest.status}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
