export type WorkspaceListKind = "quotes" | "orders";

export function WorkspaceListHeader({ kind }: { kind: WorkspaceListKind }) {
  const isQuotes = kind === "quotes";
  return (
    <section className={`border-b border-[#e6e6e6] ${isQuotes ? "pb-6" : "pb-5"}`}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">
        {isQuotes ? "Marketplace workspace" : "Production workspace"}
      </p>
      <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">
        {isQuotes ? "Quotes" : "Orders"}
      </h1>
      <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
        {isQuotes
          ? "Track RFQ packages, pricing, lead times, supplier review, and buyer actions in one scannable queue."
          : "Track purchased quotes through supplier acknowledgment, production, quality documents, shipment, and delivery follow-up."}
      </p>
    </section>
  );
}

function Skeleton({ className }: { className: string }) {
  return <div className={`workspace-skeleton rounded bg-[#eeeeee] ${className}`} />;
}

export function WorkspaceListLoading({ kind }: { kind: WorkspaceListKind }) {
  return (
    <div aria-busy="true" className={`mx-auto max-w-[1180px] ${kind === "quotes" ? "space-y-6" : "space-y-5"}`}>
      <WorkspaceListHeader kind={kind} />
      <p className="sr-only" role="status">{kind === "quotes" ? "Loading quotes and saved drafts…" : "Loading orders…"}</p>
      <div aria-hidden="true" className="space-y-5">
        {kind === "orders" && (
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div className="rounded-md border border-[#e8e8e8] bg-white p-4" key={index}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-4 h-7 w-10" />
                <Skeleton className="mt-3 h-3 w-36" />
              </div>
            ))}
          </div>
        )}
        <div className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
          <div className="border-b border-[#eeeeee] p-4">
            <Skeleton className="h-10 w-full max-w-[360px]" />
          </div>
          <div className="divide-y divide-[#eeeeee]">
            {[0, 1, 2].map((index) => (
              <div className="grid gap-5 px-4 py-5 sm:grid-cols-[2fr_1fr_1fr] sm:items-center" key={index}>
                <div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className={`mt-3 h-4 ${index === 1 ? "w-3/5" : "w-4/5"}`} />
                  <Skeleton className="mt-2 h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-4 w-20 sm:justify-self-end" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
