"use client";

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard } from "lucide-react";
import { useEffect, useMemo } from "react";

type StripeElementsSession = {
  clientSecret: string;
  publishableKey: string;
  sessionId: string;
};

export type ConfirmStripeElementsPayment = (form: HTMLFormElement) => Promise<void>;

function StripeElementsInner({
  clientSecret,
  finalizeStripeCardPaymentAction,
  onError,
  onReadyChange,
  onSubmittingChange,
  requestId,
  sessionId,
  updateStripeElementsSessionAction,
}: {
  clientSecret: string;
  finalizeStripeCardPaymentAction: (paymentIntentId: string, formData: FormData) => Promise<{ redirectTo: string }>;
  onError: (message: string) => void;
  onReadyChange: (ready: boolean) => void;
  onSubmittingChange: (submitting: boolean) => void;
  requestId: string;
  sessionId: string;
  updateStripeElementsSessionAction: (checkoutSessionId: string, formData: FormData) => Promise<void>;
}) {
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    onReadyChange(Boolean(stripe && elements));
  }, [elements, onReadyChange, stripe]);

  useEffect(() => {
    if (!stripe || !elements) {
      window.latticeConfirmStripeElementsPayment = undefined;
      return;
    }

    window.latticeConfirmStripeElementsPayment = async (form) => {
      onError("");
      onSubmittingChange(true);

      try {
        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
          throw new Error("Stripe card fields are still loading. Try again in a moment.");
        }

        await updateStripeElementsSessionAction(sessionId, new FormData(form));
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
          },
        });

        if (result.error) {
          throw new Error(result.error.message || "Stripe could not confirm this card payment.");
        }

        const paymentIntentId = result.paymentIntent?.id ?? sessionId;
        const finalized = await finalizeStripeCardPaymentAction(paymentIntentId, new FormData(form));
        window.location.assign(finalized.redirectTo || `/orders/${encodeURIComponent(requestId)}`);
      } catch (error) {
        onError(error instanceof Error ? error.message : "Stripe could not confirm this payment.");
        onSubmittingChange(false);
      }
    };

    return () => {
      window.latticeConfirmStripeElementsPayment = undefined;
    };
  }, [clientSecret, elements, finalizeStripeCardPaymentAction, onError, onSubmittingChange, requestId, sessionId, stripe, updateStripeElementsSessionAction]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-[#d6dce4] bg-white p-4">
        <CardElement
          options={{
            hidePostalCode: false,
            style: {
              base: {
                "::placeholder": {
                  color: "#8b929c",
                },
                color: "#202020",
                fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: "15px",
                lineHeight: "24px",
              },
              invalid: {
                color: "#a04400",
              },
            },
          }}
        />
      </div>
      <p className="text-[12px] leading-5 text-[#6f737a]">Card details are encrypted by Stripe. Lattice never sees or stores the full card number.</p>
    </div>
  );
}

export function StripeElementsPayment({
  enabled,
  finalizeStripeCardPaymentAction,
  onError,
  onReadyChange,
  onSubmittingChange,
  requestId,
  session,
  updateStripeElementsSessionAction,
}: {
  enabled: boolean;
  finalizeStripeCardPaymentAction?: (paymentIntentId: string, formData: FormData) => Promise<{ redirectTo: string }>;
  onError: (message: string) => void;
  onReadyChange: (ready: boolean) => void;
  onSubmittingChange: (submitting: boolean) => void;
  requestId: string;
  session: StripeElementsSession | null;
  updateStripeElementsSessionAction?: (checkoutSessionId: string, formData: FormData) => Promise<void>;
}) {
  const publishableKey = session?.publishableKey ?? "";
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey]);

  useEffect(() => {
    if (!enabled) {
      onReadyChange(false);
      onSubmittingChange(false);
    }
  }, [enabled, onReadyChange, onSubmittingChange]);

  if (!session || !updateStripeElementsSessionAction || !finalizeStripeCardPaymentAction) {
    return (
      <div className="rounded-md border border-[#f1d8a5] bg-[#fff7e8] p-4 text-[13px] leading-5 text-[#8a5b08]">
        Stripe inline payment is not configured for this checkout surface.
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-[#e7e7e7] bg-[#fafafa] p-4 text-[13px] font-medium text-[#5f6670]">
        <CreditCard aria-hidden="true" className="h-4 w-4" />
        Loading secure card fields...
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: session.clientSecret,
        appearance: {
          variables: {
            borderRadius: "6px",
            colorDanger: "#a04400",
            colorPrimary: "#171717",
            colorText: "#202020",
            fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            spacingUnit: "3px",
          },
        },
      }}
    >
      <StripeElementsInner
        clientSecret={session.clientSecret}
        finalizeStripeCardPaymentAction={finalizeStripeCardPaymentAction}
        onError={onError}
        onReadyChange={onReadyChange}
        onSubmittingChange={onSubmittingChange}
        requestId={requestId}
        sessionId={session.sessionId}
        updateStripeElementsSessionAction={updateStripeElementsSessionAction}
      />
    </Elements>
  );
}

declare global {
  interface Window {
    latticeConfirmStripeElementsPayment?: ConfirmStripeElementsPayment;
  }
}
