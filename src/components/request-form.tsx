"use client";

import { DragEvent, FormEvent, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { CadUploadPreview, type CadUploadPreviewState } from "@/components/cad-upload-preview";
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
  technicalDrawingName: string;
  partMarkings: boolean;
  tightLinearTolerance: boolean;
  threads: boolean;
  engineeringFits: boolean;
  sharpInternalCorners: boolean;
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
  generalTolerance: "iso_2768_medium_m",
  surfaceFinish: "as_machined_ra_3_2",
  qualityDocumentation: ["standard_inspection"],
  notes: "",
  fileName: "",
  technicalDrawingName: "",
  partMarkings: false,
  tightLinearTolerance: false,
  threads: false,
  engineeringFits: false,
  sharpInternalCorners: false,
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
  "rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none ring-blue-100 placeholder:text-slate-400 transition focus:border-blue-500 focus:ring-4";

function suggestedNameFromFile(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "");
  return withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function RequestForm() {
  const [form, setForm] = useState<FormState>(() => makeInitialState());
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<LatticeRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDrawingFile, setSelectedDrawingFile] = useState<File | null>(null);
  const [cadPreview, setCadPreview] = useState<CadUploadPreviewState>({ status: "empty" });
  const hasCadFile = Boolean(form.fileName.trim());

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

  function updateFlag(field: keyof Pick<FormState, "partMarkings" | "tightLinearTolerance" | "threads" | "engineeringFits" | "sharpInternalCorners">, value: boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  const updateCadPreview = useCallback((state: CadUploadPreviewState) => {
    setCadPreview(state);
  }, []);

  async function handleCadFileSelected(file: File | null) {
    setSelectedFile(file);
    setForm((current) => {
      const fileName = file?.name ?? "";
      const suggestedName = fileName ? suggestedNameFromFile(fileName) : "";

      return {
        ...current,
        fileName,
        partName: current.partName.trim() || suggestedName,
        projectName: current.projectName.trim() || suggestedName,
      };
    });

    if (!file) {
      setCadPreview({ status: "empty" });
      return;
    }

    setCadPreview({ status: "uploading", fileName: file.name });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/cad-previews", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (payload.preview?.status === "configuration_required") {
        setCadPreview({
          status: "configuration_required",
          fileName: file.name,
          message: payload.preview.message,
        });
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to start CAD preview");
      }

      setCadPreview({
        status: "processing",
        fileName: file.name,
        urn: payload.preview.urn,
        progress: "queued",
      });
    } catch (caught) {
      setCadPreview({
        status: "failed",
        fileName: file.name,
        message: caught instanceof Error ? caught.message : "Unable to start CAD preview",
      });
    }
  }

  function handleTechnicalDrawingSelected(file: File | null) {
    setSelectedDrawingFile(file);
    update("technicalDrawingName", file?.name ?? "");
  }

  function handleCadDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    void handleCadFileSelected(event.dataTransfer.files[0] ?? null);
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

    const drawingRequired = [
      form.partMarkings ? "Part markings requested; drawing required." : null,
      form.tightLinearTolerance ? "Linear tolerance tighter than general tolerance requested; drawing required." : null,
      form.threads ? "Threads requested; drawing required." : null,
      form.engineeringFits ? "Engineering fits requested; drawing required." : null,
      form.sharpInternalCorners ? "Sharp internal corners requested; drawing required." : null,
    ].filter(Boolean);
    const noteLines = [
      form.customerPo.trim() ? `Customer PO#: ${form.customerPo.trim()}` : null,
      form.notes.trim() ? form.notes.trim() : null,
      ...drawingRequired,
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
          sizeBytes: selectedFile?.size ?? 0,
          type: selectedFile?.type || "reference/name-only",
        },
        ...(form.technicalDrawingName
          ? [
              {
                name: form.technicalDrawingName,
                sizeBytes: selectedDrawingFile?.size ?? 0,
                type: selectedDrawingFile?.type || "reference/name-only",
              },
            ]
          : []),
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
      setSelectedFile(null);
      setSelectedDrawingFile(null);
      setCadPreview({ status: "empty" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit request");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Request Quote</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create a manufacturable RFQ package.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Start with the CAD file. Once a file is attached, Lattice opens the customer and manufacturing details needed to route the RFQ.
        </p>
      </section>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Upload CAD file</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Attach the model or drawing first. The quote configuration appears after the upload step, matching the Bubble reference flow.</p>
            </div>
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Draft until submitted</span>
          </div>

          {!hasCadFile ? (
            <section
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-24 text-center transition"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleCadDrop}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-slate-200 bg-white text-2xl text-slate-400">↥</div>
              <p className="mt-4 text-lg font-semibold text-slate-950">Drag & drop CAD files here, or browse</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Suggested File Types: {cadFileTypes}</p>
              <label className="mt-5 inline-flex cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                <span>Choose CAD file</span>
                <input
                  className="sr-only"
                  type="file"
                  accept=".step,.stp,.iges,.igs,.sldprt,.sat,.x_t,.x_b,.ipt"
                  onChange={(event) => void handleCadFileSelected(event.target.files?.[0] ?? null)}
                />
              </label>
              <CadUploadPreview onStatus={updateCadPreview} state={cadPreview} />
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Customer Details</h3>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

          {hasCadFile ? (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="grid lg:grid-cols-[0.95fr_1fr]">
                <div className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r">
                  <div className="mx-auto max-w-[520px]">
                    <div className="relative overflow-hidden rounded-lg bg-slate-100">
                      <Image
                        alt="Mockup preview of the uploaded machined part"
                        className="aspect-[4/3] w-full object-cover"
                        height={640}
                        priority
                        src="/part-preview/machined-bracket-mockup.svg"
                        width={960}
                      />
                    </div>

                    <label className="mt-5 block cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-4 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                      <span className="sr-only">Technical drawing</span>
                      <span>{form.technicalDrawingName || "Upload a technical drawing (Required for some part specifications)"}</span>
                    <input
                      className="sr-only"
                      type="file"
                      accept=".pdf,.dxf,.dwg,.png,.jpg,.jpeg"
                      onChange={(event) => handleTechnicalDrawingSelected(event.target.files?.[0] ?? null)}
                    />
                  </label>

                  <CadUploadPreview onStatus={updateCadPreview} state={cadPreview} />

                  <div className="mt-8">
                      <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Inspections & Certificates</h3>
                      <label className="mt-3 grid gap-2 text-sm font-medium text-slate-700">
                        <span>Quality documentation</span>
                        <select
                          className={inputClass}
                          value={form.qualityDocumentation[0] ?? "standard_inspection"}
                          onChange={(event) => setForm((current) => ({ ...current, qualityDocumentation: [event.target.value] }))}
                        >
                          {qualityDocumentationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="mb-8 flex justify-end">
                    <button
                      className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
                      onClick={() => void handleCadFileSelected(null)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-8">
                    <section>
                      <h3 className="text-3xl font-semibold tracking-tight text-slate-950">{form.fileName}</h3>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Quote ID:</p>
                      <div className="mt-6 grid gap-5">
                        <Field label="Material">
                          <select className={inputClass} value={form.material} onChange={(event) => update("material", event.target.value)}>
                            {rfqMaterialOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Quantity">
                          <input className={inputClass} min="1" type="number" value={form.quantity} onChange={(event) => update("quantity", event.target.value)} />
                        </Field>
                      </div>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                      <h3 className="text-3xl font-semibold tracking-tight text-slate-950">Finish</h3>
                      <div className="mt-6 grid gap-5">
                        <Field label="Surface Finish">
                          <select className={inputClass} value={form.surfaceFinish} onChange={(event) => update("surfaceFinish", event.target.value)}>
                            {surfaceFinishOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <input checked={form.partMarkings} onChange={(event) => updateFlag("partMarkings", event.target.checked)} type="checkbox" />
                          <span>Part Markings</span>
                          <span className="font-normal text-slate-500">Yes (drawing required)</span>
                        </label>
                      </div>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                      <h3 className="text-3xl font-semibold tracking-tight text-slate-950">Tolerances</h3>
                      <div className="mt-6 grid gap-5">
                        <Field label="General Tolerances">
                          <select className={inputClass} value={form.generalTolerance} onChange={(event) => update("generalTolerance", event.target.value)}>
                            {generalToleranceOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        {[
                          ["tightLinearTolerance", "Linear Tolerance Tighter Than General Tolerance", form.tightLinearTolerance],
                          ["threads", "Threads", form.threads],
                          ["engineeringFits", "Engineering Fits", form.engineeringFits],
                          ["sharpInternalCorners", "Sharp Internal Corners", form.sharpInternalCorners],
                        ].map(([field, label, checked]) => (
                          <label className="grid gap-2 text-sm font-medium text-slate-700" key={String(field)}>
                            <span>{label}</span>
                            <span className="flex items-center gap-2">
                              <input
                                checked={Boolean(checked)}
                                onChange={(event) =>
                                  updateFlag(field as "tightLinearTolerance" | "threads" | "engineeringFits" | "sharpInternalCorners", event.target.checked)
                                }
                                type="checkbox"
                              />
                              <span className="font-normal text-slate-600">Yes (drawing required)</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </section>

                    <section className="border-t border-slate-200 pt-8">
                      <div className="grid gap-5 md:grid-cols-2">
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
                        <Field label="File reference">
                          <input className={inputClass} placeholder="part.step / drawing.pdf" value={form.fileName} onChange={(event) => update("fileName", event.target.value)} />
                        </Field>
                      </div>
                      <label className="mt-5 grid gap-2 text-sm font-medium text-slate-700">
                        <span>Manufacturing notes</span>
                        <textarea className={`${inputClass} min-h-32`} placeholder="Tolerances, finish, deburr, inspection notes..." value={form.notes} onChange={(event) => update("notes", event.target.value)} />
                      </label>
                    </section>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">
            <button
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
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

        {createdRequest ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
            <p className="font-semibold">Submitted to queue</p>
            <p className="mt-1">{createdRequest.title}</p>
            <p className="mt-1 text-emerald-700">Status: {createdRequest.status}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
