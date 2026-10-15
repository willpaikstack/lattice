"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { UploadedFile } from "@/lib/request-model";
import { localCadFileUrl } from "@/lib/cad-demo";
import { LocalCadPreview } from "./local-cad-preview";

type SavedModel = Pick<UploadedFile, "name" | "sizeBytes" | "storageKey">;

export function SavedLocalCadPreview({ file }: { file: SavedModel }) {
  if (!file.storageKey) return <p className="p-5 text-sm text-slate-600">The original file is unavailable for preview.</p>;
  return <LocalCadPreview name={file.name} sizeBytes={file.sizeBytes} storageKey={file.storageKey} url={localCadFileUrl(file.storageKey, file.name)} />;
}

/** Load geometry only when requested, keeping RFQ lists light on browser memory. */
export function LocalCadPreviewButton({ file }: { file: SavedModel }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => { if (open) dialog.current?.showModal(); }, [open]);
  return <>
    <button type="button" className="w-full border-t border-slate-200 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50" onClick={() => setOpen(true)} aria-label={`View 3D model: ${file.name}`}>View 3D</button>
    {open ? <dialog ref={dialog} aria-labelledby={title} onClose={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) dialog.current?.close(); }} className="fixed inset-0 m-auto max-h-[90vh] w-[min(94vw,900px)] overflow-auto rounded-xl border border-slate-200 bg-white p-0 text-left shadow-xl backdrop:bg-black/50">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 p-4"><h2 id={title} className="break-all text-sm font-semibold">{file.name}</h2><button type="button" onClick={() => dialog.current?.close()} className="rounded border px-3 py-1 text-sm">Close</button></header>
      <SavedLocalCadPreview file={file} />
    </dialog> : null}
  </>;
}
