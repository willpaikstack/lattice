"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  equipmentSections,
  vendorEquipment,
  type EquipmentSection,
  type VendorEquipment,
} from "@/lib/vendor-equipment";

type PresetFilter = {
  id: string;
  label: string;
  matches: (equipment: VendorEquipment) => boolean;
};

type SortOption = "make-model" | "quantity-desc" | "tolerance-asc" | "rpm-desc";

const sortOptions: { label: string; value: SortOption }[] = [
  { label: "Make / model", value: "make-model" },
  { label: "Quantity", value: "quantity-desc" },
  { label: "Best tolerance", value: "tolerance-asc" },
  { label: "Max RPM", value: "rpm-desc" },
];

const sectionFilters: Record<EquipmentSection, PresetFilter[]> = {
  "CNC Milling": [
    { id: "all", label: "All", matches: () => true },
    { id: "5-axis", label: "5-axis", matches: (equipment) => searchableText(equipment).includes("5-axis") },
    { id: "4-axis", label: "4-axis", matches: (equipment) => searchableText(equipment).includes("4-axis") },
    { id: "3-axis", label: "3-axis", matches: (equipment) => searchableText(equipment).includes("3-axis") },
    { id: "tight-tolerance", label: "+/-0.005 mm", matches: (equipment) => getTolerance(equipment) <= 0.005 },
    { id: "large-envelope", label: "Large envelope", matches: (equipment) => getMaxEnvelope(equipment) >= 1000 },
  ],
  "CNC Lathe": [
    { id: "all", label: "All", matches: () => true },
    { id: "swiss", label: "Swiss type", matches: (equipment) => searchableText(equipment).includes("swiss") },
    { id: "large-turning", label: "Large turning", matches: (equipment) => getMaxEnvelope(equipment) >= 1000 },
    { id: "live-tooling", label: "Live tooling / Y-axis", matches: (equipment) => /live|y-axis|milled features/.test(searchableText(equipment)) },
    { id: "tight-tolerance", label: "+/-0.005 mm", matches: (equipment) => getTolerance(equipment) <= 0.005 },
  ],
  "QC & Inspection": [
    { id: "all", label: "All", matches: () => true },
    { id: "cmm", label: "CMM", matches: (equipment) => searchableText(equipment).includes("cmm") || searchableText(equipment).includes("coordinate") },
    { id: "zeiss", label: "ZEISS", matches: (equipment) => searchableText(equipment).includes("zeiss") },
    { id: "hand-tools", label: "Hand tools", matches: (equipment) => /caliper|height gauge/.test(searchableText(equipment)) },
    { id: "material-id", label: "Material ID", matches: (equipment) => /spectrometer|x-met|material/.test(searchableText(equipment)) },
  ],
  "Manual Machines": [
    { id: "all", label: "All", matches: () => true },
    { id: "drilling", label: "Drilling", matches: (equipment) => searchableText(equipment).includes("drill") },
    { id: "tapping", label: "Tapping", matches: (equipment) => searchableText(equipment).includes("tap") },
    { id: "grinding", label: "Grinding", matches: (equipment) => searchableText(equipment).includes("grind") },
  ],
  "Sheet Metal": [
    { id: "all", label: "All", matches: () => true },
    { id: "laser", label: "Laser cutting", matches: (equipment) => searchableText(equipment).includes("laser") },
    { id: "forming", label: "Forming / bending", matches: (equipment) => /press brake|bending|forming/.test(searchableText(equipment)) },
    { id: "6000w", label: "6,000 W", matches: (equipment) => searchableText(equipment).includes("6000") || searchableText(equipment).includes("6,000") },
    { id: "large-sheet", label: "3000 mm sheet", matches: (equipment) => getMaxEnvelope(equipment) >= 3000 },
  ],
  Finishing: [
    { id: "all", label: "All", matches: () => true },
    { id: "welding", label: "Welding", matches: (equipment) => searchableText(equipment).includes("weld") },
    { id: "brushing", label: "Brushing", matches: (equipment) => searchableText(equipment).includes("brush") },
    { id: "sanding", label: "Sanding", matches: (equipment) => searchableText(equipment).includes("sand") },
  ],
};

function searchableText(equipment: VendorEquipment) {
  return [
    equipment.name,
    equipment.makeModel,
    equipment.quantity,
    equipment.summary,
    ...equipment.details.flatMap((detail) => [detail.label, detail.value]),
    ...equipment.fabricatorNotes,
  ]
    .join(" ")
    .toLowerCase();
}

function getQuantity(equipment: VendorEquipment) {
  return Number(equipment.quantity.match(/\d+/)?.[0] ?? "0");
}

function getTolerance(equipment: VendorEquipment) {
  const toleranceDetail = equipment.details.find((detail) => /tolerance|accuracy/i.test(detail.label));
  const value = toleranceDetail?.value.match(/0\.\d+/)?.[0];

  return value ? Number(value) : Number.POSITIVE_INFINITY;
}

function getMaxRpm(equipment: VendorEquipment) {
  const rpmDetail = equipment.details.find((detail) => /rpm/i.test(detail.label));
  const value = rpmDetail?.value.match(/[\d,]+/)?.[0]?.replace(/,/g, "");

  return value ? Number(value) : 0;
}

function getMaxEnvelope(equipment: VendorEquipment) {
  const envelopeDetail = equipment.details.find((detail) => /envelope|range|processing|turning/i.test(detail.label));
  const dimensions = envelopeDetail?.value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];

  return dimensions.length > 0 ? Math.max(...dimensions) : 0;
}

