"use server";

import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { quoteHasExpired } from "@/lib/quote-validity";
import { createMockQuoteRenewal, isMockQuoteRenewal } from "@/lib/mock-quote-renewals";

export async function requestQuoteRenewal(requestId: string, quoteVersionId: string, data: FormData) {
  const [session, request] = await Promise.all([getCurrentSession(), getCustomerRequestByIdForCurrentSession(requestId)]);
  const mockRenewal = Boolean(request && isMockQuoteRenewal(request) && session?.user.role === "admin");
  if (!session || !["customer", "admin"].includes(session.user.role) || !request || (!request.buyerCompanyId && !mockRenewal) || request.status !== "QUOTED") {
    throw new Error("This quote is not available to your account.");
  }
  if (!mockRenewal && (request.id.startsWith("demo_") || request.id.startsWith("fixture_"))) {
    throw new Error("Demo quotes cannot create a customer support request. Use a submitted test RFQ.");
  }
  const quote = request.customerQuotes.at(-1);
  if (!quote || quote.id !== quoteVersionId || !quoteHasExpired(request)) {
    throw new Error("This quote has changed or is still valid. Reload to review the latest quote.");
  }
  const notes = String(data.get("notes") ?? "").trim();
  if (notes.length > 2000) throw new Error("Keep renewal notes within 2,000 characters.");
  if (mockRenewal) {
    const ticket = await createMockQuoteRenewal(request, session.user, notes);
    revalidatePath(`/quotes/${requestId}`);
    revalidatePath("/admin/support");
    revalidatePath("/dashboard");
    return { id: ticket.id };
  }
  const client = await getPrismaClient() as PrismaClient;
  const existing = await client.customerSupportRequest.findFirst({
    where: { requestId, companyId: request.buyerCompanyId!, issueType: "QUOTE_RENEWAL", status: "OPEN", createdAt: { gte: new Date(quote.issuedAt) } },
  });
  const ticket = existing ?? await client.customerSupportRequest.create({ data: {
    requestId, companyId: request.buyerCompanyId!, userId: session.user.id, email: session.user.email,
    issueType: "QUOTE_RENEWAL", urgency: "normal", followUp: "workspace", emailDelivery: "NOT_REQUESTED",
    message: `Please renew ${quote.quoteNumber}, version ${quote.versionNumber}, for ${request.title}. Confirm updated pricing and lead time.${notes ? `\n\nCustomer notes: ${notes}` : ""}`,
  } });
  revalidatePath(`/quotes/${requestId}`);
  revalidatePath("/admin/support");
  revalidatePath("/dashboard");
  return { id: ticket.id };
}
