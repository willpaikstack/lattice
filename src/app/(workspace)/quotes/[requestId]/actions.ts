"use server";

import { hasFinalLandedDeliveryTerms } from "@/lib/checkout-delivery";
import { assertQuoteCanBePurchased } from "@/lib/quote-validity";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createHash } from "node:crypto";
import type { AccountAddress } from "@/lib/account-settings-shared";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { quoteCheckoutAmountCents, recordStripeCheckoutSession, updateRequestShippingAddress } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";
import { assertStripeMerchantReady, getAppBaseUrl, getStripeClient } from "@/lib/stripe";
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
  if (!hasFinalLandedDeliveryTerms(request.quote.shippingTerms)) throw new Error("This quote needs final DDP delivery terms before card purchasing. Contact Lattice for an updated quote.");
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
  await assertStripeMerchantReady();
  if (paymentMethod === "card") {
    const amountCents = quoteCheckoutAmountCents(request);
    const stripe = getStripeClient();
    // Order-specific customer: use the reviewed shipping snapshot for tax,
    // without changing a shared customer address during another checkout.
    const previousSessionId = request.purchasePayment.stripe.checkoutSessionId;
    if (previousSessionId.startsWith("cs_")) {
      const previous = await stripe.checkout.sessions.retrieve(previousSessionId);
      if (previous.status === "complete") throw new Error("A payment is already completing for this quote. Check your orders before trying again.");
      if (previous.status === "open") await stripe.checkout.sessions.expire(previousSessionId);
    }
    const checkoutKey = createHash("sha256").update(JSON.stringify({
      requestId, previousSessionId, quoteVersion: request.customerQuotes.at(-1)?.id ?? request.updatedAt,
      amountCents, delivery: { ...delivery, checkoutDetails: { ...delivery.checkoutDetails, termsAcceptedAt: undefined, complianceCertifiedAt: undefined } },
    })).digest("hex");
    const customer = await stripe.customers.create({
      email: request.requesterEmail || undefined,
      name: delivery.shipToCompany || delivery.shipToName,
      shipping: {
        name: delivery.shipToName,
        phone: delivery.shipToPhone || undefined,
        address: { line1: delivery.shipToAddress1, line2: delivery.shipToAddress2,
          city: delivery.shipToCity, state: delivery.shipToState,
          postal_code: delivery.shipToZipCode, country: "US" },
      },
      metadata: { requestId },
    }, { idempotencyKey: `checkout-customer:${checkoutKey}` });
    const baseUrl = getAppBaseUrl();
    const quoteNumber = request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
    const createSession = (idempotencyKey: string) => stripe.checkout.sessions.create({
      mode: "payment",
      integration_identifier: `lattice_hosted_tax_checkout_${checkoutKey.slice(0, 8).split("").map((digit) => String.fromCharCode(97 + parseInt(digit, 16))).join("")}`,
      customer: customer.id,
      automatic_tax: { enabled: true },
      customer_update: { address: "auto" },
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents - (request.quote.shippingCostCents ?? 0),
            tax_behavior: "exclusive",
            product_data: {
              name: `${quoteNumber} - ${request.title}`,
              tax_code: "txcd_99999999",
              description: "Lattice accepted quote payment",
            },
          },
        },
      ],
      shipping_options: [{ shipping_rate_data: {
        display_name: request.quote.shippingMethod || "Lattice-managed delivery",
        type: "fixed_amount",
        fixed_amount: { amount: request.quote.shippingCostCents ?? 0, currency: "usd" },
        tax_behavior: "exclusive",
        tax_code: "txcd_92010001",
      } }],
      metadata: {
        requestId,
        quoteNumber,
      },
      success_url: `${baseUrl}/quotes/${encodeURIComponent(requestId)}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/quotes/${encodeURIComponent(requestId)}/stripe/cancel`,
    }, { idempotencyKey });
    let session = await createSession(`checkout-session:${checkoutKey}`);
    // A failed database write expires the session. Stripe may replay that
    // expired session on retry, so replace it under a new deterministic key.
    for (let attempt = 0; session.status === "expired" && attempt < 3; attempt++) {
      session = await createSession(`checkout-session:${checkoutKey}:${session.id}`);
    }
    if (session.status === "expired") throw new Error("Checkout could not restart. Refresh and try again.");

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    try {
      await recordStripeCheckoutSession(requestId, {
      ...delivery,
      checkoutDetails: { ...delivery.checkoutDetails, checkoutQuoteVersion: request.customerQuotes.at(-1)?.id ?? "" },
      amountCents,
      checkoutSessionId: session.id,
      currency: "usd",
      expectedUpdatedAt: request.updatedAt,
      });
    } catch (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      throw error;
    }

    redirect(session.url);
  }

}
