"use client";

import { useState, useTransition } from "react";
import { requestQuoteRenewal } from "@/app/(workspace)/quotes/[requestId]/renewal/actions";

export function CustomerQuoteRenewal({ requestId, quoteVersionId, quoteNumber, canSubmit, requestedAt, demo = false }: {
  requestId: string;
  quoteVersionId: string;
  quoteNumber: string;
  canSubmit: boolean;
  requestedAt?: string;
  demo?: boolean;
}) {
  const [submitted, setSubmitted] = useState(Boolean(requestedAt));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const emailHref = `mailto:support@latticeos.co?subject=${encodeURIComponent(`Renew quote ${quoteNumber}`)}&body=${encodeURIComponent(`Please renew quote ${quoteNumber} (RFQ ${requestId}) and confirm updated pricing and lead time.`)}`;
  return (
    <section className="scroll-mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5 sm:p-6" id="quote-renewal">
      <h2 className="text-lg font-semibold text-stone-950">{submitted ? "Renewal requested — waiting for Lattice" : "This quote needs renewal"}</h2>
      {demo ? <p className="mt-2 text-xs font-semibold text-amber-900">Local demo: this request stays on this computer and sends no email.</p> : null}
      {submitted ? (
        <p role="status" className="mt-2 text-sm leading-6 text-stone-700">Your request is saved in Lattice’s support queue. Lattice will review pricing and lead time and issue an updated quote. The renewal item clears when a valid quote is issued; you can then review and accept it.</p>
      ) : (
        <>
          <p className="mt-2 text-sm leading-6 text-stone-700">The validity period has ended. Request a renewed quote below. Lattice must confirm pricing and lead time and issue a new quote before you can purchase.</p>
          {canSubmit ? (
            <form className="mt-4 space-y-3" onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              startTransition(async () => {
                setError("");
                try { await requestQuoteRenewal(requestId, quoteVersionId, data); setSubmitted(true); }
                catch (caught) { setError(caught instanceof Error ? caught.message : "Your request could not be saved. Please try again."); }
              });
            }}>
              <label className="grid gap-2 text-sm font-medium">Anything that changed? (optional)
                <textarea className="min-h-20 rounded-md border border-stone-300 bg-white p-3 font-normal" disabled={pending} maxLength={2000} name="notes" placeholder="For example, a new quantity or required delivery date." />
              </label>
              {error ? <p role="alert" className="text-sm text-red-800">{error}</p> : null}
              <button className="min-h-11 rounded-md bg-stone-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? "Sending request…" : "Request renewed quote"}</button>
            </form>
          ) : <p className="mt-3 text-sm text-stone-700">This preview quote cannot submit a renewal. Use a real test RFQ to check the saved request flow.</p>}
        </>
      )}
      <a className="mt-3 inline-block text-sm font-semibold text-blue-700 underline" href={emailHref}>Contact Lattice about this quote</a>
    </section>
  );
}
