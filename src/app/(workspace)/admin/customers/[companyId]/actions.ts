"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CustomerProfileInput } from "@/lib/customer-profiles";
import { updateCustomerProfile } from "@/lib/customer-profiles";
import { requireActionRole } from "@/lib/route-authorization";
import { createSessionForUser } from "@/lib/session";
import { customerUserForSupportSession, addCustomerUserAndSendInvitation, removeCustomerUser, requestCustomerUserEmailChange, resetCustomerUserPasswordAndSendInvitation, setCustomerUserPassword, updateCustomerUserRole } from "@/lib/workspace-user-admin";

export type UserManagementActionState = {
  message: string;
  status: "idle" | "error" | "success";
};

function getString(formData: FormData, key: keyof CustomerProfileInput) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateCustomerProfileAction(companyId: string, formData: FormData) {
  await requireActionRole(["admin"]);
  await updateCustomerProfile(companyId, {
    name: getString(formData, "name"),
    website: getString(formData, "website"),
    industry: getString(formData, "industry"),
    primaryContactName: getString(formData, "primaryContactName"),
    primaryContactEmail: getString(formData, "primaryContactEmail"),
    billingEmail: getString(formData, "billingEmail"),
    customerTier: getString(formData, "customerTier"),
    accountStatus: getString(formData, "accountStatus"),
    notes: getString(formData, "notes"),
  });

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${companyId}`);
  revalidatePath("/admin/quotes");
  revalidatePath("/admin/orders");
  redirect(`/admin/customers/${companyId}`);
}

export async function startCustomerSupportSessionAction(companyId: string, formData: FormData) {
  const adminSession = await requireActionRole(["admin"]);
  const userId = userValue(formData, "userId");
  const customer = await customerUserForSupportSession(companyId, userId);
  await createSessionForUser({
    email: customer.email,
    id: customer.id,
    name: customer.name,
    provider: "password",
    role: "customer",
    supportAdmin: {
      email: adminSession.user.email,
      id: adminSession.user.id,
      name: adminSession.user.name,
    },
  });
  redirect("/dashboard");
}

function userValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function manageCustomerUserAction(
  companyId: string,
  _previousState: UserManagementActionState,
  formData: FormData,
): Promise<UserManagementActionState> {
  try {
    await requireActionRole(["admin"]);
    const operation = userValue(formData, "operation");
    let message = "";
    let deliveryFailed = false;

    if (operation === "add") {
      const result = await addCustomerUserAndSendInvitation(companyId, {
        email: userValue(formData, "email"),
        name: userValue(formData, "name"),
        role: userValue(formData, "role"),
      });
      if (result.invitation.status === "failed") {
        deliveryFailed = true;
        message = `Created ${result.user.name}, but their invitation could not be delivered. Issue a new password and resend the invitation.`;
      } else {
        message = `Created ${result.user.name} and sent their invitation to ${result.user.email}.`;
      }
    } else if (operation === "reset-and-resend") {
      const result = await resetCustomerUserPasswordAndSendInvitation(companyId, userValue(formData, "userId"));
      if (result.invitation.status === "failed") {
        deliveryFailed = true;
        message = `A new temporary password was issued for ${result.user.name}, but the invitation could not be delivered. Try again to issue another password and resend.`;
      } else {
        message = `A new temporary password was issued and an invitation was sent to ${result.user.email}.`;
      }
    } else if (operation === "set-password") {
      await setCustomerUserPassword(companyId, userValue(formData, "userId"), userValue(formData, "password"));
      message = "Custom password saved. Share it with the user securely.";
    } else if (operation === "change-email") {
      const result = await requestCustomerUserEmailChange(companyId, userValue(formData, "userId"), userValue(formData, "email"));
      message = `Verification email sent to ${result.email}. The current sign-in email remains active until confirmed.`;
    } else if (operation === "change-role") {
      await updateCustomerUserRole(companyId, userValue(formData, "userId"), userValue(formData, "role"));
      message = "Customer role updated.";
    } else if (operation === "remove") {
      await removeCustomerUser(companyId, userValue(formData, "userId"));
      message = "Customer user removed.";
    } else {
      throw new Error("Unsupported customer user operation.");
    }

    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${companyId}`);
    return { message, status: deliveryFailed ? "error" : "success" };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to update this customer user.",
      status: "error",
    };
  }
}
