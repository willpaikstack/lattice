import { buildSupplierPurchaseOrderTemplatePdf } from "@/lib/purchase-order-pdf";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const unauthorized = await requireRouteRole(["admin"]);
  if (unauthorized) {
    return unauthorized;
  }

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const pdf = await buildSupplierPurchaseOrderTemplatePdf();
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="nexus-supplier-purchase-order-template.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
