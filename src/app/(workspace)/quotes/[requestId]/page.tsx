import { getAccountSettings } from "@/lib/account-settings";
import { billingSnapshotFromAccountSettings } from "@/lib/request-billing";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { CustomerClarification } from "@/components/customer-clarification";
import { CustomerQuoteRenewal } from "@/components/customer-quote-renewal";
import { quoteHasExpired } from "@/lib/quote-validity";
import { isMockQuoteRenewal, listMockQuoteRenewals } from "@/lib/mock-quote-renewals";
import { getCurrentSession } from "@/lib/session";
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

  const client = await getPrismaClient() as PrismaClient;
  const latestQuote = request.customerQuotes.at(-1);
  const expired = request.status === "QUOTED" && quoteHasExpired(request);
  const session = await getCurrentSession();
  const demo = isMockQuoteRenewal(request) && session?.user.role === "admin";
  const [replies, renewal, settings] = await Promise.all([
    request.buyerCompanyId ? client.customerSupportRequest.findMany({ where: { requestId, companyId: request.buyerCompanyId, issueType: "RFQ_CLARIFICATION" }, orderBy: { createdAt: "asc" } }) : [],
    expired && latestQuote ? demo
      ? listMockQuoteRenewals().then((rows) => rows.find((row) => row.requestId === requestId && row.quoteVersionId === latestQuote.id && row.status === "OPEN") ?? null)
      : request.buyerCompanyId ? client.customerSupportRequest.findFirst({ where: { requestId, companyId: request.buyerCompanyId, issueType: "QUOTE_RENEWAL", status: "OPEN", createdAt: { gte: new Date(latestQuote.issuedAt) } } }) : null
      : null,
    session?.user.companyId && session.user.companyId === request.buyerCompanyId ? getAccountSettings() : null,
  ]);
  return (
    <div className="space-y-5">
      <BuyerQuoteDetail checkoutHref={`/quotes/${request.id}/checkout`} request={request} savedShippingAddress={settings?.shipping} savedBillingSnapshot={settings ? billingSnapshotFromAccountSettings(settings) : undefined} />
      {expired ? <CustomerQuoteRenewal key={latestQuote?.id ?? request.id} requestId={requestId} quoteVersionId={latestQuote?.id ?? ""} quoteNumber={latestQuote?.quoteNumber ?? requestId} demo={demo} canSubmit={Boolean(latestQuote && (demo || (request.buyerCompanyId && !request.id.startsWith("demo_") && !request.id.startsWith("fixture_"))))} requestedAt={renewal?.createdAt.toISOString()} /> : null}
      {request.status === "NEEDS_INFO" ? <CustomerClarification requestId={requestId} parts={request.lineItems.map((item) => item.partName)} /> : null}
      {replies.length > 0 ? <section className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Clarification history</h2>{replies.map((reply) => <article className="mt-3 border-t pt-3" key={reply.id}><p className="text-xs text-stone-500">{reply.email} · {reply.createdAt.toISOString()}</p><p className="whitespace-pre-wrap">{reply.message}</p></article>)}</section> : null}
    </div>
  );
}
