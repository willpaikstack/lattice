import { WorkspaceContentReveal } from "@/components/workspace-content-reveal";
import { WorkspaceListHeader } from "@/components/workspace-list-loading";
import { BuyerOrders } from "@/components/buyer-orders";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerOrders } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = (await filterCustomerVisibleRequestsForCurrentSession(await listBuyerOrders())).map(customerSafeRequest);
  const activeOrderCount = orders.filter((order) => order.supplierOrder.status !== "DELIVERED").length;
  const inProductionCount = orders.filter((order) => order.supplierOrder.status === "IN_PRODUCTION").length;
  const documentReadyCount = orders.filter((order) => order.supplierOrder.status === "DOCUMENTS_UPLOADED").length;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <WorkspaceListHeader kind="orders" />
      <WorkspaceContentReveal>
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
      </WorkspaceContentReveal>
    </div>
  );
}
