"use server";

import { redirect } from "next/navigation";

import { confirmEmailChange } from "@/lib/email-change";

export async function verifyEmailChangeAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  try {
    await confirmEmailChange(token);
  } catch {
    redirect(`/verify-email-change?token=${encodeURIComponent(token)}&error=invalid`);
  }
  redirect("/login?emailChanged=1");
}
