"use server";

import { revalidatePath } from "next/cache";

import { requireActionRole } from "@/lib/route-authorization";
import { createCustomerCompany } from "@/lib/workspace-user-admin";

export type CreateCustomerCompanyActionState = {
  customerHref?: string;
  message: string;
  status: "idle" | "error" | "success";
  temporaryPassword?: string;
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
    const result = await createCustomerCompany({
      billingEmail: formValue(formData, "billingEmail"),
      companyName: formValue(formData, "companyName"),
      industry: formValue(formData, "industry"),
      primaryAdminEmail: formValue(formData, "primaryAdminEmail"),
      primaryAdminName: formValue(formData, "primaryAdminName"),
      website: formValue(formData, "website"),
    });

    revalidatePath("/admin/customers");
    return {
      customerHref: `/admin/customers/${result.company.id}`,
      message: `${result.company.name} and its first Customer Admin were created. Share the temporary password below securely.`,
      status: "success",
      temporaryPassword: result.password,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to create the customer company.",
      status: "error",
    };
  }
}
