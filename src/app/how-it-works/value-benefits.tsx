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
    summary: "Accept work your current floor cannot support.",
    details: [
      "Route repeat production and overflow work through another qualified production path.",
      "Add process capacity that is unavailable or fully committed in-house.",
      "Protect customer lead times without reshuffling the work already scheduled on your floor.",
    ],
  },
  {
    id: "less-fixed-expansion",
    icon: Factory,
    title: "Less fixed expansion",
    summary: "Avoid scaling headcount, equipment, and floor space in lockstep with demand.",
    details: [
      "Respond to cyclical or uncertain demand before committing to another machine or facility expansion.",
      "Reduce the pressure to hire and train ahead of confirmed, durable production volume.",
      "Keep internal capital focused on the processes and work that are most important to your operation.",
    ],
  },
  {
    id: "managed-quality",
    icon: ShieldCheck,
    title: "Managed quality",
    summary: "Coordinate production and documentation against your requirements.",
    details: [
      "Keep drawings, material requirements, tolerances, and inspection expectations tied to the order.",
      "Track production against the requirements agreed before release.",
      "Review requested inspection reports and material documentation before shipment.",
    ],
  },
  {
    id: "accountable-partner",
    icon: UserRoundCheck,
    title: "One accountable partner",
    summary: "Use Lattice instead of building and managing an overseas supply chain yourself.",
    details: [
      "Work through one supplier-backed quote and one coordinated project record.",
      "Let Lattice manage supplier communication, production follow-up, and delivery coordination.",
      "Keep the customer relationship and commercial context with your own team.",
    ],
  },
];

export function ValueBenefits({ statistics }: ValueBenefitsProps) {
  const [openBenefit, setOpenBenefit] = useState<string | null>(null);
  const statisticsByBenefit: Partial<Record<string, string>> = {
    "managed-quality": `${statistics.inspectionRecords} documented inspection equipment records`,
    "more-capacity": `${statistics.equipmentRecords} documented equipment records across ${statistics.equipmentCategories} categories`,
  };

  return (
    <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-slate-50/60 divide-y divide-slate-200">
      {benefits.map((benefit) => {
        const Icon = benefit.icon;
        const isOpen = openBenefit === benefit.id;
        const buttonId = `${benefit.id}-button`;
        const panelId = `${benefit.id}-panel`;
        const statistic = statisticsByBenefit[benefit.id];

        return (
          <section className={isOpen ? "bg-white shadow-[inset_3px_0_0_#1d73ff]" : "bg-slate-50/60"} key={benefit.id}>
            <h4>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex min-h-20 w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-white focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1d73ff] sm:px-5 motion-reduce:transition-none"
                id={buttonId}
                onClick={() => setOpenBenefit(isOpen ? null : benefit.id)}
                type="button"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${isOpen ? "border-blue-200 bg-blue-50 text-[#1d73ff]" : "border-slate-200 bg-white text-slate-600"}`}>
                  <Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-slate-900">{benefit.title}</span>
                  <span className="mt-1 block text-[14px] font-normal leading-6 text-slate-600">{benefit.summary}</span>
                  {statistic ? (
                    <span className="mt-2 block text-xs font-medium leading-5 text-slate-500">
                      <span className="text-slate-400">Current network records</span>
                      <span aria-hidden="true"> &middot; </span>
                      {statistic}
                    </span>
                  ) : null}
                </span>
                <ChevronDown aria-hidden="true" className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180 text-slate-700" : ""}`} strokeWidth={1.8} />
              </button>
            </h4>

            {isOpen ? (
              <div aria-labelledby={buttonId} className="border-t border-slate-200 bg-white px-5 py-5 sm:pl-[76px] sm:pr-8" id={panelId} role="region">
                {benefit.id === "more-capacity" ? (
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">CNC network snapshot</p>
                    <div className="mt-3 grid overflow-hidden rounded-md border border-slate-200 bg-slate-200 sm:grid-cols-3 sm:gap-px">
                      {[
                        { label: "documented CNC machines", value: statistics.cncMachines },
                        { label: "milling / turning", value: `${statistics.cncMillingMachines} / ${statistics.cncTurningMachines}` },
                        { label: "explicitly listed 5-axis", value: statistics.cncFiveAxisMachines },
                      ].map((item) => (
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 last:border-b-0 sm:border-b-0" key={item.label}>
                          <span className="block text-xl font-semibold tabular-nums tracking-[-0.025em] text-slate-900">{item.value}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] leading-5 text-slate-500">
                      The documented mix spans 3-, 4-, 5-, and 6-axis equipment, Swiss-type turning, and turn-mill centers. Listed envelopes extend to 3000 × 2200 × 1100 mm for milling and Ø500 × 2000 mm for turning; availability is confirmed for each quote.
                    </p>
                  </div>
                ) : null}

                {benefit.id === "managed-quality" ? (
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Network qualification evidence</p>
                    <div className="mt-3 grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 sm:gap-6">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">Manufacturing quality systems</p>
                        <p className="mt-1 text-[13px] leading-5 text-slate-600">
                          Current supplier records include ISO 9001, ISO 13485, IATF 16949, EN 9100, ISO 14001, and ISO 45001 coverage. One additional partner describes an ISO 9001-based quality program rather than a verified certificate.
                        </p>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800">Material traceability</p>
                        <p className="mt-1 text-[13px] leading-5 text-slate-600">
                          Recorded sources cover nickel and cobalt alloys, stainless steel, titanium, and alloy steel—including Inconel 600, 601, 617, 625, 718, and X-750. They list AS9120 and ISO management systems, mill test certificates, ASTM / ASME / AMS traceability, EN 10204 3.1 or 3.2 documentation, and optional third-party inspection.
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-[13px] leading-5 text-slate-500">
                      Lattice confirms certificate scope, currency, material heat traceability, and job applicability during qualification; supplier claims and catalog listings are not treated as automatic approval.
                    </p>
                  </div>
                ) : null}

                <ul className="space-y-3 border-t border-slate-200 pt-5 text-[14px] leading-6 text-slate-600 first:border-t-0 first:pt-0">
                  {benefit.details.map((detail) => (
                    <li className="flex gap-3" key={detail}>
                      <span aria-hidden="true" className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1d73ff]" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
