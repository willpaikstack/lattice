"use client";

import { useEffect, useId, useState } from "react";
import { StreetAddressInput } from "./street-address-input";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/contact-format";
import type { AccountAddress } from "@/lib/account-settings-shared";
import { usStates, type AddressSuggestion } from "@/lib/us-address-options";
import { USStatePicker } from "./us-state-picker";

const inputClass = "mt-2 w-full rounded-md border border-[#cfd5dd] px-3 py-2 text-[14px]";

export function AccountAddressFields({ value, setValue, hideSuggestionsHelp = false, nameLabel = "Full name" }: { value: AccountAddress; setValue: (value: AccountAddress) => void; hideSuggestionsHelp?: boolean; nameLabel?: string }) {
  const id = useId();
  const [options, setOptions] = useState<AddressSuggestion[]>([]);
  const [lookupField, setLookupField] = useState<"city" | "zip" | null>(null);
  const [activeOption, setActiveOption] = useState(-1);
  const [lookupFailed, setLookupFailed] = useState(false);
  useEffect(() => {
    if (!lookupField) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      const query = new URLSearchParams(lookupField === "zip" ? { zip: value.zipCode.split("-")[0] } : { state: value.state, city: value.city });
      if ((lookupField === "zip" ? value.zipCode.length < 3 : !value.city.trim())) { setOptions([]); return; }
      try {
        const response = await fetch(`/api/address-suggestions?${query}`, { signal: abort.signal });
        if (!response.ok) throw new Error("Lookup unavailable");
        const result = await response.json() as { options: AddressSuggestion[] };
        if (abort.signal.aborted) return;
        setOptions(result.options);
        setActiveOption(-1);
        setLookupFailed(false);
      } catch { if (!abort.signal.aborted) { setOptions([]); setLookupFailed(true); } }
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [value.city, value.state, value.zipCode, lookupField]);
  useEffect(() => {
    if (activeOption < 0 || !lookupField) return;
    document.getElementById(`${id}-${lookupField}-suggestions-${activeOption}`)?.scrollIntoView?.({ block: "nearest" });
  }, [activeOption, lookupField, id]);
  const update = (key: keyof AccountAddress, next: string) => {
    setOptions([]);
    setActiveOption(-1);
    if (key === "city") setLookupField("city");
    if (key === "zipCode") setLookupField("zip");
    if (key === "state") next = usStates.find(([code, name]) => code.toLowerCase() === next.toLowerCase() || name.toLowerCase() === next.toLowerCase())?.[0] ?? next;
    setValue({ ...value, [key]: next });
  };
  const field = (label: string, key: keyof AccountAddress, autoComplete: string) => <label className="block text-[13px] font-semibold text-[#303846]">{label}<input autoComplete={autoComplete} className={inputClass} onChange={(event) => update(key, event.target.value)} value={value[key] ?? ""} /></label>;
  const select = (item: AddressSuggestion) => {
    setLookupField(null);
    setActiveOption(-1);
    setValue({ ...value, ...item });
    setOptions([]);
  };
  const locationField = (label: string, key: "city" | "zipCode") => {
    const lookup = key === "city" ? "city" : "zip";
    const visibleOptions = lookupField === lookup ? options.slice(0, 12) : [];
    const listId = `${id}-${lookup}-suggestions`;
    return <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) { setLookupField(null); setOptions([]); setActiveOption(-1); } }}>
      <label className="block text-[13px] font-semibold text-[#303846]">{label}
        <input autoComplete="off" className={inputClass} value={value[key]} role="combobox" aria-autocomplete="list" aria-expanded={visibleOptions.length > 0} aria-controls={visibleOptions.length ? listId : undefined} aria-activedescendant={visibleOptions[activeOption] ? `${listId}-${activeOption}` : undefined}
          onFocus={() => { if (lookupField !== lookup) { setOptions([]); setActiveOption(-1); } setLookupField(lookup); }}
          onChange={(event) => update(key, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); setLookupField(null); setOptions([]); setActiveOption(-1); }
            if (visibleOptions.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setActiveOption((current) => event.key === "ArrowDown" ? (current + 1) % visibleOptions.length : (current <= 0 ? visibleOptions.length : current) - 1); }
            if (event.key === "Enter" && visibleOptions[activeOption]) { event.preventDefault(); select(visibleOptions[activeOption]); }
          }} />
      </label>
      {visibleOptions.length ? <ul id={listId} role="listbox" aria-label="Address suggestions" className="absolute inset-x-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-md border border-[#d8dee8] bg-white py-1 shadow-lg">
        {visibleOptions.map((item, index) => <li role="option" aria-selected={index === activeOption} id={`${listId}-${index}`} key={`${item.city}-${item.state}-${item.zipCode}`} className={`cursor-pointer px-3 py-2.5 text-[13px] leading-5 ${index === activeOption ? "bg-[#eef3ff]" : "hover:bg-slate-50"}`} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveOption(index)} onClick={() => select(item)}>
          <span className="font-medium text-[#253040]">{item.city}, {item.state}</span><span className="ml-2 text-[#737b86]">{item.zipCode}</span>
        </li>)}
      </ul> : null}
    </div>;
  };
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">{field(nameLabel, "name", "name")}{field("Company", "company", "organization")}</div>
    <label className="block text-[13px] font-semibold text-[#303846]">Phone number (optional)<input autoComplete="tel" className={inputClass} maxLength={30} onChange={(event) => update("phone", formatPhoneNumber(event.target.value))} placeholder="(555) 123-4567" type="tel" value={value.phone ?? ""} /></label>
    {value.phone && !isValidPhoneNumber(value.phone) ? <p className="text-xs text-red-700" role="alert">Enter a complete phone number.</p> : null}
    <StreetAddressInput value={value} setValue={(next) => { setLookupField(null); setOptions([]); setValue(next); }} />
    {field("Unit or suite number (optional)", "address2", "address-line2")}
    {locationField("City", "city")}
    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div><span className="block text-[13px] font-semibold text-[#303846]">State</span><USStatePicker onChange={(next) => update("state", next)} value={value.state} /></div>
      {locationField("ZIP code", "zipCode")}
    </div>
    {!hideSuggestionsHelp ? <p className="text-xs font-normal text-[#737b86]">{lookupFailed ? "Suggestions are temporarily unavailable. " : "U.S. city, state and ZIP suggestions are available. "}You can always type your full address manually.</p> : null}
  </div>;
}
