import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileCheck2,
  Layers3,
  LineChart,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { customerMaterialCatalog, type CustomerMaterialCatalogEntry } from "@/lib/customer-material-catalog";

type MaterialSignal = {
  name: string;
  gradeCount: number;
  standards: string[];
  examples: string[];
  posture: "stocked" | "review" | "specialty";
};

const postureCopy = {
  review: "Application review",
  specialty: "Specialty sourcing",
  stocked: "Recurring availability",
} as const;

const assuranceSignals = [
  { label: "Mill certs", detail: "Documentation expected before order release", icon: FileCheck2 },
  { label: "Traceability", detail: "Grade, spec, and source path retained internally", icon: ShieldCheck },
  { label: "MOQ relief", detail: "Network sourcing helps avoid wholesale minimums", icon: Boxes },
  { label: "RFQ fit", detail: "Material limits reviewed before supplier routing", icon: ClipboardCheck },
];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function materialGradeNames(material: CustomerMaterialCatalogEntry) {
  return unique([
    ...material.commonGrades,
    ...(material.variants ?? []).map((variant) => variant.name),
    ...material.materialGroups.flatMap((group) => group.grades),
  ]);
}

function getMaterialSignals(): MaterialSignal[] {
  return customerMaterialCatalog.map((material) => {
    const gradeNames = materialGradeNames(material);
    const gradeCount = gradeNames.length;
    const posture = /Inconel|Titanium|Precision|Magnesium|zinc/i.test(material.name)
      ? "specialty"
      : /Plastics|Tool|Copper/i.test(material.name)
        ? "review"
        : "stocked";

    return {
      name: material.name,
      gradeCount,
      standards: material.standards,
      examples: gradeNames.slice(0, 4),
      posture,
    };
  });
}

const materialSignals = getMaterialSignals();
const totalGradeCount = materialSignals.reduce((sum, material) => sum + material.gradeCount, 0);
const standardCount = unique(customerMaterialCatalog.flatMap((material) => material.standards)).length;
const largestFamilies = [...materialSignals].sort((a, b) => b.gradeCount - a.gradeCount).slice(0, 6);
const quoteReadyFamilies = materialSignals.filter((material) => material.posture === "stocked");

function DirectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">{children}</p>;
}

