"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CustomerProfileInput } from "@/lib/customer-profiles";
import { updateCustomerProfile } from "@/lib/customer-profiles";
import { requireActionRole } from "@/lib/route-authorization";
import { createSessionForUser } from "@/lib/session";
import { customerUserForSupportSession, addCustomerUser, removeCustomerUser, requestCustomerUserEmailChange, resetCustomerUserPassword, setCustomerUserPassword, updateCustomerUserRole } from "@/lib/workspace-user-admin";

export type UserManagementActionState = {
  message: string;
  status: "idle" | "error" | "success";
  temporaryPassword?: string;
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
    let temporaryPassword: string | undefined;
    let message = "";

    if (operation === "add") {
      const result = await addCustomerUser(companyId, {
        email: userValue(formData, "email"),
        name: userValue(formData, "name"),
        role: userValue(formData, "role"),
      });
      temporaryPassword = result.password;
      message = `Created ${result.user.name}. Share the temporary password below securely.`;
    } else if (operation === "reset-password") {
      const result = await resetCustomerUserPassword(companyId, userValue(formData, "userId"));
      temporaryPassword = result.password;
      message = `A new temporary password was issued for ${result.user.name}.`;
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
    return { message, status: "success", temporaryPassword };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to update this customer user.",
      status: "error",
    };
  }
}
