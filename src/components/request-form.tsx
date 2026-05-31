"use client";

import { DragEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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

function drawingCanPreview(file: File | null) {
  if (!file) {
    return false;
  }

  return file.type === "application/pdf" || file.type.startsWith("image/");
}

function TechnicalDrawingReviewModal({
  drawingName,
  drawingPreviewUrl,
  drawingType,
  form,
  onClose,
  onRemove,
  update,
  updateFlag,
}: {
  drawingName: string;
  drawingPreviewUrl: string | null;
  drawingType: string;
  form: FormState;
  onClose: () => void;
  onRemove: () => void;
  update: (field: keyof FormState, value: string) => void;
  updateFlag: (field: keyof Pick<FormState, "partMarkings" | "tightLinearTolerance" | "threads" | "engineeringFits" | "sharpInternalCorners">, value: boolean) => void;
}) {
  const canRenderPreview = Boolean(drawingPreviewUrl) && (drawingType === "application/pdf" || drawingType.startsWith("image/"));

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 px-4 py-6" role="dialog">
      <div className="grid w-full max-w-[1320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-h-[620px] bg-slate-100 p-4">
          <div className="flex h-full min-h-[590px] items-center justify-center overflow-hidden rounded-md border border-slate-300 bg-white">
            {canRenderPreview && drawingPreviewUrl ? (
              drawingType === "application/pdf" ? (
                <object aria-label={`Preview of ${drawingName}`} className="h-[76vh] min-h-[590px] w-full" data={drawingPreviewUrl} type="application/pdf">
                  <p className="p-6 text-sm text-slate-600">{drawingName}</p>
                </object>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={`Preview of ${drawingName}`} className="max-h-[76vh] w-full object-contain" src={drawingPreviewUrl} />
              )
            ) : (
              <div className="max-w-md px-6 text-center">
                <p className="text-lg font-semibold text-slate-950">{drawingName}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">This drawing type is attached, but the browser cannot preview it inline.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="flex min-h-[620px] flex-col border-l border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Technical Drawing Specifications</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Avoid delays and get an accurate price by selecting specifications shown on your technical drawing.</p>
            <p className="mt-3 break-all text-xs font-medium text-slate-400">{drawingName}</p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <Field label="General Tolerance">
              <select className={inputClass} value={form.generalTolerance} onChange={(event) => update("generalTolerance", event.target.value)}>
                {generalToleranceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>Linear tolerances tighter than the general tolerance</span>
              <span className="flex items-center gap-2 font-normal text-slate-700">
                <input checked={form.tightLinearTolerance} onChange={(event) => updateFlag("tightLinearTolerance", event.target.checked)} type="checkbox" />
                <span>Yes</span>
              </span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>Engineering Fits</span>
              <span className="text-sm font-normal text-slate-500">For example: holes and shafts such as H7, k6</span>
              <span className="flex items-center gap-2 font-normal text-slate-700">
                <input aria-label="Engineering Fits" checked={form.engineeringFits} onChange={(event) => updateFlag("engineeringFits", event.target.checked)} type="checkbox" />
                <span>Yes</span>
              </span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-slate-800">
              <span>Threads</span>
              <span className="flex items-center gap-2 font-normal text-slate-700">
                <input aria-label="Threads" checked={form.threads} onChange={(event) => updateFlag("threads", event.target.checked)} type="checkbox" />
                <span>Yes</span>
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
            <button className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={onRemove} type="button">
              Remove Drawing
            </button>
            <button className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={onClose} type="button">
              Done
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function RequestForm() {
  const [form, setForm] = useState<FormState>(() => makeInitialState());
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<LatticeRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDrawingFile, setSelectedDrawingFile] = useState<File | null>(null);
  const [isDrawingReviewOpen, setIsDrawingReviewOpen] = useState(false);
  const [cadPreview, setCadPreview] = useState<CadUploadPreviewState>({ status: "empty" });
  const hasCadFile = Boolean(form.fileName.trim());
  const drawingPreviewUrl = useMemo(() => {
    if (!selectedDrawingFile || !drawingCanPreview(selectedDrawingFile) || typeof URL === "undefined" || !URL.createObjectURL) {
      return null;
    }

    return URL.createObjectURL(selectedDrawingFile);
  }, [selectedDrawingFile]);

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

  useEffect(() => {
    if (!drawingPreviewUrl || typeof URL === "undefined" || !URL.revokeObjectURL) {
      return;
    }

    return () => URL.revokeObjectURL(drawingPreviewUrl);
  }, [drawingPreviewUrl]);

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
    setIsDrawingReviewOpen(Boolean(file));
  }

  function removeTechnicalDrawing() {
    setSelectedDrawingFile(null);
    update("technicalDrawingName", "");
    setIsDrawingReviewOpen(false);
  }

  function handleCadDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    void handleCadFileSelected(event.dataTransfer.files[0] ?? null);
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8c8c8c]">Request Quote</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Create a manufacturable RFQ package.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Send the part file, target quantity, material, and timing so Lattice can turn it into a clean RFQ package for review.
        </p>
      </section>

      <div>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {isDrawingReviewOpen && form.technicalDrawingName ? (
            <TechnicalDrawingReviewModal
              drawingName={form.technicalDrawingName}
              drawingPreviewUrl={drawingPreviewUrl}
              drawingType={selectedDrawingFile?.type ?? ""}
              form={form}
              onClose={() => setIsDrawingReviewOpen(false)}
              onRemove={removeTechnicalDrawing}
              update={update}
              updateFlag={updateFlag}
            />
          ) : null}

          <div className="border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Upload CAD file</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Upload the part file first so Lattice can build the RFQ around the actual geometry, material, and production requirements.</p>
            </div>
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

          {hasCadFile ? (
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
          ) : null}

          {hasCadFile ? (
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="grid lg:grid-cols-[0.95fr_1fr]">
                <div className="border-b border-slate-200 p-8 lg:border-b-0 lg:border-r">
                  <div className="mx-auto max-w-[520px]">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">CAD file preview</p>
                          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{form.partName || form.fileName}</h3>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">{form.fileName.split(".").pop()?.toUpperCase() ?? "CAD"}</span>
                      </div>
                      <CadUploadPreview onStatus={updateCadPreview} state={cadPreview} />
                    </div>

                    <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Technical drawing</p>
                      <p className="mt-2 break-all">{form.technicalDrawingName || "Upload a technical drawing (Required for some part specifications)"}</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <label className="inline-flex cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          <span>{form.technicalDrawingName ? "Replace drawing" : "Choose drawing"}</span>
                          <input
                            aria-label="Technical drawing"
                            className="sr-only"
                            type="file"
                            accept=".pdf,.dxf,.dwg,.png,.jpg,.jpeg"
                            onChange={(event) => handleTechnicalDrawingSelected(event.target.files?.[0] ?? null)}
                          />
                        </label>
                        {form.technicalDrawingName ? (
                          <button
                            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => setIsDrawingReviewOpen(true)}
                            type="button"
                          >
                            Review drawing specs
                          </button>
                        ) : null}
                      </div>
                    </div>

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

          <div className="border-t border-slate-100 pt-6">
            <button
              className="rounded-lg bg-[#262626] px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:bg-[#cfcfcf] disabled:text-white"
              disabled={!isReady}
              type="submit"
            >
              Request Quote
            </button>
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
