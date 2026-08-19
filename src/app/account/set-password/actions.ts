"use server";

import { redirect } from "next/navigation";

import { createSessionForUser, getPasswordSetupState } from "@/lib/session";
import { completeForcedPasswordChange, type PasswordSetupFailureCode } from "@/lib/workspace-user-admin";

function errorPath(error: unknown) {
  const code = typeof error === "object" && error && "code" in error
    ? (error as { code?: string }).code
    : undefined;
  const recognized: PasswordSetupFailureCode[] = ["expired", "password-policy", "setup-unavailable", "service"];
  return recognized.includes(code as PasswordSetupFailureCode) ? code : "service";
}

export async function setTemporaryPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password !== confirmation) {
    redirect("/account/set-password?error=mismatch");
  }

  const state = await getPasswordSetupState();
  if (state.status !== "ready") {
    redirect("/account/set-password");
  }
  const { session } = state;

  try {
    await completeForcedPasswordChange(session.user.id, password);
  } catch (error) {
    redirect(`/account/set-password?error=${errorPath(error)}`);
  }

  await createSessionForUser({
    email: session.user.email,
    id: session.user.id,
    mustChangePassword: false,
    name: session.user.name,
    provider: "password",
    role: session.user.role,
  });
  redirect("/account/continue");
}
