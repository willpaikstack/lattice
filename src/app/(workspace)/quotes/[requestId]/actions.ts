"use server";

import { assertQuoteCanBePurchased } from "@/lib/quote-validity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureStripeCustomerForAccount } from "@/lib/account-settings";
import type { AccountAddress } from "@/lib/account-settings-shared";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { quoteCheckoutAmountCents, recordStripeCheckoutSession, updateRequestShippingAddress } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";
import { getAppBaseUrl, getStripeClient } from "@/lib/stripe";
import { assertCardCheckoutEnabled, finalizeStripePaymentIntent } from "@/lib/stripe-checkout";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function purchaseDeliveryInputFromForm(formData: FormData) {
  if (formData.get("termsAccepted") !== "on" || formData.get("complianceCertification") !== "on") throw new Error("Accept the purchasing terms and compliance certification before payment.");
  if (formText(formData, "shippingMethod") !== "lattice-managed") throw new Error("Company shipping accounts are not available yet.");
  if (formText(formData, "taxStatus") !== "taxable") throw new Error("Tax-exempt purchasing is not enabled for this company.");
  for (const key of ["shipToName", "shipToAddress1", "shipToCity", "shipToState", "shipToZipCode"]) if (!formText(formData, key)) throw new Error("Complete the delivery address before payment.");
  return {
    checkoutDetails: {
      shippingMethod: formText(formData, "shippingMethod"), requiredDeliveryDate: formText(formData, "requiredDeliveryDate"), shippingInstructions: formText(formData, "shippingInstructions"), endUse: formText(formData, "endUse"), exportControlStatus: formText(formData, "exportControlStatus"), buyerNotes: formText(formData, "buyerNotes"), termsAcceptedAt: new Date().toISOString(), complianceCertifiedAt: new Date().toISOString(), taxStatus: "taxable",
    },
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

async function requireCheckoutSession(requestId: string) {
  const session = await getCurrentSession();

  if (session?.user.role !== "customer" && session?.user.role !== "admin") {
    throw new Error("Customer or admin access required.");
  }

  const request = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!request || request.status !== "QUOTED") {
    throw new Error("Only priced quotes can be paid by card.");
  }

  assertQuoteCanBePurchased(request);
  return request;
}

export async function updateRequestShippingAddressAction(requestId: string, address: AccountAddress) {
  const session = await getCurrentSession();

  if (session?.user.role !== "customer" && session?.user.role !== "admin") {
    throw new Error("Customer or admin access required.");
  }

  const request = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!request) {
    throw new Error("This RFQ is not available to your account.");
  }

  await updateRequestShippingAddress(requestId, {
    shipToAddress1: address.address1,
    shipToAddress2: address.address2,
    shipToCity: address.city,
    shipToCompany: address.company,
    shipToName: address.name,
    shipToState: address.state,
    shipToZipCode: address.zipCode,
  });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
}

export async function updateStripeElementsCheckoutSessionAction(requestId: string, checkoutSessionId: string, formData: FormData) {
  const request = await requireCheckoutSession(requestId);

  if (request.purchasePayment.stripe.checkoutSessionId !== checkoutSessionId) throw new Error("Checkout session does not belong to this quote.");

  await recordStripeCheckoutSession(requestId, {
    ...purchaseDeliveryInputFromForm(formData),
    amountCents: quoteCheckoutAmountCents(request),
    checkoutSessionId,
    currency: "usd",
  });
}

export async function finalizeStripeCardPaymentAction(requestId: string, paymentIntentId: string, formData: FormData) {
  const request = await requireCheckoutSession(requestId);

  if (request.purchasePayment.stripe.checkoutSessionId !== paymentIntentId) throw new Error("Payment does not belong to this quote.");

  await recordStripeCheckoutSession(requestId, {
    ...purchaseDeliveryInputFromForm(formData),
    amountCents: quoteCheckoutAmountCents(request),
    checkoutSessionId: paymentIntentId,
    currency: "usd",
  });

  const finalized = await finalizeStripePaymentIntent(paymentIntentId, requestId);

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);

  return {
    redirectTo: finalized ? `/orders/${encodeURIComponent(requestId)}` : `/quotes/${encodeURIComponent(requestId)}/checkout?payment=pending`,
  };
}

export async function purchaseQuoteAction(requestId: string, formData: FormData) {
  const session = await getCurrentSession();

  if (session?.user.role !== "customer" && session?.user.role !== "admin") {
    throw new Error("Customer or admin access required.");
  }

  const paymentMethod = formText(formData, "paymentMethod");
  const request = await requireCheckoutSession(requestId);
  if (paymentMethod !== "card") throw new Error("Purchase-order payment is not available. Purchase your quote by credit card.");

  assertCardCheckoutEnabled();
  const delivery = purchaseDeliveryInputFromForm(formData);
  if (paymentMethod === "card") {
    const amountCents = quoteCheckoutAmountCents(request);
    const stripe = getStripeClient();
    const { customerId } = await ensureStripeCustomerForAccount();
    const baseUrl = getAppBaseUrl();
    const quoteNumber = request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `${quoteNumber} - ${request.title}`,
              description: "Lattice accepted quote payment",
            },
          },
        },
      ],
      metadata: {
        requestId,
        quoteNumber,
      },
      success_url: `${baseUrl}/quotes/${encodeURIComponent(requestId)}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/quotes/${encodeURIComponent(requestId)}/stripe/cancel`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    await recordStripeCheckoutSession(requestId, {
      ...delivery,
      amountCents,
      checkoutSessionId: session.id,
      currency: "usd",
    });

    redirect(session.url);
  }

}
