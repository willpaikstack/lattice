"use client";

import { useMemo, useState } from "react";

import { type CustomerEquipment } from "@/lib/customer-equipment";
import { equipmentSections, type EquipmentSection } from "@/lib/vendor-equipment";
import { customerEquipmentGuidance } from "@/lib/customer-partner-privacy";

type EquipmentTypeFilter = {
  id: string;
  label: string;
  matches: (equipment: CustomerEquipment) => boolean;
};

function sectionId(section: EquipmentSection) {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function searchableText(equipment: CustomerEquipment) {
  return [
    equipment.name,
    equipment.makeModel,
    equipment.quantity,
    equipment.summary,
    ...equipment.details.flatMap((detail) => [
      detail.label,
      detail.value,
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

const equipmentTypeFilters: EquipmentTypeFilter[] = [
  { id: "all", label: "All equipment types", matches: () => true },
  { id: "cnc-mill", label: "CNC Mill", matches: (equipment) => equipment.section === "CNC Milling" },
  { id: "lathes", label: "Lathes", matches: (equipment) => equipment.section === "CNC Lathe" },
  { id: "manual-equipment", label: "Manual equipment", matches: (equipment) => equipment.section === "Manual Machines" },
  { id: "qc-equipment", label: "QC equipment", matches: (equipment) => equipment.section === "QC & Inspection" },
  { id: "sheet-metal-fabrication", label: "Sheet metal fabrication", matches: (equipment) => equipment.section === "Sheet Metal" },
];

function customerFacingSpecValue(label: string, value: string) {
  const normalized = value
    .replace(/\+\/-/g, "±")
    .replace(/Dia\.\s*/gi, "Ø")
    .replace(/\s+x\s+/gi, " × ");

  if (/rpm/i.test(label) && !/rpm/i.test(normalized)) {
    return customerEquipmentGuidance(`${normalized} RPM`);
  }

  return customerEquipmentGuidance(normalized);
}

function customerFacingSpecLabel(label: string) {
  if (/best tolerance|positional accuracy|tolerance/i.test(label)) {
    return "Positional accuracy (X/Y/Z)";
  }

  if (/^processing envelope$/i.test(label)) {
    return "Work envelope";
  }

  return label;
}

function isCustomerVisibleSpecification(detail: CustomerEquipment["details"][number]) {
  return !/calibrat/i.test(detail.label) && !/calibrat/i.test(detail.value);
}

function isPrimaryComparisonSpecification(detail: CustomerEquipment["details"][number]) {
  return /tolerance|accuracy|5-axis envelope|3-axis envelope|envelope|range|processing|turning/i.test(detail.label);
}

function formatPositionalAccuracy(value: string) {
  const normalized = customerFacingSpecValue("Positional accuracy", value);
  const axisValues = normalized.match(/(?:±?\s*\d+(?:\.\d+)?\s*mm?)(?:\s*[/×x]\s*(?:±?\s*\d+(?:\.\d+)?\s*mm?)){2}/i);

  if (axisValues) return customerEquipmentGuidance(axisValues[0].replace(/\s*[/×x]\s*/g, " / "));

  return `${normalized} common X/Y/Z value`;
}

function alphabetizeEquipment(equipment: CustomerEquipment[]) {
  return [...equipment].sort((a, b) => a.makeModel.localeCompare(b.makeModel));
}

function getTableDetail(equipment: CustomerEquipment, pattern: RegExp, fallback = "—") {
  const detail = equipment.details.find((candidate) => pattern.test(candidate.label));

  return detail ? customerFacingSpecValue(detail.label, detail.value) : fallback;
}

function getTableAccuracy(equipment: CustomerEquipment) {
  const detail = equipment.details.find((candidate) => /tolerance|accuracy/i.test(candidate.label));

  return detail ? customerFacingSpecValue(detail.label, detail.value) : "—";
}

function getTableEnvelope(equipment: CustomerEquipment) {
  return getTableDetail(equipment, /5-axis envelope|3-axis envelope|envelope|range|processing|turning/i);
}

function hasQueryMatch(equipment: CustomerEquipment, query: string) {
  return query.trim().length === 0 || searchableText(equipment).includes(query.trim().toLowerCase());
}

function isCustomerVisibleEquipment(equipment: CustomerEquipment) {
  if (equipment.section !== "Sheet Metal") {
    return true;
  }

  return equipment.name === "Laser cutting machine" || equipment.name === "Press brake";
}

function usesSimplifiedComparisonSchema(section: EquipmentSection) {
  return section === "Manual Machines" || section === "QC & Inspection" || section === "Sheet Metal";
}

function comparisonGridClass(section: EquipmentSection) {
  if (section === "QC & Inspection") {
    return "grid-cols-[minmax(20rem,1.6fr)_minmax(8rem,0.45fr)_minmax(10rem,0.65fr)]";
  }

  if (usesSimplifiedComparisonSchema(section)) {
    return "grid-cols-[minmax(16rem,1fr)_5rem_8.75rem]";
  }

  return "grid-cols-[minmax(14rem,1.8fr)_5rem_minmax(10rem,1.25fr)_minmax(10rem,1.25fr)_8.75rem]";
}

function EquipmentComparisonRow({ equipment, simplified }: { equipment: CustomerEquipment; simplified: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const detailId = `${equipment.slug}-comparison-details`;
  const isQcEquipment = equipment.section === "QC & Inspection";
  const customerMakeModel = equipment.makeModel;
  const customerName = equipment.name;
  const specificationLink = equipment.dataSheets?.[0]
    ? { label: "View technical data sheet", url: equipment.dataSheets[0].url }
    : equipment.onlineSpecificationUrl
      ? { label: "View online specifications", url: equipment.onlineSpecificationUrl }
      : undefined;

  return (
    <div className="border-t border-stone-200 first:border-t-0" role="row">
      <div className={`grid px-4 text-sm lg:px-5 ${comparisonGridClass(equipment.section)} ${
        isQcEquipment ? "items-start gap-6 py-3" : "items-center gap-4 py-4"
      }`}>
        <div className="min-w-0">
          <p className="truncate font-semibold text-stone-950">{customerMakeModel}</p>
          <p className="mt-0.5 truncate text-xs text-stone-500">{customerName}</p>
        </div>
        <p className="text-stone-700">{equipment.customerQuantityLabel ?? equipment.quantity}</p>
        {!simplified && <p className="truncate text-stone-700" title={getTableAccuracy(equipment)}>{getTableAccuracy(equipment)}</p>}
        {!simplified && <p className="truncate text-stone-700" title={getTableEnvelope(equipment)}>{getTableEnvelope(equipment)}</p>}
        <button
          aria-controls={detailId}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Hide" : "View"} specifications for ${customerMakeModel}`}
          className="whitespace-nowrap text-xs font-medium text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900/30"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? "Hide specifications" : "View specifications"}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-stone-200 bg-stone-50/60 px-4 py-5 lg:px-5" id={detailId} role="region" aria-label={`${customerMakeModel} specifications`}>
          <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-stone-500">Equipment specification</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-950">{equipment.summary}</dd>
            </div>
            {equipment.details.filter((detail) => isCustomerVisibleSpecification(detail) && (simplified || !isPrimaryComparisonSpecification(detail))).map((detail) => (
              <div key={`${equipment.slug}-${detail.label}`}>
                <dt className="text-xs font-medium text-stone-500">{customerFacingSpecLabel(detail.label)}</dt>
                <dd className="mt-1 text-sm font-semibold text-stone-950">{/best tolerance|positional accuracy|tolerance/i.test(detail.label) ? formatPositionalAccuracy(detail.value) : customerFacingSpecValue(detail.label, detail.value)}</dd>
              </div>
            ))}
          </dl>
          {specificationLink && (
            <a className="mt-5 inline-flex text-sm font-medium text-blue-700 underline-offset-4 hover:text-blue-900 hover:underline" href={specificationLink.url} rel="noreferrer" target="_blank">
              {specificationLink.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Active customer-facing catalog. Photos remain preserved in VendorEquipment,
 * but comparison is deliberately image-independent.
 */
export function EquipmentCatalog({ equipment }: { equipment: CustomerEquipment[] }) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState<"all" | EquipmentSection>("all");
  const [equipmentType, setEquipmentType] = useState("all");
  const customerVisibleEquipment = useMemo(() => equipment.filter(isCustomerVisibleEquipment), [equipment]);

  const equipmentTypeCounts = useMemo(
    () => new Map(equipmentTypeFilters.map((filter) => [filter.id, customerVisibleEquipment.filter(filter.matches).length])),
    [customerVisibleEquipment],
  );

  const groupedEquipment = useMemo(() => {
    const filtered = customerVisibleEquipment.filter((equipment) => {
      const matchesSection = section === "all" || equipment.section === section;
      const selectedType = equipmentTypeFilters.find((filter) => filter.id === equipmentType) ?? equipmentTypeFilters[0];

      return matchesSection && selectedType.matches(equipment) && hasQueryMatch(equipment, query);
    });

    return equipmentSections
      .map((equipmentSection) => ({
        section: equipmentSection,
        equipment: alphabetizeEquipment(filtered.filter((equipment) => equipment.section === equipmentSection)),
      }))
      .filter((group) => group.equipment.length > 0);
  }, [customerVisibleEquipment, equipmentType, query, section]);

  const totalSets = customerVisibleEquipment.reduce((total, equipment) => total + (Number(equipment.quantity.match(/\d+/)?.[0]) || 0), 0);
  const filteredCount = groupedEquipment.reduce((total, group) => total + group.equipment.length, 0);

  return (
    <section aria-labelledby="equipment-catalog-heading">
      <div className="mb-7 flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-950" id="equipment-catalog-heading">Equipment catalog</h2>
          <p className="mt-2 text-[15px] text-stone-600">Compare the documented capacity behind the Lattice network.</p>
        </div>
        <p className="text-sm font-medium text-stone-500">{customerVisibleEquipment.length} machine models · {totalSets} total sets</p>
      </div>

      <div className="mb-6">
        <div className="grid gap-3 lg:grid-cols-[minmax(15rem,1.5fr)_minmax(11rem,0.8fr)_auto]">
          <label className="sr-only" htmlFor="equipment-search">Search make or model</label>
          <input
            className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400 focus:border-stone-400"
            id="equipment-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search make or model"
            type="search"
            value={query}
          />
          <label className="sr-only" htmlFor="equipment-process">Process category</label>
          <select className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none focus:border-stone-400" id="equipment-process" onChange={(event) => setSection(event.target.value as "all" | EquipmentSection)} value={section}>
            <option value="all">All process categories</option>
            {equipmentSections.map((equipmentSection) => <option key={equipmentSection} value={equipmentSection}>{equipmentSection}</option>)}
          </select>
          <button className="h-10 rounded-lg px-3 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950" onClick={() => { setQuery(""); setSection("all"); setEquipmentType("all"); }} type="button">Reset</button>
        </div>
        <div aria-label="Equipment type" className="mt-5" role="group">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Equipment type</p>
          <div className="mt-2 overflow-x-auto overflow-y-hidden border-b border-stone-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max items-center gap-5 px-1" role="list">
              {equipmentTypeFilters.map((filter) => {
                const isActive = filter.id === equipmentType;
                const count = equipmentTypeCounts.get(filter.id) ?? 0;

                return (
                  <button
                    aria-label={filter.label}
                    aria-pressed={isActive}
                    className={`relative -mb-px border-b-2 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 ${
                      isActive
                        ? "border-stone-950 text-stone-950"
                        : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-950"
                    }`}
                    key={filter.id}
                    onClick={() => setEquipmentType(filter.id)}
                    type="button"
                  >
                    {filter.label} <span className={`tabular-nums ${isActive ? "text-stone-700" : "text-stone-400"}`}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="min-w-[800px]" role="table" aria-label="Vendor equipment comparison">
          {groupedEquipment.map((group) => (
            <section key={group.section} aria-labelledby={`${sectionId(group.section)}-comparison-heading`}>
              <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-2.5 lg:px-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-700" id={`${sectionId(group.section)}-comparison-heading`}>{group.section}</h3>
                <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] text-stone-500">{group.equipment.length} models</span>
              </div>
              <div className={`grid border-b border-stone-200 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500 lg:px-5 ${comparisonGridClass(group.section)} ${
                group.section === "QC & Inspection" ? "gap-6" : "gap-4"
              }`} role="row">
                <span>Make / model</span><span>Sets</span>
                {!usesSimplifiedComparisonSchema(group.section) && <><span>Positional accuracy (X/Y/Z)</span><span>Work envelope (X × Y × Z)</span></>}
                <span aria-hidden="true" className="invisible whitespace-nowrap text-xs font-medium">View specifications</span>
              </div>
              {group.equipment.map((equipment) => <EquipmentComparisonRow equipment={equipment} key={equipment.slug} simplified={usesSimplifiedComparisonSchema(group.section)} />)}
            </section>
          ))}

          {groupedEquipment.length === 0 && (
            <p className="px-5 py-10 text-sm text-stone-600">No equipment matches these filters.</p>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-stone-500">{filteredCount} matching machine models · Model photos remain attached to their equipment records.</p>
    </section>
  );
}
