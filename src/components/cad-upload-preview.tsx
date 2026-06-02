"use client";

import { useEffect } from "react";

import { AutodeskModelViewer } from "@/components/autodesk-model-viewer";

export type CadUploadPreviewState =
  | { status: "empty" }
  | { status: "uploading"; fileName: string }
  | { status: "reference_only"; fileName: string; message: string }
  | { status: "configuration_required"; fileName: string; message: string }
  | { status: "processing"; fileName: string; urn: string; progress: string }
  | { status: "ready"; fileName: string; urn: string }
  | { status: "failed"; fileName: string; message: string };

export function CadUploadPreview({
  onReplacementFileSelected,
  state,
  onStatus,
}: {
  onReplacementFileSelected?: (file: File | null) => void;
  state: CadUploadPreviewState;
  onStatus: (state: CadUploadPreviewState) => void;
}) {
  useEffect(() => {
    if (state.status !== "processing") {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/cad-previews/status?urn=${encodeURIComponent(state.urn)}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to inspect CAD preview");
        }

        if (payload.preview.status === "ready") {
          onStatus({ status: "ready", fileName: state.fileName, urn: state.urn });
        } else if (payload.preview.status === "failed") {
          onStatus({ status: "failed", fileName: state.fileName, message: "Autodesk could not translate this CAD file." });
        } else {
          onStatus({ status: "processing", fileName: state.fileName, urn: state.urn, progress: payload.preview.progress ?? "processing" });
        }
      } catch (caught) {
        onStatus({ status: "failed", fileName: state.fileName, message: caught instanceof Error ? caught.message : "Unable to inspect CAD preview" });
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [onStatus, state]);

  if (state.status === "empty") {
    return null;
  }

  if (state.status === "ready") {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 text-left">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-sm font-semibold text-slate-950">3D preview ready</p>
          <p className="text-xs text-slate-500">{state.fileName}</p>
        </div>
        <AutodeskModelViewer urn={state.urn} />
      </div>
    );
  }

  const message =
    state.status === "uploading"
      ? "Uploading to the CAD preview service."
      : state.status === "reference_only"
        ? state.message
      : state.status === "configuration_required"
        ? state.message
        : state.status === "processing"
          ? `Autodesk is translating the model for browser viewing. Progress: ${state.progress}.`
          : state.message;

  const tone = state.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-900";
  const title =
    state.status === "reference_only"
      ? "CAD file reference only"
      : state.status === "configuration_required"
      ? "Autodesk preview setup needed"
      : state.status === "failed"
        ? "3D preview unavailable"
        : "Preparing 3D preview";

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
                accept=".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt"
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
