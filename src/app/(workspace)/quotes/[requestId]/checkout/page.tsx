import { notFound } from "next/navigation";

import { BuyerQuoteCheckout } from "@/components/buyer-quote-checkout";
import { getAccountSettings, listStripePaymentCards } from "@/lib/account-settings";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { createStripeElementsCheckoutSessionForRequest } from "@/lib/stripe-checkout";

import { finalizeStripeCardPaymentAction, purchaseQuoteAction, updateStripeElementsCheckoutSessionAction } from "../actions";

export const dynamic = "force-dynamic";

type BuyerQuoteCheckoutPageProps = {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ payment?: string }>;
};

export default async function BuyerQuoteCheckoutPage({ params, searchParams }: BuyerQuoteCheckoutPageProps) {
  const { requestId } = await params;
  const { payment } = await searchParams;
  const request = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!request || request.status !== "QUOTED") {
    notFound();
  }

  const accountSettings = await getAccountSettings();
  const stripeCards = await listStripePaymentCards();
  let stripeElementsSession = null;

  try {
    stripeElementsSession = await createStripeElementsCheckoutSessionForRequest(request);
  } catch (error) {
    console.warn("Stripe inline checkout is unavailable for this quote.", error);
  }

  return (
    <BuyerQuoteCheckout
      placeOrderAction={purchaseQuoteAction.bind(null, request.id)}
      accountsPayableEmail={accountSettings.billing.email}
      cards={stripeCards}
      paymentNotice={payment}
      receivingPhone={accountSettings.phone}
      request={request}
      shippingAddress={accountSettings.shipping}
      stripeElementsSession={stripeElementsSession}
      finalizeStripeCardPaymentAction={finalizeStripeCardPaymentAction.bind(null, request.id)}
      updateStripeElementsSessionAction={updateStripeElementsCheckoutSessionAction.bind(null, request.id)}
    />
  );
}
