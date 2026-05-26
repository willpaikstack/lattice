import Link from "next/link";

import type { LatticeRequest, SupplierOrderStatus } from "@/lib/request-model";

const supplierStatusLabels: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "Awaiting acknowledgment",
  IN_PRODUCTION: "In production",
  QC_IN_PROGRESS: "QC in progress",
  DOCUMENTS_UPLOADED: "Documents uploaded",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
};

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

function selectedSupplierQuote(order: LatticeRequest) {
  return order.supplierQuotes.find((quote) => quote.isSelected) ?? order.supplierQuotes.find((quote) => quote.status === "SELECTED");
}

export function AdminOrderManagement({ orders }: { orders: LatticeRequest[] }) {
  const openOrders = orders.filter((order) => order.supplierOrder.status !== "SHIPPED");
  const readyToShip = orders.filter((order) => order.supplierOrder.status === "READY_TO_SHIP").length;
  const missingDocuments = orders.filter((order) => order.supplierOrder.documents.length === 0).length;
  const orderValueCents = orders.reduce((sum, order) => sum + (order.quote.estimatedPriceCents ?? 0), 0);

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

      <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#eeeeee] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Placed orders</h2>
            <p className="mt-1 text-[14px] leading-5 text-[#707782]">
              Track each customer order against the overseas shop responsible for production.
            </p>
          </div>
          <span className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm font-semibold text-[#262626]">
            {readyToShip} ready to ship
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[15px] font-semibold text-[#202020]">No placed orders yet</p>
            <p className="mt-2 text-[14px] text-[#707782]">Accepted buyer quotes will appear here once converted into orders.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#eeeeee]">
            {orders.map((order) => {
              const primaryLine = order.lineItems[0];
              const selectedQuote = selectedSupplierQuote(order);

              return (
                <article className="grid gap-5 p-5 xl:grid-cols-[1fr_0.95fr_0.72fr]" key={order.id}>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-700">
                        Purchased
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-700">
                        {supplierStatusLabels[order.supplierOrder.status]}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[17px] font-semibold text-[#202020]">
                      <Link className="transition hover:text-blue-700" href={`/supplier/orders/${order.id}`}>
                        {order.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-[14px] text-[#4b5563]">
                      Customer: <span className="font-semibold text-[#202020]">{order.buyerCompany}</span>
                    </p>
                    <p className="mt-1 text-[13px] text-[#707782]">
                      {order.requesterName} - {primaryLine?.partName ?? "No line item"} - Qty {primaryLine?.quantity ?? 0}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#eeeeee] bg-[#f8fafc] p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Fabrication shop</p>
                    <p className="mt-3 text-[15px] font-semibold text-[#202020]">{order.supplierOrder.shopName}</p>
                    <p className="mt-1 text-[13px] text-[#707782]">{order.supplierOrder.contactName || "No contact recorded"}</p>
                    {selectedQuote ? (
                      <div className="mt-3 grid gap-2 text-[13px] text-[#4b5563] sm:grid-cols-2">
                        <span>{selectedQuote.country}</span>
                        <span>{formatCurrency(selectedQuote.priceCents)}</span>
                        <span>{selectedQuote.leadTimeDays ? `${selectedQuote.leadTimeDays} days` : "Lead time pending"}</span>
                        <span>{selectedQuote.notes || "No quote notes"}</span>
                      </div>
                    ) : (
                      <p className="mt-3 text-[13px] leading-5 text-[#707782]">
                        No selected shop quote is attached yet. The order is linked to the supplier order shop record.
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-[#eeeeee] bg-white p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Order controls</p>
                    <p className="mt-3 text-[22px] font-semibold text-[#171717]">{formatCurrency(order.quote.estimatedPriceCents)}</p>
                    <p className="mt-1 text-[13px] text-[#707782]">
                      {order.supplierOrder.documents.length} docs - {order.supplierOrder.trackingNumber || "No tracking"}
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <Link className="rounded-md bg-[#171717] px-3 py-2 text-center text-sm font-semibold text-white" href={`/supplier/orders/${order.id}`}>
                        Manage order
                      </Link>
                      <Link className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-center text-sm font-semibold text-[#262626]" href={`/quotes/${order.id}`}>
                        Source quote
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
