import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, LockKeyhole } from "lucide-react";

import { GuestQuoteCheckout } from "@/components/guest-quote-checkout";
import { PublicHeader } from "@/components/public-entry";
import { validateGuestQuoteAccess } from "@/lib/guest-quote-access";
import { quotedLineForRequestItem } from "@/lib/request-model";
import type { LatticeRequest } from "@/lib/request-model";
import { getRequestById } from "@/lib/request-repository";
import { createGuestStripeElementsCheckoutSessionForRequest } from "@/lib/stripe-checkout";

import { finalizeGuestStripeCardPaymentAction, updateGuestStripeElementsSessionAction } from "./actions";

export const dynamic = "force-dynamic";

function money(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(cents / 100);
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function lineTotal(request: LatticeRequest, item: LatticeRequest["lineItems"][number]) {
  const quotedLine = quotedLineForRequestItem(request.customerQuotes.at(-1)?.lineItems, item);

  if (quotedLine) {
    return Math.round(quotedLine.quantity * quotedLine.unitPrice * 100);
  }

  if (request.lineItems.length === 1) {
    return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  }

  return null;
}

export default async function GuestQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ payment?: string; token?: string }>;
}) {
  const { requestId } = await params;
  const { payment, token = "" } = await searchParams;
  const request = await getRequestById(requestId);

  if (!request || !validateGuestQuoteAccess(request, token)) {
    notFound();
  }

  const latestQuote = request.customerQuotes.at(-1);
  const quoteId = quoteReference(request);
  const subtotalCents = latestQuote?.totalCents ?? request.quote.estimatedPriceCents;
  const totalCents = subtotalCents === null ? null : subtotalCents + (request.quote.shippingCostCents ?? 0);
  const canPay = request.status === "QUOTED";
  let stripeElementsSession = null;

  if (canPay) {
    try {
      stripeElementsSession = await createGuestStripeElementsCheckoutSessionForRequest(request);
    } catch (error) {
      console.warn("Guest Stripe payment is unavailable for this quote.", error);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-950">
      <PublicHeader />
      <section className="px-6 pb-12 pt-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-stone-950" href="/">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Lattice
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
            <main className="space-y-6">
              <section className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      <LockKeyhole aria-hidden="true" className="h-4 w-4" />
                      Private quote link
                    </p>
                    <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-normal text-stone-950">{quoteId}</h1>
                    <p className="mt-2 text-lg leading-7 text-stone-600">{request.title}</p>
                  </div>
                  {latestQuote ? (
                    <a
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
                      download
                      href={`/simple-quote/${encodeURIComponent(request.id)}/quote.pdf?token=${encodeURIComponent(token)}`}
                    >
                      <Download aria-hidden="true" className="h-4 w-4" />
                      Download PDF
                    </a>
                  ) : null}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-4">
                  <div className="rounded-md bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Total</p>
                    <p className="mt-2 text-2xl font-semibold text-stone-950">{money(totalCents)}</p>
                  </div>
                  <div className="rounded-md bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Lead time</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">{latestQuote?.leadTime || (request.quote.leadTimeDays ? `${request.quote.leadTimeDays} business days` : "Pending")}</p>
                  </div>
                  <div className="rounded-md bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Valid until</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">{latestQuote?.validUntil || request.quote.quoteValidUntil || "Pending"}</p>
                  </div>
                  <div className="rounded-md bg-stone-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Payment</p>
                    <p className="mt-2 text-lg font-semibold text-stone-950">Credit card</p>
                  </div>
                </div>

                {payment === "pending" ? <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">Stripe is still confirming this payment. Please try again in a moment.</p> : null}
              </section>

              <section className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-normal text-stone-950">Quoted parts</h2>
                <div className="mt-5 overflow-hidden rounded-md border border-stone-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-stone-100 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      <tr>
                        <th className="px-4 py-3">Part</th>
                        <th className="px-4 py-3">Material</th>
                        <th className="px-4 py-3">Qty</th>
                        <th className="px-4 py-3 text-right">Line total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {request.lineItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 font-semibold text-stone-950">{item.partName}</td>
                          <td className="px-4 py-4 text-stone-600">{item.material}</td>
                          <td className="px-4 py-4 text-stone-600">{item.quantity}</td>
                          <td className="px-4 py-4 text-right font-semibold text-stone-950">{money(lineTotal(request, item))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-normal text-stone-950">Files reviewed</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {request.files.map((file) => (
                    <div className="flex items-center gap-3 rounded-md border border-stone-200 bg-stone-50 p-3" key={file.id}>
                      <FileText aria-hidden="true" className="h-4 w-4 text-stone-500" />
                      <span className="min-w-0 truncate text-sm font-medium text-stone-700">{file.name}</span>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            <aside className="space-y-5">
              {canPay ? (
                <GuestQuoteCheckout
                  finalizeStripeCardPaymentAction={finalizeGuestStripeCardPaymentAction.bind(null, request.id, token)}
                  request={request}
                  stripeElementsSession={stripeElementsSession}
                  token={token}
                  updateStripeElementsSessionAction={updateGuestStripeElementsSessionAction.bind(null, request.id, token)}
                />
              ) : (
                <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
                  This quote has already been paid or is no longer open for card checkout.
                </section>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