function MaterialVisual({ tone = "silver" }: { tone?: "dark" | "silver" | "copper" }) {
  const tones = {
    copper: "from-[#faf3e8] via-[#d3a36f] to-[#6f4127]",
    dark: "from-[#18181b] via-[#4b5563] to-[#f4f4f5]",
    silver: "from-[#f8fafc] via-[#cbd5e1] to-[#475569]",
  };

  return (
    <div className={`relative min-h-[270px] overflow-hidden rounded-lg border border-white/40 bg-gradient-to-br ${tones[tone]} shadow-sm`}>
      <div className="absolute left-[12%] top-[18%] h-28 w-44 rounded-[28px] bg-white/45 shadow-2xl shadow-black/20" />
      <div className="absolute right-[13%] top-[28%] h-36 w-36 rounded-full border-[28px] border-white/60 bg-black/20 shadow-xl" />
      <div className="absolute bottom-[14%] left-[25%] h-16 w-[58%] rounded-[22px] bg-black/25 shadow-2xl" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}

function SignalPill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "blue" | "green" | "neutral" | "amber" }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    neutral: "border-stone-200 bg-white text-stone-700",
  };

  return <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-[12px] font-semibold ${tones[tone]}`}>{children}</span>;
}

function AssuranceItem({ detail, icon: Icon, label }: { detail: string; icon: LucideIcon; label: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-stone-200 bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700">
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-[14px] font-semibold text-stone-950">{label}</span>
        <span className="mt-1 block text-[13px] leading-5 text-stone-500">{detail}</span>
      </span>
    </div>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight text-stone-950">{value}</p>
      <p className="mt-1 text-[12px] font-medium leading-4 text-stone-500">{label}</p>
    </div>
  );
}

function FamilyCoverageRow({ material }: { material: MaterialSignal }) {
  const tone = material.posture === "stocked" ? "green" : material.posture === "review" ? "amber" : "blue";

  return (
    <div className="grid gap-4 border-t border-stone-200 py-4 md:grid-cols-[1.2fr_0.65fr_1.6fr_0.8fr] md:items-center">
      <div>
        <p className="text-[15px] font-semibold text-stone-950">{material.name}</p>
        <p className="mt-1 text-[13px] text-stone-500">{material.gradeCount} searchable grades</p>
      </div>
      <SignalPill tone={tone}>{postureCopy[material.posture]}</SignalPill>
      <p className="text-[13px] leading-5 text-stone-600">{material.examples.join(" / ")}</p>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-stone-400">{material.standards.slice(0, 2).join(" + ")}</p>
    </div>
  );
}

function DirectionOne() {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-[#f8f7f3]">
      <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        <div className="flex flex-col justify-between gap-8">
          <div>
            <DirectionEyebrow>Direction 01 / Network Proof</DirectionEyebrow>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-stone-950 md:text-6xl">
              Material confidence before the RFQ leaves your desk.
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-stone-600">
              Lead with the promise customers actually need: breadth, certification readiness, and a credible path when their own supplier base cannot support a material.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetricBlock label="material families organized for RFQ routing" value={`${customerMaterialCatalog.length}`} />
            <MetricBlock label="grade names represented in the current catalog" value={`${totalGradeCount}+`} />
            <MetricBlock label="documentation and review standards surfaced" value={`${standardCount}`} />
          </div>
        </div>

        <div className="space-y-4">
          <MaterialVisual />
          <div className="grid gap-3 sm:grid-cols-2">
            {assuranceSignals.map((signal) => (
              <AssuranceItem key={signal.label} {...signal} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-stone-200 bg-white px-6 py-4 lg:px-8">
        {largestFamilies.map((material) => (
          <FamilyCoverageRow key={material.name} material={material} />
        ))}
      </div>
    </section>
  );
}

function FilterChip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`inline-flex min-h-9 items-center rounded-md border px-3 text-[13px] font-semibold ${active ? "border-stone-950 bg-stone-950 text-white" : "border-stone-200 bg-white text-stone-600"}`}>
      {children}
    </span>
  );
}

function SpecRow({ material }: { material: MaterialSignal }) {
  return (
    <div className="grid gap-4 border-b border-stone-200 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_0.55fr_1fr_0.8fr] md:items-center">
      <div>
        <p className="text-[15px] font-semibold text-stone-950">{material.name}</p>
        <p className="mt-1 text-[13px] text-stone-500">{material.examples.slice(0, 3).join(", ")}</p>
      </div>
      <p className="text-[14px] font-semibold text-stone-800">{material.gradeCount} grades</p>
      <div className="flex flex-wrap gap-2">
        {material.standards.slice(0, 3).map((standard) => (
          <SignalPill key={`${material.name}-${standard}`}>{standard}</SignalPill>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[13px] font-semibold text-emerald-700">
        <CheckCircle2 aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        Cert review path
      </div>
    </div>
  );
}

function DirectionTwo() {
  return (
    <section className="rounded-xl border border-stone-200 bg-white">
      <div className="grid lg:grid-cols-[340px_1fr]">
        <aside className="border-b border-stone-200 bg-stone-50 p-6 lg:border-b-0 lg:border-r">
          <DirectionEyebrow>Direction 02 / Spec Finder</DirectionEyebrow>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-stone-950">Find the material route first.</h2>
          <p className="mt-4 text-[14px] leading-6 text-stone-600">
            A more operational layout for buyers who arrive with a drawing note, an ASTM callout, or a no-quote material problem.
          </p>

          <div className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.14em] text-stone-500">Search</span>
              <span className="flex h-11 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 text-[14px] text-stone-400">
                <Search aria-hidden="true" className="h-4 w-4" />
                316L, AMS, PEEK, Inconel 718
              </span>
            </label>

            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-500">RFQ posture</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip active>Recurring</FilterChip>
                <FilterChip>Specialty</FilterChip>
                <FilterChip>Review required</FilterChip>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-500">Documentation</p>
              <div className="flex flex-wrap gap-2">
                <FilterChip>Mill cert</FilterChip>
                <FilterChip>ASTM</FilterChip>
                <FilterChip>AMS</FilterChip>
                <FilterChip>Traceability</FilterChip>
              </div>
            </div>
          </div>
        </aside>

        <div className="p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[13px] font-semibold text-stone-500">{quoteReadyFamilies.length} recurring families selected</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">Matched material families</h3>
            </div>
            <Link className="inline-flex h-10 w-fit items-center gap-2 rounded-lg bg-stone-950 px-4 text-[13px] font-semibold text-white" href="/requests/new">
              Start RFQ
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-stone-200">
            {materialSignals.map((material) => (
              <SpecRow key={material.name} material={material} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofStep({ detail, icon: Icon, title }: { detail: string; icon: LucideIcon; title: string }) {
  return (
    <div className="relative border-l border-stone-300 pb-8 pl-6 last:pb-0">
      <span className="absolute -left-[18px] top-0 flex h-9 w-9 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <h3 className="text-[16px] font-semibold text-stone-950">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-stone-600">{detail}</p>
    </div>
  );
}

function DirectionThree() {
  return (
    <section className="overflow-hidden rounded-xl border border-stone-200 bg-[#101010] text-white">
      <div className="grid gap-8 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
        <div>
          <DirectionEyebrow>Direction 03 / Reliability Narrative</DirectionEyebrow>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight md:text-6xl">A supply chain your buyer can defend.</h2>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-stone-300">
            This direction is more premium and boardroom-ready: less catalog-first, more assurance-first, with material depth as the proof underneath the story.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-semibold">{totalGradeCount}+</p>
              <p className="mt-1 text-[13px] leading-5 text-stone-300">grades across metals, alloys, and polymers</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-semibold">4-step</p>
              <p className="mt-1 text-[13px] leading-5 text-stone-300">material confidence path before production</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
          <MaterialVisual tone="dark" />
          <div className="rounded-lg border border-white/10 bg-white p-5 text-stone-950">
            <ProofStep detail="Identify the exact grade, standard, finish, drawing note, and substitution tolerance before quoting." icon={Search} title="Spec intake" />
            <ProofStep detail="Match the requirement to qualified material channels and the appropriate process family." icon={Layers3} title="Sourcing fit" />
            <ProofStep detail="Require certification and traceability expectations up front, not after parts are made." icon={BadgeCheck} title="Documentation" />
            <ProofStep detail="Route to partner capacity that can support both the material and manufacturing process." icon={Factory} title="Production handoff" />
          </div>
        </div>
      </div>

      <div className="grid border-t border-white/10 md:grid-cols-3">
        {largestFamilies.slice(0, 3).map((material, index) => (
          <div className="border-b border-white/10 p-6 md:border-b-0 md:border-r md:last:border-r-0" key={material.name}>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-stone-400">0{index + 1}</p>
            <h3 className="mt-3 text-xl font-semibold">{material.name}</h3>
            <p className="mt-2 text-[14px] leading-6 text-stone-300">{material.gradeCount} grades including {material.examples.slice(0, 3).join(", ")}.</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function MaterialsDesignDirectionsPage() {
  return (
    <main className="mx-auto max-w-[1440px] space-y-8">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">Materials page study</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">Three directions for proving material supply.</h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-7 text-stone-600">
            Each mockup keeps the catalog data visible, but changes the first impression from “available materials” to supply-chain credibility, sourcing confidence, and RFQ readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SignalPill tone="green">
            <Sparkles aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
            Customer-facing
          </SignalPill>
          <SignalPill tone="blue">
            <LineChart aria-hidden="true" className="mr-2 h-3.5 w-3.5" />
            Real catalog counts
          </SignalPill>
        </div>
      </header>

      <DirectionOne />
      <DirectionTwo />
      <DirectionThree />
    </main>
  );
}
