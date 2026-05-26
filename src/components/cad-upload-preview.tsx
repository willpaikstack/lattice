"use client";

import { useEffect } from "react";

import { AutodeskModelViewer } from "@/components/autodesk-model-viewer";

export type CadUploadPreviewState =
  | { status: "empty" }
  | { status: "uploading"; fileName: string }
  | { status: "configuration_required"; fileName: string; message: string }
  | { status: "processing"; fileName: string; urn: string; progress: string }
  | { status: "ready"; fileName: string; urn: string }
  | { status: "failed"; fileName: string; message: string };

export function CadUploadPreview({
  state,
  onStatus,
}: {
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
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-left">
        <p className="text-sm font-semibold text-slate-950">3D preview</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select a CAD file to generate an interactive model preview before submitting the RFQ.
        </p>
      </div>
    );
  }

  if (state.status === "ready") {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-left">
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
      : state.status === "configuration_required"
        ? state.message
        : state.status === "processing"
          ? `Autodesk is translating the model for browser viewing. Progress: ${state.progress}.`
          : state.message;

  const tone = state.status === "failed" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-100 bg-blue-50 text-blue-900";
  const title =
    state.status === "configuration_required"
      ? "Autodesk preview setup needed"
      : state.status === "failed"
        ? "3D preview unavailable"
        : "Preparing 3D preview";

  return (
    <div className={`mt-6 rounded-xl border p-5 text-left ${tone}`}>
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-20 shrink-0 rounded-lg border border-current/15 bg-white/70">
          <div className="absolute left-5 top-6 h-7 w-9 skew-y-[-18deg] border border-current/30 bg-current/10" />
          <div className="absolute left-8 top-3 h-7 w-9 skew-y-[24deg] border border-current/30 bg-current/5" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs opacity-75">{state.fileName}</p>
          <p className="mt-2 text-sm leading-6 opacity-85">{message}</p>
        </div>
      </div>
    </div>
  );
}
