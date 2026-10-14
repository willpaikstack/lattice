"use client";
import { normalizePersistedDraft } from "@/lib/persisted-draft-validation";
import { purgeLegacyRfqValues } from "@/lib/purge-legacy-rfq-values";
import { customerDraftStorageKey, useCustomerWorkspaceScope } from "./customer-workspace-scope";
import { RequestFormHeading } from "./request-form-loading";
import { WorkspaceContentReveal } from "./workspace-content-reveal";
import { cadAccept, cadFileTypes, cadUploadError, drawingAccept, isCadFileName, manufacturingUploadError } from "@/lib/cad-upload-policy";
import { canonicalMaterialValue, selectableRfqMaterials, searchRfqMaterials } from "@/lib/rfq-material-search";
import { draftInitialState } from "@/lib/request-form-prefill";
import { compatibleFinishOptions, finishCompatibilityError, intakeUploadError, offeredProcessOptions, processLabel, readIntakeDeclaration, restrictionPolicyVersion, type CadMetadata, type ManufacturingDetails, type PartFileHistory } from "@/lib/rfq-manufacturing";
import { useDialogFocus } from "./use-dialog-focus";
import { PreparedCadModelHost, PreparedCadViewerContext } from "./prepared-cad-viewer";
import { createPortal } from "react-dom";
import { SearchFirstMaterialSelect } from "./search-first-material-select";
import { CadMetadataSummary } from "./cad-metadata-summary";
import { TargetDatePicker } from "./target-date-picker";
import { ExportRestrictionsDialog } from "./export-restrictions-dialog";
import { type UploadDeclaration, uploadRequestDraftFile } from "@/lib/request-draft-upload";
import { refreshCadPreviewState } from "@/lib/cad-preview-status";
import { preloadAutodeskViewerAssets } from "./autodesk-model-viewer";

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
import Link from "next/link";
import {
  Archive,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileUp,
  FlaskConical,
  Factory,
  Info,
  Paperclip,
  PencilLine,
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
  restrictionStatus: string;
  restrictionPolicyVersion: string;
  endUse: string;
  endUseNotes: string;
  projectName: string;
  requiresQualityApproval: boolean;
};

