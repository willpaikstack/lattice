import type { CustomerEquipment } from "./customer-equipment";

export const explorerProcesses = ["CNC Milling", "CNC Lathe", "Sheet Metal", "EDM", "QC & Inspection", "Manual Machines"] as const;
export type ExplorerProcess = typeof explorerProcesses[number];
export type EquipmentSpecification = { label: string; value: string };
export type ExplorerEquipment = {
  id: string;
  model: string;
  type: string;
  process: ExplorerProcess;
  quantity: string;
  summary: string;
  sourceNote: string | null;
  axis: string | null;
  specifications: EquipmentSpecification[];
  envelopes: EquipmentSpecification[];
  precision: EquipmentSpecification[];
  operating: EquipmentSpecification[];
  references: { label: string; url: string }[];
};

export function isExplorerEquipment(item: CustomerEquipment) {
  return explorerProcesses.some(process => process === item.section) &&
    (item.section !== "Sheet Metal" || ["Laser cutting machine", "Press brake"].includes(item.name));
}

export function formatEquipmentValue(label: string, value: string) {
  const formatted = value.replace(/\+\/-/g, "±").replace(/Dia\.\s*/gi, "Ø").replace(/\s+x\s+/gi, " × ");
  return /rpm/i.test(label) && !/rpm/i.test(formatted) ? `${formatted} RPM` : formatted;
}

// Preserve the source's terminology; accuracy, tolerance and repeatability are
// different claims. Internal serial numbers and calibration metadata stay private.
export function visibleEquipmentSpecifications(item: CustomerEquipment) {
  return item.details
    .filter(detail => !/calibrat|machine no|department|agency|source row|arrival|brand.*origin|sheet metal deck note/i.test(detail.label) && !/calibrat/i.test(detail.value))
    .map(detail => ({ label: detail.label, value: formatEquipmentValue(detail.label, detail.value) }));
}

export function millingAxis(item: Pick<CustomerEquipment, "section" | "name" | "details">) {
  if (item.section !== "CNC Milling") return null;
  const explicit = item.details.find(detail => /axis count|axis configuration/i.test(detail.label))?.value ?? item.name;
  if (/3\s*\+\s*2/.test(explicit)) return "3+2";
  const match = explicit.match(/\b([345])(?:\s*[- ]?\s*ax(?:is|es)|$)/i);
  return match ? `${match[1]}-axis` : null;
}

export function filterExplorerEquipment(items: ExplorerEquipment[], filters: { process: string; query: string; axis: string; documentedEnvelope: boolean; publicReference: boolean }) {
  const terms = filters.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (filters.process !== "all" && item.process !== filters.process) return false;
    if (filters.axis !== "all" && item.axis !== filters.axis) return false;
    if (filters.documentedEnvelope && item.envelopes.length === 0) return false;
    if (filters.publicReference && item.references.length === 0) return false;
    const text = [item.model, item.type, item.id, ...item.specifications.map(detail => `${detail.label} ${detail.value}`)].join(" ").toLowerCase();
    return terms.every(term => text.includes(term));
  });
}
