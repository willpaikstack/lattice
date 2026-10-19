"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AccountAddress } from "@/lib/account-settings-shared";
import { canSearchStreet, type StreetAddressSuggestion, type StreetLookupFailure } from "@/lib/street-address";

const lookupFailureMessages: Record<StreetLookupFailure, string> = {
  not_configured: "Street address suggestions are not enabled yet. You can enter your address manually.",
  credentials: "Address lookup needs attention. You can enter your address manually.",
  quota: "The address search limit has been reached. You can enter your address manually.",
  timeout: "The address search took too long. Try again, add your city or ZIP, or enter the address manually.",
  unavailable: "Address lookup is temporarily unavailable. You can try again or enter your address manually.",
};

type LookupStatus = "idle" | "more_input" | "loading" | "waiting" | "ready" | StreetLookupFailure;

export function StreetAddressInput({ value, setValue }: { value: AccountAddress; setValue: (value: AccountAddress) => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const ignoreFocus = useRef(false);
  // Keep address data only in this mounted form, never in shared browser storage.
  const recentResults = useRef(new Map<string, { savedAt: number; options: StreetAddressSuggestion[] }>());
  const cacheKey = (text: string, zip: string) => JSON.stringify([text.trim().toLowerCase().replace(/\s+/g, " "), zip.trim()]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<StreetAddressSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<LookupStatus>("idle");

  useEffect(() => {
    if (!open || !canSearchStreet(query)) return;
    const key = cacheKey(query, value.zipCode);
    const cached = recentResults.current.get(key);
    if (cached && Date.now() - cached.savedAt < 5 * 60_000) {
      const frame = requestAnimationFrame(() => { setOptions(cached.options); setStatus("ready"); });
      return () => cancelAnimationFrame(frame);
    }
    const abort = new AbortController();
    let waitingTimer: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(async () => {
      waitingTimer = setTimeout(() => { if (!abort.signal.aborted) setStatus("waiting"); }, 2500);
      try {
        const response = await fetch("/api/address-autocomplete", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: query, zipCode: value.zipCode }), signal: abort.signal,
        });
        if (!response.ok) throw new Error("Lookup unavailable");
        const result = await response.json() as { available: boolean; reason?: StreetLookupFailure; options: StreetAddressSuggestion[] };
        if (abort.signal.aborted) return;
        if (result.available) {
          if (recentResults.current.size >= 20) recentResults.current.delete(recentResults.current.keys().next().value!);
          recentResults.current.set(key, { savedAt: Date.now(), options: result.options });
        }
        setOptions(result.options);
        setStatus(result.available ? "ready" : result.reason ?? "unavailable");
      } catch {
        if (!abort.signal.aborted) { setOptions([]); setStatus("unavailable"); }
      } finally { clearTimeout(waitingTimer); }
    }, 150);
    return () => { clearTimeout(timer); clearTimeout(waitingTimer); abort.abort(); };
  }, [query, open, attempt, value.zipCode]);

  function beginLookup(next: string) {
    setQuery(next);
    const cached = recentResults.current.get(cacheKey(next, value.zipCode));
    const fresh = cached && Date.now() - cached.savedAt < 5 * 60_000;
    setOptions(fresh ? cached.options : []);
    setActive(-1);
    setStatus(fresh ? "ready" : canSearchStreet(next) ? "loading" : "more_input");
    setOpen(true);
    setAttempt((previous) => previous + 1);
  }

  function focusWithoutOpening() {
    ignoreFocus.current = true;
    input.current?.focus();
    ignoreFocus.current = false;
  }

  function select(option: StreetAddressSuggestion) {
    setValue({ ...value, address1: option.address1, city: option.city, state: option.state, zipCode: option.zipCode });
    setOpen(false);
    setOptions([]);
    setActive(-1);
    focusWithoutOpening();
  }

  const message = status === "ready"
    ? options.length ? "Choose an address, then check the details below." : "No matching streets. Add a city or ZIP, or enter your address manually."
    : status === "loading" ? "Looking up U.S. addresses…"
    : status === "waiting" ? "Still searching… Adding a city or ZIP can help narrow the results."
    : status === "more_input" || status === "idle" ? "Keep typing the street name after the number, for example 350 Fifth Avenue."
    : lookupFailureMessages[status];
  const canRetry = status === "timeout" || status === "unavailable";

  return <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label className="block text-[13px] font-semibold text-[#303846]" htmlFor={`${id}-street`}>Street address</label>
    <input aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} aria-autocomplete="list" aria-controls={`${id}-suggestions`} aria-describedby={`${id}-help`} aria-expanded={open} autoComplete="address-line1" className="mt-2 w-full rounded-md border border-[#cfd5dd] px-3 py-2 text-[14px]" id={`${id}-street`} maxLength={200} onChange={(event) => {
      const next = event.target.value;
      setValue({ ...value, address1: next });
      beginLookup(next);
    }} onClick={() => { if (!open) beginLookup(value.address1); }} onFocus={() => { if (!ignoreFocus.current) beginLookup(value.address1); }} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key === "ArrowDown" && !open) { event.preventDefault(); beginLookup(value.address1); return; }
      if (!open) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => options.length ? (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : -1);
      }
      if (event.key === "Enter") { event.preventDefault(); if (active >= 0 && options[active]) select(options[active]); }
    }} placeholder="Start typing your street address" ref={input} role="combobox" value={value.address1} />
    {open ? <div className="absolute z-20 mt-1 w-full rounded-md border border-[#cfd5dd] bg-white shadow-lg">
      <ul aria-label="Street address suggestions" className="max-h-64 overflow-y-auto" id={`${id}-suggestions`} role="listbox">
        {options.map((option, index) => <li aria-selected={active === index} className={`cursor-pointer px-3 py-3 text-sm hover:bg-[#edf2ff] ${active === index ? "bg-[#edf2ff]" : ""}`} id={`${id}-option-${index}`} key={option.id} onClick={() => select(option)} onPointerDown={(event) => event.preventDefault()} role="option">{option.label}</li>)}
      </ul>
      <p aria-live="polite" className="px-3 py-2 text-xs text-[#737b86]">{message}</p>
      {canRetry ? <button className="w-full border-t px-3 py-2 text-left text-sm font-medium text-[#3b5bdb]" onClick={() => { beginLookup(value.address1); focusWithoutOpening(); }} type="button">Try address search again</button> : null}
      <button className="w-full border-t px-3 py-2 text-left text-sm font-medium text-[#3b5bdb]" onClick={() => { setOpen(false); focusWithoutOpening(); }} type="button">Enter address manually</button>
      {status === "ready" ? <p className="border-t px-3 py-2 text-[10px] text-[#737b86]">Powered by <a className="underline" href="https://www.geoapify.com/" rel="noreferrer" target="_blank">Geoapify</a> · <a className="underline" href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">© OpenStreetMap contributors</a></p> : null}
    </div> : null}
    <p className="mt-1 text-xs font-normal text-[#737b86]" id={`${id}-help`}>U.S. addresses only. Choose a suggestion to fill city, state and ZIP, or enter all fields yourself.</p>
  </div>;
}
