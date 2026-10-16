"use server";

import { redirect } from "next/navigation";

import { consumePasswordReset, PasswordResetError } from "@/lib/password-reset";

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password !== confirmation) redirect(`/reset-password?token=${encodeURIComponent(token)}&error=mismatch`);
  try {
    await consumePasswordReset(token, password);
  } catch (error) {
    const code = error instanceof PasswordResetError ? error.code : "service";
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=${code}`);
  }
  redirect("/login?reset=complete");
}
