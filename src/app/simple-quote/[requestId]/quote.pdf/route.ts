import { notFound } from "next/navigation";

import { validateGuestQuoteAccess } from "@/lib/guest-quote-access";
import { buildCustomerQuoteInputFromRequest, buildCustomerQuoteInputFromVersion, customerQuotePdfFileName } from "@/lib/quote-file";
import { buildRequestQuotePdf } from "@/lib/quote-pdf";
import { convertCustomerQuoteTemplateToPdf } from "@/lib/quote-template-pdf";
import type { RequestStatus } from "@/lib/request-model";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const downloadableQuoteStatuses = new Set<RequestStatus>(["QUOTED", "PURCHASED", "CLOSED"]);

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const quoteRequest = await getRequestById(requestId);

  if (!quoteRequest || !validateGuestQuoteAccess(quoteRequest, token) || !downloadableQuoteStatuses.has(quoteRequest.status)) {
    notFound();
  }

  const latestCustomerQuote = quoteRequest.customerQuotes.at(-1);
  const quote = latestCustomerQuote ? buildCustomerQuoteInputFromVersion(latestCustomerQuote) : buildCustomerQuoteInputFromRequest(quoteRequest);
  const pdf = (await convertCustomerQuoteTemplateToPdf(quoteRequest)) ?? (await buildRequestQuotePdf(quoteRequest));
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
