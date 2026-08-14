import Link from "next/link";
import { ArrowRight, ClipboardCheck, Diamond, Factory, FileCheck2, FileUp } from "lucide-react";

const steps = [
  {
    id: "share-your-work",
    icon: FileUp,
    title: "Send us the job",
    summary: "Give us the drawing, quantity, requirements, and delivery date.",
    description: "Share the drawing, CAD, or print; quantity; material specification; approved material-source requirements when applicable; inspection and quality requirements; and required delivery date.",
  },
  {
    id: "align-production-plan",
    icon: ClipboardCheck,
    title: "We build the supply plan",
    summary: "Confirm the viable production path before work moves forward.",
    description: "Lattice matches the work to qualified manufacturing capacity and confirms price, lead time, material requirements, the production plan, and quality requirements.",
  },
  {
    id: "production-coordination",
    icon: Factory,
    title: "We manage production",
    summary: "Keep your own floor focused on the work already committed to it.",
    description: "Lattice coordinates the supplier, tracks execution, and manages production without forcing you to reshuffle the work already committed to your own floor.",
  },
  {
    id: "review-before-shipment",
    icon: FileCheck2,
    title: "Review quality before shipment",
    summary: "Review the evidence before parts leave the supplier.",
    description: "Inspection reports, material certifications, and required quality documentation are available for review before parts leave the supplier.",
  },
];

