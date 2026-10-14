"use client";
import type { CadMetadata } from "@/lib/rfq-manufacturing";
import { ReusableCadViewer } from "./prepared-cad-viewer";
import { cadAccept } from "@/lib/cad-upload-policy";

import { useEffect, useRef } from "react";
import { refreshCadPreviewState, type CadPreviewRecovery } from "@/lib/cad-preview-status";

import { preloadAutodeskViewerAssets } from "@/components/autodesk-model-viewer";

export type CadUploadPreviewState =
  | { status: "empty" }
  | { status: "uploading"; fileName: string }
  | { status: "reference_only"; fileName: string; message: string }
  | { status: "configuration_required"; fileName: string; message: string }
  | { status: "processing"; fileName: string; urn: string; progress: string }
  | { status: "ready"; fileName: string; urn: string }
  | { status: "failed"; fileName: string; message: string };

export function CadUploadPreview({
  onMetadata,
  onReplacementFileSelected,
  state,
  onStatus,
  recovery,
}: {
  onMetadata?: (metadata: CadMetadata) => void;
  onReplacementFileSelected?: (file: File | null) => void;
  state: CadUploadPreviewState;
  onStatus: (state: CadUploadPreviewState) => void;
  recovery?: CadPreviewRecovery;
}) {
  const previewStatus = state.status;
  useEffect(() => {
    if (previewStatus === "uploading" || previewStatus === "processing") {
      void preloadAutodeskViewerAssets().catch(() => { /* The viewer retries when the model is ready. */ });
    }
  }, [previewStatus]);

  const onStatusRef = useRef(onStatus);
  useEffect(() => { onStatusRef.current = onStatus; }, [onStatus]);
  const processingUrn = state.status === "processing" ? state.urn : "";
  const processingFileName = state.status === "processing" ? state.fileName : "";
  const recoveryRef = useRef(recovery);
  useEffect(() => { recoveryRef.current = recovery; }, [recovery]);
  useEffect(() => {
    if (!processingUrn) return;
    let cancelled = false;
    let checking = false;
    async function checkStatus() {
      if (checking) return;
      checking = true;
      try {
        const next = await refreshCadPreviewState({ status: "processing", fileName: processingFileName, urn: processingUrn, progress: "pending" }, recoveryRef.current);
        if (!cancelled) onStatusRef.current(next);
      } finally { checking = false; }
    }
    void checkStatus();
    const interval = window.setInterval(() => { void checkStatus(); }, 2000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [processingUrn, processingFileName]);

  if (state.status === "empty") {
    return null;
  }

  if (state.status === "ready") {
    return (
      <div className="mt-4 text-left">
        <ReusableCadViewer urn={state.urn} onMetadata={onMetadata} />
      </div>
    );
  }

  const message =
    state.status === "uploading"
      ? "Uploading the CAD file. You can keep building the RFQ while the preview starts."
      : state.status === "reference_only"
        ? state.message
      : state.status === "configuration_required"
        ? state.message
        : state.status === "processing"
          ? `Autodesk is translating the model in the background. You can keep building and submit the RFQ while this finishes. Progress: ${state.progress}.`
          : state.message;

  const tone = state.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-900";
  const title =
    state.status === "reference_only"
      ? "CAD file reference only"
      : state.status === "configuration_required"
      ? "Autodesk preview setup needed"
      : state.status === "failed"
        ? "3D preview unavailable"
        : state.status === "uploading"
          ? "Starting 3D preview"
          : "3D preview processing";

  return (
    <div className={`mt-4 rounded-xl border p-5 text-left ${tone}`}>
      <div className="flex items-start gap-4">
        <div className="relative h-24 w-28 shrink-0 rounded-lg border border-current/15 bg-white/70">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-[size:14px_14px]" />
          <div className="absolute left-6 top-11 h-8 w-12 skew-y-[-18deg] border border-current/30 bg-current/10" />
          <div className="absolute left-11 top-6 h-8 w-12 skew-y-[24deg] border border-current/30 bg-current/5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs opacity-75">{state.fileName}</p>
          <p className="mt-2 text-sm leading-6 opacity-85">{message}</p>
          {state.status === "reference_only" && onReplacementFileSelected ? (
            <label className="mt-4 inline-flex cursor-pointer rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-900 transition hover:bg-blue-50">
              <span>Upload replacement CAD</span>
              <input
                accept={cadAccept}
                aria-label={`Upload replacement CAD for ${state.fileName}`}
                className="sr-only"
                type="file"
                onChange={(event) =>
                  onReplacementFileSelected(event.target.files?.[0] ?? null)
                }
              />
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
