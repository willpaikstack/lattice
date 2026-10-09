import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { CustomerClarification } from "@/components/customer-clarification";
import { notFound, redirect } from "next/navigation";

import { BuyerQuoteDetail } from "@/components/buyer-quote-detail";
import { getAccountSettings } from "@/lib/account-settings";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";

type BuyerQuoteDetailPageProps = {
  params: Promise<{ requestId: string }>;
};

export default async function BuyerQuoteDetailPage({ params }: BuyerQuoteDetailPageProps) {
  const { requestId } = await params;
  const [request, accountSettings] = await Promise.all([
    getCustomerRequestByIdForCurrentSession(requestId),
    getAccountSettings(),
  ]);

  if (!request || request.status === "DRAFT") {
    notFound();
  }

  if (request.status === "PURCHASED") {
    redirect(`/orders/${request.id}`);
  }

  const client = await getPrismaClient() as PrismaClient;
  const replies = request.buyerCompanyId ? await client.customerSupportRequest.findMany({ where: { requestId, companyId: request.buyerCompanyId, issueType: "RFQ_CLARIFICATION" }, orderBy: { createdAt: "asc" } }) : [];
  return <div className="space-y-5"><BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} savedShippingAddress={accountSettings.shipping} />{request.status === "NEEDS_INFO" && <CustomerClarification requestId={requestId} parts={request.lineItems.map((item) => item.partName)} />}{replies.length > 0 && <section className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Clarification history</h2>{replies.map((reply) => <article className="mt-3 border-t pt-3" key={reply.id}><p className="text-xs text-stone-500">{reply.email} · {reply.createdAt.toISOString()}</p><p className="whitespace-pre-wrap">{reply.message}</p></article>)}</section>}</div>;
}
