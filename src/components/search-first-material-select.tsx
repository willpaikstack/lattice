"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { canonicalMaterialValue, searchRfqMaterials } from "@/lib/rfq-material-search";
import type { RfqOption } from "@/lib/rfq-options";

type MaterialOption = RfqOption & { category: string; subgroup: string };
const quickFamilies = ["All", "Aluminum", "Steel", "Stainless steel", "Plastics"];
function matchesFamily(option: MaterialOption, family: string) {
  if (family === "All") return true;
  if (family === "Steel") return /^(Alloy steel|Mild steel|Tool steel)$/.test(option.category);
  if (family === "Plastics") return /plastic|polymer|composite/i.test(String(option.metadata?.family ?? "")) || /^(Polyethylene|Polypropylene|POM|Nylon|PEI|PEEK|Other Plastics)/.test(option.category);
  return option.category === family;
}
function identity(option: MaterialOption) {
  const uns = String(option.metadata?.unsNumber ?? "").replace(/^UNS[:\s]*/, "");
  return uns && uns !== "N/A" ? `UNS ${uns}` : option.subgroup;
}

export function SearchFirstMaterialSelect({ value, options, onChange }: { value: string; options: MaterialOption[]; onChange: (value: string) => void }) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("All");
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [position, setPosition] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
  const selectedValue = canonicalMaterialValue(value);
  const selected = options.find(option => option.value === selectedValue);
  const categories = useMemo(() => Array.from(new Set(options.map(option => option.category))), [options]);
  const results = useMemo(() => searchRfqMaterials(options, query).filter(option => matchesFamily(option, family)), [options, query, family]);
  const active = results.find(option => option.value === activeValue)?.value ?? results[0]?.value;
  const positioned = position !== null;

  function close(restore = false) {
    setOpen(false); setQuery(""); setFamily("All"); setActiveValue(null);
    if (restore) triggerRef.current?.focus();
  }
  function choose(next: string) { onChange(next); close(true); }
  function toggle() {
    if (open) { close(true); return; }
    setActiveValue(selectedValue || null); setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const upwards = below < 420 && above > below;
      setPosition({ left: rect.left, width: rect.width, ...(upwards ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }), maxHeight: Math.max(140, Math.min(520, upwards ? above : below)) });
    }
    function outside(event: Event) {
      const node = event.target as Node;
      if (!rootRef.current?.contains(node) && !panelRef.current?.contains(node)) { setOpen(false); setQuery(""); setFamily("All"); setActiveValue(null); }
    }
    place();
    const observer = new ResizeObserver(place);
    if (triggerRef.current) observer.observe(triggerRef.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    return () => {
      observer.disconnect(); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside, true); document.removeEventListener("focusin", outside);
    };
  }, [open]);
  useEffect(() => { if (open && positioned) searchRef.current?.focus(); }, [open, positioned]);
  useEffect(() => {
    if (open && active) document.getElementById(`${id}-option-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [id, open, active]);

  return <div ref={rootRef} className="grid min-w-0 gap-2 text-sm text-slate-700">
    <span id={`${id}-label`} className="font-medium">Material<span className="ml-1 text-[#d4183d]">*</span></span>
    <button ref={triggerRef} type="button" aria-label="Material dropdown" aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? `${id}-panel` : undefined}
      onClick={toggle} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); setActiveValue(selectedValue || null); setOpen(true); } }}
      className={`flex min-h-[54px] w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-left outline-none transition hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-slate-300 ${open ? "border-slate-500" : "border-slate-200"}`}>
      <span className="min-w-0"><span className={`block break-words text-[15px] font-semibold ${selected ? "text-slate-950" : "text-slate-400"}`}>{selected?.label ?? "Select a material"}</span>
        {selected ? <span className="mt-0.5 block text-xs font-normal text-slate-500">{identity(selected)}</span> : null}
      </span><ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
    </button>
    {open && position ? createPortal(<div ref={panelRef} id={`${id}-panel`} role="dialog" aria-label="Choose material" style={position}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); } }}
      className="fixed z-[110] flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
      <div className="shrink-0 border-b border-slate-100 p-3">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 focus-within:border-slate-400">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
          <input ref={searchRef} role="combobox" aria-label="Search materials" aria-autocomplete="list" aria-expanded={true} aria-controls={`${id}-results`} aria-activedescendant={active ? `${id}-option-${active}` : undefined}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Search grade, UNS, or family" value={query}
            onChange={event => { setQuery(event.target.value); setActiveValue(null); }}
            onKeyDown={event => {
              if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                event.preventDefault(); const index = results.findIndex(option => option.value === active);
                const next = event.key === "Home" ? 0 : event.key === "End" ? results.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length;
                setActiveValue(results[next]?.value ?? null);
              }
              if (event.key === "Enter") { event.preventDefault(); if (active) choose(active); }
            }} />
          {query ? <button type="button" aria-label="Clear material search" onClick={() => { setQuery(""); setActiveValue(null); searchRef.current?.focus(); }} className="rounded p-1 text-slate-400 hover:text-slate-800"><X className="h-4 w-4" /></button> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Material family filters">
          {quickFamilies.map(name => <button key={name} type="button" aria-pressed={family === name} onClick={() => { setFamily(name); setActiveValue(null); }} className={`rounded-full border px-2.5 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${family === name ? "border-[#171717] bg-[#171717] text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{name === "Stainless steel" ? "Stainless" : name}</button>)}
          <select aria-label="Other material families" value={quickFamilies.includes(family) ? "" : family} onChange={event => { setFamily(event.target.value || "All"); setActiveValue(null); }} className="min-w-0 max-w-full rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
            <option value="">More families</option>{categories.filter(name => !quickFamilies.includes(name)).map(name => <option key={name}>{name}</option>)}
          </select>
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-xs text-slate-400">{results.length} matching {results.length === 1 ? "grade" : "grades"}</p>
      </div>
      <div id={`${id}-results`} role="listbox" aria-label="Material grades" className="min-h-0 flex-1 overflow-y-auto py-1">
        {results.map(option => <button key={option.value} id={`${id}-option-${option.value}`} type="button" role="option" aria-selected={option.value === selectedValue}
          onMouseEnter={() => setActiveValue(option.value)} onFocus={() => setActiveValue(option.value)} onClick={() => choose(option.value)}
          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400 ${option.value === selectedValue || active === option.value ? "bg-slate-50" : "hover:bg-slate-50"}`}>
          <span className="min-w-0"><span className="block text-sm font-semibold text-slate-950">{option.label}</span><span className="mt-0.5 block text-xs text-slate-500">{identity(option)}</span></span>
          {option.value === selectedValue ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-950" /> : null}
        </button>)}
        {!results.length ? <div className="px-4 py-5 text-sm text-slate-500">No matching grades. <button type="button" className="underline underline-offset-2" onClick={() => { setQuery(""); setFamily("All"); setActiveValue(null); searchRef.current?.focus(); }}>Reset search</button></div> : null}
      </div>
      <div className="shrink-0 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Can’t find your grade? <a href="/materials/inquiry" target="_blank" rel="noopener noreferrer" aria-label="Request a custom material (opens in a new tab)" className="text-slate-700 underline underline-offset-2">Request a custom material</a></div>
    </div>, document.body) : null}
  </div>;
}
