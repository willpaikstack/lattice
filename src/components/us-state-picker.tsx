"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usStates } from "@/lib/us-address-options";

type USStatePickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function USStatePicker({ value, onChange }: USStatePickerProps) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const options = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const sorted = [...usStates].sort((a, b) => a[1].localeCompare(b[1]));
    const hasSavedLegacyValue = Boolean(value) && !usStates.some(([code, name]) => code.toLowerCase() === value.toLowerCase() || name.toLowerCase() === value.toLowerCase());
    const allOptions = hasSavedLegacyValue ? [[value, value] as [string, string], ...sorted] : sorted;
    return allOptions.filter(([code, name]) => !normalizedQuery || name.toLocaleLowerCase().includes(normalizedQuery) || code.toLocaleLowerCase().includes(normalizedQuery));
  }, [query, value]);
  const selected = usStates.find(([code, name]) => code.toLowerCase() === value.toLowerCase() || name.toLowerCase() === value.toLowerCase());
  const selectedName = selected?.[1] ?? value;
  const selectedCode = selected?.[0] ?? value;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  useEffect(() => {
    if (activeIndex < 0) return;
    document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, id]);

  function choose(code: string) {
    onChange(code);
    setOpen(false);
    setQuery("");
    trigger.current?.focus();
  }

  function openMenu() {
    setQuery("");
    const sortedStates = [...usStates].sort((a, b) => a[1].localeCompare(b[1]));
    const hasSavedLegacyValue = Boolean(value) && !selected;
    const selectedIndex = hasSavedLegacyValue ? 0 : sortedStates.findIndex(([code]) => code === selected?.[0]) + (hasSavedLegacyValue ? 1 : 0);
    setActiveIndex(Math.max(0, selectedIndex));
    setOpen(true);
  }

  return <div className="relative mt-2" ref={root}>
    <button
      aria-expanded={open}
      aria-controls={open ? `${id}-options` : undefined}
      aria-haspopup="listbox"
      aria-label={`State${selectedName ? `, ${selectedName}` : ""}`}
      className="flex min-h-[38px] w-full items-center justify-between gap-3 rounded-md border border-[#cfd5dd] bg-white px-3 py-2 text-left text-[14px] font-normal text-[#202020] shadow-sm outline-none transition hover:border-[#9ca3af] focus:border-[#3b5bdb] focus:ring-2 focus:ring-[#dbe5ff]"
      onClick={() => { if (open) setOpen(false); else openMenu(); }}
      onKeyDown={(event) => { if (event.key === "ArrowDown" && !open) { event.preventDefault(); openMenu(); } }}
      ref={trigger}
      type="button"
    >
      <span className={selectedName ? "truncate" : "truncate text-[#8a919c]"}>{selectedName || "Select a state"}</span>
      <svg aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#687181] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 20 20">
        <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      </svg>
    </button>
    {open ? <div className="absolute z-30 mt-1 w-full min-w-[240px] overflow-hidden rounded-lg border border-[#d8dce2] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
      <div className="border-b border-[#e5e7eb] p-2.5">
        <label className="sr-only" htmlFor={`${id}-search`}>Search states</label>
        <input
          autoFocus
          aria-activedescendant={options.length && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
          aria-controls={`${id}-options`}
          aria-expanded="true"
          aria-label="Search states"
          className="h-9 w-full rounded-md border border-[#cfd5dd] bg-white px-3 text-[13px] font-normal text-[#202020] outline-none placeholder:text-[#8a919c] focus:border-[#3b5bdb] focus:ring-2 focus:ring-[#dbe5ff]"
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => options.length ? (index + 1) % options.length : -1); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => options.length ? (index <= 0 ? options.length - 1 : index - 1) : -1); }
            if (event.key === "Enter" && options[activeIndex]) { event.preventDefault(); choose(options[activeIndex][0]); }
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); setQuery(""); trigger.current?.focus(); }
            if (event.key === "Tab") setOpen(false);
          }}
          placeholder="Search states"
          role="combobox"
          type="search"
          value={query}
        />
      </div>
      <div aria-label="U.S. states and territories" className="max-h-64 overflow-y-auto p-1" id={`${id}-options`} role="listbox">
        {options.length ? options.map(([code, name], index) => {
          const isSelected = code === selectedCode;
          const isActive = activeIndex === index;
          return <div
            aria-selected={isSelected}
            className={`flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-[13px] transition-colors ${isActive ? "bg-[#edf2ff] text-[#243b80]" : "text-[#303846] hover:bg-[#f6f7f9]"}`}
            id={`${id}-option-${index}`}
            key={code}
            onClick={() => choose(code)}
            onMouseMove={() => setActiveIndex(index)}
            role="option"
          >
            <span>{name}</span>
            <span className="flex items-center gap-2 text-xs text-[#737b86]">
              {code}
              {isSelected ? <svg aria-hidden="true" className="h-4 w-4 text-[#3b5bdb]" fill="none" viewBox="0 0 20 20"><path d="m4.5 10.5 3.7 3.7 7.3-8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg> : null}
            </span>
          </div>;
        }) : <p className="px-3 py-4 text-center text-xs text-[#737b86]">No matching state</p>}
      </div>
      <p className="border-t border-[#e5e7eb] px-3 py-2 text-[10px] text-[#737b86]">U.S. states and territories</p>
    </div> : null}
  </div>;
}
