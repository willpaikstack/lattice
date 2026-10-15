"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CAD_DEMO_MAX_BYTES, type CadDemoModel } from "@/lib/cad-demo";
import { loadLocalCadFile } from "@/lib/local-cad-loader";
import type { CadMetadata } from "@/lib/rfq-manufacturing";
import { saveLocalCadThumbnail } from "@/lib/local-cad-thumbnail";

const Scene = dynamic(() => import("./cad-demo-scene"), { ssr: false, loading: () => <p role="status">Starting 3D viewer…</p> });

export function LocalCadPreview({ file, url, name, sizeBytes, onMetadata, storageKey, onThumbnailSaved, onError }: {
  file?: File; url?: string; name: string; sizeBytes?: number;
  onMetadata?: (metadata: CadMetadata) => void;
  storageKey?: string;
  onThumbnailSaved?: (saved: boolean) => void;
  onError?: () => void;
}) {
  const [thumbnail, setThumbnail] = useState<{ image: Blob; source?: File | string } | null>(null);
  const callbacks = useRef({ onThumbnailSaved, onError });
  useEffect(() => { callbacks.current = { onThumbnailSaved, onError }; }, [onThumbnailSaved, onError]);
  useEffect(() => {
    if (!storageKey || !thumbnail || thumbnail.source !== (file ?? url)) return;
    const abort = new AbortController();
    void saveLocalCadThumbnail(storageKey, thumbnail.image, abort.signal).then(
      () => { if (!abort.signal.aborted) callbacks.current.onThumbnailSaved?.(true); },
      () => { if (!abort.signal.aborted) callbacks.current.onThumbnailSaved?.(false); },
    );
    return () => abort.abort();
  }, [storageKey, thumbnail, file, url]);
  const [state, setState] = useState<{ model?: CadDemoModel; error?: string; cancelled?: boolean; source?: File | string }>({});
  const controller = useRef<AbortController | null>(null);
  const metadataCallback = useRef(onMetadata);
  useEffect(() => { metadataCallback.current = onMetadata; }, [onMetadata]);
  useEffect(() => {
    const abort = new AbortController();
    controller.current = abort;
    let active = true;
    queueMicrotask(() => { if (active) setState({ source: file ?? url }); });
    async function open() {
      try {
        if ((sizeBytes ?? file?.size ?? 0) > CAD_DEMO_MAX_BYTES) throw new Error("Maximum CAD file size is 200 MB per file.");
        let source = file;
        if (!source) {
          if (!url) throw new Error("The original file is unavailable. Upload a replacement to preview it.");
          const response = await fetch(url, { signal: abort.signal, cache: "no-store" });
          if (!response.ok) throw new Error("Unable to open this saved model. The file may no longer be available to your account.");
          if (Number(response.headers.get("Content-Length")) > CAD_DEMO_MAX_BYTES) throw new Error("Maximum CAD file size is 200 MB per file.");
          source = new File([await response.arrayBuffer()], name);
        }
        const model = await loadLocalCadFile(source, abort.signal);
        if (!active) return;
        setState({ model, source: file ?? url });
        // Unitless STL/OBJ must never be persisted as millimeter measurements.
        if (model.dimensionsUnit === "mm") {
          const low = [Infinity, Infinity, Infinity], high = [-Infinity, -Infinity, -Infinity];
          for (const mesh of model.meshes) {
            const values = mesh.attributes.position.array;
            for (let i = 0; i < values.length; i++) { const axis = i % 3; low[axis] = Math.min(low[axis], values[i]); high[axis] = Math.max(high[axis], values[i]); }
          }
          const dimensionsMm = high.map((value, axis) => value - low[axis]) as [number, number, number];
          if (dimensionsMm.every(value => Number.isFinite(value) && value >= 0)) metadataCallback.current?.({ dimensionsMm, sourceUnit: /\.(gltf|glb)$/i.test(name) ? "m" : "Not reported; normalized to mm" });
        }
      } catch (caught) {
        if (active && !abort.signal.aborted) {
          setState({ error: caught instanceof Error ? caught.message : "Unable to open the model.", source: file ?? url });
          callbacks.current.onError?.();
        }
      }
    }
    void open();
    return () => { active = false; abort.abort(); };
  }, [file, url, name, sizeBytes]);

  const current = state.source === (file ?? url) ? state : {};
  if (current.model) return <Scene model={current.model} onThumbnail={image => setThumbnail({ image, source: file ?? url })} onError={() => callbacks.current.onError?.()} />;
  if (current.error || current.cancelled) return <div className="rounded-md border border-slate-200 bg-slate-50 p-5 text-sm" role="status"><p>{current.error || "Preview cancelled. The original file remains attached."}</p>{current.error ? <p className="mt-2 text-slate-600">3D preview unavailable. The original file remains attached to the RFQ.</p> : null}</div>;
  return <div className="flex min-h-64 flex-col items-center justify-center gap-3 bg-slate-50 p-5 text-sm" role="status"><p>Opening 3D model…</p><button type="button" className="rounded border bg-white px-3 py-2" onClick={() => { controller.current?.abort(); setState({ cancelled: true, source: file ?? url }); }}>Cancel preview</button></div>;
}
