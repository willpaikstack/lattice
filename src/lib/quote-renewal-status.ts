import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import { isMockQuoteRenewal, listMockQuoteRenewals } from "./mock-quote-renewals";
import type { LatticeRequest } from "./request-model";

export async function getPendingQuoteRenewalIds(quotes: LatticeRequest[]) {
  const candidates = quotes.filter((quote) => quote.status === "QUOTED" && quote.customerQuotes.length > 0);
  const real = candidates.filter((quote) => !isMockQuoteRenewal(quote) && quote.buyerCompanyId);
  const [mockTickets, realTickets] = await Promise.all([
    candidates.some(isMockQuoteRenewal) ? listMockQuoteRenewals() : [],
    real.length ? (async () => {
      const client = await getPrismaClient() as PrismaClient;
      return client.customerSupportRequest.findMany({ where: { issueType: "QUOTE_RENEWAL", status: "OPEN", OR: real.map((quote) => ({ requestId: quote.id, companyId: quote.buyerCompanyId!, createdAt: { gte: new Date(quote.customerQuotes.at(-1)!.issuedAt) } })) } });
    })() : [],
  ]);
  const mockIds = mockTickets.filter((ticket) => ticket.status === "OPEN" && candidates.some((quote) => quote.id === ticket.requestId && quote.customerQuotes.at(-1)?.id === ticket.quoteVersionId)).map((ticket) => ticket.requestId);
  return new Set([...mockIds, ...realTickets.map((ticket) => ticket.requestId)]);
}
