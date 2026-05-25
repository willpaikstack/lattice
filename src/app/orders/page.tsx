import { BuyerOrders } from "@/components/buyer-orders";
import { listBuyerOrders } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await listBuyerOrders();

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Manage</p>
        <h1 className="mt-3 text-5xl font-semibold uppercase tracking-tight text-slate-950">My Orders</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Track purchased quotes after buyer conversion. This is the first owned-code order spine; supplier fulfillment milestones can layer on next.
        </p>
      </section>

      <BuyerOrders orders={orders} />
    </div>
  );
}
