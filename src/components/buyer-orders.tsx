import Link from "next/link";

import type { LatticeRequest } from "@/lib/request-model";

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Price not recorded";
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function BuyerOrders({ orders }: { orders: LatticeRequest[] }) {
  if (orders.length === 0) {
    return (
      <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-950">No purchased orders yet.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Convert a priced quote into an order first. Purchased quotes will appear here for order tracking.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" href="/quotes">
            View Quotes
          </Link>
          <Link className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" href="/requests/new">
            Request Quote
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.3fr_0.7fr_0.7fr_1fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 max-lg:hidden">
        <span>Order</span>
        <span>Price</span>
        <span>Lead time</span>
        <span>Status</span>
      </div>
      <div className="divide-y divide-slate-100">
        {orders.map((order) => {
          const primaryLine = order.lineItems[0];
          return (
            <article className="grid gap-4 p-5 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1fr] lg:items-center" key={order.id}>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{order.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{primaryLine?.partName ?? "No line item"} • {order.process}</p>
              </div>
              <p className="text-sm font-semibold text-slate-950">{formatPrice(order.quote.estimatedPriceCents)}</p>
              <p className="text-sm text-slate-600">{order.quote.leadTimeDays ? `${order.quote.leadTimeDays} days` : "Pending"}</p>
              <p className="text-sm leading-6 text-slate-600">Purchased quote converted to order. Supplier/order fulfillment tracking comes next.</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
