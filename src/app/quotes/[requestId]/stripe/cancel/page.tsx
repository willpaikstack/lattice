import { notFound, redirect } from "next/navigation";

import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";

export default async function StripeCheckoutCancelPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const request = await getCustomerRequestByIdForCurrentSession(requestId);

  if (!request || request.status !== "QUOTED") {
    notFound();
  }

  redirect(`/quotes/${encodeURIComponent(requestId)}/checkout?payment=canceled`);
}
