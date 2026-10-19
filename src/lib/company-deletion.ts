import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { getPrismaClient } from "./prisma";
import { getStripeClient, isStripeConfigured } from "./stripe";

export class CompanyDeletionError extends Error {}

/** Company removal keeps manufacturing history; never use individual-user RFQ deletion here. */
export async function deleteCustomerCompany(companyId: string, confirmationName: string, actingAdminId: string) {
  const client = await getPrismaClient() as PrismaClient;
  const result = await client.$transaction(async (tx) => {
    const company = await tx.company.findUnique({ where: { id: companyId }, include: { users: true } });
    if (!company) throw new CompanyDeletionError("Company not found. Reload the company directory.");
    if (confirmationName.trim() !== company.name) throw new CompanyDeletionError("Type the company name exactly to confirm deletion.");
    if (company.users.some((user) => user.id === actingAdminId || user.role === "LATTICE_ADMIN")) {
      throw new CompanyDeletionError("Move any Lattice Admin accounts out of this company before deleting it.");
    }

    const userIds = company.users.map((user) => user.id);
    const emails = company.users.flatMap((user) => [user.email, ...(user.pendingEmail ? [user.pendingEmail] : [])]);
    const defaults = await tx.accountDefaults.findMany({
      where: { id: { in: userIds.map((id) => `user:${id}`) } }, select: { stripeCustomerId: true },
    });
    const archived = await tx.request.updateMany({
      where: { buyerCompanyId: companyId, status: { not: "PURCHASED" } }, data: { isArchived: true },
    });
    // Clear personal contacts, retaining prices, CAD files, quote versions, order and invoice identity.
    await tx.customerQuoteVersion.updateMany({ where: { request: { buyerCompanyId: companyId } }, data: { customerContact: "" } });
    await tx.invoice.updateMany({
      where: { request: { buyerCompanyId: companyId } },
      data: { customerContact: "", billToSnapshot: Prisma.DbNull, shipToSnapshot: Prisma.DbNull },
    });
    await tx.request.updateMany({
      where: { buyerCompanyId: companyId },
      data: {
        buyerCompanyId: null, buyerCompanyNameSnapshot: company.name,
        requesterName: "Deleted user", requesterEmail: "", requesterPhone: "", shipToName: "", shipToPhone: "",
        accountsPayableEmail: "", billingSnapshot: Prisma.DbNull, checkoutDetails: Prisma.DbNull,
        guestAccessTokenHash: "", guestAccessTokenExpiresAt: null,
      },
    });
    await tx.customerOnboardingProgress.deleteMany({ where: { OR: [{ companyId }, { userId: { in: userIds } }] } });
    await tx.customerSupportRequest.deleteMany({ where: { OR: [{ companyId }, { userId: { in: userIds } }] } });
    await tx.customerEmailEvent.deleteMany({ where: { companyId } });
    await tx.customerRequestDraft.deleteMany({ where: { ownerScope: companyId } });
    if (emails.length) {
      const emailFilter = { in: emails, mode: "insensitive" as const };
      await tx.waitingListEntry.deleteMany({ where: { email: emailFilter } });
      await tx.roadmapInterest.deleteMany({ where: { userEmail: emailFilter } });
      await tx.materialInquiry.deleteMany({ where: { requesterEmail: emailFilter } });
      await tx.customerEmailEvent.deleteMany({ where: { recipient: emailFilter } });
    }
    await tx.accountDefaults.deleteMany({ where: { id: { in: userIds.map((id) => `user:${id}`) } } });
    // User token, invitation and authentication records cascade from these deletions.
    await tx.user.deleteMany({ where: { companyId } });
    await tx.company.delete({ where: { id: companyId } });
    return {
      deletedUsers: userIds.length, archivedQuotes: archived.count,
      clerkIds: company.users.flatMap((user) => user.clerkUserId ? [user.clerkUserId] : []),
      stripeIds: [...new Set(defaults.map((entry) => entry.stripeCustomerId).filter(Boolean))],
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });

  let cleanupRequired = false;
  for (const id of result.clerkIds) {
    try { await (await clerkClient()).users.deleteUser(id); }
    catch { cleanupRequired = true; console.error("Company deletion: sign-in cleanup required", { companyId, clerkUserId: id }); }
  }
  for (const id of result.stripeIds) {
    try {
      if (!isStripeConfigured()) throw new Error("Payment provider unavailable");
      await getStripeClient().customers.del(id);
    } catch { cleanupRequired = true; console.error("Company deletion: payment profile cleanup required", { companyId, stripeCustomerId: id }); }
  }
  return { deletedUsers: result.deletedUsers, archivedQuotes: result.archivedQuotes, cleanupRequired };
}
