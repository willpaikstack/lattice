"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { LatticeRequest, SupplierOrderStatus } from "@/lib/request-model";

const supplierStatusCopy: Record<SupplierOrderStatus, { label: string; tone: string; nextAction: string }> = {
  AWAITING_ACKNOWLEDGMENT: {
    label: "Awaiting supplier acknowledgment",
    nextAction: "Awaiting acknowledgment",
    tone: "border-blue-100 bg-blue-50 text-blue-700",
  },
  IN_PRODUCTION: {
    label: "In production",
    nextAction: "Monitor production",
    tone: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
  QC_IN_PROGRESS: {
    label: "QC in progress",
    nextAction: "Quality inspection",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
  },
  DOCUMENTS_UPLOADED: {
    label: "Quality documents uploaded",
    nextAction: "Review documents",
    tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  READY_TO_SHIP: {
    label: "Ready to ship",
    nextAction: "Confirm shipment",
    tone: "border-cyan-100 bg-cyan-50 text-cyan-700",
  },
  SHIPPED: {
    label: "Shipped",
    nextAction: "Track shipment",
    tone: "border-slate-950 bg-slate-950 text-white",
  },
};

function formatPrice(cents: number | null) {
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
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

export function BuyerOrders({ orders }: { orders: LatticeRequest[] }) {
  const [query, setQuery] = useState("");

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((order) => {
      const primaryLine = order.lineItems[0];
      const searchable = [
        order.title,
        order.process,
        order.buyerCompany,
        orderReference(order),
        order.supplierOrder.shopName,
        order.supplierOrder.trackingNumber,
        primaryLine?.partName,
        primaryLine?.material,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [orders, query]);

  if (orders.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
        <h2 className="text-[22px] font-semibold text-[#202020]">No purchased orders yet.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
          Convert a priced quote into an order first. Purchased quotes will appear here for order tracking.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold transition hover:bg-[#2b2b2b]"
            href="/quotes"
            style={{ color: "#ffffff" }}
          >
            View Quotes
          </Link>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dcdcdc] bg-white px-4 text-[14px] font-semibold text-[#3f444b] transition hover:bg-[#f8f8f8]" href="/requests/new">
            Request Quote
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-[360px]">
            <span className="sr-only">Search orders</span>
            <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" fill="none" viewBox="0 0 20 20">
              <path d="m14 14 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
              <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            <input
              className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, part, supplier..."
              type="search"
              value={query}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-[1.2fr_0.66fr_0.58fr_0.6fr_0.8fr_0.74fr] gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
        <span>Order</span>
        <span>Supplier</span>
        <span>Price</span>
        <span>Lead time</span>
        <span>Status</span>
        <span>Updated</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {filteredOrders.map((order) => {
          const primaryLine = order.lineItems[0];
          const status = supplierStatusCopy[order.supplierOrder.status];
          const material = primaryLine?.material ?? "Material pending";

          return (
            <Link
              aria-label={`View order details for ${order.title}`}
              className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#171717] xl:grid-cols-[1.2fr_0.66fr_0.58fr_0.6fr_0.8fr_0.74fr] xl:items-center"
              href={`/orders/${order.id}`}
              key={order.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{orderReference(order)}</span>
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
                </div>
                <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{order.title}</h2>
                <p className="mt-1 truncate text-[13px] text-[#69707a]">
                  {primaryLine?.partName ?? "No line item"} - {material}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Supplier</p>
                <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{order.supplierOrder.shopName || "Supplier pending"}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">{order.supplierOrder.trackingNumber ? `Tracking ${order.supplierOrder.trackingNumber}` : order.process}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Price</p>
                <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{formatPrice(order.quote.estimatedPriceCents)}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Lead time</p>
                <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{order.quote.leadTimeDays ? `${order.quote.leadTimeDays} days` : "Pending"}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Status</p>
                <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{status.nextAction}</p>
                <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#747a83]">{status.label}</p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Updated</p>
                <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{formatUpdatedAt(order.updatedAt)}</p>
                <p className="mt-1 text-[12px] text-[#8a8f98]">Due {order.dueDate}</p>
              </div>
            </Link>
          );
        })}

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="text-[18px] font-semibold text-[#202020]">No orders match this search.</h2>
            <p className="mt-2 text-[14px] text-[#6f737a]">Clear the search to see every order.</p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
        <span>
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
        <span>Rows open order details</span>
      </div>
    </section>
  );
}
