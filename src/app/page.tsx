import Image from "next/image";
import Link from "next/link";
import { BarChart3, ClipboardCheck, FileSearch } from "lucide-react";

import { TechnicalBackground } from "@/components/public-entry";
import { PublicSiteHeader } from "@/components/public-site-header";

const managedProof = [
  { icon: FileSearch, label: "Engineer-reviewed RFQs" },
  { icon: ClipboardCheck, label: "Inspection plan included" },
  { icon: BarChart3, label: "Production updates" },
];

const workflowSteps = ["Upload files", "Review your quote", "Track production"];

const partnerNetworkIndustries = [
  "Automotive & mobility",
  "Medical technology",
  "Aerospace",
  "Robotics & automation",
  "Semiconductors",
  "Energy systems",
  "Industrial equipment",
  "Consumer products",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#171817] font-sans text-white selection:bg-stone-300 selection:text-stone-950">
      <PublicSiteHeader />

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
                Access Lattice&apos;s qualified global CNC machining and fabrication network for overflow and cyclical demand—without disrupting your schedule. We coordinate production, documentation, and delivery so you can protect lead times and stay responsive to customers.
              </p>
              <Link className="mt-7 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-white transition hover:text-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-stone-950" href="/how-it-works">
                See how Lattice delivers <span aria-hidden="true">→</span>
              </Link>

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

      <section aria-labelledby="partner-network-heading" className="border-b border-stone-200 bg-[#f7f6f3] text-stone-950">
        <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-10 lg:px-[72px] lg:py-20">
          <div className="max-w-[680px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Partner-network experience</p>
            <h2 className="mt-4 text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[44px]" id="partner-network-heading">
              Capability across demanding industries.
            </h2>
            <p className="mt-5 max-w-[620px] text-lg leading-8 text-stone-600">
              Documented partner capabilities span the industries where precision production, material control, and dependable execution matter most.
            </p>
          </div>

          <ul aria-label="Industries represented by documented partner capabilities" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {partnerNetworkIndustries.map((industry) => (
              <li className="flex min-h-20 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-center text-sm font-semibold leading-5 text-stone-700 shadow-sm" key={industry}>
                {industry}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-sm leading-6 text-stone-500">
            Industry coverage reflects public supplier capability information. Production fit and availability are confirmed for each job.
          </p>
        </div>
      </section>

      <section className="overflow-hidden bg-[#171817]" id="how-it-works">
        <div className="mx-auto grid max-w-[1440px] items-stretch lg:grid-cols-[0.39fr_0.61fr]">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:py-14 lg:pl-[72px] lg:pr-6">
            <h2 className="text-[38px] font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-[44px]">
              Quality you can verify.
            </h2>
            <p className="mt-5 max-w-[420px] text-lg leading-8 text-stone-300">
              Requested inspection reports and material documentation are uploaded to Lattice for your review before shipment.
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
