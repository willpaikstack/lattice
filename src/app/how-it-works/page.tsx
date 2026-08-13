import Link from "next/link";
import { ArrowRight, ClipboardCheck, Diamond, Factory, FileCheck2, FileUp } from "lucide-react";

import { TechnicalBackground } from "@/components/public-entry";

const steps = [
  {
    icon: FileUp,
    number: "01",
    title: "Share the work that needs coverage",
    body: "After your account is approved, upload the files, quantities, material requirements, and timing that matter to your customer.",
  },
  {
    icon: ClipboardCheck,
    number: "02",
    title: "Align on the production plan",
    body: "Lattice reviews the request, coordinates qualified capacity, and returns a quote with the details needed to protect your schedule.",
  },
  {
    icon: Factory,
    number: "03",
    title: "Keep production moving",
    body: "We manage production coordination and updates while your team stays focused on the work already on your floor.",
  },
  {
    icon: FileCheck2,
    number: "04",
    title: "Review before shipment",
    body: "Requested inspection reports and material documentation are uploaded to Lattice for your review before the order ships.",
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
    <main className="min-h-screen bg-[#171817] font-sans text-white selection:bg-stone-300 selection:text-stone-950">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f7f6f3]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
          <Link className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link className="hidden rounded-md text-[15px] font-medium text-stone-800 transition hover:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 sm:block" href="/login">
              Log in
            </Link>
            <Link className="rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:px-5" href="/waiting-list">
              Request an account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <TechnicalBackground />
        <div className="relative z-10 mx-auto max-w-[1120px]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">The Lattice workflow</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
            How Lattice extends your capacity.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-stone-300 sm:text-xl">
            When the schedule gets tight, Lattice helps your shop cover qualified CNC machining and fabrication work without disrupting the commitments already in motion.
          </p>
        </div>
      </section>

      <section className="bg-[#f7f6f3] px-6 py-16 text-stone-950 sm:px-10 lg:px-16 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">A managed handoff</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">From overflow to delivery, in four clear steps.</h2>
          </div>
          <ol className="mt-14 grid gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 md:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <li className="min-h-[270px] bg-[#f7f6f3] p-7 sm:p-9" key={step.number}>
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-stone-950 text-white"><Icon size={21} strokeWidth={1.7} /></span>
                    <span className="font-mono text-sm text-stone-400">{step.number}</span>
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-3 max-w-md text-base leading-7 text-stone-600">{step.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#1b1c1b] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Built to protect the work you already have</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] text-white">More room to say yes—without losing control.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="border-l border-white/20 pl-5">
              <h3 className="font-semibold text-white">Your customer relationships</h3>
              <p className="mt-2 leading-7 text-stone-400">Use Lattice to support the timelines and commitments your shop owns.</p>
            </div>
            <div className="border-l border-white/20 pl-5">
              <h3 className="font-semibold text-white">Your operating rhythm</h3>
              <p className="mt-2 leading-7 text-stone-400">Add capacity for spikes and cyclical demand without overloading the team or shop floor.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#171817] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Invite-only platform</p>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-5xl">See whether Lattice is a fit for your shop.</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-stone-300">Request an account to discuss the work, capacity requirements, and support your team needs.</p>
          <Link className="mt-9 inline-flex min-h-14 items-center gap-3 rounded-lg bg-white px-7 text-base font-semibold text-stone-950 transition hover:bg-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950" href="/waiting-list">
            Request an account <ArrowRight size={19} />
          </Link>
        </div>
      </section>
    </main>
  );
}
