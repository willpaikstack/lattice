"use client";

import { Archive } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { LatticeRequest, SupplierOrderStatus } from "@/lib/request-model";

type ArchiveOrderAction = (formData: FormData) => void | Promise<void>;

const supplierStatusCopy: Record<SupplierOrderStatus, { label: string; tone: string; nextAction: string }> = {
  AWAITING_ACKNOWLEDGMENT: { label: "Awaiting acknowledgment", nextAction: "Confirm supplier start", tone: "border-blue-100 bg-blue-50 text-blue-700" },
  IN_PRODUCTION: { label: "In production", nextAction: "Monitor production", tone: "border-indigo-100 bg-indigo-50 text-indigo-700" },
  QC_IN_PROGRESS: { label: "QC in progress", nextAction: "Watch QC timing", tone: "border-amber-100 bg-amber-50 text-amber-700" },
  DOCUMENTS_UPLOADED: { label: "Documents uploaded", nextAction: "Review docs", tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
  READY_TO_SHIP: { label: "Ready to ship", nextAction: "Release shipment", tone: "border-cyan-100 bg-cyan-50 text-cyan-700" },
  SHIPPED: { label: "Shipped", nextAction: "Track delivery", tone: "border-slate-950 bg-slate-950 text-white" },
  DELIVERED: { label: "Delivered", nextAction: "Delivery complete", tone: "border-emerald-100 bg-emerald-50 text-emerald-700" },
};

const statusFilters: Array<{ label: string; value: "ALL" | SupplierOrderStatus }> = [
  { label: "All", value: "ALL" },
  { label: "Awaiting", value: "AWAITING_ACKNOWLEDGMENT" },
  { label: "Production", value: "IN_PRODUCTION" },
  { label: "QC", value: "QC_IN_PROGRESS" },
  { label: "Docs", value: "DOCUMENTS_UPLOADED" },
  { label: "Ship", value: "READY_TO_SHIP" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
];

function formatCurrency(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function selectedSupplierQuote(order: LatticeRequest) {
  return order.supplierQuotes.find((quote) => quote.isSelected) ?? order.supplierQuotes.find((quote) => quote.status === "SELECTED");
}

export function AdminOrderManagement({
  archiveAction,
  orders,
}: {
  archiveAction?: ArchiveOrderAction;
  orders: LatticeRequest[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("ALL");

  const openOrders = orders.filter((order) => order.supplierOrder.status !== "DELIVERED");
  const readyToShip = orders.filter((order) => order.supplierOrder.status === "READY_TO_SHIP").length;
  const missingDocuments = orders.filter((order) => order.supplierOrder.documents.length === 0).length;
  const orderValueCents = orders.reduce((sum, order) => sum + (order.quote.estimatedPriceCents ?? 0), 0);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const primaryLine = order.lineItems[0];
      const selectedQuote = selectedSupplierQuote(order);
      const matchesStatus = statusFilter === "ALL" || order.supplierOrder.status === statusFilter;
      const searchable = [
        order.title,
        order.process,
        order.buyerCompany,
        order.requesterName,
        orderReference(order),
        order.supplierOrder.shopName,
        order.supplierOrder.contactName,
        order.supplierOrder.trackingNumber,
        selectedQuote?.country,
        primaryLine?.partName,
        primaryLine?.material,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [orders, query, statusFilter]);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Placed orders</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{orders.length}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Open orders</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{openOrders.length}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Missing docs</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{missingDocuments}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Order value</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{formatCurrency(orderValueCents)}</p>
        </article>
      </section>

      {orders.length === 0 ? (
        <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
          <h2 className="text-[22px] font-semibold text-[#202020]">No placed orders yet</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">Accepted buyer quotes will appear here once converted into orders.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
          <div className="border-b border-[#eeeeee] p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <label className="relative block xl:w-[360px]">
                <span className="sr-only">Search placed orders</span>
                <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" fill="none" viewBox="0 0 20 20">
                  <path d="m14 14 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
                  <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <input
                  className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search order, customer, shop..."
                  type="search"
                  value={query}
                />
              </label>
              <div aria-label="Admin order status filters" className="flex gap-2 overflow-x-auto pb-1">
                {statusFilters.map((filter) => {
                  const isActive = statusFilter === filter.value;

                  return (
                    <button
                      className={`h-9 shrink-0 rounded-md border px-3 text-[13px] font-semibold transition ${
                        isActive ? "border-[#FF5A5F] bg-[#FF5A5F] text-white" : "border-[#ffd1d4] bg-white text-[#767676] hover:bg-[#fff1f2]"
                      }`}
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      type="button"
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1.14fr_0.72fr_0.72fr_0.58fr_0.58fr_0.78fr_auto] gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
            <span>Order</span>
            <span>Customer</span>
            <span>Shop</span>
            <span>Value</span>
            <span>Docs</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-[#eeeeee]">
            {filteredOrders.map((order) => {
              const primaryLine = order.lineItems[0];
              const selectedQuote = selectedSupplierQuote(order);
              const status = supplierStatusCopy[order.supplierOrder.status];

              return (
                <article
                  className="group relative grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-within:bg-[#fafafa] xl:grid-cols-[1.14fr_0.72fr_0.72fr_0.58fr_0.58fr_0.78fr_auto] xl:items-center"
                  key={order.id}
                >
                  <Link
                    aria-label={`Manage order for ${order.title}`}
                    className="absolute inset-0 z-0 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A5F]"
                    href={`/admin/orders/${order.id}`}
                  />
                  <div className="relative z-10 min-w-0 pointer-events-none">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{orderReference(order)}</span>
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                    </div>
                    <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{order.title}</h2>
                    <p className="mt-1 truncate text-[13px] text-[#69707a]">
                      {primaryLine?.partName ?? "No line item"} - Qty {primaryLine?.quantity ?? 0}
                    </p>
                  </div>

                  <div className="relative z-10 pointer-events-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Customer</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{order.buyerCompany}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{order.requesterName}</p>
                  </div>

                  <div className="relative z-10 pointer-events-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Shop</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{order.supplierOrder.shopName || "Shop pending"}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{selectedQuote?.country ?? order.supplierOrder.contactName ?? "Contact pending"}</p>
                  </div>

                  <div className="relative z-10 pointer-events-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Value</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{formatCurrency(order.quote.estimatedPriceCents)}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{order.quote.leadTimeDays ? `${order.quote.leadTimeDays} days` : "Lead pending"}</p>
                  </div>

                  <div className="relative z-10 pointer-events-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Docs</p>
                    <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{order.supplierOrder.documents.length} uploaded</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{order.supplierOrder.trackingNumber || "No tracking"}</p>
                  </div>

                  <div className="relative z-10 pointer-events-none">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Status</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{status.nextAction}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">Updated {formatUpdatedAt(order.updatedAt)}</p>
                  </div>

                  <form action={archiveAction} className="relative z-10 flex xl:justify-end">
                    <input name="requestId" type="hidden" value={order.id} />
                    <button
                      aria-label={`Archive order for ${order.title}`}
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-[#ffd1d4] bg-white px-3 text-[12px] font-semibold text-[#767676] transition hover:border-[#FF5A5F] hover:bg-[#fff1f2] hover:text-[#FF5A5F] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!archiveAction}
                      type="submit"
                    >
                      <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  </form>
                </article>
              );
            })}

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center">
                <h2 className="text-[18px] font-semibold text-[#202020]">No orders match this view.</h2>
                <p className="mt-2 text-[14px] text-[#6f737a]">Clear the search or choose a different status filter.</p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
            <span>
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            <span>{readyToShip} ready to ship</span>
          </div>
        </section>
      )}
    </div>
  );
}
