import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, FileCheck2, FileText, Handshake, Route } from "lucide-react";

import { PublicSiteHeader } from "@/components/public-site-header";
import { vendorEquipment } from "@/lib/vendor-equipment";

import { ValueBenefits } from "./value-benefits";

function listedEquipmentQuantity(quantity: string) {
  const match = quantity.match(/[\d,]+/);
  return match ? Number.parseInt(match[0].replaceAll(",", ""), 10) : 0;
}

const cncEquipment = vendorEquipment.filter((equipment) => equipment.section === "CNC Milling" || equipment.section === "CNC Lathe");
const inspectionEquipment = vendorEquipment.filter((equipment) => equipment.section === "QC & Inspection");
const networkStatistics = {
  cncFiveAxisMachines: cncEquipment
    .filter((equipment) => equipment.name.toLowerCase().includes("5-axis"))
    .reduce((total, equipment) => total + listedEquipmentQuantity(equipment.quantity), 0),
  cncMachines: cncEquipment.reduce((total, equipment) => total + listedEquipmentQuantity(equipment.quantity), 0),
  cncMillingMachines: cncEquipment
    .filter((equipment) => equipment.section === "CNC Milling")
    .reduce((total, equipment) => total + listedEquipmentQuantity(equipment.quantity), 0),
  cncTurningMachines: cncEquipment
    .filter((equipment) => equipment.section === "CNC Lathe")
    .reduce((total, equipment) => total + listedEquipmentQuantity(equipment.quantity), 0),
  cmmMachines: inspectionEquipment
    .filter((equipment) => equipment.name.toLowerCase().includes("coordinate measuring") || equipment.name.toLowerCase().includes("cmm"))
    .reduce((total, equipment) => total + listedEquipmentQuantity(equipment.quantity), 0),
  equipmentCategories: new Set(vendorEquipment.map((equipment) => equipment.section)).size,
  equipmentRecords: vendorEquipment.length,
  inspectionRecords: inspectionEquipment.length,
};

const networkLocations = [
  { city: "Shenzhen", left: "63.2%", top: "81.4%" },
  { city: "Dongguan", left: "62.6%", top: "79.9%" },
  { city: "Beijing", left: "75.3%", top: "35.4%" },
  { city: "Shanghai", left: "73%", top: "59.7%" },
  { city: "Tianjin", left: "76.1%", top: "37.1%" },
] as const;

