"use client";

import { ChevronDown, CircleGauge, Factory, ShieldCheck, UserRoundCheck, type LucideIcon } from "lucide-react";
import { useState } from "react";

type Benefit = {
  id: string;
  icon: LucideIcon;
  title: string;
  summary: string;
  details: string[];
};

type ValueBenefitsProps = {
  statistics: {
    cncFiveAxisMachines: number;
    cncMachines: number;
    cncMillingMachines: number;
    cncTurningMachines: number;
    cmmMachines: number;
    equipmentCategories: number;
    equipmentRecords: number;
    inspectionRecords: number;
  };
};

const benefits: Benefit[] = [
  {
    id: "more-capacity",
    icon: CircleGauge,
    title: "More capacity",
    summary: "Take on overflow work without reshuffling your own production schedule.",
    details: [
      "{cncMachines} documented CNC machines across the partner network support 3-, 4-, and 5-axis milling for parts ranging from precision work to large-format machining.",
      "A combined workforce of 400+ across the partner network spans machining, quality control, shipping and receiving, and related production support.",
      "Wire EDM, laser cutting and forming, welding, grinding, and other secondary processes where the job requires them.",
      "{cmmMachines} documented CMMs across the partner network, plus 2D/2.5D vision, X-ray fluorescence (XRF), roughness, hardness, and ultrasonic inspection capability, supported by documented traceability controls from incoming material through finished goods.",
    ],
  },
  {
    id: "less-fixed-expansion",
    icon: Factory,
    title: "Capacity on demand",
    summary: "Access qualified CNC capacity when demand requires it, without a long-term volume commitment.",
    details: [
      "Release work job by job, with each quote matched to the drawing, material, quantity, quality, and delivery requirements.",
      "Scale outsourced production up for demand peaks and back down when the backlog clears.",
      "Pay for capacity used on approved work instead of carrying added headcount, equipment, and floor-space costs year-round.",
    ],
  },
  {
    id: "managed-quality",
    icon: ShieldCheck,
    title: "Managed quality",
    summary: "Suppliers are vetted, qualified for the job, and managed against defined quality requirements through shipment.",
    details: [],
  },
  {
    id: "accountable-partner",
    icon: UserRoundCheck,
    title: "One accountable partner",
    summary: "Access qualified overseas capacity through one accountable manufacturing partner.",
    details: [
      "Supplier selection, technical clarification, and material-sourcing coordination.",
      "Production tracking, supplier communication, quality-document collection, and issue resolution.",
      "Logistics and delivery coordination through one supplier-backed quote and coordinated project record.",
    ],
  },
];

