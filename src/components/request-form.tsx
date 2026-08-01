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
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileUp,
  Paperclip,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { CadRenderThumbnail } from "@/components/cad-file-preview";
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
  surfaceFinishColorOption,
  surfaceFinishColorOptionsFor,
  surfaceFinishCosmeticRequirementLabel,
  surfaceFinishCosmeticRequirementOptions,
  surfaceFinishMetadataFor,
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
  surfaceFinishColor: string;
  surfaceFinishCosmeticRequirement: string;
  surfaceFinishCustomColor: string;
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
};

export type RequestFormInitialState = LegacyInitialState;

type RequestFormProps = {
  defaultBuyerCompany?: string;
  initialState?: RequestFormInitialState;
  localDraftId?: string;
  prefillNotice?: string;
  resumeRequests?: LatticeRequest[];
};

const cadFileTypes = "STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT";
const cadAccept = ".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt";
const cadFileExtensions = cadAccept.split(",").map((extension) => extension.trim().toLowerCase());
const drawingAccept = ".pdf,.dxf,.dwg,.png,.jpg,.jpeg";
const incompleteRfqStorageKey = "lattice.incompleteRfqs.v1";
const resumeDraftPageSize = 3;

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
  surfaceFinishColor: defaultSurfaceFinishColor("as_machined_ra_3_2"),
  surfaceFinishCosmeticRequirement: defaultSurfaceFinishCosmeticRequirement("as_machined_ra_3_2"),
  surfaceFinishCustomColor: "",
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

function makeCadLineItem(id: string, file: File): LineItemState {
  const fileName = file.name;

  return {
    ...makeLineItemInitialState(id),
    selectedFile: file,
    fileName,
    fileSizeBytes: file.size,
    fileType: file.type,
    partName: suggestedNameFromFile(fileName),
    cadPreview: { status: "uploading", fileName },
  };
}

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

