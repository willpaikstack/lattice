import Link from "next/link";

import type { LatticeRequest } from "@/lib/request-model";

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPriceInput(cents: number | null) {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

const reviewChecklist = [
  "Confirm every CAD/drawing file is readable and matched to a line item.",
  "Check material, quantity, due date, finish, and inspection requirements.",
  "Resolve missing buyer information before supplier outreach.",
  "Package the request for supplier RFQ once complete.",
];

export function OperatorRequestDetail({
  request,
  updateAction,
}: {
  request: LatticeRequest;
  updateAction?: (formData: FormData) => void | Promise<void>;
}) {
  const primaryLine = request.lineItems[0];

  return (
    <div className="space-y-6">
      <Link className="inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-950" href="/admin/quotes">
        ← Back to quote submissions
      </Link>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Operator review</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{request.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Review buyer intake, package supplier-ready details, and decide whether this RFQ needs more information before outreach.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-72">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current state</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase text-blue-700">{request.status}</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {formatStatus(request.operatorReview.completeness)}
              </span>
            </div>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between gap-4">
                <dt>Owner</dt>
                <dd className="font-medium text-slate-950">{request.operatorReview.assignedOwner ?? "Unassigned"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Due date</dt>
                <dd className="font-medium text-slate-950">{request.dueDate}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Process</dt>
                <dd className="font-medium text-slate-950">{request.process}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Operator controls</p>
          <form action={updateAction} className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Review status
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  defaultValue={request.status === "PURCHASED" ? "QUOTED" : request.status}
                  name="status"
                >
                  <option value="SUBMITTED">Submitted / under review</option>
                  <option value="NEEDS_INFO">Needs buyer info</option>
                  <option value="READY_FOR_SUPPLIER_RFQ">Ready for supplier RFQ</option>
                  <option value="QUOTED">Priced / ready for buyer</option>
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Assigned owner
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  defaultValue={request.operatorReview.assignedOwner ?? ""}
                  name="assignedOwner"
                  placeholder="Owner name"
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Internal notes
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                defaultValue={request.operatorReview.internalNotes}
                name="internalNotes"
                placeholder="Missing info, review decisions, customer follow-up."
              />
            </label>
            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Supplier package notes
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                defaultValue={request.operatorReview.supplierPackageNotes}
                name="supplierPackageNotes"
                placeholder="Clean notes suppliers should receive after internal review."
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Estimated quote price
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  defaultValue={formatPriceInput(request.quote.estimatedPriceCents)}
                  min="0"
                  name="estimatedPrice"
                  placeholder="1250.00"
                  step="0.01"
                  type="number"
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Lead time days
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  defaultValue={request.quote.leadTimeDays ?? ""}
                  min="1"
                  name="leadTimeDays"
                  placeholder="14"
                  type="number"
                />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Buyer quote summary
              <textarea
                className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                defaultValue={request.quote.summary}
                name="quoteSummary"
                placeholder="Short buyer-facing pricing and delivery summary."
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!updateAction}
                type="submit"
              >
                Save review decision
              </button>
              <Link
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                href="/admin/quotes"
              >
                Manage quote submission
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Review checklist</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
            {reviewChecklist.map((item) => (
              <li className="flex gap-3" key={item}>
                <span className="mt-1.5 size-2 rounded-full bg-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Buyer intake</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Company</p>
              <p className="mt-2 font-semibold text-slate-950">{request.buyerCompany}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Requester</p>
              <p className="mt-2 font-semibold text-slate-950">{request.requesterName}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Primary part</p>
              <p className="mt-2 font-semibold text-slate-950">{primaryLine?.partName ?? "No line item"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Files</p>
              <p className="mt-2 font-semibold text-slate-950">{request.files.length} uploaded</p>
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Line items</p>
        </div>
        <div className="divide-y divide-slate-100">
          {request.lineItems.map((item) => (
            <article className="grid gap-3 p-5 md:grid-cols-[1fr_0.35fr_0.7fr_0.7fr_0.8fr] md:items-center" key={item.id}>
              <div>
                <p className="font-semibold text-slate-950">{item.partName}</p>
                {item.notes ? <p className="mt-1 text-sm text-slate-500">{item.notes}</p> : null}
                {item.qualityDocumentation?.length ? (
                  <p className="mt-1 text-xs text-slate-500">Quality docs: {item.qualityDocumentation.join(", ")}</p>
                ) : null}
              </div>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Qty:</span> {item.quantity}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Material:</span> {item.material}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Tolerance:</span> {item.generalTolerance || "Not specified"}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Finish:</span> {item.surfaceFinish || "Not specified"}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Uploaded files</p>
          <div className="mt-5 space-y-3">
            {request.files.map((file) => (
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4" key={file.id}>
                <div>
                  <p className="font-semibold text-slate-950">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{file.type || "Unknown file type"}</p>
                </div>
                <p className="text-sm font-medium text-slate-600">{formatFileSize(file.sizeBytes)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Status history</p>
          <ol className="mt-5 space-y-4">
            {request.statusEvents.map((event) => (
              <li className="rounded-2xl bg-slate-50 p-4" key={event.id}>
                <p className="font-semibold text-slate-950">{event.from ? `${event.from} → ${event.to}` : event.to}</p>
                <p className="mt-1 text-sm text-slate-500">{event.actor} • {formatDateTime(event.at)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Internal notes</p>
          <p className="mt-4 min-h-24 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {request.operatorReview.internalNotes || "No internal notes yet. Next step: capture missing details, owner decisions, and customer follow-up here."}
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Supplier package notes</p>
          <p className="mt-4 min-h-24 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {request.operatorReview.supplierPackageNotes || "No supplier package notes yet. This becomes the clean context package suppliers receive after review."}
          </p>
        </div>
      </section>
    </div>
  );
}
