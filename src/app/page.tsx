import Link from "next/link";
import { ArrowRight, FileText, Network, Package } from "lucide-react";

function PublicHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <Link className="flex w-fit items-center gap-3" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 shadow-sm">
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2L14 8L8 14L2 8L8 2Z" fill="white" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-normal text-stone-900">Lattice</span>
        </Link>
      </div>
    </header>
  );
}

function TechnicalBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:100px_100px]" />

      <div className="absolute inset-0 opacity-[0.15]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.15) 60px,
              rgba(255,255,255,0.15) 61px
            )`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.15) 60px,
              rgba(255,255,255,0.15) 61px
            )`,
          }}
        />
      </div>

      <div className="absolute left-1/4 top-1/4 h-32 w-32 opacity-10">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      </div>

      <div className="absolute right-1/4 top-2/3 h-24 w-24 opacity-10">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      </div>

      <div className="absolute bottom-1/4 left-1/3 h-40 w-40 opacity-5">
        <div className="absolute inset-0 rounded-full border-2 border-white" />
        <div className="absolute inset-4 rounded-full border border-white" />
        <div className="absolute inset-8 rounded-full border border-white" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-800/40 to-stone-900/60" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-stone-800/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export default function LandingPage() {
  const features = [
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

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-4xl space-y-12 text-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <span className="text-xs font-medium uppercase tracking-wider text-white">Invite-only manufacturing procurement</span>
              </div>

              <h1 className="text-6xl font-semibold leading-tight tracking-normal text-white lg:text-7xl">Lattice</h1>

              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-stone-300 lg:text-2xl">
                Access overseas manufacturing capacity for higher throughput at lower risk.
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
            </div>

            <div className="grid grid-cols-1 gap-6 pt-12 md:grid-cols-3">
              {features.map((feature) => {
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
                {[
                  ["1", "Upload manufacturing data package"],
                  ["2", "Match your order with compatible equipment"],
                  ["3", "Track fabrication progress"],
                  ["4", "Coordinate final delivery"],
                ].map(([step, label]) => (
                  <div className="flex items-center gap-3" key={label}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold text-white">{step}</div>
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
