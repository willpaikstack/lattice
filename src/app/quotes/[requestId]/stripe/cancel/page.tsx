import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StripeCheckoutCancelPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;

  redirect(`/quotes/${encodeURIComponent(requestId)}/checkout?payment=canceled`);
}
