import Link from "next/link";

import type { LatticeRequest, SupplierOrderStatus } from "@/lib/request-model";

const statusLabels: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "Awaiting acknowledgment",
  IN_PRODUCTION: "In production",
  QC_IN_PROGRESS: "QC in progress",
  DOCUMENTS_UPLOADED: "Documents uploaded",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
};

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Price pending";
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatStatus(status: SupplierOrderStatus) {
  return statusLabels[status];
}

export function SupplierOrders({ orders }: { orders: LatticeRequest[] }) {
  const activeOrders = orders.filter((order) => order.supplierOrder.status !== "SHIPPED").length;
  const documentsUploaded = orders.reduce((count, order) => count + order.supplierOrder.documents.length, 0);

  if (orders.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">No supplier orders yet.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Purchased buyer quotes will appear here for supplier acknowledgment, production status, quality documentation, and shipment updates.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Open orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{activeOrders}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Uploaded docs</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{documentsUploaded}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ready to ship</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {orders.filter((order) => order.supplierOrder.status === "READY_TO_SHIP").length}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.3fr_0.75fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 max-xl:hidden">
          <span>Order</span>
          <span>Due date</span>
          <span>Value</span>
          <span>Supplier status</span>
          <span>Documents</span>
        </div>
        <div className="divide-y divide-slate-100">
          {orders.map((order) => {
            const primaryLine = order.lineItems[0];

            return (
              <article className="grid gap-4 p-5 transition hover:bg-slate-50 xl:grid-cols-[1.3fr_0.75fr_0.8fr_0.8fr_0.7fr] xl:items-center" key={order.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Received order</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{order.process}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{order.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {primaryLine?.partName ?? "No line item"} - Qty {primaryLine?.quantity ?? 0} - {primaryLine?.material ?? "Material pending"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 xl:hidden">
                    Due {order.dueDate || "TBD"} - {formatPrice(order.quote.estimatedPriceCents)} - {formatStatus(order.supplierOrder.status)}
                  </p>
                </div>
                <p className="hidden text-sm font-medium text-slate-700 xl:block">{order.dueDate || "TBD"}</p>
                <p className="hidden text-sm font-semibold text-slate-950 xl:block">{formatPrice(order.quote.estimatedPriceCents)}</p>
                <p className="hidden text-sm text-slate-600 xl:block">{formatStatus(order.supplierOrder.status)}</p>
                <div className="flex items-center justify-between gap-3 xl:block">
                  <p className="text-sm text-slate-600">{order.supplierOrder.documents.length} files</p>
                  <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white xl:mt-3 xl:inline-flex" href={`/supplier/orders/${order.id}`}>
                    Manage
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
