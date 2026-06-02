"use client";

import { Clipboard, Download, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  buildCustomerQuoteMarkdown,
  customerQuoteFileName,
  formatUsd,
  quoteSubtotal,
  type CustomerQuoteInput,
  type CustomerQuoteLineItem,
} from "@/lib/quote-file";

const inputClass = "mt-1 w-full rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm text-[#202020] outline-none transition focus:border-[#171717] focus:ring-2 focus:ring-[#171717]/10";
const labelClass = "text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const defaultLineItem: CustomerQuoteLineItem = {
  description: "Machined bracket",
  finish: "As machined",
  id: "line-1",
  material: "6061-T6 aluminum",
  process: "CNC machining",
  quantity: 25,
  unitPrice: 92,
};

const initialQuote: CustomerQuoteInput = {
  assumptions: [
    "Customer-supplied CAD and drawings are complete and represent the latest revision.",
    "General tolerances are +/- 0.005 in unless otherwise specified.",
    "Standard dimensional inspection is included.",
  ].join("\n"),
  clarifications: "Please confirm whether material certification is required with shipment.",
  customerCompany: "Apex Robotics",
  customerContact: "Maya Chen, maya@apex.example",
  filesReviewed: "sensor-mount-bracket.step\nsensor-mount-bracket-drawing.pdf",
  leadTime: "12-15 business days",
  lineItems: [defaultLineItem],
  notes: "Pricing includes manufacturing coordination, production, and standard inspection for the listed line items.",
  preparedBy: "Lattice",
  projectName: "Sensor Mount Bracket Pilot Run",
  quoteDate: todayIso(),
  quoteNumber: "LQ-2026-0142",
  shipping: "Billed at actual",
  tax: "Not included",
  validUntil: addDaysIso(14),
};

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input className={inputClass} onChange={(event) => onChange(event.target.value)} type={type} value={value} />
    </label>
  );
}

function TextArea({
  label,
  onChange,
  rows = 4,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea className={`${inputClass} resize-y leading-6`} onChange={(event) => onChange(event.target.value)} rows={rows} value={value} />
    </label>
  );
}

