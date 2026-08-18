"use client";

import { ArrowRight, Check, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { setRoadmapInterestAction } from "@/app/roadmap/actions";
import type { ProductRoadmapItem, RoadmapStatus } from "@/lib/product-roadmap";

export type ProductRoadmapBoardItem = ProductRoadmapItem & {
  interested: boolean;
  interestedCount: number;
};

const statusDotTone = {
  Discovery: "bg-slate-400",
  Pilot: "bg-emerald-500",
  Planned: "bg-amber-500",
} satisfies Record<RoadmapStatus, string>;

function RoadmapInterestButton({
  item,
  onToggleInterest,
  pending,
}: {
  item: ProductRoadmapBoardItem;
  onToggleInterest: (item: ProductRoadmapBoardItem) => void;
  pending: boolean;
}) {
  const Icon = item.interested ? Check : Plus;

  return (
    <button
      aria-label={item.interested ? `Remove interest in ${item.title}` : `Flag interest in ${item.title}`}
      aria-pressed={item.interested}
      className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:opacity-60 ${
        item.interested ? "text-emerald-700 hover:text-emerald-900" : "text-stone-700 hover:text-stone-950"
      }`}
      disabled={pending}
      onClick={() => onToggleInterest(item)}
      type="button"
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
      {item.interested ? "Interested" : "Flag interest"}
      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
    </button>
  );
}

function HorizonRows({
  heading,
  items,
  onToggleInterest,
  pendingItemId,
}: {
  heading: string;
  items: ProductRoadmapBoardItem[];
  onToggleInterest: (item: ProductRoadmapBoardItem) => void;
  pendingItemId: string | null;
}) {
  if (!items.length) return null;

  return (
    <section aria-labelledby={`${heading.toLowerCase()}-heading`}>
      <h2 className="border-b border-stone-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500" id={`${heading.toLowerCase()}-heading`}>
        {heading}
      </h2>
      <div className="divide-y divide-stone-200">
        {items.map((item) => (
          <article className="grid gap-5 px-5 py-4 md:grid-cols-[minmax(0,1fr)_140px_112px] md:items-center" key={item.id}>
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-stone-950">{item.title}</h3>
              <p className="mt-1 max-w-[620px] text-[13px] leading-5 text-stone-600">{item.summary}</p>
            </div>
            <div className="text-[13px] leading-5 text-stone-600">
              <p className="font-medium text-stone-800">{item.horizon}</p>
              <p>{item.horizon === "Soon" ? "1–2 quarters" : "3+ quarters"}</p>
            </div>
            <RoadmapInterestButton item={item} onToggleInterest={onToggleInterest} pending={pendingItemId === item.id} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProductRoadmapBoard({ items }: { items: ProductRoadmapBoardItem[] }) {
  const [optimisticInterests, setOptimisticInterests] = useState(() => Object.fromEntries(items.map((item) => [item.id, item.interested])));
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const roadmapItems = useMemo(
    () =>
      items.map((item) => {
        const interested = optimisticInterests[item.id] ?? item.interested;
        const localDelta = interested === item.interested ? 0 : interested ? 1 : -1;

        return { ...item, interested, interestedCount: Math.max(0, item.interestedCount + localDelta) };
      }),
    [items, optimisticInterests],
  );
  const nextItems = roadmapItems.filter((item) => item.horizon === "Next");
  const soonItems = roadmapItems.filter((item) => item.horizon === "Soon");
  const laterItems = roadmapItems.filter((item) => item.horizon === "Later");

  function toggleInterest(item: ProductRoadmapBoardItem) {
    const currentValue = optimisticInterests[item.id] ?? item.interested;
    const nextValue = !currentValue;

    setOptimisticInterests((currentInterests) => ({ ...currentInterests, [item.id]: nextValue }));
    setPendingItemId(item.id);

    startTransition(async () => {
      try {
        await setRoadmapInterestAction(item.id, nextValue);
      } catch {
        setOptimisticInterests((currentInterests) => ({ ...currentInterests, [item.id]: currentValue }));
        window.alert("Your roadmap interest could not be saved. Please try again.");
      } finally {
        setPendingItemId(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <header className="pt-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Product roadmap</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">What we’re building next.</h1>
        <p className="mt-3 text-[15px] leading-6 text-stone-600">A simple look at what&apos;s live, what&apos;s coming soon, and what&apos;s on our horizon.</p>
        <p className="mt-2 text-[12px] text-stone-500">Last updated: August 17, 2026</p>
      </header>

      <section aria-label="Roadmap horizon" className="mt-14">
        <div className="grid grid-cols-3">
          {[
            ["1", "Now", "Live today", false],
            ["2", "Next", "In the near term", true],
            ["3", "Later", "On the horizon", false],
          ].map(([number, label, detail, emphasized]) => (
            <div className="relative border-t border-stone-300 pt-9 text-center" key={String(label)}>
              <span className={`absolute left-1/2 top-0 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[13px] font-semibold ${emphasized ? "bg-stone-950 text-white" : "bg-stone-200 text-stone-700"}`}>
                {number}
              </span>
              <p className={`text-[12px] font-semibold uppercase tracking-[0.16em] ${emphasized ? "text-stone-950" : "text-stone-500"}`}>{label}</p>
              <p className="mt-2 text-[13px] text-stone-500">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-md border-l border-stone-300 pl-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">In progress</p>
          <div className="mt-4 space-y-3">
            {nextItems.map((item) => (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1" key={item.id}>
                <p className="text-[15px] font-semibold tracking-[-0.02em] text-stone-950">{item.title}</p>
                <span className="inline-flex items-center gap-2 text-[12px] text-stone-600">
                  <span aria-hidden="true" className={`h-2 w-2 rounded-full ${statusDotTone[item.status]}`} />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Upcoming roadmap details" className="mt-16 border-y border-stone-200">
        <div className="hidden grid-cols-[minmax(0,1fr)_140px_112px] gap-5 border-b border-stone-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500 md:grid">
          <span>What we&apos;re building</span><span>Horizon</span><span>Action</span>
        </div>
        <HorizonRows heading="Soon" items={soonItems} onToggleInterest={toggleInterest} pendingItemId={pendingItemId} />
        <HorizonRows heading="Later" items={laterItems} onToggleInterest={toggleInterest} pendingItemId={pendingItemId} />
      </section>

      <p className="mt-8 text-[12px] leading-5 text-stone-500">Roadmap items and timing are directional and may change based on customer needs and market conditions.</p>
    </div>
  );
}
