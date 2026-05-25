"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";

import type { DraftRequestInput, LatticeRequest } from "@/lib/request-model";
import {
  generalToleranceOptions,
  optionLabel,
  processOptions,
  qualityDocumentationOptions,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "../lib/rfq-options";

type FormState = {
  buyerCompany: string;
  requesterName: string;
  customerPo: string;
  projectName: string;
  process: string;
  dueDate: string;
  partName: string;
  quantity: string;
  material: string;
  generalTolerance: string;
  surfaceFinish: string;
  qualityDocumentation: string[];
  notes: string;
  fileName: string;
};

const cadFileTypes = "STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT";

const makeInitialState = (): FormState => ({
  buyerCompany: "Amogy Manufacturing",
  requesterName: "William Paik",
  customerPo: "",
  projectName: "",
  process: "cnc_milling",
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  partName: "",
  quantity: "1",
  material: "ss_304",
  generalTolerance: "iso_2768_medium__m_",
  surfaceFinish: "as_machined__ra_3_2__m___ra_126__in_",
  qualityDocumentation: ["cmm"],
  notes: "",
  fileName: "",
});

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal leading-5 text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputClass =
  "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-blue-100 placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-4";

export function RequestForm() {
  const [form, setForm] = useState<FormState>(() => makeInitialState());
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<LatticeRequest | null>(null);

  const isReady = useMemo(
    () =>
      form.dueDate &&
      form.projectName.trim() &&
      form.partName.trim() &&
      form.material.trim() &&
      form.generalTolerance.trim() &&
      form.surfaceFinish.trim() &&
      Number(form.quantity) > 0 &&
      form.fileName.trim(),
    [form],
  );

  function update(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleQualityDocumentation(value: string) {
    setForm((current) => {
      const selected = current.qualityDocumentation.includes(value)
        ? current.qualityDocumentation.filter((item) => item !== value)
        : [...current.qualityDocumentation, value];

      return { ...current, qualityDocumentation: selected };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const noteLines = [
      form.customerPo.trim() ? `Customer PO#: ${form.customerPo.trim()}` : null,
      form.notes.trim() ? form.notes.trim() : null,
    ].filter(Boolean);

    const input: DraftRequestInput = {
      buyerCompany: form.buyerCompany,
      requesterName: form.requesterName,
      title: form.projectName,
      process: optionLabel(processOptions, form.process),
      dueDate: form.dueDate,
      lineItems: [
        {
          partName: form.partName,
          quantity: Number(form.quantity),
          material: optionLabel(rfqMaterialOptions, form.material),
          generalTolerance: optionLabel(generalToleranceOptions, form.generalTolerance),
          surfaceFinish: optionLabel(surfaceFinishOptions, form.surfaceFinish),
          qualityDocumentation: form.qualityDocumentation.map((value) => optionLabel(qualityDocumentationOptions, value)),
          notes: noteLines.join("\n"),
        },
      ],
      files: [
        {
          name: form.fileName,
          sizeBytes: 0,
          type: "reference/name-only",
        },
      ],
    };

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit request");
      }

      setCreatedRequest(payload.request);
      setForm(makeInitialState());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit request");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Request Quote</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create a manufacturable RFQ package.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Upload CAD files, capture customer details, and define the first manufacturable line item. Lattice routes the request into the operator queue for review.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <form onSubmit={handleSubmit} className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">RFQ intake details</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Bubble starts this workflow with CAD upload and customer details. This local version keeps that flow but removes unfinished placeholder copy.</p>
            </div>
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Draft until submitted</span>
          </div>

          <section className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl text-slate-400">↥</div>
            <p className="mt-4 text-lg font-semibold text-slate-950">Drag & drop CAD files here, or browse</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">Suggested File Types: {cadFileTypes}</p>
            <label className="mt-5 inline-flex cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <span>{form.fileName || "Upload another CAD file"}</span>
              <input
                className="sr-only"
                type="file"
                accept=".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt"
                onChange={(event) => update("fileName", event.target.files?.[0]?.name ?? "")}
              />
            </label>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Customer Details</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Customer PO#">
                <input className={inputClass} placeholder="PO-1047" value={form.customerPo} onChange={(event) => update("customerPo", event.target.value)} />
              </Field>
              <Field label="Company Name">
                <input className={inputClass} value={form.buyerCompany} onChange={(event) => update("buyerCompany", event.target.value)} />
              </Field>
              <Field label="Project Name" hint="Use a name an operator can recognize quickly.">
                <input className={inputClass} placeholder="CNC bracket package" value={form.projectName} onChange={(event) => update("projectName", event.target.value)} />
              </Field>
              <Field label="Requester name">
                <input className={inputClass} value={form.requesterName} onChange={(event) => update("requesterName", event.target.value)} />
              </Field>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Manufacturing Details</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Manufacturing process">
                <select className={inputClass} value={form.process} onChange={(event) => update("process", event.target.value)}>
                  {processOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Needed by">
                <input className={inputClass} type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} />
              </Field>
              <Field label="Part / line item name">
                <input className={inputClass} placeholder="Bracket A" value={form.partName} onChange={(event) => update("partName", event.target.value)} />
              </Field>
              <Field label="Quantity">
                <input className={inputClass} min="1" type="number" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} />
              </Field>
              <Field label="Material">
                <select className={inputClass} value={form.material} onChange={(event) => update("material", event.target.value)}>
                  {rfqMaterialOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="File reference" hint="Automatically filled from the selected file; manual entry is allowed for now.">
                <input className={inputClass} placeholder="part.step / drawing.pdf" value={form.fileName} onChange={(event) => update("fileName", event.target.value)} />
              </Field>
              <Field label="General tolerance">
                <select className={inputClass} value={form.generalTolerance} onChange={(event) => update("generalTolerance", event.target.value)}>
                  {generalToleranceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Surface finish">
                <select className={inputClass} value={form.surfaceFinish} onChange={(event) => update("surfaceFinish", event.target.value)}>
                  {surfaceFinishOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <fieldset className="grid gap-3 text-sm font-medium text-slate-700 md:col-span-2">
                <legend>Quality documentation</legend>
                <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  {qualityDocumentationOptions.map((option) => (
                    <label className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 text-sm font-normal text-slate-700" key={option.value}>
                      <input
                        checked={form.qualityDocumentation.includes(option.value)}
                        className="mt-1"
                        onChange={() => toggleQualityDocumentation(option.value)}
                        type="checkbox"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-2 text-sm font-medium text-slate-700 md:col-span-2">
                <span>Manufacturing notes</span>
                <textarea className={`${inputClass} min-h-32`} placeholder="Tolerances, finish, deburr, inspection notes…" value={form.notes} onChange={(event) => update("notes", event.target.value)} />
              </label>
            </div>
          </section>

          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
            <button
              className="rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!isReady}
              type="submit"
            >
              Request Quote
            </button>
            <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" href="/operator/requests">
              View operator queue →
            </Link>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Current slice</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Buyer → Operator handoff</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>• Upload or reference one CAD/drawing file.</li>
              <li>• Capture customer, project, process, due date, and part metadata.</li>
              <li>• Create a submitted request visible to internal operators.</li>
            </ul>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
            <p className="text-sm font-semibold text-blue-800">Bubble-backed guidance</p>
            <p className="mt-2 text-sm leading-6 text-blue-900/75">Material, tolerance, finish, process, and quality documentation options now use owned-code lookup tables extracted from the Bubble runtime.</p>
          </div>

          {createdRequest ? (
            <div className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
              <p className="font-semibold">Submitted to queue</p>
              <p className="mt-1">{createdRequest.title}</p>
              <p className="mt-1 text-emerald-700">Status: {createdRequest.status}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
