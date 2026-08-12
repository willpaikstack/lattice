"use client";

import { ChevronDown, Droplets, FlaskConical, Gauge, Thermometer } from "lucide-react";

import type { FunctionalTraits } from "@/lib/material-family-view-models";
import { usePlasticFunctionalProfileGroup } from "@/components/plastic-functional-profile-group";

function traitGuidance(label: string, value: string) {
  const guidance: Record<string, Record<string, string>> = {
    "Heat tolerance": {
      High: "Suitable for elevated-temperature service; verify the continuous-use temperature.",
      Low: "Best for lower-temperature service; verify the continuous-use temperature.",
      Moderate: "Suitable for moderate-temperature service; verify the continuous-use temperature.",
    },
    "Moisture response": {
      High: "Moisture uptake can affect dimensions and performance.",
      Low: "Low moisture uptake supports dimensional consistency.",
      Moderate: "Review moisture exposure where dimensions are critical.",
    },
    "Chemical resistance": {
      Excellent: "A strong option for chemically demanding environments; confirm media and concentration.",
      Fair: "Review compatibility against the specific chemical media.",
      Good: "Resists many common media; confirm the specific chemical exposure.",
    },
    "Wear / friction": {
      Good: "Well suited to general wear surfaces with the right mating material.",
      Low: "Low-friction behavior supports bearing and sliding applications.",
      Moderate: "Consider lubrication and mating surfaces for sustained sliding contact.",
      "Very low": "Excellent for low-friction sliding and non-stick applications.",
    },
  };

  return guidance[label]?.[value] ?? "Confirm behavior against the exact resin grade and data sheet.";
}

export function PlasticFunctionalProfile({
  traits,
  detailsClassName = "",
  summaryClassName = "",
  contentClassName = "",
}: {
  traits: FunctionalTraits;
  detailsClassName?: string;
  summaryClassName?: string;
  contentClassName?: string;
}) {
  const setOpenDetails = usePlasticFunctionalProfileGroup();
  const items = [
    [Thermometer, "Heat tolerance", traits.heatTolerance],
    [Droplets, "Moisture response", traits.moistureResponse],
    [FlaskConical, "Chemical resistance", traits.chemicalResistance],
    [Gauge, "Wear / friction", traits.wearFriction],
  ] as const;

  return (
    <details className={`group ${detailsClassName}`}>
      <summary className={`mt-2 flex w-fit cursor-pointer list-none items-center gap-1.5 py-0.5 text-[10px] font-medium text-[#77797d] marker:content-none select-none hover:text-[#4d4f53] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#171717]/20 ${summaryClassName}`} onClick={(event) => setOpenDetails(event.currentTarget.parentElement as HTMLDetailsElement)}>
        Behavior details
        <ChevronDown aria-hidden="true" className="h-3 w-3 shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="mt-3">
        <div className={`grid border-t border-[#eeedeb] sm:grid-cols-2 ${contentClassName}`}>
          {items.map(([Icon, label, value], index) => (
          <div
            className={`min-w-0 px-4 py-4 border-[#eeedeb] sm:px-5 ${
              index < items.length - 1 ? "border-b sm:border-b-0" : ""
            } ${index % 2 === 0 ? "sm:border-r" : ""} ${index < 2 ? "sm:border-b" : ""}`}
            key={label}
          >
            <div className="flex items-start gap-3">
              <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#626469]" strokeWidth={1.55} />
              <div>
                <p className="text-[11px] text-[#727479]">{label}</p>
                <p className="mt-0.5 text-[13px] font-semibold text-[#37383b]">{value}</p>
                <p className="mt-2 max-w-[34ch] text-[11px] leading-[17px] text-[#76787d]">{traitGuidance(label, value)}</p>
              </div>
            </div>
          </div>
          ))}
        </div>
      </div>
    </details>
  );
}
