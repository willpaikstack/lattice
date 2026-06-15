import Link from "next/link";
import { ArrowLeft, CreditCard, FileText, LockKeyhole } from "lucide-react";

import { PublicHeader, TechnicalBackground } from "@/components/public-entry";
import { SimpleQuoteForm } from "@/components/simple-quote-form";

export const dynamic = "force-dynamic";

export default function SimpleQuotePage() {
  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-950">
      <PublicHeader />
      <section className="relative overflow-hidden bg-stone-900 px-6 pb-16 pt-32 text-white lg:px-8">
        <TechnicalBackground />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-7">
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-stone-300 transition hover:text-white" href="/">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Back to Lattice
            </Link>
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Account-free quote</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal lg:text-6xl">Request a simple manufacturing quote</h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-300">
                Upload a CAD-backed package, get a private quote link by email, and pay by credit card without creating a Lattice account.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              ["CAD package", "Upload one or more part files.", FileText],
              ["Private link", "Review only this quote.", LockKeyhole],
              ["Card only", "Checkout through Stripe.", CreditCard],
            ] as const).map(([title, copy, Icon]) => (
              <div className="rounded-md border border-white/10 bg-white/5 p-4 backdrop-blur-sm" key={title}>
                <Icon aria-hidden="true" className="h-5 w-5 text-white" />
                <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm leading-5 text-stone-400">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-md border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <SimpleQuoteForm />
        </div>
      </section>
    </main>
  );
}
