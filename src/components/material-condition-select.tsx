"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { canonicalMaterialValue } from "@/lib/rfq-material-search";
import { otherMaterialInstructions, otherMaterialValue } from "@/lib/rfq-options";
import { materialBrowseChoices, materialGradeChoices, materialOfferingFor, materialOfferings, materialSearchChoices, materialSelectionError, materialVariantFor, searchMaterialOfferings, type MaterialSearchChoice } from "@/lib/material-quote-offerings";

const families = [...new Set(materialOfferings.map((offering) => offering.family))];
const nativeOptions = materialSearchChoices;
const materialCountsByFamily = new Map(families.map((name) => [
  name,
  materialBrowseChoices.filter((option) => option.category === name).length,
]));

// Show existing RFQ references and verified catalog UNS/composition independently
// of sourcing status. Never invent identifiers or compositions for missing data.
function materialReferenceDetails(option?: Pick<MaterialSearchChoice, "metadata">) {
  if (option?.metadata?.requiresMaterialNotes) return otherMaterialInstructions;
  const uns = String(option?.metadata?.unsNumber ?? "").replace(/^UNS[:\s]+/i, "").trim();
  const composition = String(option?.metadata?.compositionFormula ?? option?.metadata?.composition ?? "").trim();
  const details = [
    uns && !/^(?:N\/?A|unknown|pending)$/i.test(uns) ? `UNS: ${uns}` : "",
    composition && !/^(?:N\/?A|unknown|composition pending)$/i.test(composition) ? composition
      : option?.metadata?.compositionStatus === "needs-specification" ? "Composition needs specification" : "",
  ].filter(Boolean);
  return details.length ? details.join(" | ") : "Reference data not listed";
}

function materialReferenceExplanation(option?: Pick<MaterialSearchChoice, "metadata">) {
  return [option?.metadata?.composition, option?.metadata?.compositionBasis, option?.metadata?.compositionNote].filter(Boolean).join(" — ") || undefined;
}

