"use server";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export async function submitOrderSupport(requestId: string, data: FormData) {
  const session = await getCurrentSession();
  const request = await getCustomerRequestByIdForCurrentSession(requestId);
  if (!session || !request || request.status !== "PURCHASED" || !request.buyerCompanyId) throw new Error("This order is not available to your account.");
  const text = (key: string) => typeof data.get(key) === "string" ? String(data.get(key)).trim() : "";
  const message = text("message");
  if (!message || message.length > 10000) throw new Error("Enter a message of up to 10,000 characters.");
  const client = await getPrismaClient() as PrismaClient;
  const ticket = await client.customerSupportRequest.create({ data: { requestId, companyId: request.buyerCompanyId, userId: session.user.id, email: session.user.email, issueType: text("issueType"), message, urgency: text("urgency"), followUp: text("followUp") } });
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `support:${ticket.id}` }, body: JSON.stringify({ from: "Lattice <support@latticeos.co>", to: ["support@latticeos.co"], reply_to: session.user.email, subject: `Order support · ${request.title} · ${ticket.urgency}`, text: `Ticket ${ticket.id}\nOrder ${requestId}\nFrom ${session.user.email}\nType ${ticket.issueType}\nFollow-up ${ticket.followUp}\n\n${message}` }) });
      await client.customerSupportRequest.update({ where: { id: ticket.id }, data: { emailDelivery: response.ok ? "SENT" : "FAILED" } });
    } catch { await client.customerSupportRequest.update({ where: { id: ticket.id }, data: { emailDelivery: "FAILED" } }); }
  }
  revalidatePath("/admin/support");
  return { id: ticket.id };
}
