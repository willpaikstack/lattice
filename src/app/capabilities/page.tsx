import Link from "next/link";

import { CatalogCard } from "@/components/catalog-card";
import { capabilities } from "@/lib/catalog-data";

export default function CapabilitiesPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Resources</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950 md:text-6xl">Fabrication Capabilities</h1>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">Fabrication Capabilities</h2>
        <div className="mt-4 max-w-5xl space-y-4 text-sm leading-7 text-slate-600 md:text-base">
          <p>
            Lattice connects domestic fabrication demand with a vetted network of high-performance manufacturing partners. Our current capabilities focus on precision CNC machining, supported by modern 3-axis, 4-axis, and 5-axis equipment across stainless, aluminum, alloy steels, titanium, and nickel alloys.
          </p>
          <p>
            Each partner facility is selected based on demonstrated quality systems, equipment depth, tolerance control, and production scalability — not just capacity availability.
          </p>
          <p>
            All production workflows are supported by documented inspection processes, material traceability, and specification-driven execution to meet ASTM, ASME, and industry-specific standards.
          </p>
        </div>
        <Link className="mt-6 inline-flex rounded-2xl bg-[#171717] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a2a2a]" href="/requests/new">
          Start an RFQ
        </Link>
      </section>

      <section className="space-y-4" aria-label="Fabrication capability categories">
        {capabilities.map((capability, index) => (
          <CatalogCard
            commonGrades={capability.commonGrades}
            defaultOpen={index === 0}
            details={capability.details}
            key={capability.slug}
            standards={capability.standards}
            summary={capability.summary}
            title={capability.name}
          />
        ))}
      </section>
    </div>
  );
}
