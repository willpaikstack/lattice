import Link from "next/link";

import type { LatticeRequest } from "@/lib/request-model";

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Pending pricing";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function BuyerQuoteDetail({
  request,
  purchaseAction,
}: {
  request: LatticeRequest;
  purchaseAction?: () => void | Promise<void>;
}) {
  const canPurchase = request.status === "QUOTED";

  return (
    <div className="space-y-6">
      <Link className="inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-950" href="/quotes">
        ← Back to quotes
      </Link>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Buyer quote detail</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{request.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Review the RFQ package, current quote status, pricing summary, and purchase conversion path.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current quote state</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{formatStatus(request.status)}</p>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between gap-4">
                <dt>Price</dt>
                <dd className="font-medium text-slate-950">{formatPrice(request.quote.estimatedPriceCents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Lead time</dt>
                <dd className="font-medium text-slate-950">{request.quote.leadTimeDays ? `${request.quote.leadTimeDays} days` : "Pending"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Due date</dt>
                <dd className="font-medium text-slate-950">{request.dueDate}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Purchase decision</p>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {canPurchase
              ? "Pricing is ready. Convert this quote into an order when the buyer accepts the price and lead time."
              : request.status === "PURCHASED"
                ? "This quote has already been converted into an order."
                : "This RFQ is not priced yet. The purchase action becomes available after operator pricing."}
          </p>
          {request.status === "PURCHASED" ? (
            <Link className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800" href="/orders">
              View Order
            </Link>
          ) : (
            <form action={purchaseAction} className="mt-6">
              <button
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canPurchase || !purchaseAction}
                type="submit"
              >
                Convert to Order
              </button>
            </form>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Quote summary</p>
          <p className="mt-4 min-h-24 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {request.quote.summary || request.operatorReview.supplierPackageNotes || "Pricing summary will appear here once the operator marks this RFQ as priced."}
          </p>
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
              </div>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Qty:</span> {item.quantity}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Material:</span> {item.material}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Tolerance:</span> {item.generalTolerance || "Not specified"}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Finish:</span> {item.surfaceFinish || "Not specified"}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
