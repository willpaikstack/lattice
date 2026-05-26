import Link from "next/link";

import { EquipmentCatalog } from "./equipment-catalog";
import {
  equipmentSources,
  equipmentSummary,
  recommendedEquipmentSections,
} from "@/lib/vendor-equipment";

export default function EquipmentPage() {
  return (
    <div className="mx-auto max-w-[1180px] space-y-8 pb-12">
      <section className="max-w-[980px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8c8c8c]">Vendor resources</p>
        <h1 className="mt-3 text-[48px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#202020] md:text-[64px]">Vendor Equipment</h1>
        <p className="mt-4 max-w-[840px] text-[15px] leading-7 text-[#696f78]">
          A customer-facing equipment view seeded from Zintilon&apos;s processing, QC, and sheet metal capability lists. Each card represents a unique equipment type, using make and model as the grouping rule, so buyers can compare actual machines instead of broad capability bundles.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Equipment summary">
        {equipmentSummary.map((metric) => (
          <article className="rounded-md border border-[#e6e6e6] bg-white p-4" key={metric.label}>
            <p className="text-[13px] font-medium text-[#6f737a]">{metric.label}</p>
            <p className="mt-3 text-[34px] font-semibold leading-none tracking-[-0.045em] text-[#202020]">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-[#e6e6e6] bg-[#fbfbfb] p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#202020]">Catalog format</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#6f737a]">
              The page is organized into CNC Milling, CNC Lathe, QC & Inspection, Manual Machines, Sheet Metal, and Finishing. Duplicate rows from the source PDFs are combined only when the make and model match, with quantity, range, tolerance, controls, and process notes preserved inside the card.
            </p>
          </div>
          <div className="text-[13px] leading-6 text-[#6f737a]">
            <p className="font-semibold text-[#30343a]">Source documents</p>
            <p>{equipmentSources.zintilonProcessing.documentDate}: {equipmentSources.zintilonProcessing.document}</p>
            <p>{equipmentSources.zintilonSheetMetal.documentDate}: {equipmentSources.zintilonSheetMetal.document}</p>
            <p>{equipmentSources.zintilonQc.documentDate}: {equipmentSources.zintilonQc.document}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
        <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#202020]">Recommended additional sections</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {recommendedEquipmentSections.map((section) => (
            <article className="rounded-md border border-[#eeeeee] bg-[#fbfbfb] p-4" key={section.name}>
              <h3 className="text-[16px] font-semibold text-[#202020]">{section.name}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6f737a]">{section.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <EquipmentCatalog />

      <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#202020]">Need a process match?</h2>
            <p className="mt-1 text-[14px] leading-6 text-[#6f737a]">Route an RFQ with material, tolerance, finish, and inspection requirements so Lattice can map it to the right vendor equipment.</p>
          </div>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#858585] px-5 text-[14px] font-semibold text-white transition hover:bg-[#737373]" href="/requests/new">
            Start an RFQ
          </Link>
        </div>
      </section>
    </div>
  );
}
