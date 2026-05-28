import Link from "next/link";

import { BuyerQuotes } from "@/components/buyer-quotes";
import { listBuyerQuotes } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await listBuyerQuotes();
  const activeQuoteCount = quotes.filter((quote) => quote.status !== "PURCHASED").length;
  const quotedCount = quotes.filter((quote) => quote.status === "QUOTED").length;
  const needsInfoCount = quotes.filter((quote) => quote.status === "NEEDS_INFO").length;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <section className="border-b border-[#e6e6e6] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Marketplace workspace</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Quotes</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              Track RFQ packages, pricing, lead times, supplier review, and buyer actions in one scannable queue.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold transition hover:bg-[#2b2b2b]"
              href="/requests/new"
              style={{ color: "#ffffff" }}
            >
              Request Quote
            </Link>
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dcdcdc] bg-white px-4 text-[14px] font-semibold text-[#3f444b] transition hover:bg-[#f8f8f8]" href="/operator/requests">
              Open Operator Queue
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Quote summary" className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Active RFQs", value: activeQuoteCount, detail: "Not yet purchased" },
          { label: "Ready to accept", value: quotedCount, detail: "Priced quotes" },
          { label: "Needs info", value: needsInfoCount, detail: "Buyer action required" },
        ].map((metric) => (
          <article className="rounded-md border border-[#e8e8e8] bg-white p-4" key={metric.label}>
            <p className="text-[13px] font-medium text-[#686d75]">{metric.label}</p>
            <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{metric.value}</p>
            <p className="mt-2 text-[12px] text-[#8a8f98]">{metric.detail}</p>
          </article>
        ))}
      </section>

      <BuyerQuotes requests={quotes} />
    </div>
  );
}
