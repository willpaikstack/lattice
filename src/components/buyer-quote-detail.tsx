import Link from "next/link";

import type { LatticeRequest, RequestStatus, SupplierQuoteStatus } from "@/lib/request-model";

import { CadFilePreview } from "./cad-file-preview";

const quoteStatusCopy: Record<RequestStatus, { label: string; tone: string; buyerAction: string }> = {
  DRAFT: {
    label: "Draft",
    tone: "bg-slate-100 text-slate-700",
    buyerAction: "Submit the request before quote tracking begins.",
  },
  SUBMITTED: {
    label: "Submitted",
    tone: "bg-blue-50 text-blue-700",
    buyerAction: "Lattice is checking the RFQ package before supplier outreach.",
  },
  NEEDS_INFO: {
    label: "Needs info",
    tone: "bg-amber-50 text-amber-700",
    buyerAction: "Additional buyer detail is needed before suppliers can quote accurately.",
  },
  READY_FOR_SUPPLIER_RFQ: {
    label: "Under supplier review",
    tone: "bg-indigo-50 text-indigo-700",
    buyerAction: "The package is complete and supplier pricing is being collected.",
  },
  QUOTED: {
    label: "Ready for acceptance",
    tone: "bg-emerald-50 text-emerald-700",
    buyerAction: "Review the price, lead time, assumptions, and convert to an order when approved.",
  },
  PURCHASED: {
    label: "Purchased",
    tone: "bg-slate-950 text-white",
    buyerAction: "This quote has been accepted and converted into an order.",
  },
};

const supplierQuoteLabels: Record<SupplierQuoteStatus, string> = {
  INVITED: "Invited",
  QUOTE_RECEIVED: "Quote received",
  DECLINED: "Declined",
  SELECTED: "Selected",
};

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Pending pricing";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function BuyerQuoteDetail({
  request,
  purchaseAction,
}: {
  request: LatticeRequest;
  purchaseAction?: () => void | Promise<void>;
}) {
  const canPurchase = request.status === "QUOTED";
  const status = quoteStatusCopy[request.status];
  const selectedSupplierQuote = request.supplierQuotes.find((quote) => quote.isSelected || quote.status === "SELECTED");
  const quoteReference = `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <Link className="inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-950" href="/quotes">
        ← Back to quotes
      </Link>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Quote {quoteReference}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{request.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              A consistent quote record for reviewing pricing, lead time, manufacturing requirements, files, supplier coverage, and acceptance.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current quote state</p>
            <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>{status.label}</span>
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
              <div className="flex justify-between gap-4">
                <dt>Updated</dt>
                <dd className="font-medium text-slate-950">{formatDate(request.updatedAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Customer</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">{request.buyerCompany}</p>
          <p className="mt-1 text-sm text-slate-500">{request.requesterName}</p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Process</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">{request.process}</p>
          <p className="mt-1 text-sm text-slate-500">{request.lineItems.length} line item(s)</p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Files reviewed</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">{request.files.length}</p>
          <p className="mt-1 text-sm text-slate-500">CAD and drawing references</p>
        </div>
        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Supplier basis</p>
          <p className="mt-3 text-lg font-semibold text-slate-950">{selectedSupplierQuote?.shopName ?? "Pending"}</p>
          <p className="mt-1 text-sm text-slate-500">{selectedSupplierQuote ? `${formatPrice(selectedSupplierQuote.priceCents)} supplier quote` : "No supplier quote selected yet"}</p>
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
          <p className="mt-4 text-sm leading-6 text-slate-600">{status.buyerAction}</p>
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
              {item.qualityDocumentation?.length ? (
                <p className="text-sm text-slate-600 md:col-span-5"><span className="font-medium text-slate-950">Quality docs:</span> {item.qualityDocumentation.join(", ")}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Supplier quote basis</p>
          </div>
          <div className="divide-y divide-slate-100">
            {request.supplierQuotes.length ? (
              request.supplierQuotes.map((quote) => (
                <article className="grid gap-3 p-5 md:grid-cols-[1fr_0.55fr_0.55fr_0.6fr] md:items-center" key={quote.id}>
                  <div>
                    <p className="font-semibold text-slate-950">{quote.shopName}</p>
                    <p className="mt-1 text-sm text-slate-500">{quote.country}{quote.contactName ? ` - ${quote.contactName}` : ""}</p>
                    {quote.notes ? <p className="mt-2 text-sm leading-6 text-slate-600">{quote.notes}</p> : null}
                  </div>
                  <p className="text-sm font-medium text-slate-950">{formatPrice(quote.priceCents)}</p>
                  <p className="text-sm text-slate-600">{quote.leadTimeDays ? `${quote.leadTimeDays} days` : "Lead time pending"}</p>
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-950">{supplierQuoteLabels[quote.status]}</p>
                    <p className="mt-1">{formatDate(quote.quotedAt)}</p>
                  </div>
                </article>
              ))
            ) : (
              <p className="p-5 text-sm leading-6 text-slate-600">Supplier responses will appear here after operator outreach. The customer-facing quote keeps the same template before and after supplier pricing is available.</p>
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Quote activity</p>
          <div className="mt-5 space-y-4">
            {request.statusEvents.map((event) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={event.id}>
                <p className="text-sm font-semibold text-slate-950">{quoteStatusCopy[event.to].label}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(event.at)} by {event.actor}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">CAD files</p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {request.files.map((file) => (
            <CadFilePreview file={file} key={file.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
