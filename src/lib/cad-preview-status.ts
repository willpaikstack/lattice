import type { CadUploadPreviewState } from "@/components/cad-upload-preview";

/** Read current translation state without resubmitting the Autodesk job. */
export async function refreshCadPreviewState(state: CadUploadPreviewState): Promise<CadUploadPreviewState> {
  if (state.status !== "processing") return state;
  try {
    const response = await fetch(`/api/cad-previews/status?urn=${encodeURIComponent(state.urn)}`, { cache: "no-store" });
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
