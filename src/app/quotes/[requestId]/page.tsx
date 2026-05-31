import { notFound } from "next/navigation";

import { BuyerQuoteDetail } from "@/components/buyer-quote-detail";
import { getRequestById } from "@/lib/request-repository";

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

  return <BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} />;
}
