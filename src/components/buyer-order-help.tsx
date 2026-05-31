"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, MessageSquare, PackageCheck, Truck } from "lucide-react";
import { FormEvent, useState } from "react";

import type { LatticeRequest, SupplierOrderStatus } from "@/lib/request-model";

const supplierStatusLabels: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "Awaiting supplier acknowledgment",
  DOCUMENTS_UPLOADED: "Quality documents uploaded",
  IN_PRODUCTION: "In production",
  QC_IN_PROGRESS: "QC in progress",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
};

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function quoteReference(order: LatticeRequest) {
  return order.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function HelpCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">{label}</p>
      <p className="mt-2 text-[14px] font-semibold text-[#202020]">{value}</p>
    </div>
  );
}

export function BuyerOrderHelp({ order }: { order: LatticeRequest }) {
  const [submitted, setSubmitted] = useState(false);
  const primaryLine = order.lineItems[0];
  const supplierName = order.supplierOrder.shopName || "Supplier pending";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 pb-10">
      <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6f737a] transition hover:text-[#171717]" href={`/orders/${order.id}`}>
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
        Back to order
      </Link>

      <section className="border-b border-[#e6e6e6] pb-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Order support</p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Request help with this order</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              Send Lattice the issue, context, and urgency. Your account manager will use the order package, supplier status, and files below to follow up.
            </p>
          </div>
          <div className="rounded-md border border-[#e7e7e7] bg-white px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">{orderReference(order)}</p>
            <p className="mt-1 text-[14px] font-semibold text-[#202020]">{order.title}</p>
          </div>
        </div>
      </section>

      <section aria-label="Order help context" className="grid gap-3 md:grid-cols-4">
        <HelpCard label="Status" value={supplierStatusLabels[order.supplierOrder.status]} />
        <HelpCard label="Supplier" value={supplierName} />
        <HelpCard label="Reference quote" value={quoteReference(order)} />
        <HelpCard label="Updated" value={formatDate(order.updatedAt)} />
      </section>

      {submitted ? (
        <section className="rounded-md border border-emerald-200 bg-emerald-50 p-6 text-emerald-950">
          <div className="flex items-start gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <h2 className="text-[18px] font-semibold">Help request sent</h2>
              <p className="mt-2 text-[14px] leading-6 text-emerald-800">
                Lattice has the order context and your note. Erik Mast will follow up with the next step for {orderReference(order)}.
              </p>
              <Link className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b]" href={`/orders/${order.id}`}>
                Return to order
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form className="overflow-hidden rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]" onSubmit={handleSubmit}>
            <div className="border-b border-[#eeeeee] px-6 py-5">
              <h2 className="text-[16px] font-semibold text-[#202020]">What do you need help with?</h2>
              <p className="mt-1 text-[13px] leading-5 text-[#6f737a]">Choose the closest issue type and add enough context for the Lattice team to act.</p>
            </div>

            <div className="space-y-5 p-6">
              <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                Issue type
                <select className="min-h-11 rounded-md border border-[#dedede] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none transition focus:border-[#9b9b9b]" defaultValue="production_update" name="issueType">
                  <option value="production_update">Production or delivery update</option>
                  <option value="quality_documents">Quality documents or inspection records</option>
                  <option value="shipping_tracking">Shipping, customs, or tracking</option>
                  <option value="part_specification">Part specification or drawing question</option>
                  <option value="commercial">Invoice, PO, tax, or payment</option>
                  <option value="other">Something else</option>
                </select>
              </label>

              <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                Message
                <textarea
                  className="min-h-44 rounded-md border border-[#dedede] bg-white px-3 py-3 text-[14px] leading-6 text-[#202020] outline-none transition placeholder:text-[#a0a6af] focus:border-[#9b9b9b]"
                  name="message"
                  placeholder="Tell us what changed, what you need clarified, or what decision is blocked."
                  required
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                  Urgency
                  <select className="min-h-11 rounded-md border border-[#dedede] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none transition focus:border-[#9b9b9b]" defaultValue="normal" name="urgency">
                    <option value="normal">Normal</option>
                    <option value="today">Need response today</option>
                    <option value="blocked">Order is blocked</option>
                  </select>
                </label>

                <label className="grid gap-2 text-[13px] font-semibold text-[#30343a]">
                  Preferred follow-up
                  <select className="min-h-11 rounded-md border border-[#dedede] bg-white px-3 text-[14px] font-medium text-[#202020] outline-none transition focus:border-[#9b9b9b]" defaultValue="email" name="followUp">
                    <option value="email">Email</option>
                    <option value="phone">Phone call</option>
                    <option value="workspace">Workspace update</option>
                  </select>
                </label>
              </div>

              <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#171717] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b]" type="submit">
                Send help request
              </button>
            </div>
          </form>

          <aside className="space-y-5">
            <section className="rounded-md border border-[#e7e7e7] bg-white p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">
                <PackageCheck aria-hidden="true" className="h-4 w-4" />
                Order package
              </div>
              <dl className="mt-4 space-y-3 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Part</dt>
                  <dd className="text-right font-semibold text-[#202020]">{primaryLine?.partName ?? "Not recorded"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Quantity</dt>
                  <dd className="text-right font-semibold text-[#202020]">{primaryLine?.quantity ?? "Pending"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#6f737a]">Process</dt>
                  <dd className="text-right font-semibold text-[#202020]">{order.process}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-md border border-[#e7e7e7] bg-white p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">
                <Truck aria-hidden="true" className="h-4 w-4" />
                Shipping
              </div>
              <p className="mt-4 text-[13px] leading-6 text-[#5f6670]">
                Carrier: {order.supplierOrder.status === "SHIPPED" ? "UPS International Priority" : "Pending booking"}
                <br />
                Tracking: {order.supplierOrder.trackingNumber || "Pending shipment"}
              </p>
            </section>

            <section className="rounded-md border border-[#e7e7e7] bg-white p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">
                <FileText aria-hidden="true" className="h-4 w-4" />
                Files
              </div>
              <ul className="mt-4 space-y-2 text-[13px]">
                {order.files.map((file) => (
                  <li className="truncate rounded-md border border-[#eeeeee] bg-[#fafafa] px-3 py-2 font-semibold text-[#202020]" key={file.id}>
                    {file.name}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-md border border-[#e7e7e7] bg-white p-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">
                <MessageSquare aria-hidden="true" className="h-4 w-4" />
                Account manager
              </div>
              <p className="mt-4 text-[13px] font-semibold text-[#202020]">Erik Mast</p>
              <p className="mt-1 text-[13px] leading-5 text-[#6f737a]">Order help, supplier follow-up, quality documents, and delivery coordination.</p>
              <p className="mt-2 text-[13px] text-[#2f73c8]">erik.mast@latticeos.com</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
