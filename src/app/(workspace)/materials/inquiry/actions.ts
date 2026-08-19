"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createMaterialInquiry } from "@/lib/material-inquiries";
import { requireActionRole } from "@/lib/route-authorization";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function submitMaterialInquiryAction(formData: FormData) {
  const session = await requireActionRole(["customer", "admin"]);

  await createMaterialInquiry({
    company: getString(formData, "company"),
    intendedUse: getString(formData, "intendedUse"),
    materialName: getString(formData, "materialName"),
    notes: getString(formData, "notes"),
    quantity: getString(formData, "quantity"),
    requesterEmail: session.user.email,
    requesterName: session.user.name,
    specification: getString(formData, "specification"),
    stockForm: getString(formData, "stockForm"),
  });

  revalidatePath("/admin/material-inquiries");
  redirect("/materials/inquiry?status=submitted");
}
