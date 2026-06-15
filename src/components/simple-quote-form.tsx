"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertCircle, FileUp, Plus, Trash2 } from "lucide-react";

import type { SimpleQuoteFormState } from "@/app/simple-quote/actions";
import { submitSimpleQuoteAction } from "@/app/simple-quote/actions";
import {
  generalToleranceOptions,
  processOptions,
  qualityDocumentationOptions,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "@/lib/rfq-options";

type PartRow = {
  id: string;
};

const initialState: SimpleQuoteFormState = {};
const cadAccept = ".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt";
const drawingAccept = ".pdf,.dxf,.dwg,.png,.jpg,.jpeg";
const fieldClass = "w-full rounded-md border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-950 outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-200";
const labelClass = "grid gap-2 text-sm font-semibold text-stone-800";

function makePartId() {
  return `part_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function TextField({
  label,
  name,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <input className={fieldClass} name={name} required={required} type={type} />
    </label>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: { label: string; value: string }[];
}) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <select className={fieldClass} defaultValue={defaultValue} name={name}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SimpleQuoteForm() {
  const [state, formAction, pending] = useActionState(submitSimpleQuoteAction, initialState);
  const [parts, setParts] = useState<PartRow[]>(() => [{ id: makePartId() }]);
  const partIds = useMemo(() => parts.map((part) => part.id).join(","), [parts]);

  function addPart() {
    setParts((current) => [...current, { id: makePartId() }].slice(0, 8));
  }

  function removePart(id: string) {
    setParts((current) => (current.length > 1 ? current.filter((part) => part.id !== id) : current));
  }

  return (
    <form action={formAction} className="space-y-8">
      <input name="partIds" type="hidden" value={partIds} />

      {state.error ? (
        <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{state.error}</p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Contact</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal text-stone-950">Where we should send the quote</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Your name" name="requesterName" required />
          <TextField label="Work email" name="requesterEmail" required type="email" />
          <TextField label="Phone" name="requesterPhone" required type="tel" />
          <TextField label="Company" name="buyerCompany" required />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Project</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal text-stone-950">Simple manufacturing package</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className={`${labelClass} md:col-span-2`}>
            <span>Project name</span>
            <input className={fieldClass} name="title" placeholder="Motor housing prototype run" required />
          </label>
          <TextField label="Target date" name="dueDate" required type="date" />
          <SelectField defaultValue="cnc_milling" label="Process" name="process" options={processOptions} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Parts</p>
            <h2 className="mt-2 text-xl font-semibold tracking-normal text-stone-950">Upload CAD and manufacturing details</h2>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={parts.length >= 8}
            onClick={addPart}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add part
          </button>
        </div>

        <div className="space-y-5">
          {parts.map((part, index) => (
            <fieldset className="rounded-md border border-stone-200 bg-stone-50 p-4" key={part.id}>
              <legend className="px-2 text-sm font-semibold text-stone-700">Part {index + 1}</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={labelClass}>
                  <span>CAD file</span>
                  <span className="flex items-center gap-3 rounded-md border border-dashed border-stone-300 bg-white px-3 py-3 text-sm text-stone-600">
                    <FileUp aria-hidden="true" className="h-4 w-4" />
                    <input accept={cadAccept} className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-stone-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" name={`cadFile:${part.id}`} required type="file" />
                  </span>
                </label>
                <label className={labelClass}>
                  <span>Drawing or reference file</span>
                  <input accept={drawingAccept} className={fieldClass} name={`drawingFile:${part.id}`} type="file" />
                </label>
                <TextField label="Part name" name={`partName:${part.id}`} required />
                <TextField label="Quantity" name={`quantity:${part.id}`} required type="number" />
                <SelectField defaultValue="al_6061_t6" label="Material" name={`material:${part.id}`} options={rfqMaterialOptions.slice(0, 80)} />
                <SelectField defaultValue="as_machined_ra_3_2" label="Finish" name={`surfaceFinish:${part.id}`} options={surfaceFinishOptions} />
                <SelectField defaultValue="iso_2768_medium_m" label="Tolerance" name={`generalTolerance:${part.id}`} options={generalToleranceOptions} />
                <SelectField defaultValue="standard_inspection" label="Inspection" name={`qualityDocumentation:${part.id}`} options={qualityDocumentationOptions} />
                <label className={`${labelClass} md:col-span-2`}>
                  <span>Notes</span>
                  <textarea className={`${fieldClass} min-h-24 resize-y`} name={`notes:${part.id}`} placeholder="Critical features, revision notes, finish requirements, packaging, or anything else we should know." />
                </label>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold text-stone-500 transition hover:bg-white hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={parts.length === 1}
                  onClick={() => removePart(part.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Delivery</p>
          <h2 className="mt-2 text-xl font-semibold tracking-normal text-stone-950">Ship-to details for pricing</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Recipient name" name="shipToName" />
          <TextField label="Recipient phone" name="shipToPhone" type="tel" />
          <TextField label="Company" name="shipToCompany" />
          <TextField label="Address line 1" name="shipToAddress1" />
          <TextField label="Address line 2" name="shipToAddress2" />
          <TextField label="City" name="shipToCity" />
          <TextField label="State" name="shipToState" />
          <TextField label="ZIP code" name="shipToZipCode" />
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-stone-500">We will email a private quote link when pricing is ready. Payment is credit card only for this account-free flow.</p>
        <button
          className="inline-flex h-12 min-w-48 items-center justify-center rounded-md bg-stone-950 px-6 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          disabled={pending}
          type="submit"
        >
          {pending ? "Submitting..." : "Request simple quote"}
        </button>
      </div>
    </form>
  );
}