function MaterialResults({ id, options, value, activeValue, onChoose, onHighlight }: {
  id: string; options: MaterialSearchChoice[]; value: string; activeValue?: string;
  onChoose: (value: string) => void; onHighlight: (value: string) => void;
}) {
  return <div id={`${id}-results`} role="listbox" aria-label="Material grades" className="py-1">
    {options.map((option) => <button id={`${id}-${option.value}`} key={option.value} type="button" role="option" aria-label={`${option.label} ${option.description ?? option.category}`}
      aria-selected={canonicalMaterialValue(value) === option.value}
      onClick={() => onChoose(option.value)} onMouseEnter={() => onHighlight(option.value)}
      className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left ${activeValue === option.value ? "bg-slate-100" : "hover:bg-slate-50"}`}>
      <span className="min-w-0"><span className="block text-sm font-semibold text-slate-950">{option.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500" title={materialReferenceExplanation(option)}>{materialReferenceDetails(option)}</span>{option.sourcing ? <span className="mt-1 block text-xs text-slate-600">Sourcing review required</span> : null}</span>
      {canonicalMaterialValue(value) === option.value ? <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
    </button>)}
    {!options.length ? <p className="px-4 py-5 text-sm text-slate-600">No matching materials. Choose Other below and specify the material in Manufacturing notes.</p> : null}
  </div>;
}

export function MaterialConditionSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const offering = materialOfferingFor(value);
  const variant = materialVariantFor(value);
  const selectedChoice = materialSearchChoices.find((option) => option.value === canonicalMaterialValue(value)) ?? (offering ? materialGradeChoices.find((option) => materialOfferingFor(option.value)?.value === offering.value) : undefined);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState<string | null>(offering?.family ?? families[0]);
  const [active, setActive] = useState<string | undefined>();
  const [position, setPosition] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
  const results = query.trim() ? searchMaterialOfferings(query) : materialBrowseChoices.filter((option) => option.category === family);
  const activeValue = results.some((option) => option.value === active) ? active : results[0]?.value;
  const selectionError = materialSelectionError(value);

  function close(restore = true) {
    setOpen(false); setQuery(""); setActive(undefined);
    if (restore) trigger.current?.focus();
  }
  function choose(next: string) { onChange(next); close(); }
  function toggle() {
    if (open) close();
    else { if (offering) setFamily(offering.family); setOpen(true); }
  }
  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const up = below < 400 && above > below;
      setPosition({ left: Math.max(8, rect.left), width: Math.min(rect.width, window.innerWidth - 16), ...(up ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }), maxHeight: Math.max(120, Math.min(520, up ? above : below)) });
    }
    function outside(event: Event) {
      const node = event.target as Node;
      if (!trigger.current?.contains(node) && !panel.current?.contains(node)) { setOpen(false); setQuery(""); setActive(undefined); }
    }
    place();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place);
    if (trigger.current) observer?.observe(trigger.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside, true);
    return () => { observer?.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); document.removeEventListener("pointerdown", outside, true); };
  }, [open]);
  const positioned = position !== null;
  useEffect(() => { if (open && positioned) input.current?.focus(); }, [open, positioned]);
  useEffect(() => { if (open && activeValue) document.getElementById(`${id}-${activeValue}`)?.scrollIntoView?.({ block: "nearest" }); }, [open, activeValue, id]);


  return <div className="grid min-w-0 gap-4 text-sm text-slate-700">
    <div className="grid min-w-0 gap-2">
      <span className="font-medium">Material<span className="ml-1 text-[#d4183d]">*</span></span>
      <select aria-label="Material" className="sr-only" tabIndex={-1} value={canonicalMaterialValue(value)} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select a material</option>
        {nativeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        {value && !nativeOptions.some((option) => option.value === canonicalMaterialValue(value)) ? <option value={canonicalMaterialValue(value)}>{variant?.label ?? offering?.label ?? value}</option> : null}
      </select>
      <button ref={trigger} type="button" aria-label="Material dropdown" aria-expanded={open} aria-haspopup="dialog" onClick={toggle}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}
        className="flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[14px] border border-slate-200 bg-white px-5 py-3 text-left outline-none hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500">
        <span className="min-w-0"><span className="block break-words text-[15px] font-semibold text-slate-950">{selectedChoice?.label ?? offering?.label ?? (value ? value : "Select a material")}</span>{offering ? <span className="mt-1 block text-xs text-slate-500" title={materialReferenceExplanation(selectedChoice)}>{materialReferenceDetails(selectedChoice)}</span> : null}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
    </div>
    {variant?.description && value !== otherMaterialValue ? <p className="text-xs leading-5 text-slate-600">{variant.description}</p> : null}
    {offering && selectionError === "Select a material condition" ? <p className="text-xs text-slate-600">Choose the material and temper required by your drawing from the material dropdown.</p> : null}
    {open && position ? createPortal(<div ref={panel} role="dialog" aria-label="Choose material" style={position} className="fixed z-[110] flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
      onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } }}>
      <div className="shrink-0 border-b border-slate-200 p-3">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3"><Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input ref={input} role="combobox" aria-label="Search materials" aria-expanded="true" aria-autocomplete="list" aria-controls={query.trim() || family !== null ? `${id}-results` : undefined} aria-activedescendant={activeValue ? `${id}-${activeValue}` : undefined}
            placeholder="Search grade, alloy, or family..." value={query} onChange={(event) => { setQuery(event.target.value); setActive(undefined); }} className="h-11 min-w-0 flex-1 bg-transparent outline-none"
            onKeyDown={(event) => {
              if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                event.preventDefault(); if (!results.length) return;
                const index = results.findIndex((option) => option.value === activeValue);
                const next = event.key === "Home" ? 0 : event.key === "End" ? results.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
                setActive(results[next]?.value);
              }
              if (event.key === "Enter") { event.preventDefault(); if (activeValue) choose(activeValue); }
            }} />
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-xs text-slate-600">{!query.trim() && family === null ? "Choose a material family" : `${results.length} matching ${results.length === 1 ? "material" : "materials"}`}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {query.trim() ? <MaterialResults id={id} options={results} value={value} activeValue={activeValue} onChoose={choose} onHighlight={setActive} /> : families.map((name) => <section key={name}>
          <button type="button" aria-label={`${name}, ${materialCountsByFamily.get(name) ?? 0} materials`} aria-expanded={family === name} onClick={() => { setFamily((current) => current === name ? null : name); setActive(undefined); }} className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-900">
            <span>{name}</span>
            <span className="flex items-center gap-3"><span aria-hidden="true" className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{materialCountsByFamily.get(name) ?? 0}</span><ChevronDown aria-hidden="true" className={`h-4 w-4 ${family === name ? "rotate-180" : ""}`} /></span>
          </button>
          {family === name ? <MaterialResults id={id} options={results} value={value} activeValue={activeValue} onChoose={choose} onHighlight={setActive} /> : null}
        </section>)}
      </div>
      <div className="shrink-0 border-t border-slate-200 p-3 text-xs text-slate-600">Material not listed? <button type="button" className="font-medium text-blue-700 underline underline-offset-2" onClick={() => choose(otherMaterialValue)}>Select Other</button><p className="mt-1">{otherMaterialInstructions}</p></div>
    </div>, document.body) : null}
  </div>;
}
