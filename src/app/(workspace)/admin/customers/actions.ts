"use server";

import { revalidatePath } from "next/cache";

import { requireActionRole } from "@/lib/route-authorization";
import { createCustomerCompanyAndSendInvitation } from "@/lib/workspace-user-admin";

export type CreateCustomerCompanyActionState = {
  customerHref?: string;
  message: string;
  status: "idle" | "error" | "success";
};

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createCustomerCompanyAction(
  _previousState: CreateCustomerCompanyActionState,
  formData: FormData,
): Promise<CreateCustomerCompanyActionState> {
  try {
    await requireActionRole(["admin"]);
    const result = await createCustomerCompanyAndSendInvitation({
      billingEmail: formValue(formData, "billingEmail"),
      companyName: formValue(formData, "companyName"),
      industry: formValue(formData, "industry"),
      primaryAdminEmail: formValue(formData, "primaryAdminEmail"),
      primaryAdminName: formValue(formData, "primaryAdminName"),
      website: formValue(formData, "website"),
    });

    revalidatePath("/admin/customers");
    if (result.invitation.status === "failed") {
      return {
        customerHref: `/admin/customers/${result.company.id}`,
        message: `${result.company.name} and its first Customer Admin were created, but the invitation could not be delivered. Open the customer profile to issue a new password and resend the invitation.`,
        status: "error",
      };
    }

    return {
      customerHref: `/admin/customers/${result.company.id}`,
      message: `${result.company.name} and its first Customer Admin were created. The invitation was sent to ${result.user.email}.`,
      status: "success",
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to create the customer company.",
      status: "error",
    };
  }
}
