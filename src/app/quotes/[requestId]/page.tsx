import { notFound, redirect } from "next/navigation";

import { BuyerQuoteDetail } from "@/components/buyer-quote-detail";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";

type BuyerQuoteDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerQuoteDetailPage({ params }: BuyerQuoteDetailPageProps) {
  const { requestId } = await params;
  const request = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!request || request.status === "DRAFT") {
    notFound();
  }

  if (request.status === "PURCHASED") {
    redirect(`/orders/${request.id}`);
  }

  return <BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} />;
}
