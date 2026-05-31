"use client";

import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, FileText, ListFilter, Search, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

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

const sectionSummaries: Record<EquipmentSection, string> = {
  "CNC Milling": "5-axis, 4-axis, and vertical machining centers for tight-tolerance prismatic parts.",
  "CNC Lathe": "Turning, Swiss-type, and turn-mill capacity for round parts and small precision features.",
  "QC & Inspection": "Dimensional inspection, material verification, calibration, and shop-floor measurement tools.",
  "Manual Machines": "Support equipment for tapping, drilling, grinding, and secondary preparation work.",
  "Sheet Metal": "Laser cutting, forming, riveting, extraction, and sheet processing equipment.",
  Finishing: "Welding and surface finishing equipment that supports downstream production readiness.",
  EDM: "Wire EDM and related nontraditional cutting support for precision profiles.",
  "Die Casting": "Die casting presses and furnace capacity for aluminum, zinc, and magnesium alloy parts.",
  "Additive Manufacturing": "SLA, SLM, and nylon additive manufacturing equipment for prototypes and selected end-use parts.",
};

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
    { id: "tight-tolerance", label: "+/-0.005 mm", matches: (equipment) => getToleranceNumber(equipment) <= 0.005 },
    { id: "large-envelope", label: "Large envelope", matches: (equipment) => getMaxEnvelope(equipment) >= 1000 },
  ],
  "CNC Lathe": [
    { id: "all", label: "All", matches: () => true },
    { id: "swiss", label: "Swiss type", matches: (equipment) => searchableText(equipment).includes("swiss") },
    { id: "large-turning", label: "Large turning", matches: (equipment) => getMaxEnvelope(equipment) >= 1000 },
    { id: "live-tooling", label: "Live tooling / Y-axis", matches: (equipment) => /live|y-axis|milled features/.test(searchableText(equipment)) },
    { id: "tight-tolerance", label: "+/-0.005 mm", matches: (equipment) => getToleranceNumber(equipment) <= 0.005 },
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
  EDM: [
    { id: "all", label: "All", matches: () => true },
    { id: "wire", label: "Wire EDM", matches: (equipment) => searchableText(equipment).includes("wire") },
    { id: "tight-tolerance", label: "0.01 mm", matches: (equipment) => getToleranceNumber(equipment) <= 0.01 },
  ],
  "Die Casting": [
    { id: "all", label: "All", matches: () => true },
    { id: "aluminum", label: "Aluminum", matches: (equipment) => searchableText(equipment).includes("aluminum") },
    { id: "zinc", label: "Zinc", matches: (equipment) => searchableText(equipment).includes("zinc") },
    { id: "magnesium", label: "Magnesium", matches: (equipment) => searchableText(equipment).includes("magnesium") },
  ],
  "Additive Manufacturing": [
    { id: "all", label: "All", matches: () => true },
    { id: "sla", label: "SLA", matches: (equipment) => searchableText(equipment).includes("sla") },
    { id: "slm", label: "SLM", matches: (equipment) => searchableText(equipment).includes("slm") },
    { id: "nylon", label: "Nylon", matches: (equipment) => searchableText(equipment).includes("nylon") },
    { id: "large-build", label: "Large build", matches: (equipment) => getMaxEnvelope(equipment) >= 1000 },
  ],
};

