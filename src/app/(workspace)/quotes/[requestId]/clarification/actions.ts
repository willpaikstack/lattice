"use server";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";
import { saveLocalUpload } from "@/lib/local-file-storage";
export async function replyToClarification(requestId: string, data: FormData) {
  const session = await getCurrentSession();
  const request = await getCustomerRequestByIdForCurrentSession(requestId);
  if (session?.user.role !== "customer" || !request || request.status !== "NEEDS_INFO" || !request.buyerCompanyId) throw new Error("This RFQ is not waiting for a clarification from your company.");
  const message = String(data.get("message") ?? "").trim();
  if (!message || message.length > 10000) throw new Error("Enter a clarification of up to 10,000 characters.");
  const file = data.get("drawing");
  const index = Number(data.get("lineItemIndex"));
  if (!Number.isInteger(index) || index < 0 || index >= request.lineItems.length) throw new Error("Choose the part this clarification concerns.");
  if (file instanceof File && file.size > 25 * 1024 * 1024) throw new Error("Revised drawings must be no larger than 25 MB.");
  const stored = file instanceof File && file.size > 0 ? await saveLocalUpload(file) : null;
  if (stored && !stored.storageKey) throw new Error("Drawing storage is unavailable.");
  const client = await getPrismaClient() as PrismaClient;
  await client.$transaction(async (tx) => {
    const result = await tx.request.updateMany({ where: { id: requestId, buyerCompanyId: request.buyerCompanyId, status: "NEEDS_INFO" }, data: { status: "SUBMITTED", operatorCompleteness: "READY_FOR_REVIEW" } });
    if (result.count !== 1) throw new Error("This RFQ has already changed. Reload before replying.");
    if (stored) await tx.uploadedFile.create({ data: { requestId, name: stored.name, type: stored.type, sizeBytes: stored.sizeBytes, storageKey: stored.storageKey, lineItemIndex: index } });
    await tx.customerSupportRequest.create({ data: { requestId, companyId: request.buyerCompanyId!, userId: session.user.id, email: session.user.email, issueType: "RFQ_CLARIFICATION", message: `${request.lineItems[index].partName}: ${message}${stored ? `\nRevised drawing: ${stored.name}` : ""}`, urgency: "normal", followUp: "workspace" } });
    await tx.statusEvent.create({ data: { requestId, from: "NEEDS_INFO", to: "SUBMITTED", actor: "buyer" } });
  });
  revalidatePath(`/quotes/${requestId}`); revalidatePath("/admin/quotes"); revalidatePath("/admin/support"); revalidatePath("/dashboard");
}
