import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { PublicHeader, TechnicalBackground } from "@/components/public-entry";

export default async function SimpleQuoteThanksPage({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  const { request } = await searchParams;

  return (
    <main className="min-h-screen bg-stone-950 font-sans text-white">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-28 lg:px-8">
        <TechnicalBackground />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-stone-950">
            <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
          </div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Request received</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-normal">We will review your package</h1>
          <p className="mt-5 text-lg leading-8 text-stone-300">
            We sent a confirmation email and will send a private quote link when pricing is ready. No Lattice account is needed for this simple quote.
          </p>
          {request ? <p className="mt-6 font-mono text-sm text-stone-500">Reference {request}</p> : null}
          <Link className="mt-10 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-stone-950 transition hover:bg-stone-200" href="/">
            Back to Lattice
          </Link>
        </div>
      </section>
    </main>
  );
}
