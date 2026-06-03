import { notFound } from "next/navigation";

import { buildCustomerQuoteInputFromRequest, buildCustomerQuoteInputFromVersion, customerQuotePdfFileName } from "@/lib/quote-file";
import { buildRequestQuotePdf } from "@/lib/quote-pdf";
import type { RequestStatus } from "@/lib/request-model";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const downloadableQuoteStatuses = new Set<RequestStatus>(["QUOTED", "PURCHASED", "CLOSED"]);

export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const request = await getRequestById(requestId);

  if (!request || !downloadableQuoteStatuses.has(request.status)) {
    notFound();
  }

  const latestCustomerQuote = request.customerQuotes.at(-1);
  const quote = latestCustomerQuote ? buildCustomerQuoteInputFromVersion(latestCustomerQuote) : buildCustomerQuoteInputFromRequest(request);
  const pdf = await buildRequestQuotePdf(request);
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${customerQuotePdfFileName(quote)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
