import { notFound } from "next/navigation";

import { buildRequestInvoicePdf, orderInvoicePdfFileName } from "@/lib/invoice-pdf";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const order = await getRequestById(requestId);

  if (!order || order.status !== "PURCHASED") {
    notFound();
  }

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const pdf = await buildRequestInvoicePdf(order);
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${orderInvoicePdfFileName(order)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
