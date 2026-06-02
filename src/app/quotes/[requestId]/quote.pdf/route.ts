import { notFound } from "next/navigation";

import { buildCustomerQuoteInputFromRequest, buildCustomerQuoteInputFromVersion, customerQuotePdfFileName } from "@/lib/quote-file";
import { buildCustomerQuotePdf } from "@/lib/quote-pdf";
import type { RequestStatus } from "@/lib/request-model";
import { getRequestById } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

const quoteStatusLabel: Record<RequestStatus, string> = {
  DRAFT: "Configuring Quote",
  NEEDS_INFO: "Configuring Quote",
  PURCHASED: "Quote Closed",
  QUOTED: "Quote Received",
  READY_FOR_SUPPLIER_RFQ: "Configuring Quote",
  SUBMITTED: "Configuring Quote",
};

export async function GET(_request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const request = await getRequestById(requestId);

  if (!request || request.status === "DRAFT") {
    notFound();
  }

  const latestCustomerQuote = request.customerQuotes.at(-1);
  const quote = latestCustomerQuote ? buildCustomerQuoteInputFromVersion(latestCustomerQuote) : buildCustomerQuoteInputFromRequest(request);
  const pdf = buildCustomerQuotePdf(quote, {
    pricingPending: !latestCustomerQuote && request.quote.estimatedPriceCents === null,
    statusLabel: quoteStatusLabel[request.status],
  });

  return new Response(pdf, {
    headers: {
      "Content-Disposition": `attachment; filename="${customerQuotePdfFileName(quote)}"`,
      "Content-Type": "application/pdf",
    },
  });
}
