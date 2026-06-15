"use server";

import { revalidatePath } from "next/cache";

import { validateGuestQuoteAccess } from "@/lib/guest-quote-access";
import { getRequestById, quoteCheckoutAmountCents, recordStripeCheckoutSession } from "@/lib/request-repository";
import { finalizeStripePaymentIntent } from "@/lib/stripe-checkout";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function purchaseDeliveryInputFromForm(formData: FormData) {
  return {
    shipToAddress1: formText(formData, "shipToAddress1"),
    shipToAddress2: formText(formData, "shipToAddress2"),
    shipToCity: formText(formData, "shipToCity"),
    shipToCompany: formText(formData, "shipToCompany"),
    shipToName: formText(formData, "shipToName"),
    shipToPhone: formText(formData, "shipToPhone"),
    shipToState: formText(formData, "shipToState"),
    shipToZipCode: formText(formData, "shipToZipCode"),
  };
}

async function requireGuestQuote(requestId: string, token: string) {
  const request = await getRequestById(requestId);

  if (!request || !validateGuestQuoteAccess(request, token)) {
    throw new Error("This quote link is invalid or expired.");
  }

  if (request.status !== "QUOTED") {
    throw new Error("Only priced quotes can be paid by card.");
  }

  return request;
}

export async function updateGuestStripeElementsSessionAction(requestId: string, token: string, checkoutSessionId: string, formData: FormData) {
  const request = await requireGuestQuote(requestId, token);

  await recordStripeCheckoutSession(requestId, {
    ...purchaseDeliveryInputFromForm(formData),
    amountCents: quoteCheckoutAmountCents(request),
    checkoutSessionId,
    currency: "usd",
  });
}

export async function finalizeGuestStripeCardPaymentAction(requestId: string, token: string, paymentIntentId: string, formData: FormData) {
  const request = await requireGuestQuote(requestId, token);

  await recordStripeCheckoutSession(requestId, {
    ...purchaseDeliveryInputFromForm(formData),
    amountCents: quoteCheckoutAmountCents(request),
    checkoutSessionId: paymentIntentId,
    currency: "usd",
  });

  const finalized = await finalizeStripePaymentIntent(paymentIntentId);

  revalidatePath(`/simple-quote/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);

  return {
    redirectTo: finalized
      ? `/simple-quote/${encodeURIComponent(requestId)}/success?token=${encodeURIComponent(token)}`
      : `/simple-quote/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}&payment=pending`,
  };
}
