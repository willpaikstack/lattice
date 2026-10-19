import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BuyerQuoteDetail } from "@/components/buyer-quote-detail";
import { quoteTimingPreviewRequest } from "@/lib/quote-timing-preview-fixture";

export const dynamic = "force-dynamic";

export default async function TimingPreview({ searchParams }: { searchParams: Promise<{ layout?: string; parts?: string; shipping?: string; viewport?: string; frame?: string }> }) {
  if (process.env.NODE_ENV !== "development" || process.env.LOCAL_TIMING_PREVIEW !== "1") notFound();
  const query = await searchParams;
  if (query.viewport === "mobile") return <main className="min-h-screen bg-[#eef1f5] px-4 py-6">
    <header className="mx-auto mb-5 max-w-[800px] text-center text-[14px] text-[#33445c]"><p className="font-semibold">Design C · 390px mobile preview</p><Link className="mt-2 inline-block underline underline-offset-4" href="/design-preview/timing-c">Back to desktop preview</Link></header>
    <iframe title="Design C at 390px" src="/design-preview/timing-c?layout=sidebar&frame=1" width="390" height="1120" className="mx-auto block max-w-full rounded-xl border border-[#cbd3de] bg-white shadow-lg" />
  </main>;
  const request = quoteTimingPreviewRequest(query.parts === "2" ? 2 : 1);
  if (query.shipping === "unknown") request.quote.shippingMethod = "Custom freight";
  const layout = query.layout === "legacy" ? "legacy" : query.layout === "sidebar" ? "sidebar" : process.env.LATTICE_QUOTE_TIMING_LAYOUT === "legacy" ? "legacy" : "sidebar";
  return <AppShell onboardingPreview sessionRole="customer" sessionUser={{ name: "Preview Customer", email: "preview@example.com" }}>
    {query.frame !== "1" ? <div className="mx-auto mb-6 flex max-w-[1600px] flex-wrap items-center justify-between gap-3 rounded-md border border-[#cdd9e9] bg-[#f1f5fa] px-4 py-3 text-[13px] text-[#33445c]" id="local-preview">
      <p><strong>Local preview · {layout === "sidebar" ? "Design C" : "Previous layout"}</strong><span className="ml-3">Synthetic quote · No checkout or customer-data writes</span></p>
      <nav aria-label="Timing preview options" className="flex flex-wrap gap-4 font-semibold underline underline-offset-4">
        <Link href="/design-preview/timing-c?layout=sidebar">Design C</Link>
        <Link href="/design-preview/timing-c?layout=legacy">Previous layout</Link>
        <Link href="/design-preview/timing-c?parts=2">Two parts</Link>
        <Link href="/design-preview/timing-c?shipping=unknown">Missing shipping time</Link>
        <Link href="/design-preview/timing-c?viewport=mobile">Mobile preview</Link>
      </nav>
    </div> : null}
    <BuyerQuoteDetail request={request} timingLayout={layout} checkoutHref="#local-preview" />
  </AppShell>;
}
