import { BuyerQuotes } from "@/components/buyer-quotes";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerQuotes } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await filterCustomerVisibleRequestsForCurrentSession(await listBuyerQuotes());

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

      <BuyerQuotes requests={quotes} />
    </div>
  );
}
