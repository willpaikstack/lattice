"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { CustomerProfileInput } from "@/lib/customer-profiles";
import { updateCustomerProfile } from "@/lib/customer-profiles";

function getString(formData: FormData, key: keyof CustomerProfileInput) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateCustomerProfileAction(companyId: string, formData: FormData) {
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