export function CustomerQuoteBuilder({
  initialQuote: providedInitialQuote,
  requestId,
  saveAction,
}: {
  initialQuote?: CustomerQuoteInput;
  requestId?: string;
  saveAction?: (formData: FormData) => void | Promise<void>;
} = {}) {
  const [quote, setQuote] = useState<CustomerQuoteInput>(providedInitialQuote ?? initialQuote);
  const quoteMarkdown = useMemo(() => buildCustomerQuoteMarkdown(quote), [quote]);
  const subtotal = useMemo(() => quoteSubtotal(quote.lineItems), [quote.lineItems]);
  const fileName = useMemo(() => customerQuoteFileName(quote), [quote]);
  const quotePayload = useMemo(() => JSON.stringify(quote), [quote]);
  const saveSummary = `${quote.notes.trim()}\n\n${quote.lineItems
    .map((item) => `${item.description || "Part / item"}: ${formatUsd(item.unitPrice)} × ${item.quantity}`)
    .join("\n")}`.trim();

  function updateQuote<K extends keyof CustomerQuoteInput>(key: K, value: CustomerQuoteInput[K]) {
    setQuote((current) => ({ ...current, [key]: value }));
  }

  function updateLineItem(id: string, updates: Partial<CustomerQuoteLineItem>) {
    setQuote((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }

  function addLineItem() {
    setQuote((current) => ({
      ...current,
      lineItems: [
        ...current.lineItems,
        {
          description: "",
          finish: "",
          id: `line-${Date.now()}`,
          material: "",
          process: "",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    }));
  }

  function removeLineItem(id: string) {
    setQuote((current) => ({
      ...current,
      lineItems: current.lineItems.length === 1 ? current.lineItems : current.lineItems.filter((item) => item.id !== id),
    }));
  }

  function downloadQuoteFile() {
    const blob = new Blob([quoteMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-5">
        <section className="rounded-md border border-[#ead7c5] bg-white p-5">
          {requestId ? <p className="mb-4 rounded-md bg-[#fff6ee] px-3 py-2 text-sm font-semibold text-[#6f4529]">Linked RFQ: {requestId}</p> : null}
          <div className="mb-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7a4d2d]">Quote identity</p>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight text-[#202020]">Customer-facing quote header</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Quote number" onChange={(value) => updateQuote("quoteNumber", value)} value={quote.quoteNumber} />
            <Field label="Quote date" onChange={(value) => updateQuote("quoteDate", value)} type="date" value={quote.quoteDate} />
            <Field label="Valid until" onChange={(value) => updateQuote("validUntil", value)} type="date" value={quote.validUntil} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Customer company" onChange={(value) => updateQuote("customerCompany", value)} value={quote.customerCompany} />
            <Field label="Customer contact" onChange={(value) => updateQuote("customerContact", value)} value={quote.customerContact} />
            <Field label="Project / RFQ" onChange={(value) => updateQuote("projectName", value)} value={quote.projectName} />
            <Field label="Prepared by" onChange={(value) => updateQuote("preparedBy", value)} value={quote.preparedBy} />
          </div>
        </section>

        <section className="rounded-md border border-[#ead7c5] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7a4d2d]">Part production</p>
              <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-[#202020]">Line items</h2>
              <p className="mt-1 text-[14px] text-[#707782]">Price each quoted part with process, material, finish, quantity, and unit price.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm font-semibold text-[#262626] transition hover:bg-[#f8fafc]" onClick={addLineItem} type="button">
              <Plus aria-hidden="true" size={16} />
              Add line
            </button>
          </div>
          <div className="divide-y divide-[#eeeeee]">
            {quote.lineItems.map((item, index) => (
              <article className="p-5" key={item.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#202020]">Item {index + 1}</p>
                  <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-[#737b86] transition hover:bg-[#f8fafc] hover:text-[#202020]" disabled={quote.lineItems.length === 1} onClick={() => removeLineItem(item.id)} type="button">
                    <Trash2 aria-hidden="true" size={15} />
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Part / description" onChange={(value) => updateLineItem(item.id, { description: value })} value={item.description} />
                  <Field label="Process" onChange={(value) => updateLineItem(item.id, { process: value })} value={item.process} />
                  <Field label="Material" onChange={(value) => updateLineItem(item.id, { material: value })} value={item.material} />
                  <Field label="Finish" onChange={(value) => updateLineItem(item.id, { finish: value })} value={item.finish} />
                  <Field label="Quantity" onChange={(value) => updateLineItem(item.id, { quantity: Number(value) || 0 })} type="number" value={String(item.quantity)} />
                  <Field label="Unit price" onChange={(value) => updateLineItem(item.id, { unitPrice: Number(value) || 0 })} type="number" value={String(item.unitPrice)} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#ead7c5] bg-white p-5">
          <div className="mb-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7a4d2d]">Logistics and terms</p>
            <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-[#202020]">Production speed, shipping, tax, and notes</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Lead time" onChange={(value) => updateQuote("leadTime", value)} value={quote.leadTime} />
            <Field label="Shipping" onChange={(value) => updateQuote("shipping", value)} value={quote.shipping} />
            <Field label="Tax" onChange={(value) => updateQuote("tax", value)} value={quote.tax} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextArea label="Files reviewed" onChange={(value) => updateQuote("filesReviewed", value)} value={quote.filesReviewed} />
            <TextArea label="Quote notes" onChange={(value) => updateQuote("notes", value)} value={quote.notes} />
            <TextArea label="Manufacturing assumptions" onChange={(value) => updateQuote("assumptions", value)} rows={5} value={quote.assumptions} />
            <TextArea label="Open questions" onChange={(value) => updateQuote("clarifications", value)} rows={5} value={quote.clarifications} />
          </div>
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
        <section className="rounded-md border border-[#ead7c5] bg-[#fffaf6] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#7a4d2d]">Customer quote file</p>
          <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#171717]">{formatUsd(subtotal)}</h2>
          <p className="mt-1 text-sm text-[#707782]">{fileName}</p>
          <form action={saveAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input name="quoteTotalCents" type="hidden" value={Math.round(subtotal * 100)} />
            <input name="leadTime" type="hidden" value={quote.leadTime} />
            <input name="quoteSummary" type="hidden" value={saveSummary} />
            <input name="quoteMarkdown" type="hidden" value={quoteMarkdown} />
            <input name="quotePayload" type="hidden" value={quotePayload} />
            {requestId ? <input name="requestId" type="hidden" value={requestId} /> : null}
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#303030]" onClick={downloadQuoteFile} type="button">
              <Download aria-hidden="true" size={16} />
              Download quote
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626] transition hover:bg-[#f8fafc]" onClick={() => navigator.clipboard.writeText(quoteMarkdown)} type="button">
              <Clipboard aria-hidden="true" size={16} />
              Copy text
            </button>
            {saveAction ? (
              <button className="inline-flex items-center justify-center gap-2 rounded-md bg-[#4f3424] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3a281d]" type="submit">
                <Save aria-hidden="true" size={16} />
                Save to RFQ
              </button>
            ) : null}
          </form>
        </section>

        <section className="overflow-hidden rounded-md border border-[#ead7c5] bg-white">
          <div className="border-b border-[#eeeeee] px-5 py-4">
            <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Preview</h2>
            <p className="mt-1 text-[14px] text-[#707782]">This is the Markdown file the customer receives.</p>
          </div>
          <textarea className="min-h-[640px] w-full resize-y border-0 bg-white p-5 font-mono text-[12px] leading-5 text-[#303036] outline-none" readOnly value={quoteMarkdown} />
        </section>
      </aside>
    </div>
  );
}
