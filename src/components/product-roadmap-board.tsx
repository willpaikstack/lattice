"use client";

import { ArrowUpRight, CheckCircle2, Circle, Clock3, Factory, Flag, Layers3, LineChart, PlusCircle, SearchCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { setRoadmapInterestAction } from "@/app/roadmap/actions";
import type { ProductRoadmapItem, RoadmapCategory, RoadmapStatus } from "@/lib/product-roadmap";

export type ProductRoadmapBoardItem = ProductRoadmapItem & {
  interested: boolean;
  interestedCount: number;
};

type CategoryFilter = RoadmapCategory | "All";

const categoryIcons = {
  Manufacturing: Factory,
  Quoting: SearchCheck,
  Reporting: LineChart,
  Services: Layers3,
} satisfies Record<RoadmapCategory, typeof Factory>;

const statusTone = {
  Discovery: "border-sky-200 bg-sky-50 text-sky-800",
  Pilot: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Planned: "border-amber-200 bg-amber-50 text-amber-800",
} satisfies Record<RoadmapStatus, string>;

function categoryFilters(items: ProductRoadmapBoardItem[]): CategoryFilter[] {
  return ["All", ...Array.from(new Set(items.map((item) => item.category)))];
}

function countLabel(count: number) {
  return `${count} ${count === 1 ? "customer" : "customers"}`;
}

function RoadmapMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold leading-none text-stone-950">{value}</p>
    </article>
  );
}

