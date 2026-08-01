"use server";

import { redirect } from "next/navigation";

import { createSession } from "@/lib/session";
import { authorizedUser, canRoleAccessPath, defaultHomeForRole, verifyPassword } from "@/lib/auth-crypto";

export type LoginActionState = {
  email: string;
  message: string;
  next: string;
  status: "idle" | "error";
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAction(_previousState: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = getString(formData, "email").trim().toLowerCase();
  const password = getString(formData, "password");
  const next = safePath(getString(formData, "next"));

  if (!verifyPassword(email, password)) {
    return {
      email,
      message: "The email or password is incorrect. Try again or reset your password.",
      next,
      status: "error",
    };
  }

  await createSession();
  redirect(canRoleAccessPath(authorizedUser.role, next) ? next : defaultHomeForRole(authorizedUser.role));
}

function safePath(path: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}
