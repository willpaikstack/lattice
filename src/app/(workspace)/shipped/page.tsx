import Link from "next/link";

import { BuyerOrders } from "@/components/buyer-orders";
import { customerSafeRequest } from "@/lib/customer-partner-privacy";
import { filterCustomerVisibleRequestsForCurrentSession } from "@/lib/request-access-policy";
import { listBuyerOrders } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function ShippedPage() {
  const orders = (await filterCustomerVisibleRequestsForCurrentSession(await listBuyerOrders())).map(customerSafeRequest);
  const shippedOrders = orders.filter((order) => order.supplierOrder.status === "SHIPPED");
  const withTrackingCount = shippedOrders.filter((order) => order.supplierOrder.trackingNumber).length;

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <section className="border-b border-[#e6e6e6] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Delivery workspace</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-normal text-[#171717]">Shipped</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
              Track orders that have left the supplier, including shipment references, quality document context, and delivery follow-up.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold transition hover:bg-[#2b2b2b]"
              href="/orders"
              style={{ color: "#ffffff" }}
            >
              View All Orders
            </Link>
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dcdcdc] bg-white px-4 text-[14px] font-semibold text-[#3f444b] transition hover:bg-[#f8f8f8]" href="/quotes">
              View Quotes
            </Link>
          </div>
        </div>
      </section>

      <section aria-label="Shipped order summary" className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Shipped orders", value: shippedOrders.length, detail: "Left supplier facility" },
          { label: "With tracking", value: withTrackingCount, detail: "Tracking number available" },
          { label: "Awaiting tracking", value: shippedOrders.length - withTrackingCount, detail: "Needs shipment reference" },
        ].map((metric) => (
          <article className="rounded-md border border-[#e8e8e8] bg-white p-4" key={metric.label}>
            <p className="text-[13px] font-medium text-[#686d75]">{metric.label}</p>
            <p className="mt-3 text-[28px] font-semibold leading-none text-[#202020]">{metric.value}</p>
            <p className="mt-2 text-[12px] text-[#8a8f98]">{metric.detail}</p>
          </article>
        ))}
      </section>

      {shippedOrders.length > 0 ? (
        <BuyerOrders orders={shippedOrders} />
      ) : (
        <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
          <h2 className="text-[22px] font-semibold text-[#202020]">No shipped orders yet.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
            Orders will appear here after suppliers add shipment details. Use the orders workspace to monitor production and ready-to-ship items.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#171717] px-4 text-[14px] font-semibold transition hover:bg-[#2b2b2b]"
              href="/orders"
              style={{ color: "#ffffff" }}
            >
              View Orders
            </Link>
            <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-[#dcdcdc] bg-white px-4 text-[14px] font-semibold text-[#3f444b] transition hover:bg-[#f8f8f8]" href="/quotes">
              View Quotes
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
