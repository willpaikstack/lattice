import { materialSelectionDetails, materialSelectionError } from "./material-quote-offerings";
import { cncMaterialLibrary } from "./cnc-material-library";
import { resolveMaterialName } from "./material-identity-registry";
import { optionLabel, rfqMaterialOptions, surfaceFinishOptions } from "./rfq-options";

export const restrictionPolicyVersion = "overseas-intake-2026-10-12";
export type RestrictionStatus = "unconfirmed" | "unrestricted" | "restricted" | "unsure";
export type EndUse = "" | "prototype" | "commercial" | "mixed";
export type IntakeDeclaration = { restrictionStatus: RestrictionStatus; policyVersion: string; endUse: EndUse; endUseNotes: string };
export const offeredProcessOptions = [
  { value: "cnc_milling", label: "CNC Milling" },
  { value: "cnc_turning", label: "CNC Turning" },
  { value: "sheet_metal_fabrication", label: "Sheet Metal Fabrication" },
];
export type CadMetadata = { dimensionsMm: [number, number, number]; sourceUnit: string };
export type PartFileHistory = {
  kind: "cad" | "drawing"; name: string; sizeBytes: number; type: string;
  storageKey?: string; revision: string; replacedAt: string;
};
export type ManufacturingDetails = {
  process: string; customerPartNumber: string; cadRevision: string; drawingRevision: string; targetDeliveryDate?: string;
  materialKey: string; materialGrade?: string; materialCondition?: string; finishKey: string; fileHistory: PartFileHistory[]; cadMetadata?: CadMetadata;
  drawingRequirements?: Partial<Record<"partMarkings" | "tightLinearTolerance" | "drawingSpecificTolerances" | "threads" | "engineeringFits" | "sharpInternalCorners", boolean>>;
};

export function processLabel(value?: string) {
  return offeredProcessOptions.find(option => option.value === value || option.label === value)?.label ?? value ?? "Not specified";
}

export function intakeUploadError(status: unknown, policyVersion: unknown) {
  if (status === "restricted") return "Lattice does not accept ITAR, export-restricted, CUI, US-only, or other restricted-handling work through its overseas manufacturing workflow. Do not upload these files.";
  if (status === "unsure") return "Confirm your restrictions with your compliance team before uploading. Lattice cannot accept files while eligibility is uncertain.";
  if (status !== "unrestricted" || policyVersion !== restrictionPolicyVersion) return "Confirm the current overseas-manufacturing restrictions before uploading or submitting files.";
  return null;
}

/** CAD-only speculative processing; never qualifies a package for submission. */
export function cadProcessingIntakeError(status: unknown, policyVersion: unknown, processingIntent: unknown) {
  if (processingIntent === "advance_cad_preview" && status === "unconfirmed" && policyVersion === restrictionPolicyVersion) return null;
  return intakeUploadError(status, policyVersion);
}

export function readIntakeDeclaration(value: unknown): IntakeDeclaration | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  return {
    restrictionStatus: ["unrestricted", "restricted", "unsure"].includes(String(record.restrictionStatus)) ? record.restrictionStatus as RestrictionStatus : "unconfirmed",
    policyVersion: typeof record.policyVersion === "string" ? record.policyVersion : "",
    endUse: ["prototype", "commercial", "mixed"].includes(String(record.endUse)) ? record.endUse as EndUse : "",
    endUseNotes: typeof record.endUseNotes === "string" ? record.endUseNotes.slice(0, 2000) : "",
  };
}

/** Preserve legacy ship-date preferences while all new writes use delivery terminology. */
export function readTargetDeliveryDate(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const date = typeof record.targetDeliveryDate === "string" ? record.targetDeliveryDate : record.targetShipDate;
  return typeof date === "string" ? date.slice(0, 160) : "";
}

export function readManufacturingDetails(value: unknown): ManufacturingDetails | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  const text = (key: string) => typeof record[key] === "string" ? (record[key] as string).slice(0, 160) : "";
  const fileHistory: PartFileHistory[] = Array.isArray(record.fileHistory) ? record.fileHistory.slice(-50).flatMap(value => {
    if (!value || typeof value !== "object" || !["cad", "drawing"].includes(value.kind) || typeof value.name !== "string" || typeof value.replacedAt !== "string") return [];
    return [{ kind: value.kind, name: value.name.slice(0, 255), sizeBytes: Number(value.sizeBytes) || 0,
      type: typeof value.type === "string" ? value.type.slice(0, 100) : "application/octet-stream",
      ...(typeof value.storageKey === "string" ? { storageKey: value.storageKey } : {}),
      revision: typeof value.revision === "string" ? value.revision.slice(0, 160) : "", replacedAt: value.replacedAt }];
  }) : [];
  const metadata = record.cadMetadata as CadMetadata | undefined;
  const drawingRequirements = record.drawingRequirements && typeof record.drawingRequirements === "object" && !Array.isArray(record.drawingRequirements)
    ? Object.fromEntries(["partMarkings", "tightLinearTolerance", "drawingSpecificTolerances", "threads", "engineeringFits", "sharpInternalCorners"].map(key => [key, (record.drawingRequirements as Record<string, unknown>)[key] === true])) : undefined;
  const cadMetadata = metadata && Array.isArray(metadata.dimensionsMm) && metadata.dimensionsMm.length === 3 && metadata.dimensionsMm.every(value => Number.isFinite(value) && value >= 0) && typeof metadata.sourceUnit === "string"
    ? { dimensionsMm: metadata.dimensionsMm as [number, number, number], sourceUnit: metadata.sourceUnit.slice(0, 40) } : undefined;
  return { process: text("process"), customerPartNumber: text("customerPartNumber"), cadRevision: text("cadRevision"), drawingRevision: text("drawingRevision"), targetDeliveryDate: readTargetDeliveryDate(record), materialKey: text("materialKey"), ...materialSelectionDetails(text("materialKey")), finishKey: text("finishKey"), fileHistory, ...(cadMetadata ? { cadMetadata } : {}), ...(drawingRequirements ? { drawingRequirements } : {}) };
}