export function ValueBenefits({ statistics }: ValueBenefitsProps) {
  const [openBenefit, setOpenBenefit] = useState<string | null>(null);

  return (
    <div className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-md border border-stone-200 bg-stone-50/70">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        const isOpen = openBenefit === benefit.id;
        const buttonId = `${benefit.id}-button`;
        const panelId = `${benefit.id}-panel`;

        return (
          <section className={isOpen ? "bg-white shadow-[inset_3px_0_0_#1c1917]" : "bg-stone-50/70"} key={benefit.id}>
            <h4>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex min-h-20 w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-stone-950 sm:px-5 motion-reduce:transition-none"
                id={buttonId}
                onClick={() => setOpenBenefit(isOpen ? null : benefit.id)}
                type="button"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${isOpen ? "border-stone-300 bg-stone-100 text-stone-800" : "border-stone-200 bg-white text-slate-600"}`}>
                  <Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-slate-900">{benefit.title}</span>
                  <span className="mt-1 block text-[14px] font-normal leading-6 text-slate-600">{benefit.summary}</span>
                </span>
                <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 text-stone-400 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180 text-stone-700" : ""}`} strokeWidth={1.8} />
              </button>
            </h4>

            {isOpen ? (
              <div aria-labelledby={buttonId} className="border-t border-stone-200 bg-white px-5 py-5 sm:pl-[76px] sm:pr-8" id={panelId} role="region">
                {benefit.id === "more-capacity" ? (
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">CNC capacity</p>
                    <dl className="mt-3 grid grid-cols-3 divide-x divide-stone-200 border-y border-stone-200 py-4">
                      {[
                        { label: "documented CNC machines", value: statistics.cncMachines },
                        { label: "milling / turning", value: `${statistics.cncMillingMachines} / ${statistics.cncTurningMachines}` },
                        { label: "explicitly listed 5-axis", value: statistics.cncFiveAxisMachines },
                      ].map((item) => (
                        <div className="flex min-w-0 flex-col px-3 first:pl-0 last:pr-0 sm:px-5" key={item.label}>
                          <dt className="order-2 mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5">{item.label}</dt>
                          <dd className="order-1 text-lg font-semibold tabular-nums tracking-[-0.025em] text-slate-900 sm:text-xl">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-[13px] leading-5 text-slate-500">
                      Listed envelopes extend to 3000 × 2200 × 1100 mm for milling and Ø500 × 2000 mm for turning. Availability and fit are confirmed for each quote.
                    </p>
                  </div>
                ) : null}

                {benefit.id === "managed-quality" ? (
                  <div className="mb-5">
                    <p className="text-sm leading-6 text-slate-600">Lattice qualifies both the supplier and the production path before work is released, then keeps the approved requirements and evidence tied to the order through delivery.</p>

                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">How Lattice protects quality</p>
                    <ol className="mt-2 grid gap-x-8 sm:grid-cols-2">
                      {[
                        { title: "Vet the supplier", detail: "Lattice invests time and capital before approving a partner: conducting onsite facility visits, auditing the QMS and critical supply-chain controls, and producing sample parts to verify process capability and inspection performance." },
                        { title: "Qualify the job", detail: "Lattice reviews the drawing, tolerances, material, finish, inspection plan, and documentation requirements. We then confirm the selected supplier can meet them." },
                        { title: "Control production", detail: "Throughout production, Lattice keeps approved requirements with the order, tracks production and in-process checks, and coordinates resolution of technical questions or nonconforming results." },
                        { title: "Verify before shipment", detail: "Before shipment, Lattice collects the requested inspection reports, material records, and substantiation evidence, and holds shipment for review when approval is required." },
                      ].map((step, index) => (
                        <li className="flex gap-3 border-t border-stone-200 py-4" key={step.title}>
                          <span className="w-5 shrink-0 pt-px text-xs font-semibold tabular-nums text-stone-500">0{index + 1}</span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-slate-800">{step.title}</span>
                            <span className="mt-1 block text-[13px] leading-5 text-slate-600">{step.detail}</span>
                          </span>
                        </li>
                      ))}
                    </ol>

                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Qualification evidence</p>
                    <div className="mt-3 grid border-y border-stone-200 sm:grid-cols-2 sm:gap-8">
                      <div className="py-4">
                        <p className="text-[13px] font-semibold text-slate-800">Supplier qualification records</p>
                        <p className="mt-1 text-[13px] leading-5 text-slate-600">
                          We work with suppliers holding ISO 9001, ISO 13485, IATF 16949, EN 9100, ISO 14001, and ISO 45001 certifications. When a customer requests a specific certification, we use it to shortlist an eligible supplier, then confirm the certificate holder, scope, and current validity before release.
                        </p>
                      </div>
                      <div className="border-t border-stone-200 py-4 sm:border-t-0">
                        <p className="text-[13px] font-semibold text-slate-800">Inspection capability matched to the job</p>
                        <p className="mt-1 text-[13px] leading-5 text-slate-600">
                          Before award, we match the drawing and customer requirements to a supplier with the right inspection resources. Our documented capability includes {statistics.cmmMachines} CMMs plus vision measurement, X-ray fluorescence (XRF), roughness and hardness testing, and ultrasonic inspection. The selected supplier must provide the requested reports and maintain required traceability through shipment.
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                      The result: parts produced to the approved requirements, with the inspection evidence and documentation your customer expects.
                    </p>
                  </div>
                ) : null}

                {benefit.id === "less-fixed-expansion" ? <p className="mb-5 text-sm leading-6 text-slate-600">Once a job is approved, move it directly into qualified CNC capacity without waiting for a new machine, another shift, or a long-term production commitment.</p> : null}
                {benefit.id === "accountable-partner" ? <p className="mb-5 text-sm leading-6 text-slate-600">Lattice coordinates the manufacturing network on your behalf, including:</p> : null}

                {benefit.details.length > 0 ? (
                  <ul className="space-y-3 border-t border-stone-200 pt-5 text-[14px] leading-6 text-slate-600">
                    {benefit.details.map((detail) => (
                      <li className="flex gap-3" key={detail}>
                        <span aria-hidden="true" className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-stone-700" />
                        <span>{detail.replace("{cncMachines}", String(statistics.cncMachines)).replace("{cmmMachines}", String(statistics.cmmMachines))}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {benefit.id === "less-fixed-expansion" ? <p className="mt-5 text-sm font-medium leading-6 text-slate-700">Use outsourcing as variable production capacity: keep your floor focused, protect customer lead times, and expand fixed infrastructure only when sustained demand justifies it.</p> : null}
                {benefit.id === "accountable-partner" ? <p className="mt-5 text-sm font-medium leading-6 text-slate-700">You manage one relationship with Lattice instead of building and operating your own overseas supplier network.</p> : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
