"use client";

import { useState } from "react";

import type { MaterialVariant } from "../lib/catalog-data";

type CatalogCardVariant = "standard" | "bubble-material";

type CatalogCardProps = {
  title: string;
  summary: string;
  details: string;
  commonGrades?: string[];
  standards?: string[];
  defaultOpen?: boolean;
  variant?: CatalogCardVariant;
  subCards?: MaterialVariant[];
};

export function CatalogCard({
  title,
  summary,
  details,
  commonGrades = [],
  standards = [],
  defaultOpen = false,
  variant = "standard",
  subCards = [],
}: CatalogCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const panelId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-details`;

  if (variant === "bubble-material") {
    return (
      <article className="rounded-[7px] border border-[#e1e1e1] bg-white">
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          className="relative flex w-full items-start justify-between gap-8 px-4 pb-5 pt-4 text-left"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="min-w-0 pr-8">
            <span className="block text-[16px] font-bold leading-6 text-[#222222] underline decoration-[1.5px] underline-offset-2">
              {title}
            </span>
            <span className="mt-1 block text-[14px] leading-[1.55] text-[#747474]">{summary}</span>
          </span>
          <span
            className={`absolute right-4 top-4 flex h-[30px] w-[30px] items-center justify-center text-[18px] leading-none text-[#252525] transition ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            ⌄
          </span>
        </button>

        {isOpen ? (
          <div id={panelId} className="px-4 pb-5">
            <p className="max-w-[950px] text-[14px] leading-[1.55] text-[#747474]">{details}</p>
            {subCards.length ? (
              <div className="mt-6 space-y-5" aria-label={`${title} grade cards`}>
                {subCards.map((subCard) => (
                  <MaterialSubCard key={subCard.name} variant={subCard} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-6 px-5 py-5 text-left"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>
          <span className="block text-lg font-semibold text-slate-950">{title}</span>
          <span className="mt-2 block text-sm leading-6 text-slate-600">{summary}</span>
        </span>
        <span className={`mt-1 text-2xl text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true">
          ⌄
        </span>
      </button>

      {isOpen ? (
        <div id={panelId} className="border-t border-slate-100 px-5 pb-5 pt-4">
          <p className="text-sm leading-6 text-slate-600">{details}</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {commonGrades.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Common grades / modes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonGrades.map((grade) => (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700" key={grade}>
                      {grade}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {standards.length ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Standards / documentation</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {standards.map((standard) => (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800" key={standard}>
                      {standard}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function MaterialSubCard({ variant }: { variant: MaterialVariant }) {
  return (
    <article className="relative min-h-[250px] overflow-hidden rounded-[6px] border border-[#e5e5e5] bg-white px-4 py-4 text-[#787878]">
      <div className="grid min-h-[218px] grid-cols-[minmax(250px,1fr)_170px_367px] gap-5">
        <div className="pt-1">
          <div className="flex items-baseline gap-5">
            <h3 className="text-[21px] font-bold leading-7 text-[#1f1f1f]">{variant.name}</h3>
            <span className="text-[16px] leading-6 text-[#8b8b8b]">{variant.uns}</span>
          </div>
          <p className="mt-1 text-[14px] leading-5 text-[#8a8a8a]">
            <span>{variant.priceTier}</span>
            <span className="ml-5">{variant.machinability}</span>
          </p>
          <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] leading-5 text-[#8a8a8a]">
            <Metric icon="⌁" label="Lead time score" value={variant.metrics.leadTime} />
            <Metric icon="⚒" label="Quote count" value={variant.metrics.quoteCount} />
            <Metric icon="▭" label="Supplier count" value={variant.metrics.supplierCount} />
          </dl>
          <p className="mt-2 text-[14px] leading-5 text-[#777777]">Common Specs: {variant.commonSpec}</p>
        </div>

        <div className="pt-0 text-center text-[16px] leading-6 text-[#252525]">{variant.industry}</div>

        <MaterialImage tone={variant.imageTone} label={`${variant.name} machined part`} />
      </div>
    </article>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <dt className="sr-only">{label}</dt>
      <span aria-hidden="true" className="text-[13px] text-[#b4b4b4]">
        {icon}
      </span>
      <dd>{value}</dd>
    </div>
  );
}

function MaterialImage({ tone, label }: { tone: MaterialVariant["imageTone"]; label: string }) {
  const toneClasses = {
    "dark-fixture": "from-[#07080c] via-[#11131a] to-[#010102] before:left-[38%] before:top-[40%] before:h-[74px] before:w-[170px] before:rounded-[20px] before:bg-gradient-to-r before:from-[#4d4d50] before:via-[#f1f1ed] before:to-[#232328] after:left-[48%] after:top-[26%] after:h-[86px] after:w-[98px] after:rounded-t-full after:bg-gradient-to-br after:from-[#ffffff] after:via-[#b7b7b8] after:to-[#24252a]",
    "round-flange": "from-[#11131a] via-[#262b35] to-[#050508] before:left-[36%] before:top-[24%] before:h-[145px] before:w-[145px] before:rounded-full before:bg-gradient-to-br before:from-[#fafaf7] before:via-[#9d9d9c] before:to-[#26272d] after:left-[47%] after:top-[40%] after:h-[45px] after:w-[45px] after:rounded-full after:border-[10px] after:border-[#2d2e34] after:bg-[#d7d7d2]",
    "bright-fitting": "from-[#ffffff] via-[#f9f9f8] to-[#f1f1ef] before:left-[49%] before:top-[30%] before:h-[116px] before:w-[82px] before:rounded-[16px] before:bg-gradient-to-br before:from-[#ffffff] before:via-[#b6b4ae] before:to-[#686761] after:left-[43%] after:top-[63%] after:h-[56px] after:w-[140px] after:rounded-[16px] after:bg-gradient-to-r after:from-[#77756f] after:via-[#efeee8] after:to-[#5d5b56]",
  } as const;

  return (
    <div
      aria-label={label}
      role="img"
      className={`relative h-[218px] overflow-hidden bg-gradient-to-br ${toneClasses[tone]} before:absolute before:content-[''] after:absolute after:content-['']`}
    >
      <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />
    </div>
  );
}
