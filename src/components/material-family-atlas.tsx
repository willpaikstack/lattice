import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { MaterialFamilyCardData } from "@/lib/material-family-view-models";

// Remove these overrides to restore the original swatches; source files are preserved.
const familySwatchOverrides: Partial<Record<string, string>> = {
  aluminum: "/materials/aluminum-machined-v4.png",
  "stainless-steel": "/materials/stainless-matte-v5.png",
  brass: "/materials/brass-machined-v4.png",
  copper: "/materials/copper-machined-v4.png",
  titanium: "/materials/titanium-ground-v4.png",
  "precision-alloys": "/materials/precision-alloy-matte-v5.png",
  "magnesium-zinc": "/materials/magnesium-zinc-machined-v4.png",
  "plastics-polymers": "/materials/polymer-machined-v4.png",
  "alloy-steel": "/materials/alloy-steel-matte-v5.png",
  "tool-steel": "/materials/tool-steel-ground-v4.png",
};

const familyDescriptions: Record<string, string> = {
  aluminum: "Lightweight structural parts",
  "stainless-steel": "Corrosion-resistant components",
  "mild-steel": "General-purpose fabrication and machining",
  brass: "Machinable fittings and precision components",
  copper: "Electrical and thermal conductivity",
  "alloy-steel": "Higher strength and toughness",
  "tool-steel": "Wear resistance and tooling",
  titanium: "Strength-to-weight and corrosion resistance",
  "inconel-incoloy": "High-temperature and corrosion service",
  "precision-alloys": "Controlled expansion and magnetic applications",
  "magnesium-zinc": "Lightweight and die-cast applications",
  "plastics-polymers": "Lightweight, wear, and insulation applications",
};

/** First-page design only. Restore MaterialFamilyCatalog in materials/page.tsx to revert. */
export function MaterialFamilyAtlas({ families }: { families: MaterialFamilyCardData[] }) {
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="text-[40px] font-bold leading-none tracking-[-0.04em] text-[#202020] sm:text-[48px]">Materials</h1>
          <p className="mt-3 text-[16px] leading-6 text-[#505967] sm:text-[18px]">Explore families. Confirm grade and condition during RFQ.</p>
        </div>
        <Link className="inline-flex min-h-11 items-center gap-2 rounded px-1 text-[14px] font-medium text-[#0969c3] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0969c3] focus-visible:ring-offset-2" href="/materials/inquiry">
          Request an unlisted material
          <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
        </Link>
      </header>

      <section aria-label="Material families" className="mt-6 grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
        {families.map((family) => (
          <Link
            className="group grid min-h-[178px] grid-cols-[52px_minmax(0,1fr)] gap-4 rounded-[6px] border border-[#d9dde2] bg-white p-4 outline-none transition-colors hover:border-[#9aa9b9] hover:bg-[#fcfdff] focus-visible:ring-2 focus-visible:ring-[#0969c3] focus-visible:ring-offset-2 sm:grid-cols-[64px_minmax(0,1fr)]"
            href={`/materials/${family.slug}`}
            key={family.slug}
          >
            <div className="relative overflow-hidden rounded-[4px] bg-[#eff0f1]" aria-hidden="true">
              <Image alt="" className="object-cover" fill sizes="(min-width: 640px) 64px, 52px" src={familySwatchOverrides[family.slug] ?? family.texture} />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.015em] text-[#202832]">{family.name}</h2>
                <span className="whitespace-nowrap text-[13px] leading-5 text-[#505967]">{family.gradeCount} {family.catalogNoun}</span>
              </div>
              <p className="mt-1.5 text-[14px] leading-5 text-[#505967]">{familyDescriptions[family.slug] ?? family.summary}</p>
              <p className="mt-4 text-[13px] leading-5 text-[#465363]">{family.examples.slice(0, 3).join(" · ")}</p>
              <span className="mt-auto inline-flex items-center gap-2 pt-3 text-[14px] font-medium leading-5 text-[#0969c3] group-hover:underline group-hover:underline-offset-4">
                Explore family
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <div className="mt-7 border-t border-[#d9dde2] pt-3 text-[13px] leading-5 text-[#586271]">
        <p>Catalog coverage is not live inventory. Availability is confirmed during RFQ.</p>
        <p>Reference properties depend on condition and stock form.</p>
      </div>
    </>
  );
}
