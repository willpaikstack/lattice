"use client";

import { Check, CheckCircle2, ChevronDown, Circle, PackageCheck, Truck, UserRoundCog } from "lucide-react";
import { useState } from "react";

import type { LatticeRequest, OrderResponsibleParty, SupplierOrderStatus } from "@/lib/request-model";
import { supplierOrderStatusSequence } from "@/lib/request-model";

type StatusOption = {
  value: SupplierOrderStatus;
  label: string;
  shortLabel: string;
  suggestedMilestone: string;
  suggestedOwner: OrderResponsibleParty;
};

const statusOptions: StatusOption[] = [
  { value: "AWAITING_ACKNOWLEDGMENT", label: "Awaiting supplier acknowledgment", shortLabel: "Acknowledgment", suggestedMilestone: "Supplier start confirmation", suggestedOwner: "Supplier" },
  { value: "IN_PRODUCTION", label: "In production", shortLabel: "Production", suggestedMilestone: "Production completion", suggestedOwner: "Supplier" },
  { value: "QC_IN_PROGRESS", label: "Quality review", shortLabel: "Quality", suggestedMilestone: "Quality inspection complete", suggestedOwner: "Supplier" },
  { value: "DOCUMENTS_UPLOADED", label: "Quality documents ready", shortLabel: "Documents", suggestedMilestone: "Quality document review", suggestedOwner: "Lattice" },
  { value: "READY_TO_SHIP", label: "Ready to ship", shortLabel: "Ready to ship", suggestedMilestone: "Carrier pickup", suggestedOwner: "Lattice" },
  { value: "SHIPPED", label: "Shipped", shortLabel: "Shipping", suggestedMilestone: "Customer delivery", suggestedOwner: "Lattice" },
  { value: "DELIVERED", label: "Delivered", shortLabel: "Delivered", suggestedMilestone: "", suggestedOwner: "Lattice" },
];

const responsiblePartyOptions: OrderResponsibleParty[] = ["Lattice", "Supplier", "Customer"];

const statusTone: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "border-blue-200 bg-blue-50 text-blue-700",
  IN_PRODUCTION: "border-indigo-200 bg-indigo-50 text-indigo-700",
  QC_IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-800",
  DOCUMENTS_UPLOADED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  READY_TO_SHIP: "border-cyan-200 bg-cyan-50 text-cyan-800",
  SHIPPED: "border-[#484848] bg-[#484848] text-white",
  DELIVERED: "border-emerald-300 bg-emerald-100 text-emerald-800",
};

function statusOption(status: SupplierOrderStatus) {
  return statusOptions.find((option) => option.value === status) ?? statusOptions[0];
}

function formatPreviewDate(value: string) {
  if (!value) {
    return "Date needed";
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day));
}

