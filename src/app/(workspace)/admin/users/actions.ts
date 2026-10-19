"use server";

import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";
import { permanentlyDeletePlatformUser, resetCustomerUserPasswordAndSendInvitation } from "@/lib/workspace-user-admin";
import { getPrismaClient } from "@/lib/prisma";
import { requireActionRole } from "@/lib/route-authorization";

export async function resendPlatformUserInvitationAction(formData: FormData) {
  const session = await requireActionRole(["admin"]);
  const value = formData.get("userId");
  const userId = typeof value === "string" ? value.trim() : "";
  if (!userId) return { status: "error" as const, message: "Choose a user to invite." };
  if (userId === session.user.id) return { status: "error" as const, message: "You cannot reset your signed-in account here." };

  const client = await getPrismaClient() as PrismaClient;
  const user = await client.user.findUnique({ where: { id: userId }, select: { companyId: true, role: true } });
  if (!user?.companyId || user.role === "LATTICE_ADMIN") {
    return { status: "error" as const, message: "Invitations are available for company users only." };
  }

  try {
    const result = await resetCustomerUserPasswordAndSendInvitation(user.companyId, userId, { replaceExistingPassword: true });
    revalidatePath("/admin/users");
    revalidatePath(`/admin/customers/${user.companyId}`);
    if (result.invitation.status === "failed") {
      return { status: "error" as const, message: "The password was replaced, but the invitation email could not be delivered. Retry to issue and email another password." };
    }
    return { status: "success" as const, message: `A new invitation was sent to ${result.user.email}. The previous password no longer works. The new temporary password expires in 72 hours.` };
  } catch {
    return { status: "error" as const, message: "Unable to complete the password reset and invitation. Please retry or contact support." };
  }
}

export async function deletePlatformUserAction(formData: FormData) {
  const session = await requireActionRole(["admin"]);
  const value = formData.get("userId");
  const userId = typeof value === "string" ? value.trim() : "";
  if (!userId) return { error: "Choose a user to delete." };

  try {
    const result = await permanentlyDeletePlatformUser(userId, session.user.id);
    revalidatePath("/admin/users");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/quotes");
    revalidatePath("/admin/orders");
    return { success: true as const, ...result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to delete this user." };
  }
}