function sortEquipment(equipment: VendorEquipment[], sort: SortOption) {
  return [...equipment].sort((a, b) => {
    if (sort === "quantity-desc") {
      return getQuantity(b) - getQuantity(a) || a.makeModel.localeCompare(b.makeModel);
    }

    if (sort === "tolerance-asc") {
      return getTolerance(a) - getTolerance(b) || a.makeModel.localeCompare(b.makeModel);
    }

    if (sort === "rpm-desc") {
      return getMaxRpm(b) - getMaxRpm(a) || a.makeModel.localeCompare(b.makeModel);
    }

    return a.makeModel.localeCompare(b.makeModel);
  });
}

function EquipmentCard({ equipment }: { equipment: VendorEquipment }) {
  return (
    <article className="overflow-hidden rounded-md border border-[#e5e5e5] bg-white">
      <div className="border-b border-[#eeeeee] bg-[#f7f8fa]">
        <Image
          alt={`${equipment.name} machine`}
          className="h-64 w-full object-contain"
          height={760}
          src={equipment.imagePath}
          width={1200}
        />
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8c8c8c]">{equipment.section}</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-7 tracking-[-0.03em] text-[#202020]">{equipment.name}</h2>
          </div>
          <span className="rounded-md bg-[#f2f4f6] px-3 py-1.5 text-[13px] font-semibold text-[#343942]">{equipment.quantity}</span>
        </div>

        <p className="mt-2 text-[14px] leading-6 text-[#6f737a]">{equipment.summary}</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9a9da3]">Make / model</dt>
            <dd className="mt-1 text-[14px] font-medium text-[#2b2f36]">{equipment.makeModel}</dd>
          </div>
          {equipment.details.map((detail) => (
            <div key={detail.label}>
              <dt className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#9a9da3]">{detail.label}</dt>
              <dd className="mt-1 text-[14px] font-medium text-[#2b2f36]">{detail.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 border-t border-[#eeeeee] pt-4">
          <p className="text-[13px] font-semibold text-[#252525]">Fabricator notes</p>
          <ul className="mt-2 space-y-2 text-[14px] leading-6 text-[#6f737a]">
            {equipment.fabricatorNotes.map((note) => (
              <li className="flex gap-2" key={note}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b949e]" aria-hidden="true" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeeee] pt-4">
          <div className="text-[12px] leading-5 text-[#8c8c8c]">
            <p>Source: {equipment.source.vendor}, {equipment.source.documentDate}</p>
            <a className="font-medium text-[#555b63] underline decoration-[#c9ced6] underline-offset-2" href={equipment.imageSourceUrl} rel="noreferrer" target="_blank">
              Image source
            </a>
          </div>
          <a
            aria-label={`Open ${equipment.makeModel} machine page`}
            className="group relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#e0e0e0] bg-white text-[#3b4047] transition hover:border-[#c9ced6] hover:bg-[#f7f8fa] hover:text-[#171717]"
            href={equipment.machineUrl}
            rel="noreferrer"
            target="_blank"
            title="Open machine page"
          >
            <svg aria-hidden="true" className="h-5 w-5 stroke-[1.8]" fill="none" viewBox="0 0 24 24">
              <path d="M7 17 17 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 7h8v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 17H7V10" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.72" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}

function SectionEquipment({ section }: { section: EquipmentSection }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("make-model");
  const headingId = `${section.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-heading`;
  const equipmentBySection = vendorEquipment.filter((equipment) => equipment.section === section);
  const filters = sectionFilters[section];
  const activePreset = filters.find((filter) => filter.id === activeFilter) ?? filters[0];
  const filteredEquipment = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchedEquipment = equipmentBySection.filter((equipment) => {
      const text = searchableText(equipment);
      const matchesQuery = normalizedQuery.length === 0 || text.includes(normalizedQuery);

      return matchesQuery && activePreset.matches(equipment);
    });

    return sortEquipment(matchedEquipment, sort);
  }, [activePreset, equipmentBySection, query, sort]);

  return (
    <section className="space-y-4" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id={headingId} className="text-[28px] font-semibold tracking-[-0.04em] text-[#202020]">
          {section}
        </h2>
        <p className="text-[14px] text-[#7a7f87]">
          {filteredEquipment.length} of {equipmentBySection.length} unique make/model cards
        </p>
      </div>

      <div className="rounded-md border border-[#e6e6e6] bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(220px,1fr)_220px]">
          <label className="block">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8c8c8c]">Search</span>
            <input
              className="mt-2 h-11 w-full rounded-md border border-[#d9dce1] bg-white px-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9aa0a8] focus:border-[#8d96a3] focus:ring-2 focus:ring-[#e6e9ee]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${section.toLowerCase()}`}
              type="search"
              value={query}
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8c8c8c]">Sort</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-[#d9dce1] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none transition focus:border-[#8d96a3] focus:ring-2 focus:ring-[#e6e9ee]"
              onChange={(event) => setSort(event.target.value as SortOption)}
              value={sort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label={`${section} preset filters`}>
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;

            return (
              <button
                className={[
                  "min-h-9 rounded-md border px-3 text-[13px] font-semibold transition",
                  isActive
                    ? "border-[#2f3338] bg-[#2f3338] text-white"
                    : "border-[#dfe3e8] bg-[#f8f9fa] text-[#4b525b] hover:border-[#c6cdd5] hover:bg-white",
                ].join(" ")}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredEquipment.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredEquipment.map((equipment) => (
            <EquipmentCard equipment={equipment} key={equipment.slug} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#d7dce2] bg-[#fbfbfb] p-6 text-[14px] font-medium text-[#6f737a]">
          No equipment matches this section filter.
        </div>
      )}
    </section>
  );
}

export function EquipmentCatalog() {
  return (
    <>
      {equipmentSections.map((section) => (
        <SectionEquipment key={section} section={section} />
      ))}
    </>
  );
}
