"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileUp, Trash2, X } from "lucide-react";
import { useDialogFocus } from "./use-dialog-focus";

export function ExportRestrictionsDialog({ files, initialStatus, initialEndUse = "", quoteEndUse, isNewSelection, onRemoveFile, onClose, onConfirm }: {
  files: string[];
  initialStatus: string;
  initialEndUse?: string;
  quoteEndUse?: string;
  isNewSelection: boolean;
  onRemoveFile?: (index: number) => void;
  onClose: () => void;
  onConfirm: (status: string, intendedUse?: { endUse: string; endUseNotes: string }) => void;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>();
  const titleId = useId();
  const descriptionId = useId();
  const [status, setStatus] = useState(initialStatus === "unrestricted" || initialStatus === "restricted" ? initialStatus : "unconfirmed");
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [page, setPage] = useState<"restrictions" | "intended-use">("restrictions");
  const [endUse, setEndUse] = useState(["prototype", "commercial"].includes(initialEndUse) ? initialEndUse : "");
  const questionRef = useRef<HTMLLegendElement>(null);
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current !== page) questionRef.current?.focus();
    previousPage.current = page;
  }, [page]);
  const isIntendedUse = page === "intended-use";
  const intendedUseComplete = ["prototype", "commercial"].includes(endUse);
  const endUseMismatch = isIntendedUse && intendedUseComplete && Boolean(quoteEndUse) && endUse !== quoteEndUse;
  const restrictionChoices = [
    ["unrestricted", "No, this quote does not include parts subject to export control regulations.", "These parts and files are not subject to ITAR, EAR, dual-use, military/defense or firearms regulations, or considered Controlled Unclassified Information (CUI). They have no U.S.-only or other restricted handling requirements."],
    ["restricted", "Yes, parts in this quote are subject to export control regulations.", "These parts or files are subject to ITAR, EAR, dual-use, military/defense or firearms regulations, or considered Controlled Unclassified Information (CUI), or have U.S.-only or other restricted handling requirements."],
  ];
  const choices = isIntendedUse ? [
    ["prototype", "Prototype", "I will use exclusively for development, testing, product evaluation or quality control."],
    ["commercial", "Commercial", "I intend to incorporate these components into products that are sold for commercial use."],
  ] : restrictionChoices;
  const selectedValue = isIntendedUse ? endUse : status;
  const selectRestrictionStatus = (value: string) => {
    setStatus(value);
    if (value === "unrestricted" && isNewSelection) setPage("intended-use");
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-6" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} tabIndex={-1}
      onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}
      className="flex max-h-[calc(100dvh-24px)] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 id={titleId} className="text-xl font-semibold text-slate-950">{isNewSelection ? "Start a New Quote" : "Export restrictions"}</h2>
        <button type="button" aria-label={isIntendedUse ? "Close intended use" : "Close export restrictions"} onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
      </header>
      <div className="min-h-0 overflow-y-auto px-5 pb-2 sm:px-6">
        <fieldset className="mt-4 space-y-3">
          <legend ref={questionRef} tabIndex={-1} className="mb-3 text-base font-semibold text-slate-950 outline-none">{isIntendedUse ? "How will the parts in this quote be used?" : "Are any parts in this quote subject to ITAR or other U.S. export restrictions?"}</legend>
          {!isIntendedUse ? <p id={descriptionId} className="mb-4 text-sm leading-6 text-slate-500">Certain parts may be subject to various US regulations. <a href="https://www.pmddtc.state.gov/ddtc_public?id=ddtc_public_portal_itar_landing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600">Learn more about export controls.</a></p> : <p id={descriptionId} className="text-sm leading-6 text-slate-500">This classification is required for us to determine accurate pricing and any import considerations.</p>}
          {choices.map(([value, label, detail]) => <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm leading-6 transition ${selectedValue === value ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-400"}`}>
            <input type="radio" name={isIntendedUse ? "intended-use" : "export-restrictions"} value={value} checked={selectedValue === value} onChange={() => isIntendedUse ? setEndUse(value) : selectRestrictionStatus(value)} className="mt-1 h-4 w-4 shrink-0 accent-blue-600" />
            <span><span className="block font-medium text-slate-950">{label}</span><span className="text-slate-600">{detail}</span></span>
          </label>)}
        </fieldset>
        {!isIntendedUse && status === "restricted" ? <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          Lattice cannot accept export-controlled or restricted-handling parts through this quoting workflow. Do not upload restricted files.
        </p> : null}
        {endUseMismatch ? <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
          <p>This quote is configured for {quoteEndUse === "prototype" ? "prototype" : "commercial"} use. Upload this {endUse === "prototype" ? "prototype" : "commercial"} part in a new quote. Parts with different intended uses need separate quotes.</p>
          <p className="mt-2">Your current quote progress is saved as a draft. The new quote opens in another tab, so you can return to this quote and continue where you left off.</p>
          <a href="/requests/new" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-sm font-semibold text-white hover:bg-black">Request a new quote<span className="sr-only"> (opens in a new tab)</span></a>
        </div> : null}
        <section aria-label={isNewSelection ? "Selected CAD files" : "Quote CAD files"} className="mt-5">
          <ul className="space-y-2">{(showAllFiles ? files : files.slice(0, 2)).map((name, index) => <li key={`${index}:${name}`} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <FileUp aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-400" />
            <span className="min-w-0 flex-1 break-words text-sm text-slate-700">{name}</span>
            {onRemoveFile ? <button type="button" aria-label={`Remove ${name}`} onClick={() => onRemoveFile(index)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-red-600"><Trash2 className="h-4 w-4" /></button> : null}
          </li>)}</ul>
          {files.length > 2 ? <button type="button" aria-expanded={showAllFiles} onClick={() => setShowAllFiles(value => !value)} className="mt-2 w-full py-2 text-sm font-medium text-blue-600">{showAllFiles ? "Show fewer files" : `View all ${files.length} files`}</button> : null}
          {!files.length ? <p role="status" className="text-sm text-slate-500">No files selected. Go back to choose CAD files.</p> : null}
        </section>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 px-5 py-5 sm:px-6">
        <button type="button" onClick={() => isIntendedUse ? setPage("restrictions") : onClose()} className="rounded-md px-2 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">‹ Back</button>
        {isIntendedUse ? <button type="button" disabled={(isNewSelection && !files.length) || status !== "unrestricted" || !intendedUseComplete || endUseMismatch} onClick={() => { if (endUseMismatch) return; onConfirm(status, { endUse, endUseNotes: "" }); }} className="rounded-md bg-[#171717] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">
          Continue
        </button> : null}
      </footer>
    </div>
  </div>;
}
