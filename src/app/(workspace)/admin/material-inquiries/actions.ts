"use server";

import { revalidatePath } from "next/cache";

import { isMaterialInquiryStatus, updateMaterialInquiry } from "@/lib/material-inquiries";
import { requireActionRole } from "@/lib/route-authorization";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function updateMaterialInquiryAction(inquiryId: string, formData: FormData) {
  await requireActionRole(["admin"]);
  const status = getString(formData, "status");

  if (!isMaterialInquiryStatus(status)) {
    throw new Error("Choose a valid inquiry status.");
  }

  await updateMaterialInquiry(inquiryId, status, getString(formData, "operatorNotes"));
  revalidatePath("/admin/material-inquiries");
}
