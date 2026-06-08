import { notFound } from "next/navigation";

import { BuyerQuoteCheckout } from "@/components/buyer-quote-checkout";
import { getAccountSettings } from "@/lib/account-settings";
import { getRequestById } from "@/lib/request-repository";

import { purchaseQuoteAction } from "../actions";

export const dynamic = "force-dynamic";

type BuyerQuoteCheckoutPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerQuoteCheckoutPage({ params }: BuyerQuoteCheckoutPageProps) {
  const { requestId } = await params;
  const request = await getRequestById(requestId);

  if (!request || request.status !== "QUOTED") {
    notFound();
  }

  const accountSettings = await getAccountSettings();

  return (
    <BuyerQuoteCheckout
      placeOrderAction={purchaseQuoteAction.bind(null, request.id)}
      receivingPhone={accountSettings.phone}
      request={request}
      shippingAddress={accountSettings.shipping}
    />
  );
}
