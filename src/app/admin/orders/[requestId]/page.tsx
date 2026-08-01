import { notFound } from "next/navigation";

import { BuyerOrderDetail } from "@/components/buyer-order-detail";
import { AdminOrderProgressForm } from "@/components/admin-order-progress-form";
import { getRequestById } from "@/lib/request-repository";

import { updateOrderProgressAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  return (
    <div className="space-y-5">
      <AdminOrderProgressForm order={order} updateAction={updateOrderProgressAction.bind(null, order.id)} />
      <BuyerOrderDetail
        order={order}
        routeConfig={{
          backHref: "/admin/orders",
          backLabel: "Back to placed orders",
          helpHref: null,
          invoiceHref: `/admin/orders/${order.id}/invoice.pdf`,
          invoicePreviewHref: `/admin/orders/${order.id}/invoice.pdf?preview=1`,
          reorderHref: null,
          showSupplierQuoteFiles: true,
          supplierPurchaseOrderHref: `/admin/orders/${order.id}/supplier-purchase-order.pdf`,
          supplierPurchaseOrderPreviewHref: `/admin/orders/${order.id}/supplier-purchase-order.pdf?preview=1`,
          supplierQuoteReturnTo: `/admin/orders/${encodeURIComponent(order.id)}`,
        }}
      />
    </div>
  );
}
