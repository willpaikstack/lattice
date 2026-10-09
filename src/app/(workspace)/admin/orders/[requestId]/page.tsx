import { notFound } from "next/navigation";

import { BuyerOrderDetail } from "@/components/buyer-order-detail";
import { AdminOrderProgressForm } from "@/components/admin-order-progress-form";
import { getRequestById } from "@/lib/request-repository";

import { confirmOrderComplianceReview, uploadOrderQualityDocument, updateOrderProgressAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Quality review</h2><p className="my-3 text-sm">{order.requiresQualityApproval ? order.qualityApprovedAt ? "Customer Admin approved the current document package." : "Customer Admin approval required before shipment." : "Customer approval was not requested for this order."}</p><form action={uploadOrderQualityDocument.bind(null, order.id)} className="flex flex-wrap items-center gap-3"><input required aria-label="Quality document" name="file" type="file" /><button type="submit" className="rounded bg-stone-950 px-4 py-2 text-sm text-white">Upload inspection document</button></form></section>
      {order.complianceReviewRequired && <section className="rounded-lg border bg-amber-50 p-5"><h2 className="font-semibold">Compliance review</h2><p>{order.complianceReviewedAt ? "Review recorded. Shipment hold cleared." : "Shipment is on hold pending Lattice review."}</p>{!order.complianceReviewedAt && <form action={confirmOrderComplianceReview.bind(null, order.id)} className="mt-3 grid gap-3"><textarea required aria-label="Compliance review note" name="reviewNote" className="rounded border p-3" placeholder="Record the review outcome and basis for release." /><button type="submit" className="w-fit rounded bg-stone-950 px-4 py-2 text-white">Confirm completed review</button></form>}</section>}
      {order.checkoutDetails && <section className="rounded-lg border bg-white p-5"><h2 className="font-semibold">Customer delivery and purchasing instructions</h2><dl className="mt-3 grid gap-2">{Object.entries(order.checkoutDetails).map(([key, value]) => <div key={key}><dt className="text-xs text-stone-500">{key}</dt><dd className="whitespace-pre-wrap text-sm">{value || "Not provided"}</dd></div>)}</dl></section>}
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
