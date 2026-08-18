import "server-only";

import Stripe from "stripe";

import { ensureStripeCustomerForAccount } from "./account-settings";
import type { LatticeRequest } from "./request-model";
import { finalizeStripePaidQuote, markStripeCheckoutSessionFailed, quoteCheckoutAmountCents, recordStripeCheckoutSession } from "./request-repository";
import { getStripeClient, getStripePublishableKey, stripePaymentMethodCardSnapshot } from "./stripe";

function paymentIntentFromSession(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === "string" ? null : session.payment_intent;
}

function paymentMethodFromIntent(paymentIntent: Stripe.PaymentIntent | null) {
  if (!paymentIntent || typeof paymentIntent.payment_method === "string") {
    return null;
  }

  return paymentIntent.payment_method;
}

function quoteNumberForRequest(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

export type StripeElementsCheckoutSession = {
  clientSecret: string;
  publishableKey: string;
  sessionId: string;
};

export async function createStripeElementsCheckoutSessionForRequest(request: LatticeRequest): Promise<StripeElementsCheckoutSession> {
  if (request.status !== "QUOTED") {
    throw new Error("Only priced quotes can be paid by card.");
  }

  const publishableKey = getStripePublishableKey();

  if (!publishableKey) {
    throw new Error("Stripe publishable key is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
  }

  const amountCents = quoteCheckoutAmountCents(request);
  const stripe = getStripeClient();
  const { customerId } = await ensureStripeCustomerForAccount();
  const quoteNumber = quoteNumberForRequest(request);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    description: `${quoteNumber} - ${request.title}`,
    metadata: {
      requestId: request.id,
      quoteNumber,
    },
    payment_method_types: ["card"],
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe did not return a payment intent client secret.");
  }

  await recordStripeCheckoutSession(request.id, {
    amountCents,
    checkoutSessionId: paymentIntent.id,
    currency: "usd",
  });

  return {
    clientSecret: paymentIntent.client_secret,
    publishableKey,
    sessionId: paymentIntent.id,
  };
}

export async function finalizeStripePaymentIntent(paymentIntentId: string) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });

  const requestId = paymentIntent.metadata?.requestId;

  if (!requestId) {
    throw new Error("Stripe payment intent is missing request metadata");
  }

  if (paymentIntent.status !== "succeeded") {
    return null;
  }

  const paymentMethod = paymentMethodFromIntent(paymentIntent);
  const card = stripePaymentMethodCardSnapshot(paymentMethod);

  return finalizeStripePaidQuote({
    amountCents: paymentIntent.amount_received || paymentIntent.amount,
    card,
    checkoutSessionId: paymentIntent.id,
    currency: paymentIntent.currency ?? "usd",
    paidAt: new Date((paymentIntent.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    paymentIntentId: paymentIntent.id,
    requestId,
  });
}

export async function finalizeStripeCheckoutSession(sessionId: string) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.payment_method"],
  });

  if (session.mode !== "payment") {
    throw new Error("Stripe session is not a payment checkout session");
  }

  const requestId = session.metadata?.requestId;

  if (!requestId) {
    throw new Error("Stripe session is missing request metadata");
  }

  if (session.payment_status !== "paid") {
    return null;
  }

  const paymentIntent = paymentIntentFromSession(session);
  const paymentMethod = paymentMethodFromIntent(paymentIntent);
  const card = stripePaymentMethodCardSnapshot(paymentMethod);

  return finalizeStripePaidQuote({
    amountCents: session.amount_total,
    card,
    checkoutSessionId: session.id,
    currency: session.currency ?? "usd",
    paidAt: new Date((session.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    paymentIntentId: paymentIntent?.id ?? "",
    requestId,
  });
}

export async function handleStripeCheckoutFailure(sessionId: string) {
  return markStripeCheckoutSessionFailed(sessionId);
}