function sectionId(section: EquipmentSection) {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function searchableText(equipment: VendorEquipment) {
  return [
    equipment.name,
    equipment.makeModel,
    equipment.quantity,
    equipment.summary,
    ...equipment.details.flatMap((detail) => [detail.label, detail.value]),
    ...equipment.fabricatorNotes,
    ...(equipment.dataSheets ?? []).flatMap((dataSheet) => [dataSheet.label, dataSheet.source]),
  ]
    .join(" ")
    .toLowerCase();
}

function getQuantity(equipment: VendorEquipment) {
  return Number(equipment.quantity.match(/\d+/)?.[0] ?? "0");
}

function getToleranceNumber(equipment: VendorEquipment) {
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

function getDetailValue(equipment: VendorEquipment, pattern: RegExp) {
  return equipment.details.find((detail) => pattern.test(detail.label))?.value;
}

function getCollapsedMetrics(equipment: VendorEquipment) {
  const tolerance = getDetailValue(equipment, /tolerance|accuracy/i);
  const envelope = getDetailValue(equipment, /5-axis envelope/i) ?? getDetailValue(equipment, /envelope|range|processing|turning/i);

  return [
    tolerance ? { label: "Tol", value: tolerance } : null,
    envelope ? { label: "Env", value: `${envelope.split(" ").slice(0, 3).join(" ")}...` } : null,
  ].filter((metric): metric is { label: string; value: string } => Boolean(metric));
}

function getExpandedSpecs(equipment: VendorEquipment) {
  const tolerance = getDetailValue(equipment, /tolerance|accuracy/i);
  const envelope = getDetailValue(equipment, /5-axis envelope/i) ?? getDetailValue(equipment, /envelope|range|processing|turning/i);
  const rpm = getDetailValue(equipment, /rpm/i);
  const control = getDetailValue(equipment, /control/i);
  const power = getDetailValue(equipment, /power/i);

  return [
    tolerance ? { label: "Best Tolerance", value: tolerance } : null,
    envelope ? { label: "Work Envelope", value: envelope } : null,
    rpm ? { label: "Max RPM", value: rpm } : null,
    control ? { label: "Control", value: control } : null,
    !control && power ? { label: "Power", value: power } : null,
  ].filter((spec): spec is { label: string; value: string } => Boolean(spec)).slice(0, 4);
}

function sortEquipment(equipment: VendorEquipment[], sort: SortOption) {
  return [...equipment].sort((a, b) => {
    if (sort === "quantity-desc") {
      return getQuantity(b) - getQuantity(a) || a.makeModel.localeCompare(b.makeModel);
    }

    if (sort === "tolerance-asc") {
      return getToleranceNumber(a) - getToleranceNumber(b) || a.makeModel.localeCompare(b.makeModel);
    }

    if (sort === "rpm-desc") {
      return getMaxRpm(b) - getMaxRpm(a) || a.makeModel.localeCompare(b.makeModel);
    }

    return a.makeModel.localeCompare(b.makeModel);
  });
}

function EquipmentSectionNav({
  activeSection,
  onSectionChange,
}: {
  activeSection: EquipmentSection;
  onSectionChange: (section: EquipmentSection) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  return (
    <nav aria-label="Equipment sections" className="relative mb-12 flex items-center rounded-xl border border-stone-200/50 bg-stone-100/50 p-1.5">
      {showLeftArrow && (
        <div className="absolute bottom-0 left-0 top-0 z-10 flex items-center rounded-l-xl bg-gradient-to-r from-stone-100 via-stone-100 to-transparent pl-1 pr-4">
          <button
            aria-label="Scroll equipment sections left"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            onClick={() => scroll("left")}
            type="button"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      <div
        className="relative z-0 flex flex-1 gap-1 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        onScroll={checkScroll}
        ref={scrollRef}
      >
        {equipmentSections.map((section) => {
          const isActive = section === activeSection;

          return (
          <button
            aria-pressed={isActive}
            className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-0 active:outline-none active:ring-0 ${
              isActive ? "border-stone-200/60 bg-white text-stone-900 shadow-sm" : "border-transparent text-stone-600 hover:bg-stone-200/50 hover:text-stone-900"
            }`}
            key={section}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSectionChange(section)}
            type="button"
          >
            {section}
          </button>
          );
        })}
      </div>

      {showRightArrow && (
        <div className="absolute bottom-0 right-0 top-0 z-10 flex items-center rounded-r-xl bg-gradient-to-l from-stone-100 via-stone-100 to-transparent pl-4 pr-1">
          <button
            aria-label="Scroll equipment sections right"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm transition-colors hover:text-stone-900"
            onClick={() => scroll("right")}
            type="button"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </nav>
  );
}

function EquipmentRow({ defaultOpen = false, equipment }: { defaultOpen?: boolean; equipment: VendorEquipment }) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);
  const panelId = `${equipment.slug}-details`;
  const collapsedMetrics = getCollapsedMetrics(equipment);
  const expandedSpecs = getExpandedSpecs(equipment);

  return (
    <div className={`mb-4 overflow-hidden rounded-xl border bg-white transition-all duration-200 ${isExpanded ? "border-stone-300 shadow-md ring-1 ring-stone-900/5" : "border-stone-200 shadow-sm hover:border-stone-300 hover:shadow-md"}`}>
      <div
        className="group relative flex cursor-pointer select-none flex-col p-4 sm:flex-row sm:items-center sm:p-5"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsExpanded((current) => !current);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="absolute bottom-0 left-0 top-0 w-1 bg-transparent transition-colors group-hover:bg-stone-200" />
        {isExpanded && <div className="absolute bottom-0 left-0 top-0 w-1 bg-stone-900 transition-colors" />}

        <div className="mb-4 flex w-full shrink-0 items-center gap-3 pr-4 sm:mb-0 sm:w-auto">
          <button
            aria-controls={panelId}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Hide" : "View"} ${equipment.makeModel} details`}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center text-stone-400 transition-colors group-hover:text-stone-900"
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded((current) => !current);
            }}
            type="button"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
          <div className="flex flex-col">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{equipment.section}</span>
            </div>
            <h3 className="text-lg font-bold leading-none tracking-tight text-stone-900">{equipment.makeModel}</h3>
            <p className="mt-1.5 text-sm font-medium text-stone-500">{equipment.name}</p>
          </div>
        </div>

        <div className="ml-4 hidden min-w-0 flex-1 flex-col items-start justify-between gap-4 sm:flex sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1 pr-4">
            <p className="truncate text-sm text-stone-600">{equipment.summary}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-md border border-stone-200/60 bg-stone-100 px-3 py-1">
              <span className="text-xs font-bold text-stone-900">{equipment.quantity}</span>
            </div>
            {!isExpanded && collapsedMetrics.length > 0 && (
              <div className="flex gap-2">
                {collapsedMetrics.map((metric) => (
                  <MetricBadge key={`${equipment.slug}-${metric.label}`} label={metric.label} value={metric.value} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-4 border-t border-stone-100 bg-stone-50/50 p-5 duration-300 sm:p-6" id={panelId}>
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-stone-200 bg-white">
                <Image alt={equipment.makeModel} className="h-full w-full object-cover" height={760} src={equipment.imagePath} width={1200} />
                <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded border border-stone-200/50 bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-stone-800">Verified Machine</span>
                </div>
              </div>
              <a
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white py-2 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-900"
                href={equipment.imageSourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLink size={14} />
                View machine on manufacturer site
              </a>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-6">
              {expandedSpecs.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {expandedSpecs.map((detail) => (
                    <DetailBox key={`${equipment.slug}-${detail.label}`} label={detail.label} value={detail.value} />
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 border-t border-stone-200/60 pt-2 md:grid-cols-2">
                {equipment.fabricatorNotes.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Fabricator Note</h4>
                    <div className="relative overflow-hidden rounded-lg border border-stone-200 bg-white p-3 text-sm leading-relaxed text-stone-700 shadow-sm">
                      <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-blue-500" />
                      <ul className="space-y-2">
                        {equipment.fabricatorNotes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {equipment.dataSheets && equipment.dataSheets.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Supplier Data Sheet</h4>
                      <div className="grid gap-2">
                        {equipment.dataSheets.map((dataSheet) => (
                          <a
                            className="group flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
                            href={dataSheet.url}
                            key={`${equipment.slug}-${dataSheet.url}`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-stone-100 text-stone-500 transition-colors group-hover:text-stone-900">
                              <FileText size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-stone-800">{dataSheet.label}</p>
                              <p className="mt-0.5 text-xs uppercase tracking-wider text-stone-500">PDF Document</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">Source / Provenance</h4>
                    <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
                      <CheckCircle2 size={16} className="text-stone-400" />
                      <div className="flex min-w-0 flex-1 items-center justify-between">
                        <span className="truncate text-sm font-medium text-stone-800">{equipment.source.vendor}</span>
                        <span className="shrink-0 text-xs text-stone-500">{equipment.source.documentDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-md border border-stone-200/80 bg-stone-50 px-2.5 py-1">
      <span className="mb-0.5 text-[9px] font-bold uppercase leading-none tracking-widest text-stone-400">{label}</span>
      <span className="max-w-[80px] truncate text-xs font-medium leading-none text-stone-800">{value}</span>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <span className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</span>
      <span className="break-words text-sm font-semibold leading-snug text-stone-900">{value}</span>
    </div>
  );
}

function SectionEquipment({ section }: { section: EquipmentSection }) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sort, setSort] = useState<SortOption>("make-model");
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

  const headingId = `${sectionId(section)}-heading`;

  return (
    <section aria-labelledby={headingId} className="mb-8" id={sectionId(section)}>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-stone-900" id={headingId}>{section}</h2>
          <p className="text-[15px] text-stone-600">{sectionSummaries[section]}</p>
        </div>
        <div className="whitespace-nowrap text-sm font-medium text-stone-500">
          {filteredEquipment.length} of {equipmentBySection.length} unique make/model cards
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <label className="sr-only" htmlFor={`${sectionId(section)}-search`}>
              Search
            </label>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search size={16} className="text-stone-400" />
            </div>
            <input
              className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-stone-900 placeholder-stone-500 transition-shadow focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              id={`${sectionId(section)}-search`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${section.toLowerCase()}...`}
              type="text"
              value={query}
            />
          </div>

          <div className="relative shrink-0 sm:w-56">
            <label className="sr-only" htmlFor={`${sectionId(section)}-sort`}>
              Sort
            </label>
            <select
              className="w-full appearance-none rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-8 text-sm font-medium text-stone-800 transition-colors hover:bg-stone-100 focus:outline-none"
              id={`${sectionId(section)}-sort`}
              onChange={(event) => setSort(event.target.value as SortOption)}
              value={sort}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
            <ListFilter size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" />
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-2">
          {filters.map((filter) => {
            const isActive = filter.id === activeFilter;

            return (
              <button
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                  isActive ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
                }`}
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
        <div className="mt-8">
          {filteredEquipment.map((equipment) => (
            <EquipmentRow defaultOpen={equipment.slug === "jingdiao-jdgr200t"} equipment={equipment} key={equipment.slug} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-6 text-sm font-medium text-stone-600">
          No equipment matches this section filter.
        </div>
      )}
    </section>
  );
}

export function EquipmentCatalog() {
  const [activeSection, setActiveSection] = useState<EquipmentSection>(equipmentSections[0]);

  return (
    <div>
      <EquipmentSectionNav activeSection={activeSection} onSectionChange={setActiveSection} />
      <SectionEquipment key={activeSection} section={activeSection} />
    </div>
  );
}
