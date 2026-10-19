"use client";

import { useId } from "react";
import { absoluteToleranceOptions, generalToleranceOptions, optionLabel } from "@/lib/rfq-options";

export type ToleranceDesign = "cards" | "legacy";

// Customer-approved copy transcribed from the supplied Xometry screenshot.
// Keep persisted option values/labels stable for existing RFQs and drafts.
const absoluteToleranceCopy: Record<string, { title: string; detail: string }> = {
  linear_pm_010_in: {
    title: 'Tolerances will be held to ±.010” (±0.25mm)',
    detail: 'This cost-effective option overrides any tighter tolerances on your drawing, except for reamed holes less than ø1”, which will be held to drawing requirements. Inspection is limited to Standard.',
  },
  linear_pm_005_in: {
    title: 'Tolerances will be held to ±.005” (±0.13mm)',
    detail: 'This option overrides any tighter tolerances on your drawing, except for reamed holes less than ø1”, which will be held to drawing requirements.',
  },
  linear_tighter_005_in: {
    title: 'This part requires tolerances tighter than ±.005” (±0.13mm)',
    detail: 'You must indicate these critical features and their required tolerance on a drawing, excluding reamed holes less than ø1”, which will be held to drawing requirements.',
  },
};

export function ToleranceRequirements({ generalTolerance, drawingSpecific, onGeneralChange }: {
  generalTolerance: string;
  drawingSpecific: boolean;
  onGeneralChange: (value: string) => void;
}) {
  const id = useId();
  const savedIso = generalTolerance.startsWith("iso_");
  const choices = [
    ...absoluteToleranceOptions.map(option => ({ value: option.value, ...absoluteToleranceCopy[option.value] })),
    ...(savedIso ? [{ value: generalTolerance, title: `Saved requirement: ${optionLabel(generalToleranceOptions, generalTolerance)}`, detail: "Your existing ISO requirement is preserved. Choose a numeric option above to replace it; these systems are not equivalent." }] : []),
  ];
  return <div className="space-y-4">
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm font-semibold text-slate-800">Tolerance requirements <span aria-hidden="true" className="text-red-600">*</span></legend>
      {choices.map(choice => <label key={choice.value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${generalTolerance === choice.value ? "border-[#3478f6] bg-[#f5f8ff]" : "border-slate-200 bg-white hover:border-slate-400"}`}>
        <input type="radio" name={`${id}-tolerance`} value={choice.value} checked={generalTolerance === choice.value} onChange={() => {
          onGeneralChange(choice.value);
        }} className="mt-1 h-4 w-4 shrink-0 accent-[#2563eb]" />
        <span><span className="block text-sm font-semibold text-slate-900">{choice.title}</span><span className="mt-1 block text-sm leading-6 text-slate-600">{choice.detail}</span></span>
      </label>)}
    </fieldset>
    {drawingSpecific && generalTolerance !== "linear_tighter_005_in" ? <p className="text-xs leading-5 text-slate-600">Your saved drawing-specific tolerance requirement still applies. Select a numeric option to update it.</p> : null}
  </div>;
}
