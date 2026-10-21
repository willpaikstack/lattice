import "server-only";

import type { RequestFormInitialState } from "@/components/request-form";
import { customerSafeRequest } from "./customer-request";
import { normalizePersistedDraft } from "./persisted-draft-validation";
import { readManufacturingDetails } from "./rfq-manufacturing";

// Stored browser drafts may predate the customer payload contract. Project both
// the envelope and form state so old internal fields cannot be sent back out.
function customerFormState(state: RequestFormInitialState): RequestFormInitialState {
  const result: Record<string, unknown> = {};
  const fields = [
    "restrictionStatus", "restrictionPolicyVersion", "endUse", "endUseNotes", "projectName", "requiresQualityApproval",
    "process", "customerPartNumber", "cadRevision", "drawingRevision", "targetDeliveryDate", "targetShipDate",
    "quantity", "material", "generalTolerance", "surfaceFinish", "surfaceFinishColor", "surfaceFinishCosmeticRequirement", "surfaceFinishCustomColor",
    "notes", "fileName", "fileSizeBytes", "fileStorageKey", "fileType", "technicalDrawingName", "technicalDrawingSizeBytes", "technicalDrawingStorageKey", "technicalDrawingType",
    "partMarkings", "tightLinearTolerance", "drawingSpecificTolerances", "threads", "engineeringFits", "sharpInternalCorners",
  ] as const satisfies readonly (keyof RequestFormInitialState)[];
  for (const key of fields) {
    const value = state[key];
    if (["string", "number", "boolean"].includes(typeof value)) result[key] = value;
  }
  if (state.qualityDocumentation) result.qualityDocumentation = state.qualityDocumentation.map(value => value);
  const details = readManufacturingDetails({ fileHistory: state.fileHistory, cadMetadata: state.cadMetadata });
  if (state.fileHistory) result.fileHistory = details?.fileHistory;
  if (details?.cadMetadata) result.cadMetadata = details.cadMetadata;
  if (state.cadPreview) {
    const preview: Record<string, unknown> = {};
    for (const key of ["status", "fileName", "urn", "progress", "message"]) {
      const value = (state.cadPreview as unknown as Record<string, unknown>)[key];
      if (typeof value === "string") preview[key] = value;
    }
    result.cadPreview = preview;
  }
  if (state.lineItems) result.lineItems = state.lineItems.map(customerFormState);
  return result as RequestFormInitialState;
}

export function customerSafeDraft(value: unknown) {
  try {
    const draft = normalizePersistedDraft(value);
    if (!draft) return null;
    return {
      id: draft.id,
      schemaVersion: draft.schemaVersion,
      updatedAt: draft.updatedAt,
      request: customerSafeRequest(draft.request),
      initialState: customerFormState(draft.initialState as RequestFormInitialState),
    };
  } catch {
    // Older validation allowed partially malformed nested records. Preserve
    // those rows for recovery and report their IDs instead of breaking the list.
    return null;
  }
}
