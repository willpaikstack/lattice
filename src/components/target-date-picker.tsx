"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && dateKey(date) === value ? date : null;
}
function shiftMonth(date: Date, offset: number) {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth() + offset, 1, 12);
  next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  return next;
}
const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const months = Array.from({ length: 12 }, (_, i) => new Date(2026, i, 1).toLocaleDateString("en-US", { month: "long" }));
const controlClass = "rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";

export function TargetDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => dateKey(parseDate(value) ?? new Date()));
  const [position, setPosition] = useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number } | null>(null);
  const hasPosition = position !== null;
  const selected = parseDate(value);
  const current = parseDate(active) ?? new Date();
  const first = new Date(current.getFullYear(), current.getMonth(), 1, 12);
  const days = Array.from({ length: 42 }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i - first.getDay() + 1, 12));

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }
  function choose(date: string) {
    onChange(date);
    close(true);
  }
  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const upwards = below < 390 && above > below;
      setPosition({ left: rect.left, width: rect.width, ...(upwards ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }), maxHeight: Math.max(100, upwards ? above : below) });
    }
    function outside(event: PointerEvent | FocusEvent) {
      const node = event.target as Node;
      if (!rootRef.current?.contains(node) && !popupRef.current?.contains(node)) setOpen(false);
    }
    place();
    const observer = new ResizeObserver(place);
    if (triggerRef.current) observer.observe(triggerRef.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);
  useEffect(() => {
    if (open && hasPosition) popupRef.current?.querySelector<HTMLButtonElement>(`[data-date="${active}"]`)?.focus();
  }, [open, active, hasPosition]);

  function move(event: KeyboardEvent<HTMLButtonElement>, date: Date) {
    let next = new Date(date);
    switch (event.key) {
      case "ArrowLeft": next.setDate(next.getDate() - 1); break;
      case "ArrowRight": next.setDate(next.getDate() + 1); break;
      case "ArrowUp": next.setDate(next.getDate() - 7); break;
      case "ArrowDown": next.setDate(next.getDate() + 7); break;
      case "Home": next.setDate(next.getDate() - next.getDay()); break;
      case "End": next.setDate(next.getDate() + 6 - next.getDay()); break;
      case "PageUp": next = shiftMonth(date, event.shiftKey ? -12 : -1); break;
      case "PageDown": next = shiftMonth(date, event.shiftKey ? 12 : 1); break;
      default: return;
    }
    event.preventDefault();
    setActive(dateKey(next));
  }
  const today = dateKey(new Date());
  return <div ref={rootRef} className="min-w-0">
    <label id={`${id}-label`} className="mb-2 block text-sm font-medium text-slate-700">Target ship date (optional)</label>
    <button ref={triggerRef} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-calendar` : undefined}
      onClick={() => { setActive(dateKey(selected ?? new Date())); setOpen(!open); }}
      onKeyDown={event => { if (event.key === "Escape") close(true); if (event.key === "ArrowDown") { event.preventDefault(); setActive(dateKey(selected ?? new Date())); setOpen(true); } }}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm outline-none transition hover:border-slate-400 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-200">
      <span id={`${id}-value`} className={selected ? "text-slate-950" : "text-slate-400"}>{selected ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select a date"}</span>
      <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
    </button>
    <p className="mt-2 text-xs leading-5 text-slate-500">Your preferred shipment date. We’ll confirm availability in your quote; transit time is additional.</p>
    {open && position ? createPortal(<div ref={popupRef} id={`${id}-calendar`} role="dialog" aria-label="Choose target ship date" style={position}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); } }}
      className="fixed z-[110] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-[0_12px_36px_rgba(15,23,42,0.14)] sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-1">
        <button type="button" aria-label="Previous month" className={controlClass} onClick={() => setActive(dateKey(shiftMonth(current, -1)))}><ChevronLeft className="h-4 w-4" /></button>
        <div className="flex min-w-0 items-center gap-1">
          <select aria-label="Month" value={current.getMonth()} onChange={event => setActive(dateKey(new Date(current.getFullYear(), Number(event.target.value), 1, 12)))} className="min-w-0 rounded-md bg-white py-2 text-sm font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-slate-400">{months.map((month, index) => <option key={month} value={index}>{month}</option>)}</select>
          <select aria-label="Year" value={current.getFullYear()} onChange={event => setActive(dateKey(new Date(Number(event.target.value), current.getMonth(), 1, 12)))} className="rounded-md bg-white py-2 text-sm font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-slate-400">{Array.from({ length: 21 }, (_, i) => current.getFullYear() - 10 + i).map(year => <option key={year}>{year}</option>)}</select>
        </div>
        <button type="button" aria-label="Next month" className={controlClass} onClick={() => setActive(dateKey(shiftMonth(current, 1)))}><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div role="grid" aria-label={current.toLocaleDateString("en-US", { month: "long", year: "numeric" })}>
        <div role="row" className="mb-1 grid grid-cols-7">{weekdays.map(day => <span key={day} role="columnheader" className="py-2 text-center text-xs font-medium text-slate-400">{day}</span>)}</div>
        {Array.from({ length: 6 }, (_, week) => <div role="row" key={week} className="grid grid-cols-7 gap-1">{days.slice(week * 7, week * 7 + 7).map(date => {
          const key = dateKey(date);
          const chosen = key === value;
          return <button key={key} type="button" role="gridcell" aria-selected={chosen} aria-current={key === today ? "date" : undefined} aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            data-date={key} tabIndex={key === active ? 0 : -1} onKeyDown={event => move(event, date)} onClick={() => choose(key)}
            className={`my-0.5 flex min-h-9 items-center justify-center rounded-full py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 ${chosen ? "bg-[#171717] font-semibold text-white" : `${date.getMonth() === current.getMonth() ? "text-slate-800" : "text-slate-300"} hover:bg-slate-100 ${key === today ? "font-semibold ring-1 ring-inset ring-slate-300" : ""}`}`}>
            {date.getDate()}
          </button>;
        })}</div>)}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
        <button type="button" onClick={() => choose("")} className={`${controlClass} text-sm`}>Clear date</button>
        <button type="button" onClick={() => choose(today)} className="rounded-lg bg-[#171717] px-3 py-2 text-sm font-medium text-white hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500">Today</button>
      </div>
    </div>, document.body) : null}
  </div>;
}
