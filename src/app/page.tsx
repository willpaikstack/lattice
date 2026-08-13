import Image from "next/image";
import Link from "next/link";
import { BarChart3, ClipboardCheck, Diamond, FileSearch } from "lucide-react";

import { TechnicalBackground } from "@/components/public-entry";

const managedProof = [
  { icon: FileSearch, label: "Engineer-reviewed RFQs" },
  { icon: ClipboardCheck, label: "Inspection plan included" },
  { icon: BarChart3, label: "Production updates" },
];

const workflowSteps = ["Upload files", "Review your quote", "Track production"];

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
      <span className={`flex items-center justify-center rounded-lg bg-stone-950 text-white shadow-sm ${compact ? "h-8 w-8" : "h-9 w-9"}`} aria-hidden="true">
        <Diamond className="fill-white" size={compact ? 11 : 13} />
      </span>
      <span className={`${compact ? "text-lg" : "text-xl"} font-semibold tracking-[-0.025em] text-stone-950`}>Lattice</span>
    </span>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200 bg-[#f7f6f3]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <Link className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2" href="/">
          <BrandMark />
        </Link>

        <nav aria-label="Public navigation" className="hidden items-center gap-10 text-[15px] font-medium text-stone-800 md:flex">
          <button className="cursor-not-allowed rounded-md opacity-70" disabled type="button">
            Capabilities
          </button>
          <button className="cursor-not-allowed rounded-md opacity-70" disabled type="button">
            Materials
          </button>
          <button className="cursor-not-allowed rounded-md opacity-70" disabled type="button">
            Quality
          </button>
          <button className="cursor-not-allowed rounded-md opacity-70" disabled type="button">
            How it works
          </button>
        </nav>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link className="hidden rounded-md text-[15px] font-medium text-stone-800 transition hover:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 sm:block" href="/login">
            Log in
          </Link>
          <Link className="rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 sm:px-5" href="/simple-quote">
            Get a quote
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#171817] font-sans text-white selection:bg-stone-300 selection:text-stone-950">
      <LandingHeader />

      <section className="relative overflow-hidden border-b border-white/10 bg-[#171817]">
        <TechnicalBackground />
        <div className="relative z-10 mx-auto grid min-h-[545px] max-w-[1440px] lg:grid-cols-[57%_43%]">
          <div className="relative z-20 flex items-center px-6 py-16 sm:px-10 lg:translate-y-9 lg:py-14 lg:pl-[96px] lg:pr-0">
            <div className="max-w-[700px]">
              <h1 className="text-[48px] font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-[58px]">
                <span className="block">Additional capacity</span>{" "}
                <span className="block">when you need it.</span>
              </h1>
              <p className="mt-7 max-w-[580px] text-lg leading-8 text-stone-300 sm:text-xl">
                Access Lattice&apos;s global network of qualified CNC machining and fabrication partners to help manage overflow and cyclical demand—without disrupting the commitments already on your schedule. We coordinate production, documentation, and delivery so you can protect lead times and stay responsive to customers.
              </p>

              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row">
                <Link className="inline-flex min-h-14 items-center justify-center rounded-lg border border-white/30 px-7 text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950" href="/capabilities">
                  Explore capabilities
                </Link>
              </div>

            </div>
          </div>

          <div className="relative min-h-[430px] overflow-hidden lg:-ml-[100px] lg:min-h-[545px] lg:w-[calc(100%+100px)]">
            <Image
              alt="Precision-machined aluminum housing fixtured inside a CNC machining center"
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              src="/landing/manufacturing-proof-cnc.png"
            />
            <div aria-hidden="true" className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#171817] to-transparent lg:w-32" />
          </div>
        </div>
      </section>

      <section aria-label="What Lattice manages" className="border-b border-white/10 bg-[#1b1c1b]">
        <ul className="mx-auto grid max-w-[1440px] md:grid-cols-3">
          {managedProof.map((point, index) => {
            const Icon = point.icon;

            return (
              <li className={`flex min-h-[82px] items-center gap-5 px-7 py-5 lg:px-14 ${index > 0 ? "border-t border-white/10 md:border-l md:border-t-0" : ""}`} key={point.label}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-stone-200">
                  <Icon size={23} strokeWidth={1.6} />
                </span>
                <span className="text-base font-medium text-stone-200">{point.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="overflow-hidden bg-[#171817]" id="how-it-works">
        <div className="mx-auto grid max-w-[1440px] items-stretch lg:grid-cols-[0.39fr_0.61fr]">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:py-14 lg:pl-[72px] lg:pr-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Quality you can verify</p>
            <h2 className="mt-5 text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              Quality you can verify.
            </h2>
            <p className="mt-5 max-w-[420px] text-lg leading-8 text-stone-300">
              Inspection reports and material documentation stay with every order.
            </p>

            <ol className="mt-9 grid grid-cols-3 gap-3" aria-label="Lattice order workflow">
              {workflowSteps.map((step, index) => (
                <li className="relative min-w-0" key={step}>
                  <div className="flex items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-stone-500 text-sm font-medium text-white">{index + 1}</span>
                    {index < workflowSteps.length - 1 ? <span aria-hidden="true" className="h-px flex-1 bg-stone-600" /> : null}
                  </div>
                  <p className="mt-3 pr-2 text-xs leading-5 text-stone-300 sm:text-sm">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative min-h-[360px] bg-[#f5f4f1] lg:min-h-[420px]">
            <Image
              alt="Example Lattice dimensional inspection report and engineering drawing"
              className="object-cover object-left"
              fill
              sizes="(max-width: 1024px) 100vw, 61vw"
              src="/landing/manufacturing-proof-inspection-report.png"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