export function AdminOrderProgressForm({
  order,
  updateAction,
}: {
  order: LatticeRequest;
  updateAction: (formData: FormData) => void | Promise<void>;
}) {
  const initialStatusIndex = supplierOrderStatusSequence.indexOf(order.supplierOrder.status);
  const initialStatus = statusOption(order.supplierOrder.status);
  const hasStoredMilestone = Boolean(order.supplierOrder.nextMilestone.trim());
  const [status, setStatus] = useState(order.supplierOrder.status);
  const [nextMilestone, setNextMilestone] = useState(order.supplierOrder.nextMilestone || initialStatus.suggestedMilestone);
  const [nextMilestoneDate, setNextMilestoneDate] = useState(order.supplierOrder.nextMilestoneDate);
  const [responsibleParty, setResponsibleParty] = useState(hasStoredMilestone ? order.supplierOrder.responsibleParty : initialStatus.suggestedOwner);
  const [customerUpdate, setCustomerUpdate] = useState("");
  const selectedStatus = statusOption(status);
  const selectedStatusIndex = supplierOrderStatusSequence.indexOf(status);
  const isComplete = status === "DELIVERED";
  const showTracking = status === "SHIPPED" || status === "DELIVERED";
  const canPublish = Boolean(customerUpdate.trim() && (isComplete || (nextMilestone.trim() && nextMilestoneDate)));

  function changeStatus(nextStatus: SupplierOrderStatus) {
    const next = statusOption(nextStatus);
    setStatus(nextStatus);
    setNextMilestone(next.suggestedMilestone);
    setResponsibleParty(next.suggestedOwner);

    if (nextStatus === "DELIVERED") {
      setNextMilestoneDate("");
    }
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#e3e3e3] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[#202020]">Update order progress</h2>
          <p className="mt-1 text-[13px] text-[#767676]">Set the next customer-visible milestone.</p>
        </div>
        <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold ${statusTone[status]}`}>
          <PackageCheck aria-hidden="true" className="h-3.5 w-3.5" />
          {selectedStatus.label}
        </span>
      </div>

      <form action={updateAction}>
        <div className="overflow-x-auto border-b border-[#eeeeee] bg-[#fafafa] px-5 py-4">
          <ol aria-label="Order lifecycle" className="grid min-w-[780px] grid-cols-7 gap-2">
            {statusOptions.map((option, index) => {
              const isCurrent = index === selectedStatusIndex;
              const isPast = index < selectedStatusIndex;

              return (
                <li className="relative flex min-w-0 items-center gap-2" key={option.value}>
                  {isPast ? (
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-[#00A699]" />
                  ) : isCurrent ? (
                    <Circle aria-hidden="true" className="h-5 w-5 shrink-0 fill-[#FF5A5F] text-[#FF5A5F]" />
                  ) : (
                    <Circle aria-hidden="true" className="h-5 w-5 shrink-0 text-[#c7c7c7]" />
                  )}
                  <span className={`truncate text-[11px] font-semibold ${isCurrent ? "text-[#202020]" : isPast ? "text-[#5f6670]" : "text-[#9a9a9a]"}`}>{option.shortLabel}</span>
                  {index < statusOptions.length - 1 ? <span aria-hidden="true" className="absolute left-[calc(100%-5px)] top-1/2 hidden h-px w-3 bg-[#d8d8d8] xl:block" /> : null}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1.5fr_0.9fr_0.8fr]">
            <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
              Status
              <span className="relative">
                <select
                  className="h-10 w-full appearance-none rounded-md border border-[#d9d9d9] bg-white px-3 pr-9 text-[14px] font-medium text-[#202020] outline-none transition focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]"
                  name="status"
                  onChange={(event) => changeStatus(event.target.value as SupplierOrderStatus)}
                  value={status}
                >
                  {statusOptions.map((option, index) => <option disabled={index < initialStatusIndex} key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#767676]" />
              </span>
            </label>

            {!isComplete ? (
              <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                Next milestone
                <input className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]" name="nextMilestone" onChange={(event) => setNextMilestone(event.target.value)} placeholder="What happens next?" required value={nextMilestone} />
              </label>
            ) : <input name="nextMilestone" type="hidden" value="" />}

            {!isComplete ? (
              <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                Expected date
                <input className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#202020] outline-none transition focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]" name="nextMilestoneDate" onChange={(event) => setNextMilestoneDate(event.target.value)} required type="date" value={nextMilestoneDate} />
              </label>
            ) : <input name="nextMilestoneDate" type="hidden" value="" />}

            {!isComplete ? (
              <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                Waiting on
                <select className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none transition focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]" name="responsibleParty" onChange={(event) => setResponsibleParty(event.target.value as OrderResponsibleParty)} value={responsibleParty}>
                  {responsiblePartyOptions.map((party) => <option key={party} value={party}>{party}</option>)}
                </select>
              </label>
            ) : <input name="responsibleParty" type="hidden" value="Lattice" />}
          </div>

          <details className="rounded-md border border-[#e7e7e7] bg-[#fafafa]">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-[13px] font-semibold text-[#484848] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A5F]">
              <span className="flex items-center gap-2"><UserRoundCog aria-hidden="true" className="h-4 w-4 text-[#767676]" />Internal details</span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-[#767676]" />
            </summary>
            <div className={`grid gap-4 border-t border-[#e7e7e7] p-4 ${showTracking ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
              <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                Internal owner
                <input className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#202020] outline-none transition focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]" defaultValue={order.operatorReview.assignedOwner ?? ""} name="assignedOwner" placeholder="Assign a Lattice operator" />
              </label>
              {showTracking ? (
                <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                  Tracking number
                  <input className="h-10 rounded-md border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#202020] outline-none transition focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]" defaultValue={order.supplierOrder.trackingNumber} name="trackingNumber" placeholder="Carrier tracking number" />
                </label>
              ) : <input name="trackingNumber" type="hidden" value={order.supplierOrder.trackingNumber} />}
            </div>
          </details>

          <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
            <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
              Customer update
              <textarea className="min-h-28 resize-y rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-[14px] leading-6 text-[#202020] outline-none transition placeholder:text-[#9a9a9a] focus:border-[#FF5A5F] focus:ring-2 focus:ring-[#ffe1e3]" name="customerUpdate" onChange={(event) => setCustomerUpdate(event.target.value)} placeholder="Explain what changed and what the customer can expect next." required value={customerUpdate} />
            </label>

            <section aria-label="Customer preview" className="rounded-md border border-[#e4e4e4] bg-[#fafafa] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#767676]">Customer preview</p>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-semibold ${statusTone[status]}`}><Check aria-hidden="true" className="h-3 w-3" />{selectedStatus.label}</span>
              </div>
              {!isComplete ? <p className="mt-4 text-[13px] font-semibold text-[#30343a]">Next: {nextMilestone || "Milestone needed"} · {formatPreviewDate(nextMilestoneDate)}</p> : <p className="mt-4 text-[13px] font-semibold text-[#30343a]">Order delivered</p>}
              {!isComplete ? <p className="mt-1 text-[12px] text-[#767676]">Waiting on {responsibleParty}</p> : null}
              <p className={`mt-3 text-[13px] leading-5 ${customerUpdate.trim() ? "text-[#484848]" : "text-[#9a9a9a]"}`}>{customerUpdate.trim() || "Your customer-facing update will appear here."}</p>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-[#eeeeee] bg-[#fafafa] px-5 py-4">
          <button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-[#c7c7c7]" disabled={!canPublish} type="submit">
            <Truck aria-hidden="true" className="h-4 w-4" />
            Publish update
          </button>
        </div>
      </form>
    </section>
  );
}
