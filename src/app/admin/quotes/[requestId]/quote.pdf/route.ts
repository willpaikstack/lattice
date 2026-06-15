import { notFound } from "next/navigation";

import { buildCustomerQuoteInputFromVersion, customerQuotePdfFileName } from "@/lib/quote-file";
import { buildRequestQuotePdf } from "@/lib/quote-pdf";
import { convertCustomerQuoteTemplateToPdf } from "@/lib/quote-template-pdf";
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
  const latestCustomerQuote = request?.customerQuotes.at(-1);

  if (!request || !latestCustomerQuote) {
    notFound();
  }

  const quote = buildCustomerQuoteInputFromVersion(latestCustomerQuote);
  const pdf = (await convertCustomerQuoteTemplateToPdf(request)) ?? (await buildRequestQuotePdf(request));
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${customerQuotePdfFileName(quote)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