type LineItemState = {
  process: string;
  customerPartNumber: string;
  cadRevision: string;
  drawingRevision: string;
  targetShipDate: string;
  fileHistory: PartFileHistory[];
  cadMetadata?: CadMetadata;
  id: string;
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

function cleanIntakeState(state: RequestFormInitialState | undefined): RequestFormInitialState | undefined {
  if (!state) return state;
  const clean = { ...state } as Record<string, unknown>;
  for (const key of ["requesterName", "customerPo", "dueDate", "partName", "process", "buyerCompany"]) delete clean[key];
  if (Array.isArray(clean.lineItems)) clean.lineItems = clean.lineItems.map(item => { const part = { ...item }; delete part.partName; return part; });
  return clean as RequestFormInitialState;
}

type LegacyInitialState = Partial<ProjectFormState & InitialLineItemState> & {
  lineItems?: InitialLineItemState[];
};

export type RequestFormInitialState = LegacyInitialState;

type RequestFormProps = {
  initialState?: RequestFormInitialState;
  localDraftId?: string;
  prefillNotice?: string;
  resumeRequests?: LatticeRequest[];
};


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

const makeProjectInitialState = (): ProjectFormState => ({
  restrictionStatus: "unconfirmed",
  restrictionPolicyVersion: "",
  endUse: "",
  endUseNotes: "",
  requiresQualityApproval: false,
  projectName: "",
});

const makeLineItemInitialState = (id: string): LineItemState => ({
  process: "cnc_milling",
  customerPartNumber: "",
  cadRevision: "",
  drawingRevision: "",
  targetShipDate: "",
  fileHistory: [],
  id,
  quantity: "1",
  material: "",
  generalTolerance: "iso_2768_medium_m",
  surfaceFinish: "as_machined_ra_3_2",
  surfaceFinishColor: defaultSurfaceFinishColor("as_machined_ra_3_2"),
  surfaceFinishCosmeticRequirement: defaultSurfaceFinishCosmeticRequirement("as_machined_ra_3_2"),
  surfaceFinishCustomColor: "",
  qualityDocumentation: normalizedQualityDocumentation(),
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
    <label className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700">
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

// Visual layout trial: set false to restore parts inside the quote-details card.
const separatePartContainers = true;
const requestCardClass = "rounded-md border border-[#e1e3e6] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5";

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

function normalizedQualityDocumentation(values?: string[]) {
  const supportedValues = new Set(qualityDocumentationOptions.map((option) => option.value));
  return Array.from(
    new Set([
      "standard_inspection",
      ...(values ?? []).filter((value) => supportedValues.has(value)),
    ]),
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

type ConfigurationField = "cad" | "material" | "quantity" | "finish" | "tolerance" | "drawing" | "process";

function configurationFieldId(lineId: string, field: ConfigurationField) {
  return `configure-${lineId}-${field}`;
}

function missingLineItemFields(item: LineItemState): Array<{ field: ConfigurationField; label: string }> {
  const missing: Array<{ field: ConfigurationField; label: string }> = [];
  if (!item.fileName.trim() || !lineItemHasCadBytes(item)) missing.push({ field: "cad", label: "Upload the CAD file" });
  if (!offeredProcessOptions.some(option => option.value === item.process)) missing.push({ field: "process", label: "Select a supported process" });
  if (item.material && finishCompatibilityError(item.material, item.surfaceFinish, item.process)) missing.push({ field: "finish", label: "Choose a compatible surface finish" });
  if (!item.material.trim()) missing.push({ field: "material", label: "Select a material" });
  if (!(Number(item.quantity) > 0)) missing.push({ field: "quantity", label: "Enter a quantity greater than zero" });
  if (!item.generalTolerance.trim()) missing.push({ field: "tolerance", label: "Select general tolerances" });
  if (!item.surfaceFinish.trim() || !lineItemHasSurfaceFinishDetails(item)) missing.push({ field: "finish", label: "Complete the surface finish details" });
  if (!lineItemHasDrawingBytes(item) || !lineItemHasRequiredDrawing(item)) missing.push({ field: "drawing", label: lineItemRequiresDrawing(item) ? "Upload the required technical drawing" : "Upload the selected drawing again" });
  return missing;
}

function manufacturingDetailsFor(item: LineItemState): ManufacturingDetails {
  return { process: item.process, customerPartNumber: item.customerPartNumber, cadRevision: item.cadRevision,
    drawingRevision: item.drawingRevision, targetShipDate: item.targetShipDate, materialKey: item.material, finishKey: item.surfaceFinish,
    fileHistory: [], ...(item.cadMetadata ? { cadMetadata: item.cadMetadata } : {}) };
}

function intakeDeclarationFor(project: ProjectFormState) {
  return readIntakeDeclaration({ restrictionStatus: project.restrictionStatus, policyVersion: project.restrictionPolicyVersion,
    endUse: project.endUse, endUseNotes: project.endUseNotes });
}

function formCompletionPercent(project: ProjectFormState, items: LineItemState[]) {
  if (!items.length || !items.some((item) => item.fileName.trim())) return 0;
  const checks = [Boolean(project.projectName.trim())];
  for (const item of items) {
    checks.push(
      Boolean(item.fileName.trim()) && lineItemHasCadBytes(item),
      Boolean(item.material.trim()),
      offeredProcessOptions.some(option => option.value === item.process),
      !finishCompatibilityError(item.material, item.surfaceFinish, item.process),
      Boolean(item.generalTolerance.trim()),
      Boolean(item.surfaceFinish.trim()) && lineItemHasSurfaceFinishDetails(item),
      Number(item.quantity) > 0,
    );
    if (lineItemRequiresDrawing(item) || item.technicalDrawingName.trim()) {
      checks.push(lineItemHasDrawingBytes(item) && lineItemHasRequiredDrawing(item));
    }
  }
  const complete = checks.filter(Boolean).length;
  // Only a genuinely ready package should display 100%, even for many parts.
  return complete === checks.length ? 100 : Math.min(99, Math.round(complete / checks.length * 100));
}

export function draftCompletionPercent(request: LatticeRequest, savedState?: RequestFormInitialState) {
  const cadFiles = request.files.filter((file) => isCadFileName(file.name));
  const state = savedState ?? {
    ...draftInitialState(request),
    projectName: request.title,
    lineItems: request.lineItems.map((line, index) => {
      const restored = draftInitialState({ ...request, lineItems: [line], files: cadFiles[index] ? [cadFiles[index], ...request.files.filter((file) => !isCadFileName(file.name))] : [] });
      return {
        ...restored,
        material: line.material?.trim() ? restored.material : "",
        generalTolerance: line.generalTolerance?.trim() ? restored.generalTolerance : "",
        surfaceFinish: line.surfaceFinish?.trim() ? restored.surfaceFinish : "",
        quantity: String(line.quantity),
      };
    }),
  };
  const items = state.lineItems?.length
    ? state.lineItems.map((item, index) => lineItemFromInitialLineItem(item, `line-${index}`))
    : [lineItemFromInitialState(state)];
  return formCompletionPercent({ ...makeProjectInitialState(), ...state }, items);
}

function requiredDrawingErrorMessage(lineItem: LineItemState) {
  const partLabel =
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
  return isCadFileName(file.name);
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
      const options = selectableRfqMaterials
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

  const remainingOptions = selectableRfqMaterials
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
      ? { ...persistedPreview, status: "processing", progress: "Checking saved model" }
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
    process: initialState?.process ?? "cnc_milling",
    customerPartNumber: initialState?.customerPartNumber ?? "",
    cadRevision: initialState?.cadRevision ?? "",
    drawingRevision: initialState?.drawingRevision ?? "",
    targetShipDate: initialState?.targetShipDate ?? "",
    fileHistory: [],
    cadMetadata: initialState?.cadMetadata,
    quantity: initialState?.quantity ?? "1",
    material: initialState?.material ?? "",
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
    qualityDocumentation: normalizedQualityDocumentation(initialState?.qualityDocumentation),
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

function readIncompleteRfqs(incompleteRfqStorageKey: string | null) {
  if (!incompleteRfqStorageKey || typeof window === "undefined" || !window.localStorage?.getItem) {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(incompleteRfqStorageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed.map(normalizePersistedDraft).filter(Boolean) as unknown as StoredIncompleteRfq[] : [];
  } catch {
    return [];
  }
}

function readLocalIncompleteResumeRequests(incompleteRfqStorageKey: string | null) {
  return readIncompleteRfqs(incompleteRfqStorageKey)
    .map((draft) => draft.request)
    .filter(
      (request): request is LatticeRequest =>
        Boolean(request?.id) && request.status === "DRAFT",
    );
}

function writeIncompleteRfqs(incompleteRfqStorageKey: string | null, drafts: StoredIncompleteRfq[]) {
  if (!incompleteRfqStorageKey || typeof window === "undefined" || !window.localStorage?.setItem) {
    return;
  }

  window.localStorage.setItem(incompleteRfqStorageKey, JSON.stringify(purgeLegacyRfqValues(drafts)));
  window.dispatchEvent(new Event("lattice-drafts-changed"));
}

function removeIncompleteRfq(incompleteRfqStorageKey: string | null, id: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("lattice-draft-removed", { detail: id }));
  writeIncompleteRfqs(incompleteRfqStorageKey, readIncompleteRfqs(incompleteRfqStorageKey).filter((draft) => draft.id !== id));
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
  const dialogRef = useDialogFocus<HTMLDivElement>();
  const drawingType = lineItem.selectedDrawingFile?.type || lineItem.technicalDrawingType;
  const hasDrawing = Boolean(lineItem.technicalDrawingName.trim());
  const canRenderPreview =
    Boolean(drawingPreviewUrl) &&
    (drawingType === "application/pdf" || drawingType.startsWith("image/"));

  function handleDrawingDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    onDrawingSelected(lineItem.id, event.dataTransfer.files[0] ?? null);
  }

  function handleDone() {
    onClose();
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-6"
      ref={dialogRef}
      tabIndex={-1}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleDone();
        }
      }}
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
          onChange={(event) => {
            onFilesSelected(Array.from(event.target.files ?? []).filter(isCadUploadFile));
            event.target.value = "";
          }}
        />
      </label>
    </section>
  );
}

function ArchiveDraftModal({
  error,
  isArchiving,
  onCancel,
  onConfirm,
  reason,
  request,
  setReason,
}: {
  error: string | null;
  isArchiving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  reason: string;
  request: LatticeRequest;
  setReason: (reason: string) => void;
}) {
  return (
    <div
      aria-labelledby="archive-draft-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#171717]/45 px-4 py-6"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg border border-[#dedede] bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e4e4e4] bg-[#fafafa] text-[#555b64]">
            <Archive aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-[#202020]" id="archive-draft-title">
              Archive draft quote?
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-[#656b74]">
              This removes <span className="font-medium text-[#30343a]">{request.title}</span> from your draft requests. You can add a reason for the archive, but it is optional.
            </p>
          </div>
        </div>

        <label className="mt-5 block">
          <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6d737c]">
            Reason for archiving
          </span>
          <textarea
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-[#d8dce2] bg-white px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none transition placeholder:text-[#a0a6af] focus:border-[#171717] focus:ring-2 focus:ring-[#ededed]"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Optional"
            value={reason}
          />
        </label>

        {error ? (
          <p className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#d7d7d7] bg-white px-4 text-[14px] font-semibold text-[#30343a] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isArchiving}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#303030] disabled:cursor-not-allowed disabled:bg-[#cfcfcf]"
            disabled={isArchiving}
            onClick={onConfirm}
            type="button"
          >
            {isArchiving ? "Archiving..." : "Archive quote"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumeQuotePanel({
  onArchived,
  onArchiveDraft,
  requests,
  savedStates,
}: {
  onArchived: (requestId: string) => void;
  onArchiveDraft: (request: LatticeRequest, reason: string) => Promise<void>;
  requests: LatticeRequest[];
  savedStates: Record<string, RequestFormInitialState>;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [archiveRequest, setArchiveRequest] = useState<LatticeRequest | null>(null);
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
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

  function openArchiveModal(request: LatticeRequest) {
    setArchiveRequest(request);
    setArchiveReason("");
    setArchiveError(null);
  }

  function closeArchiveModal() {
    if (isArchiving) {
      return;
    }

    setArchiveRequest(null);
    setArchiveReason("");
    setArchiveError(null);
  }

  async function confirmArchiveDraft() {
    if (!archiveRequest) {
      return;
    }

    setIsArchiving(true);
    setArchiveError(null);

    try {
      await onArchiveDraft(archiveRequest, archiveReason);
      const archivedId = archiveRequest.id;
      setArchiveRequest(null);
      setArchiveReason("");
      onArchived(archivedId);
    } catch (caught) {
      setArchiveError(caught instanceof Error ? caught.message : "Unable to archive this draft.");
    } finally {
      setIsArchiving(false);
    }
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

      <div className="grid grid-cols-[minmax(0,1.6fr)_minmax(180px,0.75fr)_minmax(190px,0.8fr)_88px] gap-5 border-b border-[#eeeeee] bg-[#fafafa] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-lg:hidden">
        <span>RFQ draft</span>
        <span>Last edited</span>
        <span>Completion</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {visibleRequests.map((request) => {
          const primaryLineItem = request.lineItems[0];
          const href = resumeRequestHref(request);
          const completionPercent = draftCompletionPercent(request, savedStates[request.id]);

          return (
            <div
              className="grid gap-5 px-5 py-4 transition hover:bg-[#fbfbfb] lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.75fr)_minmax(190px,0.8fr)_88px] lg:items-center"
              key={request.id}
            >
              <Link
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
                  <p className="mt-1 break-all text-[11px] text-[#8a8f98]">
                    {request.customerQuotes.at(-1)?.quoteNumber ?? request.id}
                  </p>
                  <h3 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">
                    {request.title}
                  </h3>
                  <p className="mt-1 truncate text-[13px] text-[#69707a]">
                    {request.files.length} {request.files.length === 1 ? "file" : "files"}
                    {primaryLineItem?.partName ? ` - ${primaryLineItem.partName}` : ""}
                  </p>
                </div>
              </Link>

              <Link
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
              </Link>

              <Link
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
                <span aria-label={`Draft completion for ${request.title}`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={completionPercent} role="progressbar" className="mt-2 block h-1.5 max-w-[190px] overflow-hidden rounded-full bg-[#e6e8eb]">
                  <span
                    className="block h-full rounded-full bg-[#171717]"
                    style={{ width: `${completionPercent}%` }}
                  />
                </span>
              </Link>

              <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
                <button
                  aria-label={`Archive draft for ${request.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent bg-white text-[#8a8f98] transition hover:border-[#e2e2e2] hover:bg-[#f7f8fa] hover:text-[#30343a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
                  onClick={() => openArchiveModal(request)}
                  title="Archive draft"
                  type="button"
                >
                  <Archive aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <Link
                  aria-label={`Continue draft for ${request.title}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e2e2e2] bg-white text-[#30343a] transition hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
                  href={href}
                  title="Continue draft"
                >
                  <PencilLine aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {archiveRequest ? (
        <ArchiveDraftModal
          error={archiveError}
          isArchiving={isArchiving}
          onCancel={closeArchiveModal}
          onConfirm={confirmArchiveDraft}
          reason={archiveReason}
          request={archiveRequest}
          setReason={setArchiveReason}
        />
      ) : null}

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

function RequestQuoteProgress({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const steps = ["Upload", "Configure", "Submit"];

  return (
    <nav aria-label="Request quote progress" className="mt-7 overflow-x-auto pb-1">
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = stepNumber === currentStep;
          const isComplete = stepNumber < currentStep;

          return (
            <li className="flex min-w-0 items-center" key={step}>
              <div
                aria-current={isCurrent ? "step" : undefined}
                className="flex shrink-0 items-center gap-1.5 sm:gap-3"
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold sm:h-9 sm:w-9 sm:text-[14px]",
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
                    "whitespace-nowrap text-[12px] sm:text-[14px]",
                    isCurrent || isComplete
                      ? "font-semibold text-[#202020]"
                      : "font-medium text-[#70757d]",
                  ].join(" ")}
                >
                  {step}
                </span>
              </div>
              {stepNumber < steps.length ? (
                <span aria-hidden="true" className="mx-3 hidden h-px flex-1 bg-[#dfe1e4] sm:block" />
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

// Reversible concept-A trial: false restores the original grouped material picker.
const useSearchFirstMaterialPicker = false;
function MaterialSelect(props: { value: string; onChange: (value: string) => void }) {
  return useSearchFirstMaterialPicker
    ? <SearchFirstMaterialSelect {...props} options={materialSelectOptions} />
    : <LegacyMaterialSelect {...props} />;
}

function LegacyMaterialSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const resolvedValue = canonicalMaterialValue(value);
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOptionValue, setActiveOptionValue] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const selected = materialSelectOptions.find((option) => option.value === resolvedValue);
    return new Set(selected ? [selected.category] : [materialSelectGroups[0]?.name ?? ""]);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedOption = materialSelectOptions.find((option) => option.value === resolvedValue);
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

    return searchRfqMaterials(materialSelectOptions, query);
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
      nextVisibleOptions.find((option) => option.value === resolvedValue)?.value ??
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
        : nextVisibleOptions.find((option) => option.value === resolvedValue)?.value ??
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
      nextVisibleOptions.find((option) => option.value === resolvedValue)?.value ??
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
    <div className="grid min-w-0 w-full grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700" ref={containerRef}>
      <span id={labelId}>
        Material<span className="ml-1 text-[#d4183d]">*</span>
      </span>
      <select
        aria-label="Material"
        className="sr-only"
        tabIndex={-1}
        value={resolvedValue}
        onChange={(event) => onChange(event.target.value)}
      >
        <option disabled value="">Select a material</option>
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
                        isSelected={option.value === resolvedValue}
                        key={option.value}
                        option={option}
                        onHighlight={setActiveOptionValue}
                        onSelect={selectMaterial}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4 text-sm font-medium text-[#64748b]">
                    No materials found - email <a href="mailto:support@latticeos.co" className="underline underline-offset-2">support@latticeos.co</a> for procurement support
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
                                      isSelected={option.value === resolvedValue}
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
  const dialogRef = useDialogFocus<HTMLElement>();
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
        ref={dialogRef}
        tabIndex={-1}
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
  const dialogRef = useDialogFocus<HTMLElement>();
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={event => { if (event.target === event.currentTarget) onCancel(); }}>
      <section ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId}
        aria-describedby={descriptionId} tabIndex={-1}
        onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onCancel(); } }}
        className="max-h-[calc(100dvh-32px)] w-full max-w-sm overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Trash2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <h2 id={titleId} className="mt-4 text-xl font-semibold tracking-tight text-[#202020]">Remove this part?</h2>
        <div id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">
          <p>This part and its configuration will be removed from the quote.</p>
          <p className="mt-2 break-words">{lineItemName} · Line item {index + 1}</p>
        </div>
        <footer className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onCancel}
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-[#202020] hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={onConfirm}
            className="min-h-11 rounded-md bg-[#171717] px-3 text-sm font-semibold text-white hover:bg-[#2b2b2b]">Remove part</button>
        </footer>
      </section>
    </div>, document.body,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const filteredOptions = useMemo(() => qualityDocumentationOptions.filter(option => `${option.label} ${option.value}`.toLowerCase().includes(searchQuery.trim().toLowerCase())), [searchQuery]);
  function closeMenu() {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(0);
  }
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedValues = value;
  const selectedLabels = selectedValues.map((optionValue) =>
    optionLabel(qualityDocumentationOptions, optionValue),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleClickOutside(event: Event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    }

    // Capture dismissal before other controls can stop event propagation.
    document.addEventListener("pointerdown", handleClickOutside, true);
    document.addEventListener("click", handleClickOutside, true);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true);
      document.removeEventListener("click", handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const option = filteredOptions[highlightedIndex];
    if (option) document.getElementById(`${labelId}-option-${option.value}`)?.scrollIntoView({ block: "nearest" });
  }, [isOpen, highlightedIndex, filteredOptions, labelId]);

  useEffect(() => { if (isOpen) searchRef.current?.focus(); }, [isOpen]);

  function toggleOption(optionValue: string) {
    if (optionValue === "standard_inspection") {
      return;
    }

    const isSelected = selectedValues.includes(optionValue);

    const nextValues = isSelected
      ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
      : [...selectedValues, optionValue];

    onChange(nextValues);
  }

  return (
    <div className="grid min-w-0 w-full grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700" ref={containerRef}>
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
          onClick={() => { setIsOpen(true); searchRef.current?.focus(); }}
        >
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {selectedValues.length > 0 ? (
              selectedValues.map((optionValue) => {
                const label = optionLabel(qualityDocumentationOptions, optionValue);
                const isRequired = optionValue === "standard_inspection";

                return (
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-[#f8f8f8] py-1.5 pl-3 pr-2 text-[15px] font-medium leading-5 text-[#27272a] shadow-[0_1px_1px_rgba(15,23,42,0.04)]"
                    key={optionValue}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="min-w-0 truncate">{label}</span>
                    {isRequired ? null : (
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
                    )}
                  </span>
                );
              })
            ) : (
              <span className="px-1 py-1.5 text-[15px] font-medium leading-5 text-slate-400">
                Select quality documents
              </span>
            )}
            <input
              ref={searchRef}
              role="combobox"
              aria-label="Search quality documentation"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `${labelId}-menu` : undefined}
              aria-activedescendant={isOpen && filteredOptions[highlightedIndex] ? `${labelId}-option-${filteredOptions[highlightedIndex].value}` : undefined}
              className={isOpen ? "min-w-24 flex-1 bg-transparent py-1.5 text-sm font-normal text-slate-950 outline-none" : "sr-only"}
              tabIndex={isOpen ? 0 : -1}
              aria-hidden={!isOpen}
              value={searchQuery}
              onClick={event => { event.stopPropagation(); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              onChange={event => { setSearchQuery(event.target.value); setHighlightedIndex(0); setIsOpen(true); }}
              onKeyDown={event => {
                if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeMenu(); dropdownRef.current?.focus(); }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault(); setIsOpen(true);
                  setHighlightedIndex(current => filteredOptions.length ? (current + (event.key === "ArrowDown" ? 1 : -1) + filteredOptions.length) % filteredOptions.length : 0);
                }
                if (event.key === "Enter") { event.preventDefault(); if (isOpen && filteredOptions[highlightedIndex]) toggleOption(filteredOptions[highlightedIndex].value); else setIsOpen(true); }
                if (event.key === "Tab") closeMenu();
              }}
            />
          </span>
          <button
            ref={dropdownRef}
            aria-controls={isOpen ? `${labelId}-menu` : undefined}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label="Quality documentation dropdown"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#a1a1aa] transition hover:bg-slate-100 hover:text-[#020617]"
            onClick={(event) => {
              event.stopPropagation();
              if (isOpen) closeMenu(); else { setIsOpen(true); searchRef.current?.focus(); }
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
              {filteredOptions.map((option, index) => {
                const isSelected = selectedValues.includes(option.value);
                const isRequired = option.value === "standard_inspection";

                return (
                  <button
                    id={`${labelId}-option-${option.value}`}
                    aria-selected={isSelected}
                    aria-disabled={isRequired ? "true" : undefined}
                    className={[
                      "flex w-full items-center gap-3 border-none px-5 py-3 text-left transition-colors duration-100",
                      isSelected
                        ? "bg-[#e8f2ff] text-[#020617]"
                        : highlightedIndex === index ? "bg-[#f5f8fb] text-[#020617]" : "bg-white text-[#020617] hover:bg-[#f5f8fb]",
                    ].join(" ")}
                    key={option.value}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => { toggleOption(option.value); searchRef.current?.focus(); }}
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
                      {isRequired ? (
                        <span className="ml-2 whitespace-nowrap text-[12px] font-medium text-slate-500">
                          (included)
                        </span>
                      ) : option.value === "custom_inspection" ? (
                        <span className="ml-2 text-[12px] font-medium text-slate-500">
                          (add details to manufacturing notes section)
                        </span>
                      ) : qualityDocumentationRequiresDrawing(option.value) ? (
                        <span className="ml-2 whitespace-nowrap text-[12px] font-medium text-slate-500">
                          (drawing required)
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
              {!filteredOptions.length ? <p role="status" className="px-5 py-4 text-sm text-slate-500">No matching documents.</p> : null}
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
  onCadMetadata,
  onCadFileSelected,
  onDrawingSelected,
  onRemoveDrawing,
  onReviewDrawing,
  qualityApprovalControl,
  previewDeclaration,
}: {
  qualityApprovalControl?: React.ReactNode;
  previewDeclaration: { restrictionStatus: string; restrictionPolicyVersion: string };
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
  onCadMetadata: (id: string, metadata: CadMetadata) => void;
  onCadFileSelected: (id: string, file: File | null) => void;
  onDrawingSelected: (id: string, file: File | null) => void;
  onRemoveDrawing: (id: string) => void;
  onReviewDrawing: (id: string) => void;
}) {
  const needsCadUpload = !lineItemHasCadBytes(lineItem);
  const needsDrawingUpload = !lineItemHasDrawingBytes(lineItem);
  const lineItemDisplayName = displayNameFromFile(lineItem.fileName) || "New part";
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
    <section id={`configure-${lineItem.id}-part`} className="scroll-mt-40 overflow-hidden rounded-lg border border-slate-200 bg-white">
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
      <div className={isCollapsed ? "hidden" : "grid min-w-0 grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)]"}>
        <div className="min-w-0 border-b border-slate-200 p-4 sm:p-8 lg:border-b-0 lg:border-r">
          <div className="mx-auto min-w-0 max-w-[520px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  CAD file preview
                </p>
                <CadMetadataSummary metadata={lineItem.cadMetadata} />
              </div>
              <CadUploadPreview
                onReplacementFileSelected={(file) =>
                  onCadFileSelected(lineItem.id, file)
                }
                onStatus={(state) => onCadStatus(lineItem.id, state)}
                onMetadata={(metadata) => onCadMetadata(lineItem.id, metadata)}
                state={lineItem.cadPreview}
                recovery={{ storageKey: lineItem.fileStorageKey ?? "", ...previewDeclaration }}
              />
            </div>

            <div className="mt-5" id={configurationFieldId(lineItem.id, "drawing")}>
              <TechnicalDrawingBucket
                index={index}
                lineItem={lineItem}
                onDrawingSelected={onDrawingSelected}
                onRemoveDrawing={onRemoveDrawing}
                onReviewDrawing={onReviewDrawing}
              />
              {!lineItemHasRequiredDrawing(lineItem) ? <p role="status" className="mt-2 text-xs leading-5 text-amber-800">
                A drawing is required for the selected specifications. Upload one here or remove the drawing-required selections before submitting.
              </p> : null}
              {needsDrawingUpload ? (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm font-medium leading-6 text-amber-900">
                  This is only a saved drawing filename. Upload the drawing
                  again if it should be included in the RFQ package.
                </p>
              ) : null}
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2">
                <h3 className="min-w-0 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Inspections & Certificates
                </h3>
                <Link
                  aria-label="Learn about quality documentation"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  href="/quality-documentation"
                  title="Learn what each quality document entails"
                >
                  <Info aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-3">
                <QualityDocumentationSelect
                  value={lineItem.qualityDocumentation}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "qualityDocumentation", value)
                  }
                />
                {qualityApprovalControl ? <div className="mt-4">{qualityApprovalControl}</div> : null}
                {requiredQualityDocumentationLabels(lineItem).length > 0 && !lineItemHasRequiredDrawing(lineItem) ? <p role="status" className="mt-2 text-xs leading-5 text-amber-800">
                  Selected inspection documents require a drawing. <button type="button" className="underline underline-offset-2" onClick={() => { const area = document.getElementById(configurationFieldId(lineItem.id, "drawing")); area?.scrollIntoView({ behavior: "smooth", block: "center" }); area?.querySelector<HTMLInputElement>('input[type="file"]')?.click(); }}>Upload a drawing</button> or remove those selections before submitting.
                </p> : null}
                {lineItem.qualityDocumentation.includes("custom_inspection") ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Describe the custom inspection in the Manufacturing notes section below.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 p-4 sm:p-8">
          <div className="mb-8 flex justify-end gap-4" id={configurationFieldId(lineItem.id, "cad")}>
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
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
                <div id={configurationFieldId(lineItem.id, "process")}>
                  <CustomSelect label="Manufacturing process" value={lineItem.process} options={offeredProcessOptions} onChange={value => updateLineItem(lineItem.id, "process", value)} required />
                </div>
                <div id={configurationFieldId(lineItem.id, "material")}>
                <MaterialSelect
                  value={lineItem.material}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "material", value)
                  }
                />
                </div>
                <div id={configurationFieldId(lineItem.id, "quantity")}>
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
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8" id={configurationFieldId(lineItem.id, "finish")}>
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950">
                Finish
              </h3>
              <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
                <CustomSelect
                  label="Surface Finish"
                  value={lineItem.surfaceFinish}
                  onChange={(value) =>
                    updateLineItem(lineItem.id, "surfaceFinish", value)
                  }
                  options={compatibleFinishOptions(lineItem.material, lineItem.process, lineItem.surfaceFinish)}
                  disabled={!lineItem.material}
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
                      <label className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700">
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
                {lineItem.material && finishCompatibilityError(lineItem.material, lineItem.surfaceFinish, lineItem.process) ? <p role="alert" className="text-sm text-red-700">{finishCompatibilityError(lineItem.material, lineItem.surfaceFinish, lineItem.process)}</p> : null}
                <label className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700">
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

            <section className="border-t border-slate-200 pt-8" id={configurationFieldId(lineItem.id, "tolerance")}>
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
              <div className="mt-6 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
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
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700"
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

            <section className="border-t border-slate-200 pt-3">
              {needsCadUpload ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium leading-6 text-amber-900">
                  This is only a saved filename. Upload the CAD file again so
                  Lattice can store the actual STEP/part bytes for quoting.
                </p>
              ) : null}
              <label className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 text-sm font-medium text-slate-700">
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
              <div className="mt-5">
                <TargetDatePicker value={lineItem.targetShipDate} onChange={value => updateLineItem(lineItem.id, "targetShipDate", value)} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

function useDrawingPreviewUrl(activeDrawingFile: File | null | undefined, activeDrawingName: string, activeDrawingStorageKey: string | undefined, activeDrawingType: string) {
  return useMemo(() => {
    if (activeDrawingFile) {
      if (
        !drawingCanPreview(activeDrawingFile) ||
        typeof URL === "undefined" ||
        !URL.createObjectURL
      ) {
        return null;
      }

      return URL.createObjectURL(activeDrawingFile);
    }

    if (
      activeDrawingStorageKey &&
      (activeDrawingType === "application/pdf" ||
        activeDrawingType.startsWith("image/"))
    ) {
      return localFileHref(
        activeDrawingStorageKey,
        activeDrawingName,
        activeDrawingType,
      );
    }

    return null;
  }, [
    activeDrawingFile,
    activeDrawingName,
    activeDrawingStorageKey,
    activeDrawingType,
  ]);
}

export function RequestForm({
  initialState,
  localDraftId,
  prefillNotice,
  resumeRequests = [],
}: RequestFormProps = {}) {
  const router = useRouter();
  const [localResumeRequests, setLocalResumeRequests] = useState<LatticeRequest[]>([]);
  const [localResumeStates, setLocalResumeStates] = useState<Record<string, RequestFormInitialState>>({});
  const [archivedResumeRequestIds, setArchivedResumeRequestIds] = useState<Set<string>>(() => new Set());
  const incompleteRfqStorageKey = customerDraftStorageKey(useCustomerWorkspaceScope());
  const [projectForm, setProjectForm] = useState<ProjectFormState>(() => ({
    ...makeProjectInitialState(),
    ...cleanIntakeState(initialState),
  }));
  const [lineItems, setLineItems] = useState<LineItemState[]>(() =>
    initialState?.lineItems?.length
      ? initialState.lineItems.map((lineItem, index) => lineItemFromInitialLineItem(lineItem, `line-${index + 1}`))
      : [lineItemFromInitialState(initialState)],
  );
  const [stagedCad, setStagedCad] = useState<{ files: File[]; targetId?: string } | null>(null);
  const pendingPartRevealRef = useRef<string | null>(null);
  const [preparedModels, setPreparedModels] = useState<Array<{ file: File; urn: string; approved: boolean; metadata?: CadMetadata }>>([]);
  const [preparedTargets, setPreparedTargets] = useState<Record<string, HTMLDivElement | null>>({});
  const attachPreparedTarget = useCallback((urn: string, target: HTMLDivElement | null) => {
    setPreparedTargets(current => {
      if (current[urn] === target || !target && !current[urn]) return current;
      const next = { ...current };
      if (target) next[urn] = target;
      else delete next[urn];
      return next;
    });
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const pendingFileUploadsRef = useRef(new WeakMap<File, Promise<PersistedDraftFile | null>>());
  const pendingCadPreviewsRef = useRef(new WeakMap<File, Promise<CadUploadPreviewState>>());
  useEffect(() => {
    if (!stagedCad) return;
    const files = stagedCad.files;
    let cancelled = false;
    let checking = false;
    async function checkStagedPreviews() {
      if (checking) return;
      checking = true;
      try {
        await Promise.all(files.map(async file => {
          const pending = pendingCadPreviewsRef.current.get(file);
          if (!pending) return;
          const state = await refreshCadPreviewState(await pending);
          if (!cancelled) {
            pendingCadPreviewsRef.current.set(file, Promise.resolve(state));
            if (file === files[0] && state.status === "ready") setPreparedModels(current => current.some(model => model.file === file) ? current : [...current, { file, urn: state.urn, approved: false }]);
          }
        }));
      } finally { checking = false; }
    }
    void checkStagedPreviews();
    const interval = window.setInterval(() => { void checkStagedPreviews(); }, 2000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [stagedCad]);

  const activePreparedModels = useMemo(() => preparedModels.filter(model => stagedCad?.files[0] === model.file || model.approved && lineItems.some(item => item.selectedFile === model.file)), [preparedModels, stagedCad, lineItems]);
  const preparedViewerContext = useMemo(() => ({ models: activePreparedModels, attachTarget: attachPreparedTarget }), [activePreparedModels, attachPreparedTarget]);

  const submissionKeyRef = useRef<string | null>(null);
  const [activeLocalDraftId, setActiveLocalDraftId] = useState<string | null>(
    localDraftId ?? null,
  );
  const [isQuoteNameEditing, setIsQuoteNameEditing] = useState(false);
  const [draftQuoteName, setDraftQuoteName] = useState(projectForm.projectName);
  const [isQuoteNameCustomized, setIsQuoteNameCustomized] = useState(
    Boolean(initialState?.projectName?.trim()),
  );
  const quoteNameInputRef = useRef<HTMLInputElement | null>(null);
  const [collapsedLineItemIds, setCollapsedLineItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  useEffect(() => {
    const id = pendingPartRevealRef.current;
    if (!id || stagedCad) return;
    const card = document.getElementById(`configure-${id}-part`);
    if (!card) return;
    pendingPartRevealRef.current = null;
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    card.querySelector<HTMLButtonElement>('button[aria-expanded]')?.focus({ preventScroll: true });
  }, [lineItems, stagedCad]);

  const [drawingReviewLineItemId, setDrawingReviewLineItemId] = useState<
    string | null
  >(null);
  const activeDrawingLineItem =
    lineItems.find((lineItem) => lineItem.id === drawingReviewLineItemId) ??
    null;
  const activeDrawingFile = activeDrawingLineItem?.selectedDrawingFile ?? null;
  const activeDrawingStorageKey =
    activeDrawingLineItem?.technicalDrawingStorageKey;
  const activeDrawingName = activeDrawingLineItem?.technicalDrawingName ?? "";
  const activeDrawingType =
    activeDrawingFile?.type ||
    activeDrawingLineItem?.technicalDrawingType ||
    "";

  useEffect(() => {
    // Browser storage is intentionally read after hydration so server and client
    // produce the same initial markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalResumeRequests(readLocalIncompleteResumeRequests(incompleteRfqStorageKey));
    setLocalResumeStates(Object.fromEntries(readIncompleteRfqs(incompleteRfqStorageKey).map((draft) => [draft.id, draft.initialState])));

    if (initialState || !localDraftId) {
      return;
    }

    const localDraft = readIncompleteRfqs(incompleteRfqStorageKey).find((draft) => draft.id === localDraftId);
    if (!localDraft) {
      return;
    }

    const restoredInitialState = cleanIntakeState(localDraft.initialState)!;
    setProjectForm({
      ...makeProjectInitialState(),
      ...restoredInitialState,
    });
    setLineItems(
      restoredInitialState.lineItems?.length
        ? restoredInitialState.lineItems.map((lineItem, index) =>
            lineItemFromInitialLineItem(lineItem, `line-${index + 1}`),
          )
        : [lineItemFromInitialState(restoredInitialState)],
    );
    setDraftQuoteName(restoredInitialState.projectName ?? "");
    setIsQuoteNameCustomized(Boolean(restoredInitialState.projectName?.trim()));
  }, [initialState, localDraftId, incompleteRfqStorageKey]);

  const resumeChoices = useMemo(() => {
    const localIds = new Set(localResumeRequests.map((request) => request.id));

    return [
      ...localResumeRequests,
      ...resumeRequests.filter((request) => !localIds.has(request.id)),
    ]
      .filter((request) => request.status === "DRAFT" && !request.isArchived && !archivedResumeRequestIds.has(request.id))
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt).getTime();
        const bTime = new Date(b.updatedAt || b.createdAt).getTime();

        return (
          (Number.isNaN(bTime) ? 0 : bTime) -
          (Number.isNaN(aTime) ? 0 : aTime)
        );
      })
      .slice(0, 5);
  }, [archivedResumeRequestIds, localResumeRequests, resumeRequests]);
  const drawingPreviewUrl = useDrawingPreviewUrl(activeDrawingFile, activeDrawingName, activeDrawingStorageKey, activeDrawingType);
  const configuredLineItems = lineItems.filter((lineItem) =>
    lineItem.fileName.trim(),
  );
  const hasCadFile = configuredLineItems.length > 0;
  const shouldShowResumePanel =
    !hasCadFile &&
    !initialState &&
    !localDraftId &&
    !prefillNotice &&
    resumeChoices.length > 0;

  const restrictionError = intakeUploadError(projectForm.restrictionStatus, projectForm.restrictionPolicyVersion);
  const uploadsAllowed = !restrictionError;

  const isReady = useMemo(
    () => !restrictionError && ["prototype", "commercial"].includes(projectForm.endUse) && formCompletionPercent(projectForm, configuredLineItems) === 100,
    [configuredLineItems, projectForm, restrictionError],
  );

  function updateProject(field: keyof ProjectFormState, value: string) {
    setProjectForm((current) => ({ ...current, [field]: value }));
  }

  function startQuoteNameEdit() {
    setDraftQuoteName(projectForm.projectName);
    setIsQuoteNameEditing(true);
  }

  function focusConfigurationField(lineId: string, field: ConfigurationField) {
    setCollapsedLineItemIds(current => {
      const next = new Set(current);
      next.delete(lineId);
      return next;
    });
    requestAnimationFrame(() => {
      const target = document.getElementById(configurationFieldId(lineId, field));
      target?.scrollIntoView?.({ block: "center" });
      target?.querySelector<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select:not([tabindex="-1"])')?.focus({ preventScroll: true });
    });
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
    if (!lineItemsHaveMissingRequiredDrawing(nextLineItems)) {
      setError((currentError) =>
        isRequiredDrawingError(currentError) ? null : currentError,
      );
    }

    setLineItems(nextLineItems);
  }

  function updateLineItemFlag(id: string, field: LineItemFlag, value: boolean) {
    const nextLineItems = lineItems.map((lineItem) =>
      lineItem.id === id ? { ...lineItem, [field]: value } : lineItem,
    );

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
    if (!hasCadFile) {
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
      process: lineItem.process,
      customerPartNumber: lineItem.customerPartNumber,
      cadRevision: lineItem.cadRevision,
      drawingRevision: lineItem.drawingRevision,
      targetShipDate: lineItem.targetShipDate,
      fileHistory: [],
      cadMetadata: lineItem.cadMetadata,
      fileName: lineItem.fileName,
      fileSizeBytes: lineItem.selectedFile?.size ?? lineItem.fileSizeBytes,
      fileStorageKey: lineItem.fileStorageKey,
      fileType: lineItem.selectedFile?.type || lineItem.fileType,
      generalTolerance: lineItem.generalTolerance,
      material: lineItem.material,
      notes: lineItem.notes,
      engineeringFits: lineItem.engineeringFits,
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
      restrictionStatus: projectForm.restrictionStatus,
      restrictionPolicyVersion: projectForm.restrictionPolicyVersion,
      endUse: projectForm.endUse,
      endUseNotes: projectForm.endUseNotes,
      requiresQualityApproval: projectForm.requiresQualityApproval,
      fileName: primaryLineItem.fileName,
      generalTolerance: primaryLineItem.generalTolerance,
      material: primaryLineItem.material,
      notes: primaryLineItem.notes,
      projectName: projectForm.projectName,
      qualityDocumentation: primaryLineItem.qualityDocumentation,
      quantity: primaryLineItem.quantity,
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
      primaryLineItem.fileName.trim() ||
      "Incomplete RFQ";
    const request: LatticeRequest = {
      id: draftId,
      buyerCompany: "",
      requesterEmail: "",
      requesterName: "",
      requesterPhone: "",
      shipToAddress1: "",
      shipToAddress2: "",
      shipToCity: "",
      shipToCompany: "",
      shipToName: "",
      shipToPhone: "",
      shipToState: "",
      shipToZipCode: "",
      title: requestTitle,
      intakeDeclaration: intakeDeclarationFor(projectForm),
      process: [...new Set(configuredLineItems.map(item => processLabel(item.process)))].join(" / "),
      dueDate: "",
      requiresQualityApproval: projectForm.requiresQualityApproval,
      status: "DRAFT",
      lineItems: configuredLineItems.map((lineItem) => ({
        id: lineItem.id,
        partName: displayNameFromFile(lineItem.fileName) || "Part",
        quantity: Number(lineItem.quantity) || 1,
        manufacturingDetails: manufacturingDetailsFor(lineItem),
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
    const otherDrafts = readIncompleteRfqs(incompleteRfqStorageKey).filter((draft) => draft.id !== draftId);
    writeIncompleteRfqs(incompleteRfqStorageKey, [nextDraft, ...otherDrafts].slice(0, 12));
  }, [activeLocalDraftId, configuredLineItems, hasCadFile, projectForm, incompleteRfqStorageKey]);

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

  function persistDraftUpload(file: File, declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }): Promise<PersistedDraftFile | null> {
    const pending = pendingFileUploadsRef.current.get(file);
    if (pending) return pending;
    const operation = uploadDraftFile(file, declaration);
    pendingFileUploadsRef.current.set(file, operation);
    void operation.then(stored => { if (!stored) pendingFileUploadsRef.current.delete(file); });
    return operation;
  }

  async function uploadDraftFile(file: File, declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }): Promise<PersistedDraftFile | null> {
    try {
      return await uploadRequestDraftFile(file, declaration);
    } catch (caught) {
      setError(`${file.name}: ${caught instanceof Error ? caught.message : "Unable to save this file. Please try again."}`);
      return null;
    }
  }

  async function persistCadDraftUpload(id: string, file: File, declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }) {
    const stored = await persistDraftUpload(file, declaration);

    if (!stored) {
      return;
    }

    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id && lineItem.selectedFile === file
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
    return stored;
  }

  async function persistDrawingDraftUpload(id: string, file: File) {
    const stored = await persistDraftUpload(file);

    if (!stored) {
      return;
    }

    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id && lineItem.selectedDrawingFile === file
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
    const previousFile = lineItems.find(item => item.id === id)?.selectedFile;
    if (previousFile && previousFile !== file) setPreparedModels(current => current.filter(model => model.file !== previousFile));
    if (file) {
      ensureLocalDraftId();
    }

    setLineItems((current) =>
      current.map((lineItem) => {
        if (lineItem.id !== id) {
          return lineItem;
        }

        const fileName = file?.name ?? "";

        return {
          ...lineItem,
          fileHistory: [],
          cadMetadata: undefined,
          cadRevision: lineItem.fileName ? "" : lineItem.cadRevision,
          selectedFile: file,
          fileName,
          fileSizeBytes: file?.size ?? 0,
          fileStorageKey: undefined,
          fileType: file?.type ?? "",
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

  function requestCadPreview(file: File, stored: PersistedDraftFile, declaration: UploadDeclaration): Promise<CadUploadPreviewState> {
    const pending = pendingCadPreviewsRef.current.get(file);
    if (pending) return pending;
    const operation = (async (): Promise<CadUploadPreviewState> => {
      try {
        const response = await fetch("/api/cad-previews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storageKey: stored.storageKey, ...declaration }),
        });
        const payload = await response.json();
        if (payload.preview?.status === "configuration_required") return { status: "configuration_required", fileName: file.name, message: payload.preview.message };
        if (!response.ok) throw new Error(payload.error ?? "Unable to start CAD preview");
        return { status: "processing", fileName: file.name, urn: payload.preview.urn, progress: "queued" };
      } catch (caught) {
        return { status: "failed", fileName: file.name, message: caught instanceof Error ? caught.message : "Unable to start CAD preview" };
      }
    })();
    pendingCadPreviewsRef.current.set(file, operation);
    void operation.then(state => { if (state.status === "failed") pendingCadPreviewsRef.current.delete(file); });
    return operation;
  }

  async function startCadPreview(id: string, file: File, stored: PersistedDraftFile, declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }) {
    const state = await refreshCadPreviewState(await requestCadPreview(file, stored, declaration));
    pendingCadPreviewsRef.current.set(file, Promise.resolve(state));
    setLineItems(current => current.map(item => item.id === id && item.selectedFile === file ? { ...item, cadPreview: state } : item));
  }

  function persistCadFileAndPreview(id: string, file: File, declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }) {
    void preloadAutodeskViewerAssets().catch(() => { /* Preview initialization retries asset loading. */ });
    void persistCadDraftUpload(id, file, declaration).then((stored) => {
      if (stored) return startCadPreview(id, file, stored, declaration);
      setLineItems(current => current.map(item => item.id === id && item.selectedFile === file
        ? { ...item, cadPreview: { status: "failed", fileName: file.name, message: "Save the CAD file before starting its preview. Try submitting again to retry the upload." } }
        : item));
    });
  }

  async function handleCadFileSelected(
    id: string,
    file: File | null,
    updateQuoteName = true,
    declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion },
  ) {
    if (submittingRef.current) return;
    const eligibilityError = intakeUploadError(declaration.restrictionStatus, declaration.restrictionPolicyVersion);
    if (eligibilityError) { setError(eligibilityError); return; }
    if (file) {
      const uploadError = cadUploadError(file);
      if (uploadError) { setError(uploadError); return; }
    }
    applyCadFileToLineItem(id, file, updateQuoteName);

    if (!file) {
      return;
    }

    persistCadFileAndPreview(id, file, declaration);
  }

  function appendCadLineItem(file: File, updateQuoteName = true, declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }) {
    if (submittingRef.current) return;
    const eligibilityError = intakeUploadError(declaration.restrictionStatus, declaration.restrictionPolicyVersion);
    if (eligibilityError) { setError(eligibilityError); return; }
    const uploadError = cadUploadError(file);
    if (uploadError) { setError(uploadError); return; }
    ensureLocalDraftId();
    const id = makeLineItemId();
    const nextFileNames = [
      ...lineItems
        .map((lineItem) => lineItem.fileName)
        .filter((fileName) => fileName.trim()),
      file.name,
    ];

    setLineItems((current) => [...current, makeCadLineItem(id, file)]);
    setCollapsedLineItemIds(current => { const next = new Set(current); next.delete(id); return next; });
    if (updateQuoteName && !isQuoteNameCustomized) {
      setProjectForm((current) => ({
        ...current,
        projectName: quoteNameFromFileNames(nextFileNames),
      }));
    }
    persistCadFileAndPreview(id, file, declaration);
    return id;
  }

  function handleCadFilesSelected(id: string, files: File[], declaration: UploadDeclaration = { restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }) {
    const uploadError = files.map(cadUploadError).find(Boolean);
    if (uploadError) { setError(uploadError); return; }
    const [firstFile, ...additionalFiles] = files;

    if (!firstFile) {
      return;
    }

    if (!isQuoteNameCustomized) {
      setProjectForm((current) => ({
        ...current,
        projectName: quoteNameFromFileNames([...lineItems.map(item => item.id === id ? firstFile.name : item.fileName).filter(Boolean), ...additionalFiles.map(file => file.name)]),
      }));
    }
    handleCadFileSelected(id, firstFile, files.length === 1, declaration);
    additionalFiles.forEach((file) => appendCadLineItem(file, false, declaration));
  }

  function stageCadFiles(files: File[], targetId?: string) {
    if (submittingRef.current || !files.length) return;
    const uploadError = files.map(cadUploadError).find(Boolean);
    if (uploadError) { setError(uploadError); return; }
    setError(null);
    setPreparedModels(current => current.filter(model => model.approved && lineItems.some(item => item.selectedFile === model.file)));
    setStagedCad({ files, targetId });
    void preloadAutodeskViewerAssets().catch(() => { /* Preview initialization retries asset loading. */ });
    // Keep advance processing separate from the customer's unanswered declaration.
    const declaration: UploadDeclaration = { restrictionStatus: "unconfirmed", restrictionPolicyVersion, processingIntent: "advance_cad_preview" };
    files.forEach(file => {
      if (pendingFileUploadsRef.current.has(file)) return;
      const upload = uploadRequestDraftFile(file, declaration).catch(() => null);
      pendingFileUploadsRef.current.set(file, upload);
      void upload.then(stored => {
        if (stored) return requestCadPreview(file, stored, declaration);
        pendingFileUploadsRef.current.delete(file);
      });
    });
  }

  function confirmExportRestrictions(status: string, intendedUse?: { endUse: string; endUseNotes: string }) {
    if (submittingRef.current) return;
    // Additional/replacement parts must not overwrite the quote’s intended use.
    if (stagedCad && lineItems.some(item => item.fileName.trim()) &&
        ["prototype", "commercial"].includes(projectForm.endUse) &&
        intendedUse && intendedUse.endUse !== projectForm.endUse) return;
    const declaration = { ...projectForm, restrictionStatus: status, restrictionPolicyVersion };
    setProjectForm(current => ({ ...current, restrictionStatus: status, restrictionPolicyVersion, ...(intendedUse ?? {}) }));
    const pending = stagedCad;
    if (status === "unrestricted" && pending) setPreparedModels(current => current.map(model => pending.files.includes(model.file) ? { ...model, approved: true } : model));
    setStagedCad(null);
    if (intakeUploadError(status, restrictionPolicyVersion) || !pending) return;
    if (pending.targetId) {
      handleCadFilesSelected(pending.targetId, pending.files, declaration);
      setCollapsedLineItemIds(current => { const next = new Set(current); next.delete(pending.targetId!); return next; });
      pendingPartRevealRef.current = pending.targetId;
    } else {
      if (!isQuoteNameCustomized) setProjectForm(current => ({ ...current, projectName: quoteNameFromFileNames([...lineItems.map(item => item.fileName).filter(Boolean), ...pending.files.map(file => file.name)]) }));
      const addedIds = pending.files.map(file => appendCadLineItem(file, false, declaration));
      pendingPartRevealRef.current = addedIds.find((id): id is string => Boolean(id)) ?? null;
    }
  }

  async function handleTechnicalDrawingSelected(id: string, file: File | null) {
    if (submittingRef.current) return;
    if (file) {
      const uploadError = manufacturingUploadError(file);
      if (uploadError) { setError(uploadError); return; }
    }
    if (!uploadsAllowed) { setError(restrictionError); return; }
    if (file) {
      ensureLocalDraftId();
      setError(null);
    }

    setLineItems((current) =>
      current.map((lineItem) =>
        lineItem.id === id
          ? {
              ...lineItem,
              fileHistory: [],
              drawingRevision: lineItem.technicalDrawingName ? "" : lineItem.drawingRevision,
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
    const removedFile = lineItems.find(item => item.id === id)?.selectedFile;
    setPreparedModels(current => current.filter(model => model.file !== removedFile));
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
    if (submittingRef.current || !isReady) return;
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

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Wait for any in-flight uploads and retry failed uploads through the same
      // direct path. Submission contains references only, even if clicked early.
      const submissionLineItems = await Promise.all(configuredLineItems.map(async (lineItem) => {
        const cad = !lineItem.fileStorageKey && lineItem.selectedFile
          ? await persistDraftUpload(lineItem.selectedFile) : null;
        const drawing = !lineItem.technicalDrawingStorageKey && lineItem.selectedDrawingFile
          ? await persistDraftUpload(lineItem.selectedDrawingFile) : null;
        const fileStorageKey = lineItem.fileStorageKey || cad?.storageKey;
        const technicalDrawingStorageKey = lineItem.technicalDrawingStorageKey || drawing?.storageKey;
        if (!fileStorageKey) throw new Error(`${lineItem.fileName} could not be saved. Please try submitting again.`);
        if (lineItem.technicalDrawingName && !technicalDrawingStorageKey) throw new Error(`${lineItem.technicalDrawingName} could not be saved. Please try submitting again.`);
        return { ...lineItem, fileStorageKey, technicalDrawingStorageKey };
      }));
      setLineItems(current => current.map(item => {
        const saved = submissionLineItems.find(lineItem => lineItem.id === item.id);
        return saved ? { ...item, fileStorageKey: saved.fileStorageKey, technicalDrawingStorageKey: saved.technicalDrawingStorageKey } : item;
      }));

      const input: DraftRequestInput = {
        title: projectForm.projectName,
        intakeDeclaration: intakeDeclarationFor(projectForm),
        process: [...new Set(submissionLineItems.map(item => processLabel(item.process)))].join(" / "),
        requiresQualityApproval: projectForm.requiresQualityApproval,
        lineItems: submissionLineItems.map((lineItem) => {
          const noteLines = [
            lineItem.notes.trim() ? lineItem.notes.trim() : null,
            ...drawingRequiredNotes(lineItem),
          ].filter(Boolean);

          return {
                  quantity: Number(lineItem.quantity),
            manufacturingDetails: manufacturingDetailsFor(lineItem),
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
        files: submissionLineItems.flatMap((lineItem, lineItemIndex) => [
          {
            lineItemIndex,
            name: lineItem.fileName,
            sizeBytes: lineItem.selectedFile?.size ?? lineItem.fileSizeBytes,
            storageKey: lineItem.fileStorageKey,
            type: lineItem.selectedFile?.type || lineItem.fileType || "reference/name-only",
            cadPreviewUrn: cadPreviewUrnForLineItem(lineItem),
          },
          ...(lineItem.technicalDrawingName
            ? [
                {
                  lineItemIndex,
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
      const formData = new FormData();
      formData.append("request", JSON.stringify(input));

      submissionKeyRef.current ??= activeLocalDraftId ?? crypto.randomUUID();
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Idempotency-Key": submissionKeyRef.current },
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit request");
      }

      if (activeLocalDraftId) {
        removeIncompleteRfq(incompleteRfqStorageKey, activeLocalDraftId);
      }
      router.replace(`/quotes/${payload.request.id}`);
    } catch (caught) {
      submittingRef.current = false;
      setIsSubmitting(false);
      setError(
        caught instanceof Error ? caught.message : "Unable to submit request",
      );
    }
  }

  async function archiveResumeRequest(request: LatticeRequest, reason: string) {
    const isLocalDraft = localResumeRequests.some((draft) => draft.id === request.id);

    if (isLocalDraft) {
      removeIncompleteRfq(incompleteRfqStorageKey, request.id);
      return;
    }

    const response = await fetch(`/api/requests/${encodeURIComponent(request.id)}/archive`, {
      body: JSON.stringify({ reason }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(typeof payload.error === "string" ? payload.error : "Unable to archive this draft.");
    }
  }

  function removeArchivedResumeRequest(requestId: string) {
    setLocalResumeRequests((current) => current.filter((draft) => draft.id !== requestId));
    setArchivedResumeRequestIds((current) => new Set([...current, requestId]));
  }

  return (
    <PreparedCadViewerContext.Provider value={preparedViewerContext}>
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <header className="px-1 pt-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <RequestFormHeading />
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
          <RequestQuoteProgress currentStep={isSubmitting ? 3 : hasCadFile ? 2 : 1} />
        </header>

        <WorkspaceContentReveal className="space-y-6">
          <section className={`space-y-6 ${separatePartContainers && hasCadFile ? "" : requestCardClass}`}>
            {uploadsAllowed && activeDrawingLineItem ? (
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

            <div className={`space-y-6 ${separatePartContainers && hasCadFile ? requestCardClass : ""}`}>
            {hasCadFile ? (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
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
                      <p className="break-words text-xl leading-7 text-slate-600">
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
                <div className="flex min-w-0 max-w-[66.666%] shrink-0 items-center gap-3">
                  <div className="w-60 min-w-0 shrink">
                  <CustomSelect
                    label="Export restrictions"
                    compact
                    value={projectForm.restrictionPolicyVersion === restrictionPolicyVersion ? projectForm.restrictionStatus : "unconfirmed"}
                    placeholder="Confirm export restrictions"
                    required
                    disabled={isSubmitting}
                    onChange={confirmExportRestrictions}
                    options={[
                      { value: "unrestricted", label: "No restrictions declared", description: "This quote does not include export-controlled parts, CUI, U.S.-only or other restricted handling requirements." },
                      { value: "restricted", label: "Subject to export restrictions", description: "Includes ITAR, EAR, dual-use, military/defense, firearms, CUI, U.S.-only or other restricted handling requirements." },
                    ]}
                  />
                  </div>
                  <div className="w-48 min-w-0 shrink">
              <CustomSelect
                label="Intended use"
                compact
                accessory={projectForm.endUse === "commercial" ? <Factory className="h-5 w-5 text-slate-700" /> : <FlaskConical className="h-5 w-5 text-slate-700" />}
                value={["prototype", "commercial"].includes(projectForm.endUse) ? projectForm.endUse : ""}
                placeholder="Select intended use"
                required
                disabled={isSubmitting}
                onChange={value => setProjectForm(current => ({ ...current, endUse: value, endUseNotes: "" }))}
                options={[
                  { value: "prototype", label: "Prototype", description: "I will use exclusively for development, testing, product evaluation or quality control." },
                  { value: "commercial", label: "Commercial", description: "I intend to incorporate these components into products that are sold for commercial use." },
                ]}
              />
                  </div>
                </div>
              </div>
            ) : null}
            {hasCadFile && restrictionError ? <p role="status" className="text-sm text-amber-900">{restrictionError}</p> : null}

            {!hasCadFile ? (
              <UploadCadDropZone
                label="Choose CAD file"
                onFilesSelected={(files) =>
                  stageCadFiles(files, lineItems[0].id)
                }
              />
            ) : null}

            </div>

            {uploadsAllowed && configuredLineItems.map((lineItem, index) => (
              <LineItemConfigurationCard
                key={lineItem.id}
                previewDeclaration={{ restrictionStatus: projectForm.restrictionStatus, restrictionPolicyVersion: projectForm.restrictionPolicyVersion }}
                index={index}
                lineItem={lineItem}
                isCollapsed={collapsedLineItemIds.has(lineItem.id)}
                canRemove
                updateLineItem={updateLineItem}
                updateLineItemFlag={updateLineItemFlag}
                onToggleCollapsed={toggleLineItemCollapsed}
                onRemove={removeLineItem}
                onCadStatus={updateCadPreview}
                onCadMetadata={(id, metadata) => setLineItems(current => current.map(item => item.id === id ? { ...item, cadMetadata: metadata } : item))}
                onCadFileSelected={(id, file) =>
                  file ? stageCadFiles([file], id) : handleCadFileSelected(id, null)
                }
                onDrawingSelected={handleTechnicalDrawingSelected}
                onRemoveDrawing={removeTechnicalDrawing}
                onReviewDrawing={setDrawingReviewLineItemId}
                qualityApprovalControl={index === 0 ? <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                  <input type="checkbox" disabled={isSubmitting} checked={projectForm.requiresQualityApproval} onChange={event => setProjectForm(current => ({ ...current, requiresQualityApproval: event.target.checked }))} className="mt-1" />
                  <span><strong>Require quality approval before shipment</strong><br />Request Customer Admin approval of inspection documents before Lattice releases this order for shipment. Applies to the entire order; Lattice will confirm this requirement in your quote.</span>
                </label> : undefined}
              />
            ))}

            <div className={`space-y-6 ${separatePartContainers && hasCadFile ? requestCardClass : ""}`}>
            {hasCadFile && uploadsAllowed ? (
              <UploadCadDropZone
                compact
                label="Upload another CAD file"
                onFilesSelected={(files) => stageCadFiles(files)}
              />
            ) : null}


            {error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            ) : null}

            {hasCadFile ? (
              <div className="border-t border-slate-100 pt-6">
                <section aria-label="Configuration checklist" className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-950">{isReady ? "Ready to submit" : "Complete your configuration"}</h3>
                  {!["prototype", "commercial"].includes(projectForm.endUse) ? <p className="mt-2 text-sm text-amber-800">Select the intended use above.</p> : null}
                  {restrictionError ? <p className="mt-2 text-sm text-amber-800">Confirm export restrictions above before continuing.</p> : null}
                  {!projectForm.projectName.trim() ? <button type="button" onClick={startQuoteNameEdit} className="mt-2 text-sm text-blue-700 underline">Enter a quote name</button> : null}
                  <ul className="mt-3 space-y-3">
                    {configuredLineItems.map((item, index) => {
                      const missing = missingLineItemFields(item);
                      return <li key={item.id} className="text-sm">
                        <p className="font-medium text-slate-800">Part {index + 1}: {displayNameFromFile(item.fileName)}</p>
                        {missing.length ? <ul className="mt-1 space-y-1">{missing.map(issue => <li key={issue.field}>
                          <button type="button" className="min-h-9 text-left text-blue-700 underline underline-offset-2" onClick={() => focusConfigurationField(item.id, issue.field)}>{issue.label}</button>
                        </li>)}</ul> : <p className="mt-1 flex items-center gap-1.5 text-slate-600"><Check aria-hidden="true" className="h-4 w-4" />Configuration complete</p>}
                      </li>;
                    })}
                  </ul>
                </section>
                <button
                  className="cursor-pointer rounded-lg bg-[#262626] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#cfcfcf] disabled:text-white"
                  disabled={!isReady || isSubmitting}
                  aria-busy={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Submitting…" : "Request Quote"}
                </button>
              </div>
            ) : null}
            </div>
          </section>

          {shouldShowResumePanel ? (
            <ResumeQuotePanel
              onArchived={removeArchivedResumeRequest}
              onArchiveDraft={archiveResumeRequest}
              requests={resumeChoices}
              savedStates={localResumeStates}
            />
          ) : null}
        </WorkspaceContentReveal>
      </form>

      {stagedCad ? <ExportRestrictionsDialog
        files={stagedCad ? stagedCad.files.map(file => file.name) : configuredLineItems.map(item => item.fileName)}
        initialEndUse={projectForm.endUse}
        quoteEndUse={configuredLineItems.length && ["prototype", "commercial"].includes(projectForm.endUse) ? projectForm.endUse : undefined}
        isNewSelection={Boolean(stagedCad)}
        initialStatus={stagedCad ? "unconfirmed" : projectForm.restrictionStatus}
        onRemoveFile={stagedCad ? (index) => {
          const removedFile = stagedCad.files[index];
          setPreparedModels(current => current.filter(model => model.file !== removedFile));
          setStagedCad(current => current ? { ...current, files: current.files.filter((_, i) => i !== index) } : null);
        } : undefined}
        onClose={() => { setPreparedModels(current => current.filter(model => model.approved)); setStagedCad(null); }}
        onConfirm={confirmExportRestrictions}
      /> : null}

      {activePreparedModels.map(model => <PreparedCadModelHost key={model.urn} urn={model.urn} target={preparedTargets[model.urn] ?? null}
        onMetadata={metadata => setPreparedModels(current => current.map(item => item.urn === model.urn ? { ...item, metadata } : item))} />)}

    </div>
    </PreparedCadViewerContext.Provider>
  );
}
