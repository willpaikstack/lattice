import { EquipmentCatalog } from "./equipment-catalog";

export default function EquipmentPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-10 max-w-3xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Your Resources</span>
        </div>
        <h1 className="mb-4 text-4xl font-semibold tracking-tight text-stone-900">Vendor Equipment</h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-stone-600">
          Browse the machines, inspection tools, and fabrication equipment behind Lattice vendor capacity. Use the section filters to narrow by process, tolerance, work envelope, and production role before routing an RFQ.
        </p>
      </div>

      <EquipmentCatalog />
    </div>
  );
}
