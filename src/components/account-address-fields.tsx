"use client";

import { useEffect, useId, useState } from "react";
import { StreetAddressInput } from "./street-address-input";
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/contact-format";
import type { AccountAddress } from "@/lib/account-settings-shared";
import { usStates, type AddressSuggestion } from "@/lib/us-address-options";

const inputClass = "mt-2 w-full rounded-md border border-[#cfd5dd] px-3 py-2 text-[14px]";

export function AccountAddressFields({ value, setValue }: { value: AccountAddress; setValue: (value: AccountAddress) => void }) {
  const id = useId();
  const [options, setOptions] = useState<AddressSuggestion[]>([]);
  const [lookupField, setLookupField] = useState<"city" | "zip" | null>(null);
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
        setOptions(result.options);
        setLookupFailed(false);
      } catch { if (!abort.signal.aborted) { setOptions([]); setLookupFailed(true); } }
    }, 200);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [value.city, value.state, value.zipCode, lookupField]);
  const update = (key: keyof AccountAddress, next: string) => {
    setOptions([]);
    if (key === "city") setLookupField("city");
    if (key === "zipCode") setLookupField("zip");
    if (key === "state") next = usStates.find(([code, name]) => code.toLowerCase() === next.toLowerCase() || name.toLowerCase() === next.toLowerCase())?.[0] ?? next;
    setValue({ ...value, [key]: next });
  };
  const field = (label: string, key: keyof AccountAddress, autoComplete: string, list?: string) => <label className="block text-[13px] font-semibold text-[#303846]">{label}<input autoComplete={autoComplete} className={inputClass} list={list} onChange={(event) => update(key, event.target.value)} value={value[key] ?? ""} /></label>;
  const cities = [...new Set(options.map((item) => item.city))];
  const selectedState = usStates.find(([code, name]) => code.toLowerCase() === value.state.toLowerCase() || name.toLowerCase() === value.state.toLowerCase())?.[0] ?? value.state;
  const stateOptions = [...usStates].sort((a, b) => a[1].localeCompare(b[1]));
  return <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">{field("Full name", "name", "name")}{field("Company", "company", "organization")}</div>
    <label className="block text-[13px] font-semibold text-[#303846]">Phone number (optional)<input autoComplete="tel" className={inputClass} maxLength={30} onChange={(event) => update("phone", formatPhoneNumber(event.target.value))} placeholder="(555) 123-4567" type="tel" value={value.phone ?? ""} /></label>
    {value.phone && !isValidPhoneNumber(value.phone) ? <p className="text-xs text-red-700" role="alert">Enter a complete phone number.</p> : null}
    <StreetAddressInput value={value} setValue={(next) => { setLookupField(null); setOptions([]); setValue(next); }} />
    {field("Unit or suite number (optional)", "address2", "address-line2")}
    {field("City", "city", "address-level2", `${id}-cities`)}
    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <label className="block text-[13px] font-semibold text-[#303846]">State<select autoComplete="address-level1" className="mt-2 min-h-[38px] w-full rounded-lg border border-[#888c8c] bg-[#f0f2f2] px-3 py-2 text-[14px] font-normal text-[#0f1111] shadow-sm hover:bg-[#e3e6e6] focus:border-[#007185] focus:outline-none focus:ring-[3px] focus:ring-[#c8f3fa]" onChange={(event) => update("state", event.target.value)} value={selectedState}>
        <option value="">Select</option>
        {selectedState && !stateOptions.some(([code]) => code === selectedState) ? <option value={selectedState}>{value.state}</option> : null}
        {stateOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select></label>
      {field("ZIP code", "zipCode", "postal-code", `${id}-zips`)}
    </div>
    <datalist id={`${id}-cities`}>{cities.map((city) => <option key={city} value={city} />)}</datalist>
    <datalist id={`${id}-zips`}>{options.map((item) => <option key={item.zipCode} value={item.zipCode}>{item.city}, {item.state}</option>)}</datalist>
    {options.length ? <div aria-label="Address suggestions" className="flex max-h-36 flex-wrap gap-2 overflow-auto">{options.slice(0, 12).map((item) => <button className="rounded border px-2 py-1 text-left text-xs text-[#3b5bdb] hover:bg-slate-50" key={item.zipCode} onClick={() => { setLookupField(null); setValue({ ...value, ...item }); setOptions([]); }} type="button">{item.city}, {item.state} {item.zipCode}</button>)}</div> : null}
    <p className="text-xs font-normal text-[#737b86]">{lookupFailed ? "Suggestions are temporarily unavailable. " : "U.S. city, state and ZIP suggestions are available. "}You can always type your full address manually.</p>
  </div>;
}
