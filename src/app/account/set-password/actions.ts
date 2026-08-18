"use server";

import { redirect } from "next/navigation";

import { defaultHomeForRole } from "@/lib/auth-crypto";
import { createSessionForUser, getCurrentSession } from "@/lib/session";
import { completeForcedPasswordChange } from "@/lib/workspace-user-admin";

export async function setTemporaryPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password !== confirmation) {
    redirect("/account/set-password?error=mismatch");
  }

  const session = await getCurrentSession({ allowPasswordChange: true });
  if (!session?.user.mustChangePassword) {
    redirect("/login");
  }

  try {
    await completeForcedPasswordChange(session.user.id, password);
  } catch {
    redirect("/account/set-password?error=invalid");
  }

  await createSessionForUser({
    email: session.user.email,
    id: session.user.id,
    mustChangePassword: false,
    name: session.user.name,
    provider: "password",
    role: session.user.role,
  });
  redirect(defaultHomeForRole(session.user.role));
}
