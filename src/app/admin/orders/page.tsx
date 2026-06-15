import Link from "next/link";

import { archiveOrderAction } from "@/app/admin/orders/actions";
import { AdminOrderManagement } from "@/components/admin-order-management";
import { listAdminOrders } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await listAdminOrders();

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#e6e6e6] bg-[#f8fafc] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Admin</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Placed orders</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Track accepted customer quotes through overseas fabrication, documents, production status, and shipment readiness.
            </p>
          </div>
          <Link className="rounded-md bg-[#171717] px-4 py-2 text-center text-sm font-semibold text-white" href="/admin/vendors">
            Vendor Directory
          </Link>
        </div>
      </section>

      <AdminOrderManagement archiveAction={archiveOrderAction} orders={orders} />
    </div>
  );
}
