import Link from "next/link";

import type { LatticeRequest } from "@/lib/request-model";

function formatCompleteness(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function OperatorQueue({ requests }: { requests: LatticeRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">RFQ Queue</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">No submitted requests yet</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500">Create a buyer request first. It will appear here for internal review, packaging, and supplier outreach.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">RFQ Queue</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Incoming buyer requests</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">Review completeness, package supplier RFQs, and assign owners. This screen is moving toward the Bubble-inspired operations queue.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3 text-center">
            <div className="px-3">
              <p className="text-2xl font-semibold text-slate-950">{requests.length}</p>
              <p className="text-xs font-medium text-slate-500">Submitted</p>
            </div>
            <div className="border-x border-slate-200 px-3">
              <p className="text-2xl font-semibold text-slate-950">0</p>
              <p className="text-xs font-medium text-slate-500">Assigned</p>
            </div>
            <div className="px-3">
              <p className="text-2xl font-semibold text-slate-950">{requests.length}</p>
              <p className="text-xs font-medium text-slate-500">Needs review</p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 max-lg:hidden">
          <span>RFQ</span>
          <span>Process</span>
          <span>Due date</span>
          <span>Owner</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-slate-100">
          {requests.map((request) => (
            <article className="grid gap-4 p-5 transition hover:bg-slate-50 lg:grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.8fr] lg:items-center" key={request.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{request.status}</span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{formatCompleteness(request.operatorReview.completeness)}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-950">{request.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{request.buyerCompany}</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:hidden">
                  <p><span className="font-medium text-slate-950">Process:</span> {request.process}</p>
                  <p><span className="font-medium text-slate-950">Due:</span> {request.dueDate}</p>
                  <p><span className="font-medium text-slate-950">Owner:</span> {request.operatorReview.assignedOwner ?? "Unassigned"}</p>
                </div>
              </div>

              <p className="hidden text-sm font-medium text-slate-700 lg:block">{request.process}</p>
              <p className="hidden text-sm text-slate-600 lg:block">{request.dueDate}</p>
              <p className="hidden text-sm text-slate-600 lg:block">{request.operatorReview.assignedOwner ?? "Unassigned"}</p>
              <div className="flex items-center justify-between gap-3 lg:block">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{request.lineItems[0]?.partName}</p>
                  <p className="mt-1 text-xs text-slate-500">{request.lineItems[0]?.quantity} × {request.lineItems[0]?.material}</p>
                  <p className="mt-1 text-xs text-slate-500">Files: {request.files.map((file) => file.name).join(", ")}</p>
                </div>
                <Link className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white lg:mt-3" href={`/operator/requests/${request.id}`}>
                  Review
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
