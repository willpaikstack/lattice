"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { AccountAddress } from "@/lib/account-settings-shared";
import type { StreetAddressSuggestion, StreetLookupFailure } from "@/lib/street-address";

const lookupFailureMessages: Record<StreetLookupFailure, string> = {
  not_configured: "Street address suggestions are not enabled yet. You can enter your address manually.",
  credentials: "Address lookup needs attention. You can enter your address manually.",
  quota: "The address search limit has been reached. You can enter your address manually.",
  unavailable: "Address lookup is temporarily unavailable. You can enter your address manually.",
};

export function StreetAddressInput({ value, setValue }: { value: AccountAddress; setValue: (value: AccountAddress) => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<StreetAddressSuggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | StreetLookupFailure>("idle");

  useEffect(() => {
    if (!open || query.trim().length < 3) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/address-autocomplete", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: query }), signal: abort.signal,
        });
        if (!response.ok) throw new Error("Lookup unavailable");
        const result = await response.json() as { available: boolean; reason?: StreetLookupFailure; options: StreetAddressSuggestion[] };
        if (abort.signal.aborted) return;
        setOptions(result.options);
        setStatus(result.available ? "ready" : result.reason ?? "unavailable");
      } catch {
        if (!abort.signal.aborted) { setOptions([]); setStatus("unavailable"); }
      }
    }, 350);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [query, open]);

  function select(option: StreetAddressSuggestion) {
    setValue({ ...value, address1: option.address1, city: option.city, state: option.state, zipCode: option.zipCode });
    setOpen(false);
    setOptions([]);
    setActive(-1);
    input.current?.focus();
  }

  const message = status === "ready"
    ? options.length ? "Choose an address, then check the details below." : "No matching streets. You can enter your address manually."
    : status === "loading" ? "Looking up U.S. addresses…" : status === "idle" ? "" : lookupFailureMessages[status];

  return <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <label className="block text-[13px] font-semibold text-[#303846]" htmlFor={`${id}-street`}>Street address</label>
    <input aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined} aria-autocomplete="list" aria-controls={`${id}-suggestions`} aria-describedby={`${id}-help`} aria-expanded={open && query.trim().length >= 3} autoComplete="address-line1" className="mt-2 w-full rounded-md border border-[#cfd5dd] px-3 py-2 text-[14px]" id={`${id}-street`} maxLength={200} onChange={(event) => {
      const next = event.target.value;
      setValue({ ...value, address1: next }); setQuery(next); setOptions([]); setActive(-1);
      setOpen(next.trim().length >= 3); setStatus(next.trim().length >= 3 ? "loading" : "idle");
    }} onKeyDown={(event) => {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (!open) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActive((current) => options.length ? (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : -1);
      }
      if (event.key === "Enter") { event.preventDefault(); if (active >= 0 && options[active]) select(options[active]); }
    }} placeholder="Start typing your street address" ref={input} role="combobox" value={value.address1} />
    {open && query.trim().length >= 3 ? <div className="absolute z-20 mt-1 w-full rounded-md border border-[#cfd5dd] bg-white shadow-lg">
      <ul aria-label="Street address suggestions" className="max-h-64 overflow-y-auto" id={`${id}-suggestions`} role="listbox">
        {options.map((option, index) => <li aria-selected={active === index} className={`cursor-pointer px-3 py-3 text-sm hover:bg-[#edf2ff] ${active === index ? "bg-[#edf2ff]" : ""}`} id={`${id}-option-${index}`} key={option.id} onClick={() => select(option)} onMouseDown={(event) => event.preventDefault()} role="option">{option.label}</li>)}
      </ul>
      <p aria-live="polite" className="px-3 py-2 text-xs text-[#737b86]">{message}</p>
      <button className="w-full border-t px-3 py-2 text-left text-sm font-medium text-[#3b5bdb]" onClick={() => { setOpen(false); input.current?.focus(); }} type="button">Enter address manually</button>
      {status === "ready" ? <p className="border-t px-3 py-2 text-[10px] text-[#737b86]">Powered by <a className="underline" href="https://www.geoapify.com/" rel="noreferrer" target="_blank">Geoapify</a> · <a className="underline" href="https://www.openstreetmap.org/copyright" rel="noreferrer" target="_blank">© OpenStreetMap contributors</a></p> : null}
    </div> : null}
    <p className="mt-1 text-xs font-normal text-[#737b86]" id={`${id}-help`}>U.S. addresses only. Choose a suggestion to fill city, state and ZIP, or enter all fields yourself.</p>
  </div>;
}
