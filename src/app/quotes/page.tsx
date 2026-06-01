import { BuyerQuotes } from "@/components/buyer-quotes";
import { listBuyerQuotes } from "@/lib/request-repository";

import { CheckCircle2, FilePenLine, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await listBuyerQuotes();
  const configuringQuoteCount = quotes.filter((quote) => quote.status !== "QUOTED" && quote.status !== "PURCHASED").length;
  const quoteReceivedCount = quotes.filter((quote) => quote.status === "QUOTED").length;
  const quoteClosedCount = quotes.filter((quote) => quote.status === "PURCHASED").length;

  const metrics = [
    {
      detail: "RFQs being prepared, reviewed, or priced",
      icon: FilePenLine,
      label: "Configuring Quote",
      value: configuringQuoteCount,
    },
    {
      detail: "Priced quotes ready for review",
      icon: Inbox,
      label: "Quote Received",
      value: quoteReceivedCount,
    },
    {
      detail: "Converted, expired, or no longer active",
      icon: CheckCircle2,
      label: "Quote Closed",
      value: quoteClosedCount,
    },
  ];

  return (
    <div className="mx-auto max-w-[1180px] space-y-6">
      <section className="border-b border-[#e6e6e6] pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Marketplace workspace</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Quotes</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              Track RFQ packages, pricing, lead times, supplier review, and buyer actions in one scannable queue.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Quote summary" className="grid gap-3 md:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="relative rounded-lg border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" key={metric.label}>
              <div className="flex items-start justify-between gap-4">
                <p className="text-[13px] font-medium text-[#686d75]">{metric.label}</p>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#ececec] bg-[#fafafa] text-[#8b919a]">
                  <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                </span>
              </div>
              <p className="mt-4 text-[30px] font-semibold leading-none text-[#202020]">{metric.value}</p>
              <p className="mt-2 text-[12px] text-[#8a8f98]">{metric.detail}</p>
            </article>
          );
        })}
      </section>

      <BuyerQuotes requests={quotes} />
    </div>
  );
}
