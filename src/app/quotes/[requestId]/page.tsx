import { notFound } from "next/navigation";

import { BuyerQuoteDetail } from "@/components/buyer-quote-detail";
import { getRequestById } from "@/lib/request-repository";

import { purchaseQuoteAction } from "./actions";

export const dynamic = "force-dynamic";

type BuyerQuoteDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerQuoteDetailPage({ params }: BuyerQuoteDetailPageProps) {
  const { requestId } = await params;
  const request = await getRequestById(requestId);

  if (!request || request.status === "DRAFT") {
    notFound();
  }

  return <BuyerQuoteDetail request={request} purchaseAction={purchaseQuoteAction.bind(null, request.id)} />;
}
