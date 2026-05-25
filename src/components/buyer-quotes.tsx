import Link from "next/link";

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

export function BuyerQuotes({ requests }: { requests: LatticeRequest[] }) {
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
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.3fr_0.8fr_0.8fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 max-lg:hidden">
        <span>RFQ</span>
        <span>Status</span>
        <span>Updated</span>
        <span>Next step</span>
      </div>
      <div className="divide-y divide-slate-100">
        {requests.map((request) => {
          const status = buyerStatusCopy[request.status];
          const primaryLine = request.lineItems[0];

          return (
            <article className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr] lg:items-center" key={request.id}>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  <Link className="transition hover:text-blue-700" href={`/quotes/${request.id}`}>
                    {request.title}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-slate-500">{primaryLine?.partName ?? "No line item"} • {request.process}</p>
                <p className="mt-1 text-xs text-slate-500">Due {request.dueDate} • {request.files.length} file(s)</p>
              </div>
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
  );
}
