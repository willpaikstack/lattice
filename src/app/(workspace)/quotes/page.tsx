import { WorkspaceContentReveal } from "@/components/workspace-content-reveal";
import { WorkspaceListHeader } from "@/components/workspace-list-loading";
import { BuyerQuotes } from "@/components/buyer-quotes";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerQuotes } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await filterCustomerVisibleRequestsForCurrentSession(await listBuyerQuotes());

  return (
    <div data-workspace-tour="quotes" className="mx-auto max-w-[1180px] space-y-6">
      <WorkspaceListHeader kind="quotes" />
      <WorkspaceContentReveal>
        <BuyerQuotes requests={quotes} />
      </WorkspaceContentReveal>
    </div>
  );
}
