"use server";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { encodeWorkspaceTourStep, WORKSPACE_TOUR_COMPLETION_SCREEN } from "@/lib/workspace-tour";

export async function completeCustomerOnboarding() {
  const session = await getCurrentSession();
  if (session?.user.role !== "customer" || !session.user.companyId || session.user.supportAdmin) throw new Error("Customer membership required.");
  const step = encodeWorkspaceTourStep(WORKSPACE_TOUR_COMPLETION_SCREEN);
  const completedAt = new Date();
  const client = await getPrismaClient() as PrismaClient;
  const membership = { userId: session.user.id, companyId: session.user.companyId };
  await client.customerOnboardingProgress.upsert({ where: { userId_companyId: membership }, create: { ...membership, step, completedAt }, update: { step, completedAt } });
}
