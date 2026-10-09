import type { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { retryCustomerEmail } from "./actions";
export const dynamic = "force-dynamic";
export default async function SupportQueue() {
  if ((await getCurrentSession())?.user.role !== "admin") notFound();
  const client = await getPrismaClient() as PrismaClient;
  const tickets = await client.customerSupportRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const emails = await client.customerEmailEvent.findMany({ where: { status: { not: "SENT" } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <section className="space-y-5"><h1 className="text-2xl font-semibold">Customer support</h1><p>Requests save here even when email delivery is unavailable.</p>{tickets.length === 0 && <p>No support requests yet.</p>}{tickets.map((ticket) => <article className="rounded-lg border bg-white p-5" key={ticket.id}><div className="flex flex-wrap justify-between gap-3"><Link className="font-semibold underline" href={ticket.issueType === "RFQ_CLARIFICATION" ? `/admin/quotes?requestId=${ticket.requestId}` : `/admin/orders/${ticket.requestId}`}>{ticket.issueType === "RFQ_CLARIFICATION" ? "RFQ" : "Order"} {ticket.requestId}</Link><span>{ticket.status} · {ticket.urgency}</span></div><p className="my-3 whitespace-pre-wrap">{ticket.message}</p><p className="text-sm text-stone-600">{ticket.email} · {ticket.issueType} · Follow up by {ticket.followUp} · {ticket.createdAt.toISOString()} · Email {ticket.emailDelivery}</p></article>)}{emails.length > 0 && <section className="rounded-lg border bg-amber-50 p-5"><h2 className="font-semibold">Email delivery needs attention</h2>{emails.map((email) => <form className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm" key={email.key} action={retryCustomerEmail}><input type="hidden" name="key" value={email.key} /><p>{email.status} · {email.recipient} · {email.subject} · {email.attempts} delivery attempts</p><button className="rounded border bg-white px-3 py-2" type="submit">Retry email</button></form>)}</section>}</section>;
}