// Conservative service matrix, researched from Protolabs Network's service table.
// Physical possibilities outside this matrix require custom supplier review.
export function finishCompatibilityError(material: string, finish: string, process = "cnc_milling") {
  if (!material) return "Select a material to see compatible finishes.";
  const label = optionLabel(rfqMaterialOptions, material);
  const family = cncMaterialLibrary.find(entry => entry.value === material || entry.label === label)?.family
    ?? (/^SS /.test(label) ? "Stainless steel" : undefined);
  const metal = !!family && !["Plastic / polymer", "Composite"].includes(family);
  if (finish === "as_fabricated") return process === "sheet_metal_fabrication" && metal ? null : "As fabricated is available for sheet metal parts with a metal material.";
  if (!surfaceFinishOptions.some(option => option.value === finish)) return "Select a supported surface finish.";
  if (process === "sheet_metal_fabrication" && !metal) return "Sheet metal fabrication requires a metal material.";
  if (process === "sheet_metal_fabrication" && /as_machined_ra|machining_ra|polishing_ra|electroless_nickel/.test(finish)) return "This finish requires CNC machining; choose a sheet-metal finish or describe a custom requirement in notes.";
  if (finish.includes("anodized") || finish.includes("chromate")) return family === "Aluminum" ? null : "The offered anodizing and chromate finishes require aluminum.";
  if (finish === "electroless_nickel_plating") return (family === "Aluminum" || family === "Stainless steel" || (family === "Steel" && /1018|A36|1215/.test(label))) ? null : "Offered electroless nickel plating is limited to aluminum, stainless steel and mild steel; other substrates require custom review.";
  if (finish === "smooth_machining_ra_1_6" || finish === "as_machined_ra_3_2") return null;
  return metal ? null : "This offered finish requires a metal substrate. Describe any special plastic/composite finish in notes for review.";
}

export function compatibleFinishOptions(material: string, process: string, selected: string) {
  if (!material) return surfaceFinishOptions.filter(option => option.value === "as_machined_ra_3_2" || option.value === selected);
  const options = surfaceFinishOptions.filter(option => !finishCompatibilityError(material, option.value, process));
  const invalid = surfaceFinishOptions.find(option => option.value === selected && !options.includes(option));
  return invalid ? [{ ...invalid, label: `${invalid.label} — select a compatible finish` }, ...options] : options;
}

export function validateManufacturingIntake(input: { intakeDeclaration?: IntakeDeclaration; lineItems: Array<{ material: string; surfaceFinish?: string; manufacturingDetails?: ManufacturingDetails }>; process?: string }) {
  for (const part of input.lineItems) {
    const date = readTargetDeliveryDate(part.manufacturingDetails);
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)) {
      throw new Error("Enter a valid target delivery date or leave it blank.");
    }
  }
  const intake = readIntakeDeclaration(input.intakeDeclaration);
  const restrictionError = intakeUploadError(intake?.restrictionStatus, intake?.policyVersion);
  if (restrictionError) throw new Error(restrictionError);
  if (!intake || !["prototype", "commercial"].includes(intake.endUse)) throw new Error("Select prototype or commercial use before submitting.");
  input.intakeDeclaration = intake;
  input.lineItems.forEach((part, index) => {
    const details = readManufacturingDetails(part.manufacturingDetails);
    if (!details || !offeredProcessOptions.some(option => option.value === details.process)) throw new Error(`Part ${index + 1}: select milling, turning or sheet metal.`);
    const selectionError = materialSelectionError(details.materialKey);
    if (selectionError) throw new Error(`Part ${index + 1}: ${selectionError}.`);
    const selectedMaterial = optionLabel(rfqMaterialOptions, details.materialKey);
    const savedMaterial = resolveMaterialName("rfq", part.material);
    if (selectedMaterial !== savedMaterial || !details.materialKey) throw new Error(`Part ${index + 1}: invalid material selection.`);
    const finishError = finishCompatibilityError(details.materialKey, details.finishKey, details.process);
    if (finishError) throw new Error(`Part ${index + 1}: ${finishError}`);
    const finishLabel = optionLabel(surfaceFinishOptions, details.finishKey);
    if (!part.surfaceFinish?.startsWith(finishLabel)) throw new Error(`Part ${index + 1}: invalid finish selection.`);
    part.manufacturingDetails = { ...details, fileHistory: [] };
  });
  input.process = [...new Set(input.lineItems.map(part => processLabel(part.manufacturingDetails?.process)))].join(" / ");
}
