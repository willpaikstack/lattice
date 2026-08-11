"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ListFilter, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
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

type CompactEquipmentSpec = {
  label: string;
  value: string;
};

function customerFacingSpecValue(label: string, value: string) {
  const normalized = value
    .replace(/\+\/-/g, "±")
    .replace(/Dia\.\s*/gi, "Ø")
    .replace(/\s+x\s+/gi, " × ");

  if (/rpm/i.test(label) && !/rpm/i.test(normalized)) {
    return `${normalized} RPM`;
  }

  return normalized;
}

function getAxisCount(equipment: VendorEquipment) {
  const match = `${equipment.name} ${equipment.summary}`.match(/\b([345])-axis\b/i);

  return match ? `${match[1]} axes` : undefined;
}

function getCompactSpecs(equipment: VendorEquipment) {
  const specs: CompactEquipmentSpec[] = [];
  const seen = new Set<string>();
  const addDetail = (pattern: RegExp, label: string) => {
    const detail = equipment.details.find((candidate) => pattern.test(candidate.label));

    if (!detail || seen.has(detail.label)) return;
    specs.push({ label, value: customerFacingSpecValue(detail.label, detail.value) });
    seen.add(detail.label);
  };

  addDetail(/tolerance/i, "Supplier-reported capability");
  addDetail(/accuracy/i, "Supplier-reported accuracy");
  addDetail(/5-axis envelope/i, "5-axis envelope");
  addDetail(/3-axis envelope/i, "3-axis envelope");

  if (!specs.some((spec) => /envelope/i.test(spec.label))) {
    addDetail(/envelope|range|processing|turning/i, "Work envelope");
  }

  const axisCount = getAxisCount(equipment);
  if (axisCount) specs.push({ label: "Axis count", value: axisCount });

  addDetail(/rpm/i, "Max spindle speed");
  addDetail(/control/i, "Control");
  addDetail(/power/i, "Power");

  for (const detail of equipment.details) {
    if (specs.length >= 6) break;
    if (seen.has(detail.label)) continue;
    specs.push({ label: detail.label, value: customerFacingSpecValue(detail.label, detail.value) });
    seen.add(detail.label);
  }

  return specs.slice(0, 6);
}

function getCustomerGuidance(equipment: VendorEquipment) {
  return {
    bestFor: equipment.customerGuidance?.bestFor ?? equipment.fabricatorNotes[0] ?? equipment.summary,
    limitation: equipment.customerGuidance?.limitation ?? "Additional machine limits are confirmed during RFQ review.",
    qualificationNote:
      equipment.customerGuidance?.qualificationNote ??
      "Potential fit only. Final manufacturability and part tolerance are confirmed from the drawing, material, and inspection requirements.",
  };
}

function getImageLabel(equipment: VendorEquipment) {
  if (equipment.imageKind === "actual") return "Actual machine image";
  if (equipment.imageKind === "same-model") return "Same-model image";
  return "Representative image";
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
  const compactSpecs = getCompactSpecs(equipment);
  const guidance = getCustomerGuidance(equipment);
  const imageLabel = getImageLabel(equipment);
  const primaryDataSheet = equipment.dataSheets?.[0];

  return (
    <article className={`mb-4 overflow-hidden rounded-xl border bg-white transition-[border-color,box-shadow] duration-200 ${isExpanded ? "border-stone-300 shadow-sm" : "border-stone-200 shadow-sm hover:border-stone-300"}`}>
      <button
        aria-controls={panelId}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Hide" : "View"} ${equipment.makeModel} details`}
        className="group grid w-full select-none grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 text-left outline-none transition-colors hover:bg-stone-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-900/20 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:gap-6 sm:px-5"
        onClick={() => setIsExpanded((current) => !current)}
        type="button"
      >
        <div className="relative flex h-[76px] items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white sm:h-[96px]">
          <Image
            alt=""
            className="h-full w-full object-contain px-1.5 pb-5 pt-1.5"
            height={240}
            sizes="(max-width: 640px) 96px, 128px"
            src={equipment.imagePath}
            width={320}
          />
          <span className="absolute inset-x-0 bottom-0 truncate border-t border-stone-200 bg-white/95 px-1.5 py-1 text-center text-[9px] font-medium text-stone-500 sm:text-[10px]">
            {imageLabel}
          </span>
        </div>

        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">{equipment.section}</span>
          <h3 className="mt-1 truncate text-[19px] font-semibold leading-tight tracking-tight text-stone-950 sm:text-[26px]">{equipment.makeModel}</h3>
          <p className="mt-1 truncate text-[13px] text-stone-500 sm:text-[15px]">{equipment.name}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden min-h-9 items-center rounded-md border border-stone-200 px-3 text-[13px] font-medium text-stone-700 sm:inline-flex">
            {equipment.customerQuantityLabel ?? equipment.quantity}
          </span>
          <ChevronDown className={`text-stone-700 transition-transform ${isExpanded ? "rotate-180" : ""}`} size={20} strokeWidth={1.8} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-stone-200" id={panelId} role="region" aria-label={`${equipment.makeModel} qualification details`}>
          {compactSpecs.length > 0 && (
            <dl className="grid grid-cols-2 border-b border-stone-200 sm:grid-cols-3 xl:grid-cols-6">
              {compactSpecs.map((spec, index) => (
                <div
                  className={`min-w-0 px-4 py-3.5 sm:px-5 ${index % 2 !== 0 ? "border-l border-stone-200" : ""} ${index >= 2 ? "border-t border-stone-200 sm:border-t-0" : ""} sm:[&:not(:nth-child(3n+1))]:border-l sm:[&:nth-child(3n+1)]:border-l-0 xl:border-t-0 xl:[&:not(:first-child)]:border-l xl:[&:first-child]:border-l-0`}
                  key={`${equipment.slug}-${spec.label}`}
                >
                  <dt className="text-[12px] font-medium leading-4 text-stone-500">{spec.label}</dt>
                  <dd className="mt-1 break-words text-[15px] font-semibold leading-5 text-stone-950">{spec.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <dl className="grid border-b border-stone-200 lg:grid-cols-3">
            {[
              { label: "Best for", value: guidance.bestFor },
              { label: "Limitation", value: guidance.limitation },
              { label: "Qualification note", value: guidance.qualificationNote },
            ].map((item, index) => (
              <div className={`px-4 py-3.5 sm:px-5 ${index > 0 ? "border-t border-stone-200 lg:border-l lg:border-t-0" : ""}`} key={`${equipment.slug}-${item.label}`}>
                <dt className="text-[12px] font-medium leading-4 text-stone-500">{item.label}</dt>
                <dd className="mt-1 text-[13px] leading-[1.45] text-stone-800">{item.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            {primaryDataSheet ? (
              <a
                className="w-fit text-[13px] font-medium text-blue-700 underline-offset-4 transition-colors hover:text-blue-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/30"
                href={primaryDataSheet.url}
                rel="noreferrer"
                target="_blank"
              >
                View technical data sheet
              </a>
            ) : (
              <span aria-hidden="true" />
            )}
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-stone-950 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30 focus-visible:ring-offset-2"
              href="/requests/new"
            >
              Evaluate my part
            </Link>
          </div>
        </div>
      )}
    </article>
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
