import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "./prisma";
import { getCurrentSession } from "./session";
import { defaultAccountSettings } from "./account-settings-shared";
import { getAccountSettings, hasCompletedAddressOnboarding } from "./account-settings";

export async function getCustomerOnboarding() {
  const session = await getCurrentSession();
  if (session?.user.role !== "customer" || !session.user.companyId || session.user.supportAdmin) return null;
  const client = await getPrismaClient() as PrismaClient;
  const [progress, settings] = await Promise.all([
    client.customerOnboardingProgress.findUnique({ where: { userId_companyId: { userId: session.user.id, companyId: session.user.companyId } }, select: { completedAt: true } }),
    session.user.customerRole === "admin" ? getAccountSettings() : Promise.resolve(null),
  ]);
  const needsAddressSetup = Boolean(settings && !hasCompletedAddressOnboarding(settings) && !settings.addressOnboardingDeferred);
  return { step: 0, completed: Boolean(progress?.completedAt), name: session.user.name, company: session.user.companyName ?? "your company", needsAddressSetup, addressSettings: needsAddressSetup && settings ? {
    ...defaultAccountSettings(), name: settings.name, companyName: settings.companyName,
    shipping: settings.shipping, billingAddress: settings.billingAddress,
    billingSameAsShipping: settings.billingSameAsShipping, canManageCompanyDefaults: settings.canManageCompanyDefaults,
    canCompleteInitialAddressOnboarding: settings.canCompleteInitialAddressOnboarding,
  } : undefined };
}
