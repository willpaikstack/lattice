import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import { getCurrentSession } from "./session";

export async function getCustomerOnboarding() {
  const session = await getCurrentSession();
  if (session?.user.role !== "customer" || !session.user.companyId || session.user.supportAdmin) return null;
  const client = await getPrismaClient() as PrismaClient;
  const progress = await client.customerOnboardingProgress.findUnique({ where: { userId_companyId: { userId: session.user.id, companyId: session.user.companyId } } });
  return { step: progress?.step ?? 0, completed: Boolean(progress?.completedAt), name: session.user.name, company: session.user.companyName ?? "your company" };
}
