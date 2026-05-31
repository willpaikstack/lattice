import { notFound } from "next/navigation";

import { BuyerQuoteCheckout } from "@/components/buyer-quote-checkout";
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

  return <BuyerQuoteCheckout placeOrderAction={purchaseQuoteAction.bind(null, request.id)} request={request} />;
}
