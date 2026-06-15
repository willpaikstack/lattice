import { notFound } from "next/navigation";

import { buildCustomerQuoteXlsx, customerQuoteXlsxFileName } from "@/lib/quote-xlsx";
import { getRequestById } from "@/lib/request-repository";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const unauthorized = await requireRouteRole(["admin"]);
  if (unauthorized) {
    return unauthorized;
  }

  const { requestId } = await params;
  const request = await getRequestById(requestId);

  if (!request || request.status === "DRAFT" || request.status === "PURCHASED") {
    notFound();
  }

  const workbook = buildCustomerQuoteXlsx(request);
  const body = new ArrayBuffer(workbook.byteLength);
  new Uint8Array(body).set(workbook);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${customerQuoteXlsxFileName(request)}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
