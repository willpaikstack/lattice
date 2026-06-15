import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { PublicHeader, TechnicalBackground } from "@/components/public-entry";
import { validateGuestQuoteAccess } from "@/lib/guest-quote-access";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function GuestQuoteSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { requestId } = await params;
  const { token = "" } = await searchParams;
  const request = await getRequestById(requestId);

  if (!request || !validateGuestQuoteAccess(request, token)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-stone-950 font-sans text-white">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-28 lg:px-8">
        <TechnicalBackground />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-stone-950">
            <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Payment received</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal">Your order is placed</h1>
          <p className="mt-5 text-lg leading-8 text-stone-300">
            Stripe confirmed your card payment for {request.title}. Lattice will review the order package and follow up by email with production next steps.
          </p>
          <Link className="mt-10 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-stone-950 transition hover:bg-stone-200" href={`/simple-quote/${encodeURIComponent(request.id)}?token=${encodeURIComponent(token)}`}>
            View quote
          </Link>
        </div>
      </section>
    </main>
  );
}
