import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripeAccountSetupAvailability() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      available: false,
      message: "Saved cards are not available until Lattice finishes configuring secure card payments.",
    };
  }

  // A production Checkout Session must return to the canonical app domain,
  // never the localhost development fallback.
  if (process.env.NODE_ENV === "production" && !process.env.APP_BASE_URL && !process.env.NEXT_PUBLIC_APP_URL) {
    return {
      available: false,
      message: "Saved cards are temporarily unavailable while Lattice finishes payment setup.",
    };
  }

  return { available: true, message: "" };
}

export function getAppBaseUrl() {
  const configuredUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_BASE_URL must be configured before using Stripe in production.");
  }

  return "http://localhost:3000";
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
