"use client";

import { useState } from "react";
import type { CadMetadata } from "@/lib/rfq-manufacturing";

export function CadMetadataSummary({ metadata }: { metadata?: CadMetadata }) {
  const [unit, setUnit] = useState("mm");
  if (!metadata) return null;
  const dimensions = metadata.dimensionsMm.map(value => (unit === "in" ? value / 25.4 : value).toFixed(2));
  return <span aria-label="CAD envelope" className="ml-auto inline-flex min-w-0 items-center gap-1 text-[11px] font-normal tracking-normal text-slate-500"
    title={`X × Y × Z axis-aligned envelope. Model units: ${metadata.sourceUnit}. For reference; drawing dimensions govern manufacturing.`}>
    <span className="whitespace-nowrap">{dimensions.join(" × ")}</span>
    <select aria-label="CAD dimension display units" className="rounded border-0 bg-transparent py-1 text-[11px] text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-slate-300" value={unit} onChange={event => setUnit(event.target.value)}>
      <option value="mm">mm</option><option value="in">in</option>
    </select>
  </span>;
}
