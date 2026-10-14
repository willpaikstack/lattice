import type { CadUploadPreviewState } from "@/components/cad-upload-preview";

export type CadPreviewRecovery = { storageKey: string; restrictionStatus?: string; restrictionPolicyVersion?: string };

/** Read current translation state without resubmitting the Autodesk job. */
export async function refreshCadPreviewState(state: CadUploadPreviewState, recovery?: CadPreviewRecovery): Promise<CadUploadPreviewState> {
  if (state.status !== "processing") return state;
  try {
    const response = await fetch(`/api/cad-previews/status?urn=${encodeURIComponent(state.urn)}`, { cache: "no-store" });
    if (response.status === 404) {
      if (recovery?.storageKey) {
        const fresh = await fetch("/api/cad-previews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...recovery, reuseExisting: true }) });
        const payload = await fresh.json();
        if (fresh.ok && payload.preview?.urn) return { ...state, urn: payload.preview.urn, progress: "Preparing a secure preview" };
      }
      return { status: "reference_only", fileName: state.fileName, message: "The secure CAD preview is unavailable. The saved original file is still available; upload a replacement only if you need to change it." };
    }
    if (!response.ok) return state; // Temporary manifest/network failures should not discard a running job.
    const payload = await response.json();
    if (payload.preview?.status === "ready") return { status: "ready", fileName: state.fileName, urn: state.urn };
    if (payload.preview?.status === "failed") return { status: "failed", fileName: state.fileName, message: "Autodesk could not translate this CAD file." };
    if (payload.preview?.status === "configuration_required") return { status: "configuration_required", fileName: state.fileName, message: payload.preview.message };
    return { ...state, progress: payload.preview?.progress ?? state.progress };
  } catch {
    return state;
  }
}