function BrandMark() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-950 text-white shadow-sm" aria-hidden="true">
        <Diamond className="fill-white" size={13} />
      </span>
      <span className="text-xl font-semibold tracking-[-0.025em] text-stone-950">Lattice</span>
    </span>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] font-sans text-slate-950 selection:bg-slate-200">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-[#fbfaf7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-6 lg:px-10">
          <Link className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link className="rounded-md text-sm font-medium text-slate-700 transition hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4 sm:text-[15px]" href="/login">
              Log in
            </Link>
            <Link className="rounded-lg bg-stone-950 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:px-5" href="/waiting-list">
              <span className="sm:hidden">Talk to us</span>
              <span className="hidden sm:inline">Talk to us about your backlog</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1180px] px-6 pb-16 pt-10 sm:px-10 sm:pt-14 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,740px)_190px] lg:justify-center lg:gap-20">
          <article className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400">
              <Link className="transition hover:text-slate-700" href="/">Lattice</Link>
              <span aria-hidden="true">/</span>
              <span>How it works</span>
            </nav>

            <header className="mt-9 border-b border-slate-200 pb-8">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
                <ClipboardCheck aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[44px]">How Lattice works</h1>
              <p className="mt-4 max-w-[680px] text-[16px] leading-7 text-slate-600">
                Lattice gives domestic manufacturers access to qualified global production capacity, helping shops fulfill overflow demand while keeping their customer relationships and existing production schedules intact.
              </p>
              <p className="mt-5 text-sm text-slate-400">Lattice workflow overview &middot; Invite-only access</p>
            </header>

            <section aria-labelledby="problem-heading" className="scroll-mt-24 border-b border-slate-200 py-10" id="problem">
              <header className="border-b border-slate-200 pb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">01 &middot; The problem</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950" id="problem-heading">Demand is growing faster than shop capacity.</h2>
              </header>

              <section aria-labelledby="the-problem" className="scroll-mt-24 border-b border-slate-200 py-7">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950" id="the-problem">More customer demand. Not enough productive capacity.</h3>
                <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-600">
                  <p>
                    When a job cannot fit the schedule or available capacity, the choices are difficult: extend the lead time, raise the price, disrupt committed work, or send a customer to the competition.
                  </p>
                  <p>
                    Adding capacity is not simple. Skilled machinists are difficult to hire, new employees take time to train, and new machines, automation, and floor space require significant capital and ramp time.
                  </p>
                  <p className="text-[15px] font-semibold leading-7 text-slate-700">Demand exists. Customers are ready to buy. But the capacity to fulfill that demand does not.</p>
                </div>
              </section>

              <section aria-labelledby="available-capacity" className="scroll-mt-24 pt-7">
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-slate-950" id="available-capacity">Global capacity exists. Making it trustworthy is the hard part.</h3>
                <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-600">
                  <p>
                    Finding a supplier is only the first step. Knowing whether it can consistently meet your drawings, material requirements, quality standards, and delivery commitments requires qualification.
                  </p>
                  <p>
                    Lattice handles the work required to make global capacity usable: supplier qualification, process validation, material coordination, production oversight, quality documentation, and delivery.
                  </p>
                  <p className="text-[15px] font-semibold leading-7 text-slate-700">You get access to additional capacity without having to build and manage an overseas supply chain yourself.</p>
                </div>
              </section>
            </section>

            <section aria-labelledby="solution-heading" className="scroll-mt-24 py-10" id="solution">
              <header className="border-b border-slate-200 pb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">02 &middot; The solution</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950" id="solution-heading">Add capacity without building it yourself.</h2>
                <p className="mt-4 text-[15px] leading-7 text-slate-600">
                  Lattice gives manufacturers another production path when internal capacity is constrained. We coordinate qualified suppliers, material requirements, quality documentation, production, logistics, and delivery so your team can stay focused on the work that belongs on your own floor.
                </p>
              </header>

              <section aria-labelledby="starting-work" className="scroll-mt-24 pt-8" id="start-with">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">A practical first job</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="starting-work">Start with predictable, lower-risk overflow work.</h3>
                <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-600">
                  <p>Repeat production, stable drawings, sufficient lead time, clear material requirements, and objective inspection criteria are strong starting points.</p>
                  <p>Use Lattice to free your internal team for the complex, urgent, and high-value work that belongs on your floor.</p>
                </div>
              </section>

              <section aria-labelledby="workflow-steps" className="border-t border-slate-200 pt-8">
                <h3 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="workflow-steps">How the workflow works</h3>
                <div className="mt-2 divide-y divide-slate-200">
                  {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <section className="scroll-mt-24 py-7" id={step.id} key={step.id}>
                        <div className="flex items-start gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600"><Icon aria-hidden="true" size={19} strokeWidth={1.7} /></span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Step {index + 1}</p>
                            <h4 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[21px]">{step.title}</h4>
                            <p className="mt-2 text-[15px] font-medium leading-6 text-slate-500">{step.summary}</p>
                            <p className="mt-3 text-[15px] leading-7 text-slate-600">{step.description}</p>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="value-heading" className="scroll-mt-24 border-t border-slate-200 pt-8" id="value">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">What Lattice adds</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="value-heading">Capacity without the fixed expansion.</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["More capacity", "Accept work your current floor cannot support."],
                    ["Less fixed expansion", "Avoid scaling headcount, equipment, and floor space in lockstep with demand."],
                    ["Managed quality", "Coordinate production and documentation against your requirements."],
                    ["One accountable partner", "Use Lattice instead of building and managing an overseas supply chain yourself."],
                  ].map(([title, description]) => (
                    <section className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4" key={title}>
                      <h4 className="text-[15px] font-semibold text-slate-900">{title}</h4>
                      <p className="mt-1 text-[14px] leading-6 text-slate-600">{description}</p>
                    </section>
                  ))}
                </div>
              </section>
            </section>

            <section aria-labelledby="why-lattice-heading" className="mt-8 border-t border-slate-200 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Why Lattice exists</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="why-lattice-heading">Global manufacturing shouldn&apos;t require building a global supply chain.</h3>
              <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  For many parts, domestic capacity cannot consistently meet the price, lead-time, or process requirements customers face. But accessing qualified overseas production has traditionally meant building supplier relationships from scratch—conducting factory audits, validating processes, managing quality, and navigating communication and logistics across borders.
                </p>
                <p>
                  Lattice was built by a team that learned this firsthand while sourcing critical components for high-temperature ammonia reforming systems. We built the overseas production network, validated the suppliers, and developed the operating discipline required to make it dependable.
                </p>
                <p>
                  Lattice gives manufacturers access to that hard-won capacity—without requiring them to build an international supply chain from scratch.
                </p>
              </div>
            </section>

            <aside className="mt-8 border-l-2 border-[#1d73ff] bg-slate-50 px-5 py-5">
              <p className="text-lg font-semibold tracking-[-0.02em] text-slate-950">Have work you can&apos;t fit on the floor?</p>
              <p className="mt-2 text-[14px] leading-6 text-slate-600">Talk with Lattice about the backlog or overflow work you need to evaluate. Lattice is invite-only; we&apos;ll help determine whether the network fits your requirements.</p>
              <Link className="mt-4 inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2" href="/waiting-list">
                Talk to us about your backlog
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </aside>

          </article>

          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24 border-l border-slate-200 pl-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">On this page</p>
              <div className="mt-4 space-y-3 text-sm leading-5">
                <a className="block font-semibold text-slate-700 transition hover:text-slate-950" href="#problem">The problem</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#the-problem">Demand pressure</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#available-capacity">Global capacity</a>
                <a className="block pt-2 font-semibold text-slate-700 transition hover:text-slate-950" href="#solution">The solution</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#start-with">Good first job</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#share-your-work">Send us the job</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#align-production-plan">Build the supply plan</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#production-coordination">Manage production</a>
                <a className="block pl-3 text-slate-500 transition hover:text-slate-950" href="#review-before-shipment">Quality review</a>
                <a className="block pt-2 font-semibold text-slate-700 transition hover:text-slate-950" href="#value">Capacity without fixed expansion</a>
              </div>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}
