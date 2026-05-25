import { SupplierOrders } from "@/components/supplier-orders";
import { listSupplierOrders } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function SupplierOrdersPage() {
  const orders = await listSupplierOrders();

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">China machine shop</p>
        <h1 className="mt-3 text-5xl font-semibold uppercase tracking-tight text-slate-950">Supplier Orders</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Receive awarded work, update production and QC status, upload quality documentation, and keep shipment details visible to the Lattice team.
        </p>
      </section>

      <SupplierOrders orders={orders} />
    </div>
  );
}
