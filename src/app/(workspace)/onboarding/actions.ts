"use server";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";

export async function saveCustomerOnboarding(step: number, complete = false) {
  const session = await getCurrentSession();
  if (session?.user.role !== "customer" || !session.user.companyId || session.user.supportAdmin) throw new Error("Customer membership required.");
  if (!Number.isInteger(step) || step < 0 || step > 4) throw new Error("Invalid tour step.");
  const client = await getPrismaClient() as PrismaClient;
  const membership = { userId: session.user.id, companyId: session.user.companyId };
  await client.customerOnboardingProgress.upsert({ where: { userId_companyId: membership }, create: { ...membership, step, completedAt: complete ? new Date() : null }, update: { step, completedAt: complete ? new Date() : null } });
}
