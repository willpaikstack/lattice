import Link from "next/link";
import { ArrowRight, FileText, Network, Package } from "lucide-react";
import { PublicHeader, TechnicalBackground } from "@/components/public-entry";

const landingFeatures = [
  {
    copy: "Submit drawing packages with specifications and receive supplier quotes in a unified workspace.",
    icon: FileText,
    title: "CAD-backed RFQs",
  },
  {
    copy: "Access 200+ production machines across vetted partners, including CNC mills, CNC lathes, manual machines, and sheet metal equipment.",
    icon: Network,
    title: "Vetted supplier network",
  },
  {
    copy: "Track raw material procurement, fabrication steps, and QC documentation through final-part delivery.",
    icon: Package,
    title: "Full part traceability",
  },
];

const landingSteps = [
  ["1", "Upload manufacturing data package"],
  ["2", "Match your order with compatible equipment"],
  ["3", "Track fabrication progress"],
  ["4", "Coordinate final delivery"],
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-4xl space-y-12 text-center">
            <div className="space-y-6">
              <h1 className="text-6xl font-semibold leading-tight tracking-normal text-white lg:text-7xl">Lattice OS</h1>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-stone-300 lg:text-2xl">
                Access excess manufacturing capacity for higher throughput at lower risk.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                className="group flex min-w-[200px] items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 font-semibold text-stone-900 shadow-lg transition-all hover:bg-stone-100 hover:shadow-xl"
                href="/login"
              >
                Log in
                <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={18} />
              </Link>
              <Link
                className="flex min-w-[200px] items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                href="/waiting-list"
              >
                Request access
              </Link>
              <Link
                className="flex min-w-[220px] items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                href="/simple-quote"
              >
                Request a simple quote
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3">
              {landingFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm" key={feature.title}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                      <Icon className="text-white" size={20} />
                    </div>
                    <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
                    <p className="text-sm leading-relaxed text-stone-400">{feature.copy}</p>
                  </article>
                );
              })}
            </div>

            <div className="pt-12">
              <div className="inline-flex flex-col items-start gap-4 rounded-xl border border-white/10 bg-white/5 px-8 py-6 backdrop-blur-sm sm:flex-row sm:items-center sm:gap-6">
                {landingSteps.map(([step, label]) => (
                  <div className="flex items-center gap-3" key={label}>
                    <div className="flex aspect-square h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">{step}</div>
                    <span className="text-sm font-medium text-stone-300">{label}</span>
                    <div className="hidden h-px w-8 bg-white/20 sm:block" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <TechnicalBackground />
      </section>
    </main>
  );
}
