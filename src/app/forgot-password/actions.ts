"use server";

import { redirect } from "next/navigation";

import { requestPasswordReset } from "@/lib/password-reset-email";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function forgotPasswordAction(formData: FormData) {
  await requestPasswordReset(getString(formData, "email"));
  redirect("/forgot-password?status=sent");
}
