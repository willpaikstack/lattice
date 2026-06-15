import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { finalizeStripeCheckoutSession } from "@/lib/stripe-checkout";

export const dynamic = "force-dynamic";

export default async function StripeCheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { requestId } = await params;
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect(`/quotes/${encodeURIComponent(requestId)}/checkout?payment=missing-session`);
  }

  const finalized = await finalizeStripeCheckoutSession(sessionId);

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/orders");
  revalidatePath(`/orders/${requestId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${requestId}`);

  if (!finalized) {
    redirect(`/quotes/${encodeURIComponent(requestId)}/checkout?payment=pending`);
  }

  redirect(`/orders/${encodeURIComponent(requestId)}`);
}
