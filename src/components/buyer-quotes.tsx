"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CadFilePreview } from "@/components/cad-file-preview";
import type { LatticeRequest } from "@/lib/request-model";

const buyerStatusCopy: Record<LatticeRequest["status"], { label: string; tone: string; description: string }> = {
  DRAFT: {
    label: "Draft",
    tone: "bg-slate-100 text-slate-700",
    description: "Not submitted yet.",
  },
  SUBMITTED: {
    label: "Submitted",
    tone: "bg-blue-50 text-blue-700",
    description: "Your RFQ was received and is waiting for internal review.",
  },
  NEEDS_INFO: {
    label: "Needs info",
    tone: "bg-amber-50 text-amber-700",
    description: "The operator team needs more buyer detail before supplier outreach.",
  },
  READY_FOR_SUPPLIER_RFQ: {
    label: "Under supplier review",
    tone: "bg-indigo-50 text-indigo-700",
    description: "The package is complete and ready for supplier RFQ outreach.",
  },
  QUOTED: {
    label: "Priced / ready for buyer",
    tone: "bg-emerald-50 text-emerald-700",
    description: "Pricing is ready for buyer review and purchase decision.",
  },
  PURCHASED: {
    label: "Purchased",
    tone: "bg-slate-950 text-white",
    description: "This quote has been converted into an order.",
  },
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Pending pricing";
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function QuotePreviewDialog({ request, onClose }: { request: LatticeRequest; onClose: () => void }) {
  const status = buyerStatusCopy[request.status];

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div aria-labelledby="quote-preview-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog">
      <button aria-label="Close quote preview" className="absolute inset-0 cursor-default" onClick={onClose} type="button" />
      <section className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Quote preview</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950" id="quote-preview-title">{request.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{request.buyerCompany} - Updated {formatUpdatedAt(request.updatedAt)}</p>
          </div>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-xl leading-none text-slate-500 transition hover:bg-slate-50 hover:text-slate-950" onClick={onClose} type="button">
            x
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.72fr]">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Status</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{status.label}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Price</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{formatPrice(request.quote.estimatedPriceCents)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Lead time</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Pending"}</p>
              </div>
            </div>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Line items</h3>
              <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {request.lineItems.map((item) => (
                  <article className="grid gap-3 p-4 md:grid-cols-[1fr_0.35fr_0.8fr]" key={item.id}>
                    <div>
                      <p className="font-semibold text-slate-950">{item.partName}</p>
                      {item.notes ? <p className="mt-1 text-sm leading-5 text-slate-500">{item.notes}</p> : null}
                    </div>
                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Qty:</span> {item.quantity}</p>
                    <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Material:</span> {item.material}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Quote summary</h3>
              <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {request.quote.summary || request.operatorReview.supplierPackageNotes || status.description}
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">CAD files</h3>
              <div className="mt-3 grid gap-3">
                {request.files.map((file) => (
                  <CadFilePreview file={file} key={file.id} />
                ))}
              </div>
            </div>
            <Link className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href={`/quotes/${request.id}`}>
              Open full quote page
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}

export function BuyerQuotes({ requests }: { requests: LatticeRequest[] }) {
  const [selectedRequest, setSelectedRequest] = useState<LatticeRequest | null>(null);

  if (requests.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">No submitted RFQs yet.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Submit a request quote package first. It will appear here as a buyer-facing quote tracker while operator review continues internally.
        </p>
        <Link className="mt-6 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href="/requests/new">
          Request Quote
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.2fr_0.72fr_0.7fr_0.7fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 max-lg:hidden">
          <span>RFQ</span>
          <span>CAD preview</span>
          <span>Status</span>
          <span>Updated</span>
          <span>Next step</span>
        </div>
        <div className="divide-y divide-slate-100">
          {requests.map((request) => {
            const status = buyerStatusCopy[request.status];
            const primaryLine = request.lineItems[0];

            return (
              <article className="grid gap-4 p-5 lg:grid-cols-[1.2fr_0.72fr_0.7fr_0.7fr_1fr] lg:items-center" key={request.id}>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    <button className="text-left transition hover:text-blue-700" onClick={() => setSelectedRequest(request)} type="button">
                      {request.title}
                    </button>
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{primaryLine?.partName ?? "No line item"} - {request.process}</p>
                  <p className="mt-1 text-xs text-slate-500">Due {request.dueDate} - {request.files.length} file(s)</p>
                  <button className="mt-3 inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => setSelectedRequest(request)} type="button">
                    Preview quote
                  </button>
                </div>
                <div>{request.files[0] ? <CadFilePreview compact file={request.files[0]} /> : <p className="text-sm text-slate-500">No file uploaded</p>}</div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
                </div>
                <p className="text-sm text-slate-600">{formatUpdatedAt(request.updatedAt)}</p>
                <p className="text-sm leading-6 text-slate-600">{status.description}</p>
              </article>
            );
          })}
        </div>
      </section>
      {selectedRequest ? <QuotePreviewDialog onClose={() => setSelectedRequest(null)} request={selectedRequest} /> : null}
    </>
  );
}
