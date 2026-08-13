import Link from "next/link";
import { ArrowRight, ClipboardCheck, Diamond, Factory, FileCheck2, FileUp, Info } from "lucide-react";

const steps = [
  {
    id: "share-your-work",
    icon: FileUp,
    title: "Share the work that needs coverage",
    summary: "Start with the files, quantities, material requirements, and timing that matter to your customer.",
    description: "After your account is approved, bring in the work your shop needs help covering. Lattice uses the request details to understand the process, specifications, quality requirements, and delivery window before coordinating production capacity.",
  },
  {
    id: "align-production-plan",
    icon: ClipboardCheck,
    title: "Align on the production plan",
    summary: "Review a clear quote before any work moves forward.",
    description: "Lattice reviews the request, coordinates qualified CNC machining and fabrication capacity, and returns the quote details needed to protect your schedule. The final plan reflects the scope, lead time, documentation, and delivery requirements for the job.",
  },
  {
    id: "production-coordination",
    icon: Factory,
    title: "Keep production moving",
    summary: "Use additional capacity without disrupting the commitments already on your floor.",
    description: "Once the plan is approved, Lattice coordinates production and provides updates while your team stays focused on the work already in motion. This gives your shop a way to respond to overflow and cyclical demand without overloading its operating rhythm.",
  },
  {
    id: "review-before-shipment",
    icon: FileCheck2,
    title: "Review before shipment",
    summary: "See requested quality evidence before the order ships.",
    description: "Requested inspection reports and material documentation are uploaded to Lattice for your review before shipment. This keeps the quality requirements visible through the handoff and supports confident communication with your customer.",
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
            <Link className="hidden rounded-md text-[15px] font-medium text-slate-700 transition hover:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4 sm:block" href="/login">
              Log in
            </Link>
            <Link className="rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:px-5" href="/waiting-list">
              Request an account
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
                Lattice connects domestic machine shops facing sustained demand with qualified overseas manufacturing capacity&mdash;without disrupting the commitments already on the schedule.
              </p>
              <p className="mt-5 text-sm text-slate-400">Lattice workflow overview &middot; Invite-only access</p>
            </header>

            <section aria-labelledby="the-problem" className="border-b border-slate-200 py-8">
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="the-problem">Demand is growing faster than shop capacity.</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  Domestic manufacturers are seeing sustained demand from growing industrial sectors. Capable machine shops can have full sales pipelines, but hiring skilled machinists takes time and adding machines does not immediately create the people or flexibility needed to run them.
                </p>
                <p>
                  When a job cannot fit the schedule, the choices are difficult: extend the lead time, raise the price, disrupt committed work, or send a customer to the competition. Lattice was built to give shops another option.
                </p>
              </div>
            </section>

            <section aria-labelledby="available-capacity" className="border-b border-slate-200 py-8">
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="available-capacity">Capable capacity exists, but access requires confidence.</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  Large overseas production facilities can have skilled operators and machines available even when their overall utilization is high. Their challenge is reaching domestic work that matches their capability and production windows.
                </p>
                <p>
                  For a domestic shop, using overseas capacity requires more than finding a supplier. It requires confidence in the facility, material controls, quality process, and production coordination behind the work.
                </p>
              </div>
            </section>

            <section aria-labelledby="what-lattice-solves" className="border-b border-slate-200 py-8">
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="what-lattice-solves">Lattice bridges the gap.</h2>
              <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  Lattice gives domestic machine shops a managed way to extend capacity through a vetted, qualified manufacturing network. We coordinate production, requested documentation, and delivery so shops can protect their customer relationships and stay responsive when demand exceeds what their floor can support.
                </p>
              </div>
            </section>

            <section aria-labelledby="workflow-steps" className="mt-8">
              <h2 className="text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="workflow-steps">The workflow</h2>
              <div className="mt-2 divide-y divide-slate-200">
                {steps.map((step, index) => {
                  const Icon = step.icon;

                  return (
                    <section className="scroll-mt-24 py-7" id={step.id} key={step.id}>
                      <div className="flex items-start gap-4">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600"><Icon aria-hidden="true" size={19} strokeWidth={1.7} /></span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Step {index + 1}</p>
                          <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[21px]">{step.title}</h3>
                          <p className="mt-2 text-[15px] font-medium leading-6 text-slate-500">{step.summary}</p>
                          <p className="mt-3 text-[15px] leading-7 text-slate-600">{step.description}</p>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </section>

            <aside className="mt-8 flex gap-3 border-l-2 border-[#1d73ff] bg-slate-50 px-4 py-4 text-[14px] leading-6 text-slate-600">
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#1d73ff]" />
              <p><strong className="font-semibold text-slate-800">Lattice is invite-only.</strong> Request an account to discuss your shop&apos;s capacity needs and whether the network is a fit for the work you want to support.</p>
            </aside>

            <Link className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950" href="/waiting-list">
              Request an account
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </article>

          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24 border-l border-slate-200 pl-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">On this page</p>
              <div className="mt-4 space-y-3 text-sm leading-5">
                <a className="block text-slate-500 transition hover:text-slate-950" href="#the-problem">The problem</a>
                <a className="block text-slate-500 transition hover:text-slate-950" href="#available-capacity">Available capacity</a>
                <a className="block text-slate-500 transition hover:text-slate-950" href="#what-lattice-solves">What Lattice solves</a>
                <a className="block text-slate-500 transition hover:text-slate-950" href="#share-your-work">Share your work</a>
                <a className="block text-slate-500 transition hover:text-slate-950" href="#align-production-plan">Production plan</a>
                <a className="block text-slate-500 transition hover:text-slate-950" href="#production-coordination">Production coordination</a>
                <a className="block text-slate-500 transition hover:text-slate-950" href="#review-before-shipment">Review before shipment</a>
              </div>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}
