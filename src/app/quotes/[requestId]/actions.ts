"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureStripeCustomerForAccount } from "@/lib/account-settings";
import { saveLocalUpload } from "@/lib/local-file-storage";
import { getRequestById, purchaseQuote, quoteCheckoutAmountCents, recordStripeCheckoutSession } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";
import { getAppBaseUrl, getStripeClient, getStripePublishableKey } from "@/lib/stripe";
import { finalizeStripePaymentIntent } from "@/lib/stripe-checkout";

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).name === "string" &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}

function quoteNumberForStripe(request: Awaited<ReturnType<typeof getRequestById>>) {
  if (!request) {
    return "";
  }

  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
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

async function requireCheckoutSession(requestId: string) {
  const session = await getCurrentSession();

  if (session?.user.role !== "customer" && session?.user.role !== "admin") {
    throw new Error("Customer or admin access required.");
  }

  const request = await getRequestById(requestId);

  if (!request || request.status !== "QUOTED") {
    throw new Error("Only priced quotes can be paid by card.");
  }

  return request;
}

export async function createStripeElementsCheckoutSessionAction(requestId: string) {
  const request = await requireCheckoutSession(requestId);
  const publishableKey = getStripePublishableKey();

  if (!publishableKey) {
    throw new Error("Stripe publishable key is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
  }

  const amountCents = quoteCheckoutAmountCents(request);
  const stripe = getStripeClient();
  const { customerId } = await ensureStripeCustomerForAccount();
  const baseUrl = getAppBaseUrl();
  const quoteNumber = quoteNumberForStripe(request);
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "elements",
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
    return_url: `${baseUrl}/quotes/${encodeURIComponent(requestId)}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
  });

  if (!checkoutSession.client_secret) {
    throw new Error("Stripe did not return a checkout client secret.");
  }

  await recordStripeCheckoutSession(requestId, {
    amountCents,
    checkoutSessionId: checkoutSession.id,
    currency: "usd",
  });

  return {
    clientSecret: checkoutSession.client_secret,
    publishableKey,
    sessionId: checkoutSession.id,
  };
}

export async function updateStripeElementsCheckoutSessionAction(requestId: string, checkoutSessionId: string, formData: FormData) {
  const request = await requireCheckoutSession(requestId);

  await recordStripeCheckoutSession(requestId, {
    ...purchaseDeliveryInputFromForm(formData),
    amountCents: quoteCheckoutAmountCents(request),
    checkoutSessionId,
    currency: "usd",
  });
}

export async function finalizeStripeCardPaymentAction(requestId: string, paymentIntentId: string, formData: FormData) {
  const request = await requireCheckoutSession(requestId);

  await recordStripeCheckoutSession(requestId, {
    ...purchaseDeliveryInputFromForm(formData),
    amountCents: quoteCheckoutAmountCents(request),
    checkoutSessionId: paymentIntentId,
    currency: "usd",
  });

  const finalized = await finalizeStripePaymentIntent(paymentIntentId);

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

  if (paymentMethod === "card") {
    const request = await getRequestById(requestId);

    if (!request || request.status !== "QUOTED") {
      throw new Error("Only priced quotes can be paid by card.");
    }

    const amountCents = quoteCheckoutAmountCents(request);
    const stripe = getStripeClient();
    const { customerId } = await ensureStripeCustomerForAccount();
    const baseUrl = getAppBaseUrl();
    const quoteNumber = quoteNumberForStripe(request);
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
      ...purchaseDeliveryInputFromForm(formData),
      amountCents,
      checkoutSessionId: session.id,
      currency: "usd",
    });

    redirect(session.url);
  }

  const poFile = formData.get("poFile");
  const storedPoFile = paymentMethod === "purchase-order" && isUploadFile(poFile) ? await saveLocalUpload(poFile, "customer-purchase-orders") : null;

  await purchaseQuote(requestId, {
    shipToAddress1: formText(formData, "shipToAddress1"),
    shipToAddress2: formText(formData, "shipToAddress2"),
    shipToCity: formText(formData, "shipToCity"),
    shipToCompany: formText(formData, "shipToCompany"),
    shipToName: formText(formData, "shipToName"),
    shipToPhone: formText(formData, "shipToPhone"),
    shipToState: formText(formData, "shipToState"),
    shipToZipCode: formText(formData, "shipToZipCode"),
    accountsPayableEmail: formText(formData, "apEmail"),
    buyerCheckoutNotes: formText(formData, "buyerNotes"),
    customerPoNumber: formText(formData, "poNumber"),
    paymentMethod: paymentMethod === "card" ? "card" : paymentMethod === "purchase-order" ? "purchase-order" : undefined,
    poAttachment: storedPoFile,
    selectedCard: {
      id: formText(formData, "selectedCardId"),
      brand: formText(formData, "selectedCardBrand"),
      last4: formText(formData, "selectedCardLast4"),
      holder: formText(formData, "selectedCardHolder"),
      expires: formText(formData, "selectedCardExpires"),
    },
  });

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);
  redirect("/orders");
}
