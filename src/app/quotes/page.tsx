import Link from "next/link";

import { BuyerQuotes } from "@/components/buyer-quotes";
import { listBuyerQuotes } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await listBuyerQuotes();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Manage</p>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">My Quotes</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Track submitted RFQs from buyer intake through operator review, supplier RFQ packaging, pricing, and purchase conversion.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href="/requests/new">
              Request Quote
            </Link>
            <Link className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" href="/operator/requests">
              Open Operator Queue
            </Link>
          </div>
        </div>
      </section>

      <BuyerQuotes requests={quotes} />
    </div>
  );
}