function quoteNameFromFileNames(fileNames: string[]) {
  const displayNames = fileNames
    .map(suggestedNameFromFile)
    .filter((name) => name.trim());

  if (displayNames.length <= 3) {
    return displayNames.join(", ");
  }

  return `${displayNames.slice(0, 2).join(", ")}, +${displayNames.length - 2} more`;
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

function cadPreviewUrnForLineItem(lineItem: LineItemState) {
  if (
    (lineItem.cadPreview.status === "processing" || lineItem.cadPreview.status === "ready") &&
    lineItem.cadPreview.fileName === lineItem.fileName
  ) {
    return lineItem.cadPreview.urn;
  }

  return undefined;
}

function qualityDocumentationRequiresDrawing(optionValue: string) {
  return Boolean(
    qualityDocumentationOptions.find((option) => option.value === optionValue)
      ?.metadata?.requiresDrawing,
  );
}

function defaultSurfaceFinishColor(surfaceFinish: string) {
  const metadata = surfaceFinishMetadataFor(surfaceFinish);
  return metadata?.defaultColor ?? metadata?.colors?.[0]?.value ?? "";
}

function defaultSurfaceFinishCosmeticRequirement(surfaceFinish: string) {
  const metadata = surfaceFinishMetadataFor(surfaceFinish);
  return metadata?.cosmeticRequirement
    ? metadata.defaultCosmeticRequirement ?? "non_cosmetic"
    : "";
}

function normalizedSurfaceFinishColor(surfaceFinish: string, value?: string) {
  const options = surfaceFinishColorOptionsFor(surfaceFinish);

  if (!options.length) {
    return "";
  }

  if (value && options.some((option) => option.value === value)) {
    return value;
  }

  return defaultSurfaceFinishColor(surfaceFinish);
}

function normalizedSurfaceFinishCosmeticRequirement(surfaceFinish: string, value?: string) {
  const metadata = surfaceFinishMetadataFor(surfaceFinish);

  if (!metadata?.cosmeticRequirement) {
    return "";
  }

  if (
    value &&
    surfaceFinishCosmeticRequirementOptions.some((option) => option.value === value)
  ) {
    return value;
  }

  return defaultSurfaceFinishCosmeticRequirement(surfaceFinish);
}

function surfaceFinishDisplayValue(lineItem: Pick<
  LineItemState,
  | "surfaceFinish"
  | "surfaceFinishColor"
  | "surfaceFinishCosmeticRequirement"
  | "surfaceFinishCustomColor"
>) {
  const finishLabel = optionLabel(surfaceFinishOptions, lineItem.surfaceFinish);
  const metadata = surfaceFinishMetadataFor(lineItem.surfaceFinish);
  const details: string[] = [];

  if (metadata?.cosmeticRequirement && lineItem.surfaceFinishCosmeticRequirement) {
    details.push(
      surfaceFinishCosmeticRequirementLabel(
        lineItem.surfaceFinishCosmeticRequirement,
        "shortLabel",
      ),
    );
  }

  const colorOption = surfaceFinishColorOption(
    lineItem.surfaceFinish,
    lineItem.surfaceFinishColor,
  );
  if (colorOption) {
    if (colorOption.mode === "custom") {
      const customColor = lineItem.surfaceFinishCustomColor.trim();
      details.push(customColor ? `${colorOption.label}: ${customColor}` : colorOption.label);
    } else {
      details.push(colorOption.label);
    }
  }

  return details.length ? `${finishLabel} - ${details.join(" - ")}` : finishLabel;
}

function lineItemHasSurfaceFinishDetails(lineItem: LineItemState) {
  const metadata = surfaceFinishMetadataFor(lineItem.surfaceFinish);
  const colorOption = surfaceFinishColorOption(
    lineItem.surfaceFinish,
    lineItem.surfaceFinishColor,
  );

  if (metadata?.cosmeticRequirement && !lineItem.surfaceFinishCosmeticRequirement) {
    return false;
  }

  if (metadata?.colors?.length && !colorOption) {
    return false;
  }

  if (colorOption?.mode === "custom") {
    return Boolean(lineItem.surfaceFinishCustomColor.trim());
  }

  return true;
}

function requiredQualityDocumentationLabels(lineItem: LineItemState) {
  return lineItem.qualityDocumentation
    .filter(qualityDocumentationRequiresDrawing)
    .map((optionValue) => optionLabel(qualityDocumentationOptions, optionValue));
}

function lineItemRequiresDrawing(lineItem: LineItemState) {
  return (
    lineItem.partMarkings ||
    lineItem.tightLinearTolerance ||
    lineItem.threads ||
    lineItem.engineeringFits ||
    lineItem.sharpInternalCorners ||
    requiredQualityDocumentationLabels(lineItem).length > 0
  );
}

function lineItemHasRequiredDrawing(lineItem: LineItemState) {
  return (
    !lineItemRequiresDrawing(lineItem) ||
    (Boolean(lineItem.technicalDrawingName.trim()) && lineItemHasDrawingBytes(lineItem))
  );
}

function lineItemsHaveMissingRequiredDrawing(lineItems: LineItemState[]) {
  return lineItems.some(
    (lineItem) =>
      lineItemRequiresDrawing(lineItem) &&
      !lineItem.technicalDrawingName.trim(),
  );
}

function resumeRequestHref(request: LatticeRequest) {
  return `/requests/new?draft=${request.id}`;
}

function formatResumeLastEdited(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function draftCompletionPercent(request: LatticeRequest) {
  const completedIntakeSignals = [
    Boolean(request.title.trim()),
    request.files.length > 0,
    request.lineItems.length > 0,
  ].filter(Boolean).length;

  return completedIntakeSignals * 20;
}

function requiredDrawingErrorMessage(lineItem: LineItemState) {
  const partLabel =
    lineItem.partName.trim() ||
    displayNameFromFile(lineItem.fileName) ||
    "This line item";

  return `${partLabel} has specifications marked as drawing required. Upload a technical drawing before requesting a quote.`;
}

function isRequiredDrawingError(message: string | null) {
  return Boolean(
    message?.includes("has specifications marked as drawing required"),
  );
}

function localFileHref(storageKey: string, name: string, type: string) {
  return `/api/local-files/${storageKey}?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
}

function isCadUploadFile(file: File) {
  const fileName = file.name.toLowerCase();

  return cadFileExtensions.some((extension) => fileName.endsWith(extension));
}

function makeLineItemId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type MaterialFamilyDefinition = {
  name: string;
  matches: (option: RfqOption) => boolean;
};

function optionFamily(option: RfqOption) {
  return String(option.metadata?.family ?? "");
}

function optionLabelText(option: RfqOption) {
  return option.label.toLowerCase();
}

const hubsStyleMaterialFamilies: MaterialFamilyDefinition[] = [
  {
    name: "Aluminum",
    matches: (option) => optionFamily(option) === "Aluminum",
  },
  {
    name: "Alloy steel",
    matches: (option) =>
      optionFamily(option) === "Steel" &&
      /(alloy|4130|4140|4340|52100|8620|42crmo|1\.7131|1\.7225)/i.test(option.label),
  },
  {
    name: "Mild steel",
    matches: (option) =>
      optionFamily(option) === "Steel" &&
      /(mild|carbon|1018|1020|1045|a36|s235|s275|s355|c35|c40|c45)/i.test(option.label),
  },
  {
    name: "Stainless steel",
    matches: (option) => optionFamily(option) === "Stainless steel",
  },
  {
    name: "Tool steel",
    matches: (option) => optionFamily(option) === "Tool steel",
  },
  {
    name: "Brass",
    matches: (option) =>
      optionFamily(option) === "Copper / brass / bronze" && optionLabelText(option).includes("brass"),
  },
  {
    name: "Copper",
    matches: (option) =>
      optionFamily(option) === "Copper / brass / bronze" &&
      /(copper|c101|c110|cu-etp|cu-dhp)/i.test(option.label),
  },
  {
    name: "Titanium",
    matches: (option) => optionFamily(option) === "Titanium",
  },
  {
    name: "Bronze",
    matches: (option) =>
      optionFamily(option) === "Copper / brass / bronze" &&
      /(bronze|c932|c954|cusn|phosphor)/i.test(option.label),
  },
  {
    name: "Inconel",
    matches: (option) => /inconel/i.test(option.label),
  },
  {
    name: "Other Metals",
    matches: (option) =>
      [
        "Nickel / precision alloy",
        "Cast iron",
        "Magnesium / zinc",
      ].includes(optionFamily(option)) || optionFamily(option) === "Steel",
  },
  {
    name: "Polyethylene",
    matches: (option) => /(polyethylene|hdpe|uhmw)/i.test(option.label),
  },
  {
    name: "Polypropylene",
    matches: (option) => /(polypropylene|\bpp\b)/i.test(option.label),
  },
  {
    name: "POM (Delrin/Acetal)",
    matches: (option) => /(pom|delrin|acetal)/i.test(option.label),
  },
  {
    name: "Nylon",
    matches: (option) => /nylon/i.test(option.label),
  },
  {
    name: "PEI",
    matches: (option) => /(pei|ultem)/i.test(option.label),
  },
  {
    name: "PEEK",
    matches: (option) => /peek/i.test(option.label),
  },
  {
    name: "Other Plastics",
    matches: (option) =>
      ["Plastic / polymer", "Composite"].includes(optionFamily(option)),
  },
];

function buildMaterialSelectGroups(): MaterialSelectGroup[] {
  const usedOptionValues = new Set<string>();
  const groups = hubsStyleMaterialFamilies
    .map((family) => {
      const options = rfqMaterialOptions
        .filter((option) => !usedOptionValues.has(option.value))
        .filter(family.matches)
        .map((option) => {
          usedOptionValues.add(option.value);

          return {
            ...option,
            category: family.name,
            subgroup: optionFamily(option) || family.name,
          };
        });

      return {
        name: family.name,
        subgroups: [
          {
            name: family.name,
            options,
          },
        ],
        optionCount: options.length,
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
    groups.push({
      name: "Custom Review required",
      subgroups: [{ name: "Custom Review required", options: remainingOptions }],
      optionCount: remainingOptions.length,
    });
  }

  return groups;
}

const materialSelectGroups = buildMaterialSelectGroups();
const materialSelectOptions = materialSelectGroups.flatMap((group) =>
  group.subgroups.flatMap((subgroup) => subgroup.options),
);
const iso2768ToleranceRows = [
  ["0.5mm* to 3mm", "+/-0.1mm", "+/-0.05mm"],
  ["Over 3mm to 6mm", "+/-0.1mm", "+/-0.05mm"],
  ["Over 6mm to 30mm", "+/-0.2mm", "+/-0.1mm"],
  ["Over 30mm to 120mm", "+/-0.3mm", "+/-0.15mm"],
  ["Over 120mm to 400mm", "+/-0.5mm", "+/-0.2mm"],
  ["Over 400mm to 1000mm", "+/-0.8mm", "+/-0.3mm"],
  ["Over 1000mm to 2000mm", "+/-1.2mm", "+/-0.5mm"],
  ["Over 2000mm to 4000mm", "+/-2mm", ""],
];

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
  const surfaceFinish = initialState?.surfaceFinish ?? "as_machined_ra_3_2";

  return {
    ...makeLineItemInitialState(id),
    partName: initialState?.partName ?? "",
    quantity: initialState?.quantity ?? "1",
    material: initialState?.material ?? "ss_304",
    generalTolerance: initialState?.generalTolerance ?? "iso_2768_medium_m",
    surfaceFinish,
    surfaceFinishColor: normalizedSurfaceFinishColor(
      surfaceFinish,
      initialState?.surfaceFinishColor,
    ),
    surfaceFinishCosmeticRequirement: normalizedSurfaceFinishCosmeticRequirement(
      surfaceFinish,
      initialState?.surfaceFinishCosmeticRequirement,
    ),
    surfaceFinishCustomColor: initialState?.surfaceFinishCustomColor ?? "",
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

function readLocalIncompleteResumeRequests() {
  return readIncompleteRfqs()
    .map((draft) => draft.request)
    .filter(
      (request): request is LatticeRequest =>
        Boolean(request?.id) && request.status === "DRAFT",
    );
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

function makeLocalDraftId() {
  return `local_draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function TechnicalDrawingReviewModal({
  lineItem,
  drawingPreviewUrl,
  onClose,
  onDrawingSelected,
  onRemove,
  updateLineItem,
  updateLineItemFlag,
}: {
  lineItem: LineItemState;
  drawingPreviewUrl: string | null;
  onClose: () => void;
  onDrawingSelected: (id: string, file: File | null) => void;
  onRemove: () => void;
  updateLineItem: (
    id: string,
    field: LineItemField,
    value: string | string[],
  ) => void;
  updateLineItemFlag: (id: string, field: LineItemFlag, value: boolean) => void;
}) {
  const [showMissingDrawingNotice, setShowMissingDrawingNotice] = useState(false);
  const drawingType = lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType;
  const hasDrawing = Boolean(lineItem.technicalDrawingName.trim());
  const drawingRequiredModalSelections = [
    lineItem.tightLinearTolerance
      ? "Linear tolerances tighter than the general tolerance"
      : null,
    lineItem.engineeringFits ? "Engineering Fits" : null,
    lineItem.threads ? "Threads" : null,
    ...requiredQualityDocumentationLabels(lineItem),
  ].filter((selection): selection is string => Boolean(selection));
  const hasDrawingRequiredModalSelection =
    drawingRequiredModalSelections.length > 0;
  const mustAttachDrawingBeforeClosing =
    hasDrawingRequiredModalSelection && !hasDrawing;
  const drawingRequiredNotice =
    drawingRequiredModalSelections.length === 1
      ? drawingRequiredModalSelections[0]
      : drawingRequiredModalSelections.length === 2
        ? drawingRequiredModalSelections.join(" and ")
        : `${drawingRequiredModalSelections.slice(0, -1).join(", ")}, and ${drawingRequiredModalSelections.at(-1)}`;
  const canRenderPreview =
    Boolean(drawingPreviewUrl) &&
    (drawingType === "application/pdf" || drawingType.startsWith("image/"));

  function handleDrawingDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onDrawingSelected(lineItem.id, event.dataTransfer.files[0] ?? null);
  }

  function handleDone() {
    if (mustAttachDrawingBeforeClosing) {
      setShowMissingDrawingNotice(true);
      return;
    }

    onClose();
  }

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
            ) : hasDrawing ? (
              <div className="max-w-md px-6 text-center">
                <p className="text-lg font-semibold text-slate-950">
                  {lineItem.technicalDrawingName}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This drawing type is attached, but the browser cannot preview
                  it inline.
                </p>
              </div>
            ) : (
              <label
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center bg-slate-50 px-6 text-center transition hover:bg-blue-50/30"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrawingDrop}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-lg text-slate-400">
                  <Upload className="h-10 w-10" strokeWidth={1.7} />
                </span>
                <span className="mt-6 block text-lg font-semibold text-slate-950">
                  Upload a technical drawing
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-500">
                  Click to browse, or drag and drop a PDF, DXF, DWG, PNG, or JPG.
                </span>
                <input
                  accept={drawingAccept}
                  aria-label="Upload replacement technical drawing"
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
            {hasDrawing ? (
              <p className="mt-3 break-all text-xs font-medium text-slate-400">
                {lineItem.technicalDrawingName}
              </p>
            ) : null}
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
                <span className="text-slate-500">(drawing required)</span>
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
                <span className="text-slate-500">(drawing required)</span>
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
                <span className="text-slate-500">(drawing required)</span>
              </span>
            </label>
          </div>

          <div className="flex flex-col items-end gap-3 border-t border-slate-200 p-5">
            {showMissingDrawingNotice && mustAttachDrawingBeforeClosing ? (
              <p className="max-w-[300px] rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-right text-xs font-medium leading-5 text-amber-900">
                Add a technical drawing, or uncheck {drawingRequiredNotice}, to
                finish these specifications.
              </p>
            ) : null}
            <div className="flex justify-end gap-3">
              {hasDrawing ? (
                <button
                  className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  onClick={onRemove}
                  type="button"
                >
                  Remove Drawing
                </button>
              ) : null}
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={handleDone}
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadCadDropZone({
  compact = false,
  label,
  onFilesSelected,
}: {
  compact?: boolean;
  label: string;
  onFilesSelected: (files: File[]) => void;
}) {
  const dragDepthRef = useRef(0);
  const [isDragActive, setIsDragActive] = useState(false);

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    onFilesSelected(Array.from(event.dataTransfer.files).filter(isCadUploadFile));
  }

  return (
    <section
      aria-label={compact ? "Additional CAD upload drop zone" : "CAD upload drop zone"}
      className={[
        "rounded-lg border border-dashed px-6 text-center transition-all duration-150",
        compact ? "py-16" : "py-24",
        isDragActive
          ? "border-blue-500 bg-blue-50 shadow-[inset_0_0_0_2px_rgba(37,99,235,0.18),0_10px_30px_rgba(37,99,235,0.12)]"
          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white",
      ].join(" ")}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div
        className={[
          "mx-auto flex h-16 w-16 items-center justify-center rounded-xl border transition-all duration-150",
          isDragActive
            ? "scale-105 border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-200"
            : "border-slate-200 bg-white text-slate-500 shadow-sm",
        ].join(" ")}
      >
        <FileUp aria-hidden="true" className="h-9 w-9" strokeWidth={1.8} />
      </div>
      <p className={`mt-4 text-lg font-semibold ${isDragActive ? "text-blue-950" : "text-slate-950"}`}>
        {isDragActive ? "Drop CAD files to add them" : "Drag & drop CAD files here, or browse"}
      </p>
      <p className={`mt-2 text-sm leading-6 ${isDragActive ? "text-blue-700" : "text-slate-500"}`}>
        Supported formats: {cadFileTypes}
      </p>
      {!compact ? (
        <p className={`mt-1 text-xs leading-5 ${isDragActive ? "text-blue-700" : "text-slate-400"}`}>
          Maximum file size: 200 MB per file
        </p>
      ) : null}
      <label
        className={[
          "mt-5 inline-flex cursor-pointer rounded-md border px-4 py-3 text-sm font-semibold transition",
          compact
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "border-[#171717] bg-[#171717] text-white hover:bg-black",
        ].join(" ")}
      >
        <span>{label}</span>
        <input
          aria-label={label}
          className="sr-only"
          type="file"
          accept={cadAccept}
          multiple
          onChange={(event) =>
            onFilesSelected(Array.from(event.target.files ?? []).filter(isCadUploadFile))
          }
        />
      </label>
    </section>
  );
}

function ResumeQuotePanel({ requests }: { requests: LatticeRequest[] }) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = Math.max(1, Math.ceil(requests.length / resumeDraftPageSize));
  const clampedPageIndex = Math.min(pageIndex, pageCount - 1);
  const firstVisibleIndex = clampedPageIndex * resumeDraftPageSize;
  const visibleRequests = requests.slice(
    firstVisibleIndex,
    firstVisibleIndex + resumeDraftPageSize,
  );
  const hasMultiplePages = requests.length > resumeDraftPageSize;

  if (!requests.length) {
    return null;
  }

  return (
    <section aria-labelledby="draft-requests-heading" className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="flex flex-col gap-1 border-b border-[#eeeeee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[#202020]" id="draft-requests-heading">
            Draft requests
          </h2>
          <p className="mt-1 text-[13px] text-[#70757d]">
            Continue RFQs that have not been submitted.
          </p>
        </div>
        <span className="text-[12px] font-medium text-[#777d86]">
          {requests.length} {requests.length === 1 ? "draft" : "drafts"}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(180px,0.75fr)_minmax(190px,0.8fr)_96px] gap-5 border-b border-[#eeeeee] bg-[#fafafa] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-lg:hidden">
        <span>RFQ draft</span>
        <span>Last edited</span>
        <span>Completion</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {visibleRequests.map((request) => {
          const primaryLineItem = request.lineItems[0];
          const href = resumeRequestHref(request);
          const completionPercent = draftCompletionPercent(request);

          return (
            <div
              className="grid gap-5 px-5 py-4 transition hover:bg-[#fbfbfb] lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.75fr)_minmax(190px,0.8fr)_96px] lg:items-center"
              key={request.id}
            >
              <a
                aria-label={`Resume draft for ${request.title}`}
                className="flex min-w-0 gap-4 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
                href={href}
              >
                <CadRenderThumbnail
                  className="h-[72px] w-[72px] shrink-0 border-[#cbd5df] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                  file={request.files[0]}
                  label={primaryLineItem?.partName ?? request.title}
                />
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">
                    Draft
                  </span>
                  <h3 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">
                    {request.title}
                  </h3>
                  <p className="mt-1 truncate text-[13px] text-[#69707a]">
                    {request.files.length} {request.files.length === 1 ? "file" : "files"}
                    {primaryLineItem?.partName ? ` - ${primaryLineItem.partName}` : ""}
                  </p>
                </div>
              </a>

              <a
                className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
                href={href}
                tabIndex={-1}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">
                  Last edited
                </p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] lg:mt-0">
                  {formatResumeLastEdited(request.updatedAt || request.createdAt)}
                </p>
              </a>

              <a
                className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
                href={href}
                tabIndex={-1}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">
                  Completion
                </p>
                <p className="mt-1 text-[13px] font-medium text-[#4f5660] lg:mt-0">
                  {completionPercent}% complete
                </p>
                <span className="mt-2 block h-1.5 max-w-[190px] overflow-hidden rounded-full bg-[#e6e8eb]">
                  <span
                    className="block h-full rounded-full bg-[#171717]"
                    style={{ width: `${completionPercent}%` }}
                  />
                </span>
              </a>

              <div className="flex items-center justify-between gap-2 lg:justify-end">
                <a
                  aria-label={`Continue draft for ${request.title}`}
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#e2e2e2] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#f7f8fa]"
                  href={href}
                >
                  Continue
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {hasMultiplePages ? (
        <div className="flex flex-col gap-3 border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86] sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {firstVisibleIndex + 1}-
            {Math.min(firstVisibleIndex + visibleRequests.length, requests.length)} of{" "}
            {requests.length} drafts
          </span>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#e2e2e2] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={clampedPageIndex === 0}
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="px-1 font-medium text-[#555b64]">
              Page {clampedPageIndex + 1} of {pageCount}
            </span>
            <button
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#e2e2e2] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={clampedPageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((current) => Math.min(pageCount - 1, current + 1))
              }
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RequestQuoteProgress({ currentStep }: { currentStep: 1 | 2 }) {
  const steps = ["Upload", "Configure", "Review", "Submit"];

  return (
    <nav aria-label="Request quote progress" className="mt-7 overflow-x-auto pb-1">
      <ol className="grid min-w-[620px] grid-cols-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;

          return (
            <li className="flex min-w-0 items-center" key={step}>
              <div
                aria-current={isCurrent ? "step" : undefined}
                className="flex shrink-0 items-center gap-3"
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full border text-[14px] font-semibold",
                    isCurrent
                      ? "border-[#171717] bg-[#171717] text-white"
                      : isComplete
                        ? "border-[#171717] bg-white text-[#171717]"
                        : "border-[#d7d9dd] bg-white text-[#656b74]",
                  ].join(" ")}
                >
                  {isComplete ? <Check aria-hidden="true" className="h-4 w-4" /> : stepNumber}
                </span>
                <span
                  className={[
                    "whitespace-nowrap text-[14px]",
                    isCurrent || isComplete
                      ? "font-semibold text-[#202020]"
                      : "font-medium text-[#70757d]",
                  ].join(" ")}
                >
                  {step}
                </span>
              </div>
              {stepNumber < steps.length ? (
                <span aria-hidden="true" className="mx-5 h-px min-w-8 flex-1 bg-[#dfe1e4]" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
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
        className="flex min-h-[72px] cursor-pointer flex-col gap-3 rounded-md border-2 border-dashed border-slate-200 bg-white px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <Upload className="h-5 w-5" strokeWidth={2.4} />
        </span>
        <span className="min-w-0">
          <span className="block text-lg font-semibold leading-6 text-slate-950">
            Upload a technical drawing
          </span>
          <span className="mt-0.5 block text-sm font-semibold leading-5 text-slate-400">
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
  const [activeOptionValue, setActiveOptionValue] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const selected = materialSelectOptions.find((option) => option.value === value);
    return new Set(selected ? [selected.category] : [materialSelectGroups[0]?.name ?? ""]);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedOption = materialSelectOptions.find((option) => option.value === value);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  function materialOptionsFor(query: string, groups: Set<string>) {
    const normalizedMaterialQuery = query.trim().toLowerCase();

    if (!normalizedMaterialQuery) {
      return materialSelectGroups.flatMap((group) =>
        groups.has(group.name)
          ? group.subgroups.flatMap((subgroup) => subgroup.options)
          : [],
      );
    }

    return materialSelectOptions.filter((option) =>
      [
        option.label,
        option.category,
        option.subgroup,
        String(option.metadata?.family ?? ""),
        String(option.metadata?.unsNumber ?? ""),
        String(option.metadata?.composition ?? ""),
        String(option.metadata?.compositionFormula ?? ""),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedMaterialQuery),
    );
  }
  const searchResults = useMemo(
    () => (normalizedQuery ? materialOptionsFor(searchQuery, openGroups) : []),
    [normalizedQuery, openGroups, searchQuery],
  );
  const visibleMaterialOptions = useMemo(() => {
    return normalizedQuery ? searchResults : materialOptionsFor(searchQuery, openGroups);
  }, [normalizedQuery, openGroups, searchQuery, searchResults]);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeOptionValue) {
      return;
    }

    const activeOptionElement = document.getElementById(
      materialOptionId(labelId, activeOptionValue),
    );

    if (activeOptionElement?.scrollIntoView) {
      activeOptionElement.scrollIntoView({ block: "nearest" });
    }
  }, [activeOptionValue, isOpen, labelId]);

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
    setActiveOptionValue(null);
  }

  function openMenu() {
    const nextOpenGroups = new Set(openGroups);

    if (selectedOption) {
      nextOpenGroups.add(selectedOption.category);
    }

    const nextVisibleOptions = materialOptionsFor(searchQuery, nextOpenGroups);
    setIsOpen(true);
    setOpenGroups(nextOpenGroups);
    setActiveOptionValue(
      nextVisibleOptions.find((option) => option.value === value)?.value ??
        nextVisibleOptions[0]?.value ??
        null,
    );
  }

  function toggleMenu() {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }

  function toggleGroup(groupName: string) {
    const next = new Set(openGroups);

    if (next.has(groupName)) {
      next.delete(groupName);
    } else {
      next.add(groupName);
    }

    const nextVisibleOptions = materialOptionsFor(searchQuery, next);
    setOpenGroups(next);
    setActiveOptionValue((currentValue) =>
      currentValue &&
      nextVisibleOptions.some((option) => option.value === currentValue)
        ? currentValue
        : nextVisibleOptions.find((option) => option.value === value)?.value ??
          nextVisibleOptions[0]?.value ??
          null,
    );
  }

  function selectMaterial(optionValue: string) {
    onChange(optionValue);
    closeMenu();
  }

  function handleSearchChange(nextSearchQuery: string) {
    const nextVisibleOptions = materialOptionsFor(nextSearchQuery, openGroups);

    setSearchQuery(nextSearchQuery);
    setActiveOptionValue(
      nextVisibleOptions.find((option) => option.value === value)?.value ??
        nextVisibleOptions[0]?.value ??
        null,
    );
  }

  function moveActiveOption(direction: 1 | -1) {
    if (visibleMaterialOptions.length === 0) {
      return;
    }

    setActiveOptionValue((currentValue) => {
      const currentIndex = visibleMaterialOptions.findIndex(
        (option) => option.value === currentValue,
      );
      const nextIndex =
        currentIndex === -1
          ? direction === 1
            ? 0
            : visibleMaterialOptions.length - 1
          : (currentIndex + direction + visibleMaterialOptions.length) %
              visibleMaterialOptions.length;

      return visibleMaterialOptions[nextIndex]?.value ?? null;
    });
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLInputElement | HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveOption(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveOption(-1);
      return;
    }

    if (event.key === "Home" && visibleMaterialOptions.length > 0) {
      event.preventDefault();
      setActiveOptionValue(visibleMaterialOptions[0].value);
      return;
    }

    if (event.key === "End" && visibleMaterialOptions.length > 0) {
      event.preventDefault();
      setActiveOptionValue(visibleMaterialOptions[visibleMaterialOptions.length - 1].value);
      return;
    }

    if (event.key === "Enter" && activeOptionValue) {
      event.preventDefault();
      selectMaterial(activeOptionValue);
    }
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
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-6 text-[#020617]">
              {selectedOption?.label ?? "Select a material"}
            </span>
            {selectedOption ? (
              <span className="mt-0.5 block truncate text-[12px] font-medium leading-4 text-[#64748b]">
                {materialOptionDetails(selectedOption)}
              </span>
            ) : null}
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
            aria-activedescendant={
              activeOptionValue ? materialOptionId(labelId, activeOptionValue) : undefined
            }
            id={`${labelId}-menu`}
            onKeyDown={handleMenuKeyDown}
            role="listbox"
          >
            <div className="border-b border-[#e4e8ee] bg-white">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1d73ff]"
                />
                <input
                  className="h-14 w-full border-0 bg-white pl-14 pr-5 text-[15px] font-semibold text-[#020617] outline-none placeholder:text-[#64748b]"
                  onChange={(event) => handleSearchChange(event.target.value)}
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
                        id={materialOptionId(labelId, option.value)}
                        isActive={option.value === activeOptionValue}
                        isSelected={option.value === value}
                        key={option.value}
                        option={option}
                        onHighlight={setActiveOptionValue}
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
                          {group.subgroups.map((subgroup) => {
                            const showSubgroupHeading =
                              group.subgroups.length > 1 && subgroup.name !== group.name;

                            return (
                              <div className="pt-3" key={`${group.name}-${subgroup.name}`}>
                                {showSubgroupHeading ? (
                                  <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">
                                    {subgroup.name}
                                  </p>
                                ) : null}
                                <div>
                                  {subgroup.options.map((option) => (
                                    <MaterialOptionButton
                                      id={materialOptionId(labelId, option.value)}
                                      isActive={option.value === activeOptionValue}
                                      isSelected={option.value === value}
                                      key={option.value}
                                      option={option}
                                      onHighlight={setActiveOptionValue}
                                      onSelect={selectMaterial}
                                    />
                                  ))}
                              </div>
                            </div>
                            );
                          })}
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

function materialOptionId(labelId: string, optionValue: string) {
  return `${labelId}-${optionValue}-option`;
}

function Iso2768ToleranceModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/35 px-4 py-6">
      <section
        aria-modal="true"
        aria-labelledby="iso-2768-tolerance-title"
        className="max-h-[calc(100vh-3rem)] w-full max-w-[640px] overflow-y-auto rounded bg-white px-5 py-4 shadow-2xl md:px-6 md:py-5"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-lg font-semibold tracking-tight text-[#242424]"
              id="iso-2768-tolerance-title"
            >
              ISO 2768-1 tolerances
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#6f6f6f]">
              Clearly indicate tolerances for nominal sizes below 0.5mm on your
              technical drawing.
            </p>
          </div>
          <button
            aria-label="Close ISO 2768-1 tolerances"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#242424] transition hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#d8d8d8]">
                <th className="pb-3 pr-5 text-sm font-semibold text-[#242424]">
                  Limits for nominal size
                </th>
                <th className="pb-3 pr-5 text-sm font-semibold text-[#242424]">
                  Medium class (m)
                </th>
                <th className="pb-3 text-sm font-semibold text-[#242424]">
                  Fine class (f)
                </th>
              </tr>
            </thead>
            <tbody>
              {iso2768ToleranceRows.map(([nominalSize, mediumClass, fineClass]) => (
                <tr className="border-b border-[#d8d8d8]" key={nominalSize}>
                  <td className="py-3 pr-5 text-sm text-[#4f4f4f]">{nominalSize}</td>
                  <td className="py-3 pr-5 text-sm text-[#4f4f4f]">{mediumClass}</td>
                  <td className="py-3 text-sm text-[#4f4f4f]">{fineClass || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RemoveLineItemConfirmationModal({
  index,
  lineItemName,
  onCancel,
  onConfirm,
}: {
  index: number;
  lineItemName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 py-6">
      <section
        aria-modal="true"
        aria-labelledby="remove-line-item-title"
        className="w-full max-w-[520px] rounded bg-white px-8 py-7 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-6">
          <h2
            className="text-2xl font-semibold tracking-tight text-[#242424]"
            id="remove-line-item-title"
          >
            Remove from quote
          </h2>
          <button
            aria-label="Close remove line item confirmation"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#242424] transition hover:bg-slate-100"
            onClick={onCancel}
            type="button"
          >
            <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </div>

        <p className="mt-8 text-lg font-medium text-[#242424]">
          {index + 1}.&nbsp;&nbsp;{lineItemName}
        </p>

        <div className="mt-16 flex justify-end gap-3">
          <button
            className="inline-flex min-h-11 items-center justify-center rounded bg-[#f2f2f2] px-6 text-base font-semibold text-[#4f4f4f] transition hover:bg-[#e8e8e8]"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded bg-[#ffe8ec] px-6 text-base font-semibold text-[#c41230] transition hover:bg-[#ffdce3]"
            onClick={onConfirm}
            type="button"
          >
            Remove
          </button>
        </div>
      </section>
    </div>
  );
}

function materialOptionDetails(option: MaterialSelectOption) {
  const unsNumber = String(option.metadata?.unsNumber ?? "UNS N/A").replace(/^UNS\s+/, "UNS: ");
  const composition = String(option.metadata?.compositionFormula ?? option.metadata?.composition ?? "Composition pending");
  return `${unsNumber} | ${composition}`;
}

function MaterialOptionButton({
  id,
  isActive,
  isSelected,
  option,
  onHighlight,
  onSelect,
}: {
  id: string;
  isActive: boolean;
  isSelected: boolean;
  option: MaterialSelectOption;
  onHighlight: (value: string) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      aria-selected={isSelected}
      className={[
        "w-full border-none px-4 py-3 text-left transition-colors duration-100",
        isSelected
          ? "bg-[#e8f2ff] text-[#020617]"
          : isActive
            ? "bg-[#f5f8fb] text-[#020617]"
            : "bg-white text-[#020617] hover:bg-[#f5f8fb]",
      ].join(" ")}
      id={id}
      onClick={() => onSelect(option.value)}
      onFocus={() => onHighlight(option.value)}
      onMouseEnter={() => onHighlight(option.value)}
      role="option"
      type="button"
    >
      <span className="block text-[14px] font-semibold leading-5">{option.label}</span>
      <span className="mt-1 block text-[12px] font-medium leading-4 text-[#64748b]">
        {materialOptionDetails(option)}
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
          data-testid="quality-documentation-trigger"
          className={[
            "flex min-h-[54px] w-full cursor-pointer items-center justify-between gap-3 rounded-[14px] border bg-white px-3.5 py-2.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-150",
            isOpen
              ? "border-[#1d73ff] shadow-[0_0_0_5px_rgba(191,219,254,0.78),0_2px_8px_rgba(15,23,42,0.08)]"
              : "border-[#dce4ee] hover:border-[#b4c5d8] focus:border-[#1d73ff] focus:shadow-[0_0_0_5px_rgba(191,219,254,0.65)]",
          ].join(" ")}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {selectedValues.length > 0 ? (
              selectedValues.map((optionValue) => {
                const label = optionLabel(qualityDocumentationOptions, optionValue);

                return (
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-[#f8f8f8] py-1.5 pl-3 pr-2 text-[15px] font-medium leading-5 text-[#27272a] shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    key={optionValue}
                    onClick={(event) => event.stopPropagation()}
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
                      <span>{option.label}</span>
                      {qualityDocumentationRequiresDrawing(option.value) ? (
                        <span className="ml-2 whitespace-nowrap text-[12px] font-medium text-slate-500">
                          (drawing required)
                        </span>
                      ) : null}
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
  const selectedSurfaceFinishMetadata = surfaceFinishMetadataFor(
    lineItem.surfaceFinish,
  );
  const selectedSurfaceFinishColors = surfaceFinishColorOptionsFor(
    lineItem.surfaceFinish,
  );
  const selectedSurfaceFinishColor = surfaceFinishColorOption(
    lineItem.surfaceFinish,
    lineItem.surfaceFinishColor,
  );
  const [isToleranceModalOpen, setIsToleranceModalOpen] = useState(false);
  const [isRemoveConfirmationOpen, setIsRemoveConfirmationOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <button
          aria-expanded={!isCollapsed}
          aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${lineItemHeader}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-800"
          onClick={() => onToggleCollapsed(lineItem.id)}
          type="button"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
            />
          </span>
          <span className="min-w-0 break-all">{lineItemHeader}</span>
        </button>
        {canRemove ? (
          <button
            aria-label={`Delete ${lineItemHeader}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e2e2e2] bg-white text-[#8a3f3f] transition hover:border-[#d7b4b4] hover:bg-[#fff6f6] hover:text-[#7c2424]"
            onClick={() => setIsRemoveConfirmationOpen(true)}
            title="Delete line item"
            type="button"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
          </button>
        ) : null}
        {isRemoveConfirmationOpen ? (
          <RemoveLineItemConfirmationModal
            index={index}
            lineItemName={lineItemDisplayName}
            onCancel={() => setIsRemoveConfirmationOpen(false)}
            onConfirm={() => {
              setIsRemoveConfirmationOpen(false);
              onRemove(lineItem.id);
            }}
          />
        ) : null}
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
              <span>Replace Part</span>
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
                {selectedSurfaceFinishMetadata?.cosmeticRequirement ? (
                  <CustomSelect
                    label="Select cosmetic requirement"
                    value={lineItem.surfaceFinishCosmeticRequirement}
                    onChange={(value) =>
                      updateLineItem(
                        lineItem.id,
                        "surfaceFinishCosmeticRequirement",
                        value,
                      )
                    }
                    options={surfaceFinishCosmeticRequirementOptions}
                    required
                  />
                ) : null}
                {selectedSurfaceFinishColors.length ? (
                  <fieldset className="grid gap-3">
                    <legend className="text-sm font-medium text-slate-700">
                      Select color
                      <span className="ml-1 text-[#d4183d]">*</span>
                    </legend>
                    <div className="overflow-hidden rounded-[14px] border border-[#dce4ee] bg-white">
                      {selectedSurfaceFinishColors.map((color) => {
                        const isSelected = lineItem.surfaceFinishColor === color.value;
                        const isChecker = color.swatch === "checker";

                        return (
                          <label
                            className={[
                              "flex min-h-[54px] cursor-pointer items-center gap-4 border-b border-slate-200 px-5 py-3 text-[15px] font-semibold text-slate-950 first:rounded-t-[13px] last:rounded-b-[13px] last:border-b-0",
                              isSelected ? "bg-slate-50 shadow-[inset_0_0_0_1px_#020617]" : "",
                            ].join(" ")}
                            key={color.value}
                          >
                            <input
                              checked={isSelected}
                              className="sr-only"
                              name={`${lineItem.id}-surface-finish-color`}
                              onChange={() =>
                                updateLineItem(
                                  lineItem.id,
                                  "surfaceFinishColor",
                                  color.value,
                                )
                              }
                              type="radio"
                              value={color.value}
                            />
                            {color.swatch ? (
                              <span
                                aria-hidden="true"
                                className="h-6 w-6 rounded-full border border-slate-200"
                                style={
                                  isChecker
                                    ? {
                                        backgroundColor: "#ffffff",
                                        backgroundImage:
                                          "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
                                        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                                        backgroundSize: "16px 16px",
                                      }
                                    : { backgroundColor: color.swatch }
                                }
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="h-6 w-6 rounded-full border border-dashed border-slate-300"
                              />
                            )}
                            <span>{color.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    {selectedSurfaceFinishColor?.mode === "custom" ? (
                      <label className="grid gap-2 text-sm font-medium text-slate-700">
                        <span>{selectedSurfaceFinishColor.label} color code</span>
                        <input
                          className={inputClass}
                          placeholder={selectedSurfaceFinishColor.placeholder}
                          value={lineItem.surfaceFinishCustomColor}
                          onChange={(event) =>
                            updateLineItem(
                              lineItem.id,
                              "surfaceFinishCustomColor",
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    ) : null}
                  </fieldset>
                ) : null}
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  <span>Part Markings</span>
                  <span className="flex items-center gap-2">
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
                    <span className="font-normal text-slate-600">
                      Yes (drawing required)
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Tolerances
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Tolerances follow{" "}
                <button
                  className="font-semibold text-[#006ce5] underline underline-offset-2 transition hover:text-[#004eb5]"
                  onClick={() => setIsToleranceModalOpen(true)}
                  type="button"
                >
                  ISO 2768-1 standards
                </button>
              </p>
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
              {isToleranceModalOpen ? (
                <Iso2768ToleranceModal onClose={() => setIsToleranceModalOpen(false)} />
              ) : null}
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
  resumeRequests = [],
}: RequestFormProps = {}) {
  const router = useRouter();
  const [localResumeRequests] = useState<LatticeRequest[]>(
    readLocalIncompleteResumeRequests,
  );
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
  const [isQuoteNameCustomized, setIsQuoteNameCustomized] = useState(
    Boolean(resolvedInitialState?.projectName?.trim()),
  );
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
  const resumeChoices = useMemo(() => {
    const localIds = new Set(localResumeRequests.map((request) => request.id));

    return [
      ...localResumeRequests,
      ...resumeRequests.filter((request) => !localIds.has(request.id)),
    ]
      .filter((request) => request.status === "DRAFT")
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();

        return (
          (Number.isNaN(bTime) ? 0 : bTime) -
          (Number.isNaN(aTime) ? 0 : aTime)
        );
      })
      .slice(0, 5);
  }, [localResumeRequests, resumeRequests]);
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
  const shouldShowResumePanel =
    !hasCadFile &&
    !resolvedInitialState &&
    !prefillNotice &&
    resumeChoices.length > 0;

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
          lineItemHasSurfaceFinishDetails(lineItem) &&
          Number(lineItem.quantity) > 0 &&
          lineItem.fileName.trim() &&
          lineItemHasCadBytes(lineItem) &&
          lineItemHasDrawingBytes(lineItem) &&
          lineItemHasRequiredDrawing(lineItem),
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
    setIsQuoteNameCustomized(true);
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
    const currentLineItem = lineItems.find((lineItem) => lineItem.id === id);
    const nextLineItems = lineItems.map((lineItem) =>
      lineItem.id === id && field === "surfaceFinish" && typeof value === "string"
        ? {
            ...lineItem,
            surfaceFinish: value,
            surfaceFinishColor: defaultSurfaceFinishColor(value),
            surfaceFinishCosmeticRequirement:
              defaultSurfaceFinishCosmeticRequirement(value),
            surfaceFinishCustomColor: "",
          }
        : lineItem.id === id
          ? { ...lineItem, [field]: value }
          : lineItem,
    );
    const nextLineItem = nextLineItems.find((lineItem) => lineItem.id === id);

    if (
      field === "qualityDocumentation" &&
      currentLineItem &&
      nextLineItem &&
      requiredQualityDocumentationLabels(nextLineItem).some(
        (label) => !requiredQualityDocumentationLabels(currentLineItem).includes(label),
      ) &&
      !currentLineItem.technicalDrawingName.trim()
    ) {
      setError(requiredDrawingErrorMessage(nextLineItem));
      setDrawingReviewLineItemId(id);
    }

    if (!lineItemsHaveMissingRequiredDrawing(nextLineItems)) {
      setError((currentError) =>
        isRequiredDrawingError(currentError) ? null : currentError,
      );
    }

    setLineItems(nextLineItems);
  }

  function updateLineItemFlag(id: string, field: LineItemFlag, value: boolean) {
    const currentLineItem = lineItems.find((lineItem) => lineItem.id === id);
    const nextLineItems = lineItems.map((lineItem) =>
      lineItem.id === id ? { ...lineItem, [field]: value } : lineItem,
    );

    if (
      value &&
      currentLineItem &&
      !currentLineItem.technicalDrawingName.trim()
    ) {
      setError(requiredDrawingErrorMessage({ ...currentLineItem, [field]: true }));
      setDrawingReviewLineItemId(id);
    }

    if (!lineItemsHaveMissingRequiredDrawing(nextLineItems)) {
      setError((currentError) =>
        isRequiredDrawingError(currentError) ? null : currentError,
      );
    }

    setLineItems(nextLineItems);
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
      surfaceFinishColor: lineItem.surfaceFinishColor,
      surfaceFinishCosmeticRequirement: lineItem.surfaceFinishCosmeticRequirement,
      surfaceFinishCustomColor: lineItem.surfaceFinishCustomColor,
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
      surfaceFinish: primaryLineItem.surfaceFinish,
      surfaceFinishColor: primaryLineItem.surfaceFinishColor,
      surfaceFinishCosmeticRequirement:
        primaryLineItem.surfaceFinishCosmeticRequirement,
      surfaceFinishCustomColor: primaryLineItem.surfaceFinishCustomColor,
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
        surfaceFinish: surfaceFinishDisplayValue(lineItem),
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
          cadPreviewUrn: cadPreviewUrnForLineItem(lineItem),
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
      guestAccessTokenExpiresAt: null,
      guestAccessTokenHash: "",
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
        nextMilestone: "Supplier acknowledgment",
        nextMilestoneDate: "",
        responsibleParty: "Supplier",
        documents: [],
        updates: [],
      },
      supplierQuoteFiles: [],
      customerPurchaseOrderAttachment: null,
      supplierQuotes: [],
      customerQuotes: [],
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
      revisionChangeLog: [],
      revisionNumber: 1,
      revisionOfRequestId: null,
      requestOrigin: "ACCOUNT",
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
  }, [activeLocalDraftId, configuredLineItems, createdRequest, hasCadFile, projectForm, resolvedInitialState]);

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

  function applyCadFileToLineItem(
    id: string,
    file: File | null,
    updateQuoteName = true,
  ) {
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

    if (file?.name && updateQuoteName) {
      const nextFileNames = lineItems
        .map((lineItem) => (lineItem.id === id ? file.name : lineItem.fileName))
        .filter((fileName) => fileName.trim());

      setProjectForm((current) => ({
        ...current,
        projectName:
          isQuoteNameCustomized
            ? current.projectName
            : quoteNameFromFileNames(nextFileNames),
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

  function persistCadFileAndPreview(id: string, file: File) {
    void persistCadDraftUpload(id, file);
    void startCadPreview(id, file);
  }

  function handleCadFileSelected(
    id: string,
    file: File | null,
    updateQuoteName = true,
  ) {
    applyCadFileToLineItem(id, file, updateQuoteName);

    if (!file) {
      return;
    }

    persistCadFileAndPreview(id, file);
  }

  function appendCadLineItem(file: File, updateQuoteName = true) {
    ensureLocalDraftId();
    const id = makeLineItemId();
    const nextFileNames = [
      ...lineItems
        .map((lineItem) => lineItem.fileName)
        .filter((fileName) => fileName.trim()),
      file.name,
    ];

    setLineItems((current) => [...current, makeCadLineItem(id, file)]);
    if (updateQuoteName && !isQuoteNameCustomized) {
      setProjectForm((current) => ({
        ...current,
        projectName: quoteNameFromFileNames(nextFileNames),
      }));
    }
    persistCadFileAndPreview(id, file);
  }

  function handleCadFilesSelected(id: string, files: File[]) {
    const [firstFile, ...additionalFiles] = files;

    if (!firstFile) {
      return;
    }

    if (!isQuoteNameCustomized) {
      setProjectForm((current) => ({
        ...current,
        projectName: quoteNameFromFileNames(files.map((file) => file.name)),
      }));
    }
    handleCadFileSelected(id, firstFile, files.length === 1);
    additionalFiles.forEach((file) => appendCadLineItem(file, false));
  }

  function handleNewCadFilesSelected(files: File[]) {
    files.forEach((file) => appendCadLineItem(file));
  }

  function handleTechnicalDrawingSelected(id: string, file: File | null) {
    if (file) {
      ensureLocalDraftId();
      setError(null);
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
      setDrawingReviewLineItemId(id);
    }
  }

  function removeTechnicalDrawing(id: string) {
    handleTechnicalDrawingSelected(id, null);
  }

  function removeLineItem(id: string) {
    const remainingConfiguredLineItems = lineItems.filter(
      (lineItem) => lineItem.id !== id && lineItem.fileName.trim(),
    );

    setLineItems((current) => {
      const remainingLineItems = current.filter((lineItem) => lineItem.id !== id);
      return remainingLineItems.length
        ? remainingLineItems
        : [makeLineItemInitialState("line-1")];
    });

    if (!isQuoteNameCustomized) {
      setProjectForm((current) => ({
        ...current,
        projectName: quoteNameFromFileNames(
          remainingConfiguredLineItems.map((lineItem) => lineItem.fileName),
        ),
      }));
    }

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
    const requiredQualityLabels = requiredQualityDocumentationLabels(lineItem);
    const generatedNotes = [
      lineItem.partMarkings ? "Part markings requested; drawing required." : null,
      lineItem.tightLinearTolerance ? "Linear tolerance tighter than general tolerance requested; drawing required." : null,
      lineItem.threads ? "Threads requested; drawing required." : null,
      lineItem.engineeringFits ? "Engineering fits requested; drawing required." : null,
      lineItem.sharpInternalCorners ? "Sharp internal corners requested; drawing required." : null,
      requiredQualityLabels.length
        ? `${requiredQualityLabels.join(", ")} requested; drawing required.`
        : null,
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

    const missingRequiredDrawing = configuredLineItems.find(
      (lineItem) =>
        lineItemRequiresDrawing(lineItem) &&
        !lineItem.technicalDrawingName.trim(),
    );

    if (missingRequiredDrawing) {
      setError(requiredDrawingErrorMessage(missingRequiredDrawing));
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
          surfaceFinish: surfaceFinishDisplayValue(lineItem),
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
          cadPreviewUrn: cadPreviewUrnForLineItem(lineItem),
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
      router.push(`/quotes/${payload.request.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to submit request",
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="px-1 pt-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-[#171717] sm:text-[40px]">
                Request a quote
              </h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#656b74]">
                Upload your CAD files to start a saved RFQ draft. Configure the
                details, review the package, and submit when it is ready.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-[#656b74] lg:pt-2">
              <CheckCircle2 aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span>Drafts autosave as you work</span>
            </div>
          </div>
          {prefillNotice ? (
            <p className="mt-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium leading-6 text-blue-800">
              {prefillNotice}
            </p>
          ) : null}
          <RequestQuoteProgress currentStep={hasCadFile ? 2 : 1} />
        </header>

        <section className="space-y-6 rounded-md border border-[#e1e3e6] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
          {activeDrawingLineItem ? (
            <TechnicalDrawingReviewModal
              lineItem={activeDrawingLineItem}
              drawingPreviewUrl={drawingPreviewUrl}
              onClose={() => setDrawingReviewLineItemId(null)}
              onDrawingSelected={handleTechnicalDrawingSelected}
              onRemove={() => removeTechnicalDrawing(activeDrawingLineItem.id)}
              updateLineItem={updateLineItem}
              updateLineItemFlag={updateLineItemFlag}
            />
          ) : null}

          {hasCadFile ? (
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
                        {projectForm.projectName.trim()}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {!hasCadFile ? (
            <UploadCadDropZone
              label="Choose CAD file"
              onFilesSelected={(files) =>
                handleCadFilesSelected(lineItems[0].id, files)
              }
            />
          ) : null}

          {configuredLineItems.map((lineItem, index) => (
            <LineItemConfigurationCard
              key={lineItem.id}
              index={index}
              lineItem={lineItem}
              isCollapsed={collapsedLineItemIds.has(lineItem.id)}
              canRemove
              updateLineItem={updateLineItem}
              updateLineItemFlag={updateLineItemFlag}
              onToggleCollapsed={toggleLineItemCollapsed}
              onRemove={removeLineItem}
              onCadStatus={updateCadPreview}
              onCadFileSelected={(id, file) =>
                handleCadFileSelected(id, file)
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
              onFilesSelected={handleNewCadFilesSelected}
            />
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

        {shouldShowResumePanel ? (
          <ResumeQuotePanel requests={resumeChoices} />
        ) : null}
      </form>

    </div>
  );
}
