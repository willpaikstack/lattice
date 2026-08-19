import { notFound } from "next/navigation";

import { buildRequestSupplierPurchaseOrderPdf, supplierPurchaseOrderPdfFileName } from "@/lib/purchase-order-pdf";
import { getRequestById } from "@/lib/request-repository";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const unauthorized = await requireRouteRole(["admin"]);
  if (unauthorized) {
    return unauthorized;
  }

  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  const pdf = await buildRequestSupplierPurchaseOrderPdf(order);

  if (!pdf) {
    notFound();
  }

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${supplierPurchaseOrderPdfFileName(order)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
