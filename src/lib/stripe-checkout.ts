import "server-only";
import { assertQuoteCanBePurchased } from "./quote-validity";

import Stripe from "stripe";

import { ensureStripeCustomerForAccount } from "./account-settings";
import type { LatticeRequest } from "./request-model";
import { finalizeStripePaidQuote, markStripeCheckoutSessionFailed, quoteCheckoutAmountCents, recordStripeCheckoutSession, recordStripeRefund } from "./request-repository";
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

export function assertCardCheckoutEnabled() {
  if (process.env.STRIPE_CHECKOUT_ENABLED !== "true") throw new Error("Card purchasing is being set up. Contact support@latticeos.co for help with this quote.");
}

export async function createStripeElementsCheckoutSessionForRequest(request: LatticeRequest): Promise<StripeElementsCheckoutSession> {
  if (request.status !== "QUOTED") {
    throw new Error("Only priced quotes can be paid by card.");
  }

  assertQuoteCanBePurchased(request);
  assertCardCheckoutEnabled();
  if (process.env.STRIPE_INLINE_CHECKOUT_ENABLED !== "true") throw new Error("Use the secure Stripe checkout page to review tax and pay.");
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
  }, { idempotencyKey: `quote:${request.id}:${request.customerQuotes.at(-1)?.id ?? request.updatedAt}:${customerId}:${amountCents}` });

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

export async function finalizeStripePaymentIntent(paymentIntentId: string, expectedRequestId?: string) {
  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });

  const requestId = paymentIntent.metadata?.requestId;

  if (!requestId) {
    throw new Error("Stripe payment intent is missing request metadata");
  }

  if (expectedRequestId && requestId !== expectedRequestId) throw new Error("This payment does not belong to your quote.");

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

export async function finalizeStripeCheckoutSession(sessionId: string, expectedRequestId?: string) {
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

  if (expectedRequestId && requestId !== expectedRequestId) throw new Error("This checkout does not belong to your quote.");

  if (session.payment_status !== "paid") {
    return null;
  }

  if (!session.automatic_tax?.enabled || session.automatic_tax.status !== "complete") {
    throw new Error("Stripe tax calculation is incomplete.");
  }
  const taxCents = session.total_details?.amount_tax;
  const shippingCents = session.total_details?.amount_shipping;
  if (!Number.isInteger(taxCents) || taxCents! < 0 || !Number.isInteger(shippingCents) ||
      !Number.isInteger(session.amount_subtotal) ||
      session.amount_total !== session.amount_subtotal! + shippingCents! + taxCents!) {
    throw new Error("Stripe checkout totals cannot be reconciled.");
  }

  const paymentIntent = paymentIntentFromSession(session);
  const paymentMethod = paymentMethodFromIntent(paymentIntent);
  const card = stripePaymentMethodCardSnapshot(paymentMethod);

  return finalizeStripePaidQuote({
    amountCents: session.amount_total,
    taxCents: taxCents!,
    shippingCents: shippingCents!,
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

/** Retrieve current cumulative refunds so duplicate/out-of-order events are harmless. */
export async function reconcileStripeChargeRefund(chargeId: string) {
  const stripe = getStripeClient();
  const charge = await stripe.charges.retrieve(chargeId);
  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return null;
  const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
  const session = sessions.data[0];
  const paymentIntent = session ? null : await stripe.paymentIntents.retrieve(paymentIntentId);
  const requestId = session?.metadata?.requestId || paymentIntent?.metadata?.requestId;
  if (!requestId) return null;
  let refundedAmountCents = 0;
  let pendingRefundAmountCents = 0;
  let failedRefundAmountCents = 0;
  // Fetch all current refunds instead of trusting an old webhook or aggregate charge amount.
  for await (const refund of stripe.refunds.list({ charge: charge.id, limit: 100 })) {
    if (refund.status === "succeeded") refundedAmountCents += refund.amount;
    else if (refund.status === "pending" || refund.status === "requires_action") pendingRefundAmountCents += refund.amount;
    else if (refund.status === "failed") failedRefundAmountCents += refund.amount;
  }
  return recordStripeRefund({ requestId, paymentIntentId,
    checkoutSessionId: session?.id || paymentIntentId, chargeId: charge.id,
    amountCents: charge.amount, refundedAmountCents, pendingRefundAmountCents, failedRefundAmountCents, currency: charge.currency,
  });
}
