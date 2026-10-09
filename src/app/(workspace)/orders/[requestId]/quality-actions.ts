"use server";
import type { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { getCustomerRequestByIdForCurrentSession } from "@/lib/request-access-policy";

export async function approveOrderQuality(requestId: string) {
  const session = await getCurrentSession();
  if (session?.user.role !== "customer" || session.user.customerRole !== "admin" || session.user.supportAdmin) throw new Error("Customer Admin approval required.");
  const order = await getCustomerRequestByIdForCurrentSession(requestId);
  if (!order || order.status !== "PURCHASED" || !order.requiresQualityApproval) throw new Error("This order does not require quality approval.");
  const documents = order.supplierOrder.documents.filter((document) => ["INSPECTION_REPORT", "MATERIAL_CERT", "CERTIFICATE_OF_CONFORMANCE"].includes(document.category));
  if (!documents.length || documents.some((document) => !document.storageKey)) throw new Error("Quality documents must be available to download before approval.");
  const client = await getPrismaClient() as PrismaClient;
  const result = await client.request.updateMany({ where: { id: requestId, buyerCompanyId: session.user.companyId!, updatedAt: new Date(order.updatedAt) }, data: { qualityApprovedAt: new Date(), qualityApprovedBy: session.user.id } });
  if (result.count !== 1) throw new Error("The order or document package changed. Reload and review it before approving.");
  revalidatePath(`/orders/${requestId}`); revalidatePath(`/admin/orders/${requestId}`); revalidatePath("/dashboard");
}
