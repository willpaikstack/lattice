import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getAppBaseUrl() {
  return (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function getStripePublishableKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY before using card checkout.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function stripePaymentMethodCardSnapshot(paymentMethod: Stripe.PaymentMethod | null | undefined) {
  const card = paymentMethod?.card;

  if (!paymentMethod?.id || !card) {
    return null;
  }

  return {
    id: paymentMethod.id,
    brand: card.brand,
    last4: card.last4,
    holder: typeof paymentMethod.billing_details?.name === "string" ? paymentMethod.billing_details.name : "",
    expires: `${String(card.exp_month).padStart(2, "0")}/${card.exp_year}`,
  };
}
