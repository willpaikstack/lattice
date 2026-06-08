"use client";

import {
  DragEvent,
  FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  Paperclip,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  CadUploadPreview,
  type CadUploadPreviewState,
} from "@/components/cad-upload-preview";
import { CustomSelect } from "@/components/custom-select";
import { customerMaterialCatalog } from "@/lib/customer-material-catalog";
import type { DraftRequestInput, LatticeRequest } from "@/lib/request-model";
import {
  generalToleranceOptions,
  optionLabel,
  processOptions,
  qualityDocumentationOptions,
  rfqMaterialOptions,
  surfaceFinishOptions,
  type RfqOption,
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
  defaultBuyerCompany?: string;
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

type MaterialSelectOption = RfqOption & {
  category: string;
  subgroup: string;
};

type MaterialSelectSubgroup = {
  name: string;
  options: MaterialSelectOption[];
};

type MaterialSelectGroup = {
  name: string;
  subgroups: MaterialSelectSubgroup[];
  optionCount: number;
};

const makeProjectInitialState = (defaultBuyerCompany = "Amogy Manufacturing"): ProjectFormState => ({
  buyerCompany: defaultBuyerCompany,
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

function displayNameFromFile(fileName: string) {
  return fileName.trim().replace(/\.[^.]+$/, "");
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

function localFileHref(storageKey: string, name: string, type: string) {
  return `/api/local-files/${storageKey}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
}

function normalizedMaterialName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildMaterialSelectGroups() {
  const optionByName = new Map(
    rfqMaterialOptions.map((option) => [
      normalizedMaterialName(option.label),
      option,
    ]),
  );
  const usedOptionValues = new Set<string>();
  const groups: MaterialSelectGroup[] = customerMaterialCatalog
    .map((category) => {
      const subgroups = category.materialGroups
        .map((subgroup) => {
          const options = subgroup.grades
            .map((grade) => optionByName.get(normalizedMaterialName(grade)))
            .filter((option): option is RfqOption => Boolean(option))
            .filter((option) => {
              if (usedOptionValues.has(option.value)) {
                return false;
              }

              usedOptionValues.add(option.value);
              return true;
            })
            .map((option) => ({
              ...option,
              category: category.name,
              subgroup: subgroup.name,
            }));

          return {
            name: subgroup.name,
            options,
          };
        })
        .filter((subgroup) => subgroup.options.length > 0);

      return {
        name: category.name,
        subgroups,
        optionCount: subgroups.reduce(
          (count, subgroup) => count + subgroup.options.length,
          0,
        ),
      };
    })
    .filter((group) => group.optionCount > 0);

  const remainingOptions = rfqMaterialOptions
    .filter((option) => !usedOptionValues.has(option.value))
    .map((option) => ({
      ...option,
      category: "Other available materials",
      subgroup: String(option.metadata?.family ?? "Other grades"),
    }));

  if (remainingOptions.length > 0) {
    const subgroupsByName = new Map<string, MaterialSelectOption[]>();

    remainingOptions.forEach((option) => {
      const subgroupOptions = subgroupsByName.get(option.subgroup) ?? [];
      subgroupOptions.push(option);
      subgroupsByName.set(option.subgroup, subgroupOptions);
    });

    const subgroups = [...subgroupsByName.entries()].map(([name, options]) => ({
      name,
      options,
    }));

    groups.push({
      name: "Other available materials",
      subgroups,
      optionCount: remainingOptions.length,
    });
  }

  return groups;
}

const materialSelectGroups = buildMaterialSelectGroups();
const materialSelectOptions = materialSelectGroups.flatMap((group) =>
  group.subgroups.flatMap((subgroup) => subgroup.options),
);

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

type PersistedDraftFile = {
  name: string;
  sizeBytes: number;
  storageKey: string;
  type: string;
};

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
  const drawingType = lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType;
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

function TechnicalDrawingBucket({
  index,
  lineItem,
  onDrawingSelected,
  onReviewDrawing,
  onRemoveDrawing,
}: {
  index: number;
  lineItem: LineItemState;
  onDrawingSelected: (id: string, file: File | null) => void;
  onReviewDrawing: (id: string) => void;
  onRemoveDrawing: (id: string) => void;
}) {
  const drawingInputLabel = `Technical drawing for line item ${index + 1}`;
  const hasDrawing = Boolean(lineItem.technicalDrawingName.trim());
  const canDownload = Boolean(lineItem.selectedDrawingFile || lineItem.technicalDrawingStorageKey);
  const downloadHref = lineItem.technicalDrawingStorageKey
    ? localFileHref(
        lineItem.technicalDrawingStorageKey,
        lineItem.technicalDrawingName,
        lineItem.technicalDrawingType || "application/octet-stream",
      )
    : null;

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onDrawingSelected(lineItem.id, event.dataTransfer.files[0] ?? null);
  }

  function downloadSelectedDrawing() {
    if (
      !lineItem.selectedDrawingFile ||
      typeof URL === "undefined" ||
      !URL.createObjectURL ||
      !URL.revokeObjectURL
    ) {
      return;
    }

    const href = URL.createObjectURL(lineItem.selectedDrawingFile);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = lineItem.technicalDrawingName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  if (!hasDrawing) {
    return (
      <label
        className="flex min-h-36 cursor-pointer flex-col gap-5 rounded-md border-2 border-dashed border-slate-200 bg-white px-6 py-7 text-left transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:gap-8 sm:px-8"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="flex h-[90px] w-[90px] shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <Upload className="h-8 w-8" strokeWidth={2.4} />
        </span>
        <span className="min-w-0">
          <span className="block text-2xl font-semibold leading-8 text-slate-950">
            Upload a technical drawing
          </span>
          <span className="mt-2 block text-[22px] font-semibold leading-7 text-slate-400">
            Required for some part specifications
          </span>
        </span>
        <input
          accept={drawingAccept}
          aria-label={drawingInputLabel}
          className="sr-only"
          type="file"
          onChange={(event) =>
            onDrawingSelected(
              lineItem.id,
              event.target.files?.[0] ?? null,
            )
          }
        />
      </label>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left text-blue-900 transition hover:text-blue-700">
          <Paperclip className="h-5 w-5 shrink-0 text-blue-600" strokeWidth={2.2} />
          <span className="min-w-0 truncate text-base font-medium leading-6">
            {lineItem.technicalDrawingName}
          </span>
          <input
            accept={drawingAccept}
            aria-label={drawingInputLabel}
            className="sr-only"
            type="file"
            onChange={(event) =>
              onDrawingSelected(
                lineItem.id,
                event.target.files?.[0] ?? null,
              )
            }
          />
        </label>
        <div className="flex shrink-0 items-center gap-1.5 sm:justify-end">
          {downloadHref ? (
            <a
              aria-label={`Download ${lineItem.technicalDrawingName}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700 transition hover:bg-blue-100"
              download={lineItem.technicalDrawingName}
              href={downloadHref}
              title="Download drawing"
            >
              <Download className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </a>
          ) : (
            <button
              aria-label={`Download ${lineItem.technicalDrawingName}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!canDownload}
              onClick={downloadSelectedDrawing}
              title="Download drawing"
              type="button"
            >
              <Download className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </button>
          )}
          <button
            aria-label="Review drawing specs"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-700 transition hover:bg-blue-100"
            onClick={() => onReviewDrawing(lineItem.id)}
            title="Preview drawing and specs"
            type="button"
          >
            <Eye className="h-5 w-5" strokeWidth={2.4} />
          </button>
          <button
            aria-label={`Remove ${lineItem.technicalDrawingName}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-red-50 text-red-700 transition hover:bg-red-100"
            onClick={() => onRemoveDrawing(lineItem.id)}
            title="Remove drawing"
            type="button"
          >
            <Trash2 className="h-[18px] w-[18px]" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MaterialSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const selected = materialSelectOptions.find((option) => option.value === value);
    return new Set(selected ? [selected.category] : [materialSelectGroups[0]?.name ?? ""]);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedOption = materialSelectOptions.find((option) => option.value === value);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return materialSelectOptions.filter((option) =>
      [
        option.label,
        option.category,
        option.subgroup,
        String(option.metadata?.family ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
    setSearchQuery("");
  }

  function openMenu() {
    setIsOpen(true);

    if (selectedOption) {
      setOpenGroups((current) => new Set([...current, selectedOption.category]));
    }
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  function toggleGroup(groupName: string) {
    setOpenGroups((current) => {
      const next = new Set(current);

      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }

      return next;
    });
  }

  function selectMaterial(optionValue: string) {
    onChange(optionValue);
    closeMenu();
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleMenu();
    }

    if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      closeMenu();
    }
  }

  return (
    <div className="grid w-full gap-2 text-sm font-medium text-slate-700" ref={containerRef}>
      <span id={labelId}>
        Material<span className="ml-1 text-[#d4183d]">*</span>
      </span>
      <select
        aria-label="Material"
        className="sr-only"
        tabIndex={-1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {materialSelectOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="relative">
        <button
          aria-controls={isOpen ? `${labelId}-menu` : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Material dropdown"
          className={[
            "flex min-h-[54px] w-full items-center justify-between rounded-[14px] border bg-white px-5 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-150",
            isOpen
              ? "border-[#1d73ff] shadow-[0_0_0_5px_rgba(191,219,254,0.78),0_2px_8px_rgba(15,23,42,0.08)]"
              : "border-[#dce4ee] hover:border-[#b4c5d8] focus:border-[#1d73ff] focus:shadow-[0_0_0_5px_rgba(191,219,254,0.65)]",
          ].join(" ")}
          onClick={toggleMenu}
          onKeyDown={handleButtonKeyDown}
          type="button"
        >
          <span className="min-w-0 truncate text-[15px] font-semibold leading-6 text-[#020617]">
            {selectedOption?.label ?? "Select a material"}
          </span>
          <span className="ml-4 flex shrink-0 items-center gap-2">
            {selectedOption ? (
              <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 sm:inline">
                {selectedOption.category}
              </span>
            ) : null}
            <ChevronDown
              aria-hidden="true"
              className={[
                "h-4 w-4 text-[#020617] transition-transform duration-200",
                isOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </span>
        </button>

        {isOpen ? (
          <div
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-[#e4e8ee] bg-white shadow-[0_18px_34px_rgba(15,23,42,0.14)]"
            id={`${labelId}-menu`}
            role="listbox"
          >
            <div className="border-b border-[#e4e8ee] bg-[#f8f9fa] p-3">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]"
                />
                <input
                  className="h-10 w-full rounded-lg border border-[#dce4ee] bg-white pl-9 pr-3 text-[14px] font-medium text-[#020617] outline-none transition focus:border-[#1d73ff]"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      closeMenu();
                    }
                  }}
                  placeholder="Search grade, alloy, or family..."
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                />
              </div>
            </div>

            <div
              className="max-h-[430px] overflow-y-auto"
              style={{
                scrollbarColor: "#8a8f98 #d4d9e1",
                scrollbarWidth: "thin",
              }}
            >
              {normalizedQuery ? (
                searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((option) => (
                      <MaterialOptionButton
                        isSelected={option.value === value}
                        key={option.value}
                        option={option}
                        onSelect={selectMaterial}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-sm font-medium text-[#64748b]">
                    No materials found
                  </div>
                )
              ) : (
                materialSelectGroups.map((group) => {
                  const isGroupOpen = openGroups.has(group.name);

                  return (
                    <section className="border-b border-[#edf0f4] last:border-b-0" key={group.name}>
                      <button
                        aria-expanded={isGroupOpen}
                        className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition hover:bg-[#f8fafc]"
                        onClick={() => toggleGroup(group.name)}
                        type="button"
                      >
                        <span className="min-w-0">
                          <span className="block text-[14px] font-bold leading-5 text-[#020617]">
                            {group.name}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                            {group.optionCount}
                          </span>
                          <ChevronDown
                            aria-hidden="true"
                            className={[
                              "h-4 w-4 text-slate-500 transition-transform",
                              isGroupOpen ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </span>
                      </button>
                      {isGroupOpen ? (
                        <div className="bg-white px-5 pb-4">
                          {group.subgroups.map((subgroup) => (
                            <div className="pt-3" key={`${group.name}-${subgroup.name}`}>
                              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">
                                {subgroup.name}
                              </p>
                              <div className="overflow-hidden rounded-md border border-[#edf0f4]">
                                {subgroup.options.map((option) => (
                                  <MaterialOptionButton
                                    isSelected={option.value === value}
                                    key={option.value}
                                    option={option}
                                    onSelect={selectMaterial}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MaterialOptionButton({
  isSelected,
  option,
  onSelect,
}: {
  isSelected: boolean;
  option: MaterialSelectOption;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      aria-selected={isSelected}
      className={[
        "w-full border-none px-4 py-3 text-left transition-colors duration-100",
        isSelected
          ? "bg-[#e8f2ff] text-[#020617]"
          : "bg-white text-[#020617] hover:bg-[#f5f8fb]",
      ].join(" ")}
      onClick={() => onSelect(option.value)}
      role="option"
      type="button"
    >
      <span className="block text-[14px] font-semibold leading-5">
        {option.label}
      </span>
      <span className="mt-1 block text-[12px] font-normal leading-4 text-[#64748b]">
        {option.category} / {option.subgroup}
      </span>
    </button>
  );
}

function QualityDocumentationSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedValues = value;
  const selectedLabels = selectedValues.map((optionValue) =>
    optionLabel(qualityDocumentationOptions, optionValue),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function toggleOption(optionValue: string) {
    const isSelected = selectedValues.includes(optionValue);

    const nextValues = isSelected
      ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
      : [...selectedValues, optionValue];

    onChange(nextValues);
  }

  return (
    <div className="grid w-full gap-2 text-sm font-medium text-slate-700" ref={containerRef}>
      <span id={labelId}>
        Quality documentation<span className="ml-1 text-[#d4183d]">*</span>
      </span>
      <input
        aria-label="Quality documentation"
        className="sr-only"
        readOnly
        value={selectedLabels.join(", ")}
      />
      <div className="relative">
        <div
          className={[
            "flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[14px] border bg-white px-3.5 py-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-150",
            isOpen
              ? "border-[#1d73ff] shadow-[0_0_0_5px_rgba(191,219,254,0.78),0_2px_8px_rgba(15,23,42,0.08)]"
              : "border-[#dce4ee] hover:border-[#b4c5d8] focus:border-[#1d73ff] focus:shadow-[0_0_0_5px_rgba(191,219,254,0.65)]",
          ].join(" ")}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {selectedValues.length > 0 ? (
              selectedValues.map((optionValue) => {
                const label = optionLabel(qualityDocumentationOptions, optionValue);

                return (
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-[#f8f8f8] py-1.5 pl-3 pr-2 text-[15px] font-medium leading-5 text-[#27272a] shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    key={optionValue}
                  >
                    <span className="min-w-0 truncate">{label}</span>
                    <button
                      aria-label={`Remove ${label}`}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[#a1a1aa] transition hover:bg-slate-200 hover:text-[#52525b]"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleOption(optionValue);
                      }}
                      type="button"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </span>
                );
              })
            ) : (
              <span className="px-1 py-1.5 text-[15px] font-medium leading-5 text-slate-400">
                Select quality documents
              </span>
            )}
          </span>
          <button
            aria-controls={isOpen ? `${labelId}-menu` : undefined}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="Quality documentation dropdown"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#a1a1aa] transition hover:bg-slate-100 hover:text-[#020617]"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen((current) => !current);
            }}
            type="button"
          >
            <ChevronDown
              aria-hidden="true"
              className={[
                "h-5 w-5 transition-transform duration-200",
                isOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        </div>

        {isOpen ? (
          <div
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-[#e4e8ee] bg-white shadow-[0_18px_34px_rgba(15,23,42,0.14)]"
            id={`${labelId}-menu`}
            role="listbox"
            aria-multiselectable="true"
          >
            <div className="max-h-[360px] overflow-y-auto">
              {qualityDocumentationOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <button
                    aria-selected={isSelected}
                    className={[
                      "flex w-full items-center gap-3 border-none px-5 py-3 text-left transition-colors duration-100",
                      isSelected
                        ? "bg-[#e8f2ff] text-[#020617]"
                        : "bg-white text-[#020617] hover:bg-[#f5f8fb]",
                    ].join(" ")}
                    key={option.value}
                    onClick={() => toggleOption(option.value)}
                    role="option"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={[
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-[#1d73ff] bg-[#1d73ff] text-white"
                          : "border-[#cbd5e1] bg-white text-transparent",
                      ].join(" ")}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 text-[15px] font-semibold leading-5">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LineItemConfigurationCard({
  index,
  lineItem,
  isCollapsed,
  canRemove,
  updateLineItem,
  updateLineItemFlag,
  onToggleCollapsed,
  onRemove,
  onCadStatus,
  onCadFileSelected,
  onDrawingSelected,
  onRemoveDrawing,
  onReviewDrawing,
}: {
  index: number;
  lineItem: LineItemState;
  isCollapsed: boolean;
  canRemove: boolean;
  updateLineItem: (
    id: string,
    field: LineItemField,
    value: string | string[],
  ) => void;
  updateLineItemFlag: (id: string, field: LineItemFlag, value: boolean) => void;
  onToggleCollapsed: (id: string) => void;
  onRemove: (id: string) => void;
  onCadStatus: (id: string, state: CadUploadPreviewState) => void;
  onCadFileSelected: (id: string, file: File | null) => void;
  onDrawingSelected: (id: string, file: File | null) => void;
  onRemoveDrawing: (id: string) => void;
  onReviewDrawing: (id: string) => void;
}) {
  const needsCadUpload = !lineItemHasCadBytes(lineItem);
  const needsDrawingUpload = !lineItemHasDrawingBytes(lineItem);
  const lineItemDisplayName = displayNameFromFile(lineItem.fileName) || lineItem.partName || "New part";
  const lineItemHeader = `Line item ${index + 1}: ${lineItemDisplayName}`;

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
        <button
          aria-expanded={!isCollapsed}
          aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${lineItemHeader}`}
          className="flex w-full items-center gap-3 text-left text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-800"
          onClick={() => onToggleCollapsed(lineItem.id)}
          type="button"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
            />
          </span>
          <span className="min-w-0 break-all">
          {lineItemHeader}
          </span>
        </button>
      </div>
      <div className={isCollapsed ? "hidden" : "grid lg:grid-cols-[0.95fr_1fr]"}>
        <div className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r">
          <div className="mx-auto max-w-[520px]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                CAD file preview
              </p>
              <CadUploadPreview
                onReplacementFileSelected={(file) =>
                  onCadFileSelected(lineItem.id, file)
                }
                onStatus={(state) => onCadStatus(lineItem.id, state)}
                state={lineItem.cadPreview}
              />
            </div>

            <div className="mt-5">
              <TechnicalDrawingBucket
                index={index}
                lineItem={lineItem}
                onDrawingSelected={onDrawingSelected}
                onRemoveDrawing={onRemoveDrawing}
                onReviewDrawing={onReviewDrawing}
              />
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
                <QualityDocumentationSelect
                  value={lineItem.qualityDocumentation}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "qualityDocumentation", value)
                  }
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
              <div className="grid gap-5">
                <MaterialSelect
                  value={lineItem.material}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "material", value)
                  }
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
              {needsCadUpload ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium leading-6 text-amber-900">
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
  defaultBuyerCompany,
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
    ...makeProjectInitialState(defaultBuyerCompany),
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
  const [isQuoteNameEditing, setIsQuoteNameEditing] = useState(false);
  const [draftQuoteName, setDraftQuoteName] = useState(projectForm.projectName);
  const quoteNameInputRef = useRef<HTMLInputElement | null>(null);
  const [collapsedLineItemIds, setCollapsedLineItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [drawingReviewLineItemId, setDrawingReviewLineItemId] = useState<
    string | null
  >(null);
  const activeDrawingLineItem =
    lineItems.find((lineItem) => lineItem.id === drawingReviewLineItemId) ??
    null;
  const drawingPreviewUrl = useMemo(() => {
    if (!activeDrawingLineItem) {
      return null;
    }

    if (activeDrawingLineItem.selectedDrawingFile) {
      if (
        !drawingCanPreview(activeDrawingLineItem.selectedDrawingFile) ||
        typeof URL === "undefined" ||
        !URL.createObjectURL
      ) {
        return null;
      }

      return URL.createObjectURL(activeDrawingLineItem.selectedDrawingFile);
    }

    if (
      activeDrawingLineItem.technicalDrawingStorageKey &&
      (activeDrawingLineItem.technicalDrawingType === "application/pdf" ||
        activeDrawingLineItem.technicalDrawingType.startsWith("image/"))
    ) {
      return localFileHref(
        activeDrawingLineItem.technicalDrawingStorageKey,
        activeDrawingLineItem.technicalDrawingName,
        activeDrawingLineItem.technicalDrawingType,
      );
    }

    return null;
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

  function startQuoteNameEdit() {
    setDraftQuoteName(projectForm.projectName);
    setIsQuoteNameEditing(true);
  }

  function saveQuoteNameEdit() {
    updateProject("projectName", draftQuoteName.trim());
    setIsQuoteNameEditing(false);
  }

  function cancelQuoteNameEdit() {
    setDraftQuoteName(projectForm.projectName);
    setIsQuoteNameEditing(false);
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

  function toggleLineItemCollapsed(id: string) {
    setCollapsedLineItemIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
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
      fileStorageKey: lineItem.fileStorageKey,
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
      technicalDrawingStorageKey: lineItem.technicalDrawingStorageKey,
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
          storageKey: lineItem.fileStorageKey,
          type: lineItem.selectedFile?.type || lineItem.fileType || "reference/name-only",
        },
        ...(lineItem.technicalDrawingName
          ? [
              {
                id: `${lineItem.id}-drawing`,
                name: lineItem.technicalDrawingName,
                sizeBytes: lineItem.selectedDrawingFile?.size ?? lineItem.technicalDrawingSizeBytes,
                storageKey: lineItem.technicalDrawingStorageKey,
                type: lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType || "reference/name-only",
              },
            ]
          : []),
      ]),
      isArchived: false,
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
      supplierQuoteFiles: [],
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

  useEffect(() => {
    if (isQuoteNameEditing) {
      quoteNameInputRef.current?.focus();
      quoteNameInputRef.current?.select();
    }
  }, [isQuoteNameEditing]);

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
      !drawingPreviewUrl.startsWith("blob:") ||
      typeof URL === "undefined" ||
      !URL.revokeObjectURL
    ) {
      return;
    }

    return () => URL.revokeObjectURL(drawingPreviewUrl);
  }, [drawingPreviewUrl]);

  async function persistDraftUpload(file: File): Promise<PersistedDraftFile | null> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/request-draft-files", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.file?.storageKey) {
        return null;
      }

      return {
        name: payload.file.name || file.name,
        sizeBytes: payload.file.sizeBytes || file.size,
        storageKey: payload.file.storageKey,
        type: payload.file.type || file.type || "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async function persistCadDraftUpload(id: string, file: File) {
    const stored = await persistDraftUpload(file);

    if (!stored) {
      return;
    }

    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id && lineItem.fileName === file.name
          ? {
              ...lineItem,
              fileName: stored.name,
              fileSizeBytes: stored.sizeBytes,
              fileStorageKey: stored.storageKey,
              fileType: stored.type,
            }
          : lineItem,
      ),
    );
  }

  async function persistDrawingDraftUpload(id: string, file: File) {
    const stored = await persistDraftUpload(file);

    if (!stored) {
      return;
    }

    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id && lineItem.technicalDrawingName === file.name
          ? {
              ...lineItem,
              technicalDrawingName: stored.name,
              technicalDrawingSizeBytes: stored.sizeBytes,
              technicalDrawingStorageKey: stored.storageKey,
              technicalDrawingType: stored.type,
            }
          : lineItem,
      ),
    );
  }

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

    void persistCadDraftUpload(id, file);
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
    void persistCadDraftUpload(id, file);
    void startCadPreview(id, file);
  }

  function handleTechnicalDrawingSelected(id: string, file: File | null) {
    if (file) {
      ensureLocalDraftId();
    }

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
    if (file) {
      void persistDrawingDraftUpload(id, file);
    }
    setDrawingReviewLineItemId(file ? id : null);
  }

  function removeTechnicalDrawing(id: string) {
    handleTechnicalDrawingSelected(id, null);
  }

  function removeLineItem(id: string) {
    setLineItems((current) => current.filter((lineItem) => lineItem.id !== id));
    setCollapsedLineItemIds((current) => {
      if (!current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.delete(id);
      return next;
    });
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
          storageKey: lineItem.fileStorageKey,
          type: lineItem.selectedFile?.type || lineItem.fileType || "reference/name-only",
        },
        ...(lineItem.technicalDrawingName
          ? [
              {
                name: lineItem.technicalDrawingName,
                sizeBytes: lineItem.selectedDrawingFile?.size ?? lineItem.technicalDrawingSizeBytes,
                storageKey: lineItem.technicalDrawingStorageKey,
                type:
                  lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType || "reference/name-only",
              },
            ]
          : []),
      ]),
    };
    const uploadedFiles = configuredLineItems.flatMap((lineItem) => [
      lineItem.fileStorageKey ? null : lineItem.selectedFile,
      ...(lineItem.technicalDrawingName
        ? [lineItem.technicalDrawingStorageKey ? null : lineItem.selectedDrawingFile]
        : []),
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
      setProjectForm(makeProjectInitialState(defaultBuyerCompany));
      setLineItems([makeLineItemInitialState("line-1")]);
      setCollapsedLineItemIds(new Set());
      setDrawingReviewLineItemId(null);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to submit request",
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <section className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="border-b border-slate-100 pb-4">
            <div className="max-w-2xl">
              <div className="text-sm font-medium text-slate-700">
                {isQuoteNameEditing ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <span className="shrink-0 text-slate-600">
                      Quote name:
                    </span>
                    <input
                      aria-label="Quote name"
                      className={`${inputClass} min-w-0 flex-1`}
                      placeholder="Aluminum plate reorder"
                      ref={quoteNameInputRef}
                      value={draftQuoteName}
                      onChange={(event) =>
                        setDraftQuoteName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveQuoteNameEdit();
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelQuoteNameEdit();
                        }
                      }}
                    />
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                        onClick={saveQuoteNameEdit}
                        type="button"
                      >
                        <Check className="h-4 w-4" />
                        <span>Save</span>
                      </button>
                      <button
                        className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        onClick={cancelQuoteNameEdit}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl leading-8 text-slate-600">
                    <span>Quote name: </span>
                    <button
                      aria-label="Quote name"
                      className="rounded-sm font-semibold text-slate-950 transition hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      onDoubleClick={startQuoteNameEdit}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          startQuoteNameEdit();
                        }
                      }}
                      title="Double-click to edit"
                      type="button"
                    >
                      {projectForm.projectName.trim() || "Untitled quote"}
                    </button>
                  </p>
                )}
              </div>
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
              isCollapsed={collapsedLineItemIds.has(lineItem.id)}
              canRemove={configuredLineItems.length > 1}
              updateLineItem={updateLineItem}
              updateLineItemFlag={updateLineItemFlag}
              onToggleCollapsed={toggleLineItemCollapsed}
              onRemove={removeLineItem}
              onCadStatus={updateCadPreview}
              onCadFileSelected={(id, file) =>
                void handleCadFileSelected(id, file)
              }
              onDrawingSelected={handleTechnicalDrawingSelected}
              onRemoveDrawing={removeTechnicalDrawing}
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
        </section>
      </form>

      {createdRequest ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
          <p className="font-semibold">Submitted to queue</p>
          <p className="mt-1">{createdRequest.title}</p>
          <p className="mt-1 text-emerald-700">
            Status: {createdRequest.status}
          </p>
        </div>
      ) : null}
    </div>
  );
}
