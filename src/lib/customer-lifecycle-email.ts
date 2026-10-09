import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import type { LatticeRequest } from "./request-model";

type Kind = "CLARIFICATION_REQUESTED" | "QUOTE_ISSUED" | "QUALITY_APPROVAL_REQUESTED" | "SHIPPED";
const subjects: Record<Kind, string> = { CLARIFICATION_REQUESTED: "Your manufacturing request needs clarification", QUOTE_ISSUED: "Your Lattice quote is ready", QUALITY_APPROVAL_REQUESTED: "Quality documents are ready for your approval", SHIPPED: "Your Lattice order has shipped" };
export async function deliverCustomerEmailEvent(key: string) {
  const client = await getPrismaClient() as PrismaClient;
  const event = await client.customerEmailEvent.findUnique({ where: { key } });
  if (!event || event.status === "SENT") return;
  if (!process.env.RESEND_API_KEY) throw new Error("Email delivery is not configured.");
  let delivered = false;
  try {
    const result = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(8000), headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": event.key }, body: JSON.stringify({ from: "Lattice <support@latticeos.co>", to: [event.recipient], subject: event.subject, text: event.body }) });
    delivered = result.ok;
  } finally {
    await client.customerEmailEvent.update({ where: { key: event.key }, data: { attempts: { increment: 1 }, status: delivered ? "SENT" : "FAILED", deliveredAt: delivered ? new Date() : null } });
  }
  if (!delivered) throw new Error("Email provider did not accept delivery. The event remains in the queue.");
}
export async function queueCustomerLifecycleEmail(request: LatticeRequest, kind: Kind, version: string) {
  if (!request.buyerCompanyId || !request.requesterEmail) return;
  try {
    const client = await getPrismaClient() as PrismaClient;
    const href = kind === "SHIPPED" || kind === "QUALITY_APPROVAL_REQUESTED" ? `/orders/${request.id}` : `/quotes/${request.id}`;
    const subject = `${subjects[kind]} · ${request.title}`;
    const body = `${subjects[kind]}.\n\n${request.title}\nhttps://latticeos.co${href}\n\nFor help, contact support@latticeos.co.`;
    const admins = kind === "QUALITY_APPROVAL_REQUESTED" ? await client.user.findMany({ where: { companyId: request.buyerCompanyId, role: "CUSTOMER_ADMIN" }, select: { email: true } }) : [];
    const recipients = [...new Set(admins.length ? admins.map((admin) => admin.email) : [request.requesterEmail])];
    for (const recipient of recipients) {
      const key = `${request.id}:${kind}:${version}:${recipient}`;
      const event = await client.customerEmailEvent.upsert({ where: { key }, update: {}, create: { key, requestId: request.id, companyId: request.buyerCompanyId, kind, recipient, subject, body } });
      if (event.status !== "SENT" && process.env.RESEND_API_KEY) await deliverCustomerEmailEvent(key);
    }
  } catch { console.warn("Customer notification could not be delivered; check the email queue."); }
}
