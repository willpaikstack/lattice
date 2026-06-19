import { BuyerOrders } from "@/components/buyer-orders";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerOrders } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await filterCustomerVisibleRequestsForCurrentSession(await listBuyerOrders());
  const activeOrderCount = orders.filter((order) => order.supplierOrder.status !== "SHIPPED").length;
  const inProductionCount = orders.filter((order) => order.supplierOrder.status === "IN_PRODUCTION").length;
  const documentReadyCount = orders.filter((order) => order.supplierOrder.status === "DOCUMENTS_UPLOADED").length;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <section className="border-b border-[#e6e6e6] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Production workspace</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Orders</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              Track purchased quotes through supplier acknowledgment, production, quality documents, shipment, and delivery follow-up.
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Order summary" className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Active orders", value: activeOrderCount, detail: "Not yet shipped" },
          { label: "In production", value: inProductionCount, detail: "Supplier work underway" },
          { label: "Docs ready", value: documentReadyCount, detail: "Quality records uploaded" },
        ].map((metric) => (
          <article className="rounded-md border border-[#e8e8e8] bg-white p-4" key={metric.label}>
            <p className="text-[13px] font-medium text-[#686d75]">{metric.label}</p>
            <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{metric.value}</p>
            <p className="mt-2 text-[12px] text-[#8a8f98]">{metric.detail}</p>
          </article>
        ))}
      </section>

      <BuyerOrders orders={orders} />
    </div>
  );
}
