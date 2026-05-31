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
  technicalDrawingName: string;
  partMarkings: boolean;
  tightLinearTolerance: boolean;
  threads: boolean;
  engineeringFits: boolean;
  sharpInternalCorners: boolean;
  selectedFile: File | null;
  selectedDrawingFile: File | null;
  cadPreview: CadUploadPreviewState;
};

type LegacyInitialState = Partial<
  ProjectFormState &
    Omit<
      LineItemState,
      "id" | "selectedFile" | "selectedDrawingFile" | "cadPreview"
    >
>;

export type RequestFormInitialState = LegacyInitialState;

type RequestFormProps = {
  initialState?: RequestFormInitialState;
  prefillNotice?: string;
};

const cadFileTypes = "STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT";
const cadAccept = ".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt";
const drawingAccept = ".pdf,.dxf,.dwg,.png,.jpg,.jpeg";

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
  technicalDrawingName: "",
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

function initialCadPreview(
  initialState?: RequestFormInitialState,
): CadUploadPreviewState {
  if (!initialState?.fileName?.trim()) {
    return { status: "empty" };
  }

  return {
    status: "configuration_required",
    fileName: initialState.fileName,
    message:
      "Reused from a previous order. Upload a replacement CAD file if the geometry has changed.",
  };
}

function lineItemFromInitialState(
  initialState?: RequestFormInitialState,
): LineItemState {
  return {
    ...makeLineItemInitialState("line-1"),
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
    technicalDrawingName: initialState?.technicalDrawingName ?? "",
    partMarkings: initialState?.partMarkings ?? false,
    tightLinearTolerance: initialState?.tightLinearTolerance ?? false,
    threads: initialState?.threads ?? false,
    engineeringFits: initialState?.engineeringFits ?? false,
    sharpInternalCorners: initialState?.sharpInternalCorners ?? false,
    cadPreview: initialCadPreview(initialState),
  };
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
            <Field label="General Tolerance">
              <select
                className={inputClass}
                value={lineItem.generalTolerance}
                onChange={(event) =>
                  updateLineItem(
                    lineItem.id,
                    "generalTolerance",
                    event.target.value,
                  )
                }
              >
                {generalToleranceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

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
            </div>

            <div className="mt-8">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                Inspections & Certificates
              </h3>
              <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
                <span>Quality documentation</span>
                <select
                  className={inputClass}
                  value={
                    lineItem.qualityDocumentation[0] ?? "standard_inspection"
                  }
                  onChange={(event) =>
                    updateLineItem(lineItem.id, "qualityDocumentation", [
                      event.target.value,
                    ])
                  }
                >
                  {qualityDocumentationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
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
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Quote ID:
              </p>
              <div className="mt-6 grid gap-5">
                <Field label="Material">
                  <select
                    className={inputClass}
                    value={lineItem.material}
                    onChange={(event) =>
                      updateLineItem(
                        lineItem.id,
                        "material",
                        event.target.value,
                      )
                    }
                  >
                    {rfqMaterialOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
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
                <Field label="Surface Finish">
                  <select
                    className={inputClass}
                    value={lineItem.surfaceFinish}
                    onChange={(event) =>
                      updateLineItem(
                        lineItem.id,
                        "surfaceFinish",
                        event.target.value,
                      )
                    }
                  >
                    {surfaceFinishOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
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
                <Field label="General Tolerances">
                  <select
                    className={inputClass}
                    value={lineItem.generalTolerance}
                    onChange={(event) =>
                      updateLineItem(
                        lineItem.id,
                        "generalTolerance",
                        event.target.value,
                      )
                    }
                  >
                    {generalToleranceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
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
  prefillNotice,
}: RequestFormProps = {}) {
  const [projectForm, setProjectForm] = useState<ProjectFormState>(() => ({
    ...makeProjectInitialState(),
    ...initialState,
  }));
  const [lineItems, setLineItems] = useState<LineItemState[]>(() => [
    lineItemFromInitialState(initialState),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<LatticeRequest | null>(
    null,
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
          lineItem.fileName.trim(),
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

    const id = `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const fileName = file.name;
    const suggestedName = suggestedNameFromFile(fileName);
    setLineItems((current) => [
      ...current,
      {
        ...makeLineItemInitialState(id),
        selectedFile: file,
        fileName,
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
    return [
      lineItem.partMarkings
        ? "Part markings requested; drawing required."
        : null,
      lineItem.tightLinearTolerance
        ? "Linear tolerance tighter than general tolerance requested; drawing required."
        : null,
      lineItem.threads ? "Threads requested; drawing required." : null,
      lineItem.engineeringFits
        ? "Engineering fits requested; drawing required."
        : null,
      lineItem.sharpInternalCorners
        ? "Sharp internal corners requested; drawing required."
        : null,
    ].filter(Boolean);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const input: DraftRequestInput = {
      buyerCompany: projectForm.buyerCompany,
      requesterName: projectForm.requesterName,
      title: projectForm.projectName,
      process: optionLabel(processOptions, projectForm.process),
      dueDate: projectForm.dueDate,
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
          sizeBytes: lineItem.selectedFile?.size ?? 0,
          type: lineItem.selectedFile?.type || "reference/name-only",
        },
        ...(lineItem.technicalDrawingName
          ? [
              {
                name: lineItem.technicalDrawingName,
                sizeBytes: lineItem.selectedDrawingFile?.size ?? 0,
                type:
                  lineItem.selectedDrawingFile?.type || "reference/name-only",
              },
            ]
          : []),
      ]),
    };

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit request");
      }

      setCreatedRequest(payload.request);
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
                <Field
                  label="Project Name"
                  hint="Use a name an operator can recognize quickly."
                >
                  <input
                    className={inputClass}
                    placeholder="CNC bracket package"
                    value={projectForm.projectName}
                    onChange={(event) =>
                      updateProject("projectName", event.target.value)
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
                <Field label="Manufacturing process">
                  <select
                    className={inputClass}
                    value={projectForm.process}
                    onChange={(event) =>
                      updateProject("process", event.target.value)
                    }
                  >
                    {processOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
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

          <div className="border-t border-slate-100 pt-6">
            <button
              className="rounded-lg bg-[#262626] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#cfcfcf] disabled:text-white"
              disabled={!isReady}
              type="submit"
            >
              Request Quote
            </button>
          </div>
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
