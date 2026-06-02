"use server";

import { redirect } from "next/navigation";

import { createSession } from "@/lib/session";
import { verifyPassword } from "@/lib/auth-crypto";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!verifyPassword(email, password)) {
    redirect("/login?error=invalid-credentials");
  }

  await createSession();
  redirect("/dashboard");
}