const steps = [
  {
    id: "share-your-work",
    icon: FileText,
    markerPosition: "10%",
    title: "Submit a complete manufacturing package",
    description: "Upload CAD, drawings, quantities, material and finish requirements, tolerances, requested inspection or certification documentation, and target delivery date. Each part stays tied to its own requirements—so a multi-part RFQ can be managed as one project without losing technical specificity.",
  },
  {
    id: "align-production-plan",
    icon: ClipboardCheck,
    markerPosition: "36%",
    title: "We validate the production path",
    description: "We confirm manufacturability, requirements completeness, viable production options, expected lead time, quality-documentation needs, and commercial assumptions. Then we build a supplier-backed quote—not an automated estimate.",
  },
  {
    id: "production-coordination",
    icon: Handshake,
    markerPosition: "62%",
    title: "Approve the quote and launch production",
    description: "Once you approve, Lattice coordinates the selected supplier, tracks execution against the agreed plan, and gives you a clear record of the order from release through delivery.",
  },
  {
    id: "review-before-shipment",
    icon: FileCheck2,
    markerPosition: "88%",
    title: "Review quality before shipment",
    description: "Inspection reports, material certifications, and other required quality documentation are attached to the order and available for review before shipment. If requested, shipment will be held until the substantiation documents are approved.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#fbfaf7] font-sans text-slate-950 selection:bg-slate-200">
      <PublicSiteHeader />

      <div className="mx-auto w-full max-w-[1320px] px-6 pb-16 pt-10 sm:px-10 sm:pt-14 lg:px-10">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_190px] xl:gap-12">
          <article className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-400">
              <Link className="transition hover:text-slate-700" href="/">Lattice</Link>
              <span aria-hidden="true">/</span>
              <span>How it works</span>
            </nav>

            <header className="mt-9 border-b border-slate-200 pb-8">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
                <Route aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-[44px]">How Lattice works</h1>
              <p className="mt-4 text-[16px] leading-7 text-slate-600">
                Lattice gives domestic manufacturers access to qualified global production capacity, helping shops fulfill overflow demand while keeping their customer relationships and existing production schedules intact.
              </p>
              <p className="mt-5 text-sm text-slate-400">Lattice workflow overview &middot; Invite-only access</p>
            </header>

            <section aria-labelledby="problem-heading" className="scroll-mt-24 border-b border-slate-200 py-10" id="problem">
              <header className="border-b border-slate-200 pb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">01 &middot; The problem</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-950" id="problem-heading">Demand is growing faster than shop capacity.</h2>
              </header>

              <div className="md:grid md:grid-cols-2 md:divide-x md:divide-slate-200">
                <section aria-labelledby="the-problem" className="scroll-mt-24 border-b border-slate-200 py-7 md:border-b-0 md:pr-8">
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

                <section aria-labelledby="available-capacity" className="scroll-mt-24 pt-7 md:pl-8 md:pt-7">
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
              </div>
            </section>

            <section aria-labelledby="solution-heading" className="scroll-mt-24 py-10" id="solution">
              <div className="md:grid md:grid-cols-2 md:divide-x md:divide-slate-200">
                <header className="border-b border-slate-200 pb-7 md:border-b-0 md:pr-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">02 &middot; The solution</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="solution-heading">Add capacity without building it yourself.</h2>
                  <p className="mt-4 text-[15px] leading-7 text-slate-600">
                    Lattice gives manufacturers another production path when internal capacity is constrained. We coordinate qualified suppliers, material requirements, quality documentation, production, logistics, and delivery so your team can stay focused on the work that belongs on your own floor.
                  </p>
                </header>

                <section aria-labelledby="starting-work" className="scroll-mt-24 pt-8 md:pl-8 md:pt-0" id="start-with">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">A practical first job</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="starting-work">Where to start with Lattice</h3>
                  <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-600">
                    <p>Repeat production, stable drawings, sufficient lead time, clear material requirements, and objective inspection criteria are strong starting points.</p>
                    <p>Use Lattice to free your internal team for the complex, urgent, and high-value work that belongs on your floor.</p>
                  </div>
                </section>
              </div>

              <section aria-labelledby="workflow-steps" className="border-t border-slate-200 pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400" id="workflow-steps">How Lattice delivers</p>

                <div aria-hidden="true" className="relative mt-9 hidden h-[100px] lg:block">
                  <Image
                    alt=""
                    className="absolute inset-x-0 top-0 h-[100px] w-full object-fill"
                    height={724}
                    loading="eager"
                    src="/how-it-works/workflow-path.png"
                    width={2172}
                  />
                  {steps.map((step, index) => (
                    <span
                      className="absolute top-[21px] flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-slate-500 bg-[#fbfaf7] text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                      key={step.id}
                      style={{ left: step.markerPosition }}
                    >
                      {index + 1}
                    </span>
                  ))}
                </div>

                <div className="mt-2 divide-y divide-slate-200 lg:mt-1 lg:grid lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                  {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                      <section className="scroll-mt-24 py-7 lg:px-5 lg:py-2 lg:text-center lg:first:pl-0 lg:last:pr-0" id={step.id} key={step.id}>
                        <div className="flex items-start gap-4 lg:block">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-700 lg:mx-auto lg:h-12 lg:w-12">
                            <Icon aria-hidden="true" className="h-6 w-6 lg:h-7 lg:w-7" strokeWidth={1.55} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 lg:hidden">Step {index + 1}</p>
                            <h4 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950 sm:text-[21px] lg:mt-4 lg:text-[18px] lg:leading-6">{step.title}</h4>
                            <p className="mt-3 text-[15px] leading-7 text-slate-600 lg:text-sm lg:leading-6">{step.description}</p>
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="value-heading" className="scroll-mt-24 border-t border-slate-200 pt-8" id="value">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">What Lattice adds</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="value-heading">More capacity. Less infrastructure to manage.</h3>
                <ValueBenefits statistics={networkStatistics} />

                <section aria-labelledby="network-heading" className="mt-8 grid gap-7 border-t border-slate-200 pt-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-10" id="network">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Network reach</p>
                    <h4 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="network-heading">Qualified manufacturing capacity across China.</h4>
                    <p className="mt-3 text-[15px] leading-7 text-slate-600">China&apos;s manufacturing base combines dense industrial clusters with deep specialization across machining, materials, finishing, and inspection. Lattice qualifies capability across the region, then matches the right production path to the technical and commercial requirements of each job.</p>
                  </div>
                  <figure className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <div className="relative">
                      <Image
                        alt="Map of China showing Lattice network cities"
                        className="h-auto w-full"
                        height={1024}
                        loading="eager"
                        sizes="(min-width: 1024px) 55vw, 100vw"
                        src="/how-it-works/china-network-map-base.png"
                        unoptimized
                        width={1536}
                      />
                      <div aria-hidden="true" className="absolute inset-0">
                        {networkLocations.map((location) => (
                          <span
                            className="absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500/15"
                            key={location.city}
                            style={{ left: location.left, top: location.top }}
                          >
                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]" />
                          </span>
                        ))}
                      </div>
                    </div>
                    <figcaption className="border-t border-slate-200 px-4 py-2 text-xs leading-5 text-slate-400">Pins indicate locations of partner manufacturers.</figcaption>
                  </figure>
                </section>
              </section>
            </section>

            <section aria-labelledby="why-lattice-heading" className="scroll-mt-24 mt-8 border-t border-slate-200 pt-8" id="why-lattice">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Why Lattice exists</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.025em] text-slate-950" id="why-lattice-heading">Access global manufacturing capacity without building the supply chain yourself.</h3>
              <div className="mt-3 space-y-4 text-[15px] leading-7 text-slate-600">
                <p>
                  When internal or domestic capacity cannot support the work, overseas manufacturing can provide another production path. But accessing it reliably requires more than finding a supplier—it requires qualification, process validation, material coordination, quality control, communication, and logistics.
                </p>
                <p>
                  <strong className="font-semibold text-slate-800">We learned this firsthand.</strong>
                </p>
                <p>
                  While sourcing critical components for high-temperature (&gt;1,000 F) chemical reactor systems, our team built and qualified an overseas manufacturing network, developed supplier relationships, and learned the operating discipline required to make global production dependable. That work also meant disqualifying prospective suppliers that could not demonstrate the quality systems, process controls, and execution discipline each job requires. We did this to augment and fortify our domestic manufacturing team&apos;s ability to meet customer requirements without displacing the work that belongs on our floor.
                </p>
                <p className="font-semibold text-slate-700">
                  Lattice helps domestic manufacturers stay strong: keep customer relationships, protect internal capacity, and accept more of the work they are already winning.
                </p>
              </div>
            </section>

            <aside className="mt-8 border-l-2 border-[#1d73ff] bg-slate-50 px-5 py-5">
              <p className="text-[14px] leading-6 text-slate-600">If this model fits how you manage capacity, request access to the platform.</p>
              <Link className="mt-4 inline-flex items-center gap-2 rounded-md bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2" href="/waiting-list">
                Request access
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </aside>

          </article>

          <aside className="fixed right-0 top-24 z-40 hidden xl:block">
            <nav aria-label="On this page" className="group w-8 overflow-hidden rounded-l-md border border-r-0 border-transparent transition-[width,background-color,border-color,box-shadow] duration-200 hover:w-52 hover:border-slate-200 hover:bg-[#fbfaf7]/95 hover:shadow-sm focus-within:w-52 focus-within:border-slate-200 focus-within:bg-[#fbfaf7]/95 focus-within:shadow-sm">
              <span aria-hidden="true" className="absolute right-2 top-3 flex flex-col gap-1.5 transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0">
                <span className="h-0.5 w-4 rounded-full bg-slate-400" />
                <span className="h-0.5 w-4 rounded-full bg-slate-400" />
                <span className="h-0.5 w-4 rounded-full bg-slate-400" />
              </span>
              <div className="w-52 px-4 py-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">On this page</p>
                <div className="mt-4 space-y-3 text-sm leading-5">
                  <a className="block font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#problem">The problem</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#the-problem">Demand pressure</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#available-capacity">Global capacity</a>
                  <a className="block pt-2 font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#solution">The solution</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#start-with">Good first job</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#share-your-work">Submit a manufacturing package</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#align-production-plan">Validate the production path</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#production-coordination">Approve and launch production</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#review-before-shipment">Quality review</a>
                  <a className="block pt-2 font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#value">Capacity without fixed expansion</a>
                  <a className="block pl-3 text-slate-500 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#network">Network reach</a>
                  <a className="block font-semibold text-slate-700 transition hover:text-slate-950 focus:outline-none focus-visible:text-slate-950" href="#why-lattice">Why Lattice exists</a>
                </div>
              </div>
            </nav>
          </aside>
        </div>
      </div>
    </main>
  );
}