function RoadmapStatusPill({ status }: { status: RoadmapStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${statusTone[status]}`}>
      <Clock3 aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
      {status}
    </span>
  );
}

function RoadmapCard({
  item,
  onToggleInterest,
  pending,
}: {
  item: ProductRoadmapBoardItem;
  onToggleInterest: (item: ProductRoadmapBoardItem) => void;
  pending: boolean;
}) {
  const CategoryIcon = categoryIcons[item.category];
  const InterestIcon = item.interested ? CheckCircle2 : PlusCircle;

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm shadow-stone-200/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[12px] font-semibold text-stone-700">
              <CategoryIcon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
              {item.category}
            </span>
            <RoadmapStatusPill status={item.status} />
            <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-stone-600">{item.horizon}</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-stone-950">{item.title}</h2>
          <p className="mt-2 text-[14px] leading-6 text-stone-600">{item.summary}</p>
        </div>
        <button
          aria-label={item.interested ? `Remove interest in ${item.title}` : `Flag interest in ${item.title}`}
          aria-pressed={item.interested}
          className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-[14px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:opacity-60 ${
            item.interested
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              : "border-stone-300 bg-white text-stone-900 hover:border-stone-950 hover:bg-stone-50"
          }`}
          disabled={pending}
          onClick={() => onToggleInterest(item)}
          type="button"
        >
          <InterestIcon aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          {item.interested ? "Interested" : "Flag interest"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 border-t border-stone-100 pt-5 lg:grid-cols-[1fr_0.78fr]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">Likely signals</p>
          <ul className="mt-3 grid gap-2">
            {item.signals.map((signal) => (
              <li className="flex gap-2 text-[13px] leading-5 text-stone-600" key={signal}>
                <Circle aria-hidden="true" className="mt-1 h-2.5 w-2.5 fill-stone-300 text-stone-300" strokeWidth={0} />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">Customer value</p>
          <p className="mt-2 text-[13px] leading-5 text-stone-700">{item.customerValue}</p>
          <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">Interest</p>
          <p className="mt-2 text-[18px] font-semibold text-stone-950">{countLabel(item.interestedCount)}</p>
        </div>
      </div>
    </article>
  );
}

export function ProductRoadmapBoard({ items }: { items: ProductRoadmapBoardItem[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const [optimisticInterests, setOptimisticInterests] = useState(() => Object.fromEntries(items.map((item) => [item.id, item.interested])));
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const filters = useMemo(() => categoryFilters(items), [items]);

  const visibleItems = useMemo(() => {
    return items
      .map((item) => {
        const interested = optimisticInterests[item.id] ?? item.interested;
        const localDelta = interested === item.interested ? 0 : interested ? 1 : -1;

        return {
          ...item,
          interested,
          interestedCount: Math.max(0, item.interestedCount + localDelta),
        };
      })
      .filter((item) => activeCategory === "All" || item.category === activeCategory);
  }, [activeCategory, items, optimisticInterests]);

  const selectedItems = visibleItems.filter((item) => item.interested);
  const totalInterestedItems = Object.values(optimisticInterests).filter(Boolean).length;
  const mostRequested = [...visibleItems].sort((left, right) => right.interestedCount - left.interestedCount)[0];

  function toggleInterest(item: ProductRoadmapBoardItem) {
    const currentValue = optimisticInterests[item.id] ?? item.interested;
    const nextValue = !currentValue;

    setOptimisticInterests((currentInterests) => ({
      ...currentInterests,
      [item.id]: nextValue,
    }));
    setPendingItemId(item.id);

    startTransition(async () => {
      try {
        await setRoadmapInterestAction(item.id, nextValue);
      } catch {
        setOptimisticInterests((currentInterests) => ({
          ...currentInterests,
          [item.id]: currentValue,
        }));
        window.alert("Your roadmap interest could not be saved. Please try again.");
      } finally {
        setPendingItemId(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="border-b border-stone-200 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-stone-500">Product roadmap</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight text-stone-950">Help prioritize what Lattice builds next</h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-stone-600">
              Upcoming product and service investments across quoting, supplier capacity, expanded processes, and order visibility.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-[14px] font-semibold text-white transition hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
            href="/requests/new"
          >
            Request Quote
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <section aria-label="Roadmap summary" className="grid gap-3 md:grid-cols-3">
        <RoadmapMetric label="Roadmap items" value={items.length} />
        <RoadmapMetric label="Your flags" value={totalInterestedItems} />
        <RoadmapMetric label="Top signal" value={mostRequested?.title ?? "No signals yet"} />
      </section>

      <section className="flex flex-wrap gap-2" aria-label="Roadmap filters">
        {filters.map((filter) => {
          const isActive = activeCategory === filter;

          return (
            <button
              aria-pressed={isActive}
              className={`inline-flex min-h-9 items-center rounded-md border px-3 text-[13px] font-semibold transition ${
                isActive ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-950"
              }`}
              key={filter}
              onClick={() => setActiveCategory(filter)}
              type="button"
            >
              {filter}
            </button>
          );
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <section aria-label="Roadmap items" className="space-y-4">
          {visibleItems.map((item) => (
            <RoadmapCard
              item={item}
              key={item.id}
              onToggleInterest={toggleInterest}
              pending={isPending && pendingItemId === item.id}
            />
          ))}
        </section>

        <aside className="h-fit rounded-lg border border-stone-200 bg-white p-5 shadow-sm shadow-stone-200/40 xl:sticky xl:top-8">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-stone-950 text-white">
              <Flag aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-stone-500">Your priorities</p>
              <h2 className="text-[18px] font-semibold text-stone-950">Marked interested</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {selectedItems.length ? (
              selectedItems.map((item) => (
                <div className="rounded-md border border-stone-200 bg-stone-50 p-3" key={`selected-${item.id}`}>
                  <p className="text-[14px] font-semibold text-stone-950">{item.title}</p>
                  <p className="mt-1 text-[12px] text-stone-600">
                    {item.category} - {item.horizon}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-4 text-[13px] leading-5 text-stone-600">
                No roadmap items marked in this view.
              </div>
            )}
          </div>

          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-[13px] font-semibold text-amber-900">Customer demand signal</p>
            <p className="mt-2 text-[13px] leading-5 text-amber-800">
              Interest flags are saved to the Lattice roadmap signal store for prioritization review.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
