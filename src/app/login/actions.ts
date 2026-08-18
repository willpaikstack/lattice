"use server";

import { redirect } from "next/navigation";

import { createSession, createSessionForUser } from "@/lib/session";
import { authorizedUser, canRoleAccessPath, defaultHomeForRole, verifyPassword } from "@/lib/auth-crypto";
import { authenticateWorkspaceUser, hasExpiredTemporaryPassword, roleForWorkspaceRole } from "@/lib/workspace-user";

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

  const workspaceUser = await authenticateWorkspaceUser(email, password);
  const isBootstrapAdmin = !workspaceUser && verifyPassword(email, password);

  if (!workspaceUser && !isBootstrapAdmin) {
    return {
      email,
      message: "The email or password is incorrect. Try again or reset your password.",
      next,
      status: "error",
    };
  }

  if (workspaceUser) {
    if (hasExpiredTemporaryPassword(workspaceUser)) {
      return {
        email,
        message: "Your temporary password has expired. Ask a Lattice administrator to issue a new one.",
        next,
        status: "error",
      };
    }

    const role = roleForWorkspaceRole(workspaceUser.role);
    await createSessionForUser({
      email: workspaceUser.email,
      id: workspaceUser.id,
      name: workspaceUser.name,
      mustChangePassword: workspaceUser.mustChangePassword,
      provider: "password",
      role,
    });
    redirect(workspaceUser.mustChangePassword ? "/account/set-password" : canRoleAccessPath(role, next) ? next : defaultHomeForRole(role));
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
