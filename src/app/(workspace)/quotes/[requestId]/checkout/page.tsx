import { customerSafeRequest } from "@/lib/customer-request";
import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { getAccountSettings } from "@/lib/account-settings";
import { quoteHasExpired } from "@/lib/quote-validity";
import { notFound } from "next/navigation";

import { BuyerQuoteCheckout } from "@/components/buyer-quote-checkout";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";


import { purchaseQuoteAction } from "../actions";

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

  if (quoteHasExpired(request)) return <section className="rounded-xl bg-white p-8"><h1 className="text-xl font-semibold">This quote has expired</h1><p className="my-4">Lattice needs to confirm current pricing and lead time before you can purchase.</p><Link className="inline-flex min-h-11 items-center rounded-md bg-stone-950 px-4 font-semibold text-white" href={`/quotes/${request.id}#quote-renewal`}>Request renewed quote</Link></section>;

  const [settings, session] = await Promise.all([getAccountSettings(), getCurrentSession()]);

  return (
    <BuyerQuoteCheckout
      addressDefaults={{ shipping: settings.shipping, billing: settings.billingAddress, billingSameAsShipping: Boolean(settings.billingSameAsShipping), canSave: Boolean(settings.canManageCompanyDefaults && session?.user.companyId && session.user.companyId === request.buyerCompanyId) }}
      placeOrderAction={purchaseQuoteAction.bind(null, request.id)}
      accountsPayableEmail={request.billingSnapshot?.contact.email ?? request.purchasePayment.accountsPayableEmail}
      paymentNotice={payment}
      receivingPhone={request.shipToPhone || request.requesterPhone}
      request={customerSafeRequest(request)}
      hostedCheckout
      checkoutAvailable={process.env.STRIPE_CHECKOUT_ENABLED === "true" && Boolean(process.env.STRIPE_SECRET_KEY)}
    />
  );
}
