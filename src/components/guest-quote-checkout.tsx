"use client";

import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";

import type { LatticeRequest } from "@/lib/request-model";
import { StripeElementsPayment } from "./stripe-elements-payment";

type StripeElementsCheckoutSession = {
  clientSecret: string;
  publishableKey: string;
  sessionId: string;
};

function fieldClass() {
  return "mt-2 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm text-stone-950 outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-200";
}

function Field({ defaultValue, label, name, type = "text" }: { defaultValue?: string; label: string; name: string; type?: string }) {
  return (
    <label className="text-sm font-semibold text-stone-700">
      {label}
      <input className={fieldClass()} defaultValue={defaultValue} name={name} type={type} />
    </label>
  );
}

export function GuestQuoteCheckout({
  finalizeStripeCardPaymentAction,
  request,
  stripeElementsSession,
  token,
  updateStripeElementsSessionAction,
}: {
  finalizeStripeCardPaymentAction: (paymentIntentId: string, formData: FormData) => Promise<{ redirectTo: string }>;
  request: LatticeRequest;
  stripeElementsSession: StripeElementsCheckoutSession | null;
  token: string;
  updateStripeElementsSessionAction: (checkoutSessionId: string, formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!termsAccepted) {
      setError("Accept the quote terms before paying.");
      return;
    }

    if (!formRef.current || !window.latticeConfirmStripeElementsPayment) {
      setError("Secure card fields are still loading. Try again in a moment.");
      return;
    }

    await window.latticeConfirmStripeElementsPayment(formRef.current);
  }

  return (
    <form className="space-y-5 rounded-md border border-stone-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit} ref={formRef}>
      <input name="guestToken" type="hidden" value={token} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Credit card checkout</p>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-normal text-stone-950">
          <CreditCard aria-hidden="true" className="h-5 w-5" />
          Pay securely with Stripe
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">This account-free quote can only be paid by credit card. Lattice never stores the full card number.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field defaultValue={request.shipToName || request.requesterName} label="Receiving contact" name="shipToName" />
        <Field defaultValue={request.shipToPhone || request.requesterPhone} label="Receiving phone" name="shipToPhone" type="tel" />
        <Field defaultValue={request.shipToCompany || request.buyerCompany} label="Company" name="shipToCompany" />
        <Field defaultValue={request.shipToAddress1} label="Address line 1" name="shipToAddress1" />
        <Field defaultValue={request.shipToAddress2} label="Address line 2" name="shipToAddress2" />
        <Field defaultValue={request.shipToCity} label="City" name="shipToCity" />
        <Field defaultValue={request.shipToState} label="State" name="shipToState" />
        <Field defaultValue={request.shipToZipCode} label="ZIP code" name="shipToZipCode" />
      </div>

      <StripeElementsPayment
        enabled
        finalizeStripeCardPaymentAction={finalizeStripeCardPaymentAction}
        onError={setError}
        onReadyChange={setReady}
        onSubmittingChange={setSubmitting}
        requestId={request.id}
        session={stripeElementsSession}
        updateStripeElementsSessionAction={updateStripeElementsSessionAction}
      />

      {error ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-900">{error}</p> : null}

      <label className="flex items-start gap-3 text-sm leading-6 text-stone-600">
        <input checked={termsAccepted} className="mt-1 accent-stone-950" onChange={(event) => setTermsAccepted(event.currentTarget.checked)} required type="checkbox" />
        <span>I accept the quote basis, pricing, lead time, and card payment terms for this order.</span>
      </label>

      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={!termsAccepted || !ready || submitting}
        type="submit"
      >
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        {submitting ? "Processing payment..." : "Pay by credit card"}
      </button>
    </form>
  );
}
