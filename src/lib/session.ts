import "server-only";

import { cookies } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";

import { createSessionToken, SESSION_COOKIE_NAME, verifySessionToken, type LatticeRole } from "./auth-crypto";
import { clerkUserDisplayName } from "./clerk-user-profile";
import { customerRoleForWorkspaceRole, findWorkspaceUser, findWorkspaceUserByClerkUserId, linkWorkspaceUserToClerk, roleForWorkspaceRole, syncWorkspaceUserName } from "./workspace-user";

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

type SessionUserInput = {
  email?: string;
  id: string;
  mustChangePassword?: boolean;
  name?: string;
  provider?: "google" | "password";
  role?: LatticeRole;
  supportAdmin?: {
    email: string;
    id: string;
    name: string;
  };
};

export function createSessionCookie(user: SessionUserInput) {
  const expires = new Date(Date.now() + sessionDurationMs);
  const token = createSessionToken({
    email: user.email,
    exp: expires.getTime(),
    iat: Date.now(),
    mustChangePassword: user.mustChangePassword,
    name: user.name,
    provider: user.provider,
    role: user.role ?? "customer",
    supportAdmin: user.supportAdmin,
    userId: user.id,
  });

  return { expires, token };
}

export async function createSessionForUser(user: SessionUserInput) {
  const { expires, token } = createSessionCookie(user);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function createSession() {
  // Clerk owns normal sign-in sessions. This remains as a compatibility no-op
  // while the legacy password pages are retired.
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

type SupportAdmin = { email: string; id: string; name: string } | null;

type CurrentSession = {
  user: {
    email: string;
    id: string;
    name: string;
    role: LatticeRole;
    companyId: string | null;
    companyName: string | null;
    customerRole: "admin" | "member" | null;
    mustChangePassword: boolean;
    supportAdmin: SupportAdmin;
  };
};

export type PasswordSetupState =
  | { status: "signed-out" }
  | { status: "not-provisioned" }
  | { status: "already-complete" }
  | { status: "expired" }
  | { status: "ready"; session: CurrentSession };

async function resolveCurrentWorkspaceUser() {
  const clerkAuth = await auth();
  if (!clerkAuth.isAuthenticated || !clerkAuth.userId) return null;
  const clerkUserId = clerkAuth.userId;

  let workspaceUser = await findWorkspaceUserByClerkUserId(clerkUserId);
  const clerkUser = await currentUser();

  // Existing Lattice members are linked on their first completed Clerk sign-in.
  // Clerk only returns a primary email after its own verification requirements pass.
  if (!workspaceUser) {
    const email = clerkUser?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
    if (!email) return { clerkUser, workspaceUser: null };

    const provisionedUser = await findWorkspaceUser(email);
    if (!provisionedUser) return { clerkUser, workspaceUser: null };
    workspaceUser = await linkWorkspaceUserToClerk(provisionedUser.id, clerkUserId);
  }

  const clerkName = clerkUserDisplayName(clerkUser);
  if (clerkName && clerkName !== workspaceUser.name) {
    const syncedUser = await syncWorkspaceUserName(workspaceUser.id, clerkName);
    if (syncedUser) workspaceUser = syncedUser;
  }

  return { clerkUser, workspaceUser };
}

export async function getCurrentSession(options?: { allowPasswordChange?: boolean }): Promise<CurrentSession | null> {
  const resolved = await resolveCurrentWorkspaceUser();
  if (!resolved?.workspaceUser) return null;
  const workspaceUser = resolved.workspaceUser;

  const supportToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const supportSession = verifySessionToken(supportToken);
  if (workspaceUser.role === "LATTICE_ADMIN" && supportSession?.supportAdmin?.id === workspaceUser.id) {
    const supportedUser = await findWorkspaceUser(supportSession.email);
    if (supportedUser && supportedUser.companyId && !supportedUser.mustChangePassword) {
      return {
        user: {
          email: supportedUser.email,
          id: supportedUser.id,
          name: supportedUser.name,
          role: "customer" as LatticeRole,
          companyId: supportedUser.companyId,
          companyName: supportedUser.company?.name ?? null,
          customerRole: customerRoleForWorkspaceRole(supportedUser.role),
          mustChangePassword: false,
          supportAdmin: { ...supportSession.supportAdmin },
        },
      };
    }
  }

  if (workspaceUser.mustChangePassword) {
    if (workspaceUser.temporaryPasswordExpiresAt && workspaceUser.temporaryPasswordExpiresAt <= new Date()) {
      return null;
    }

    if (!options?.allowPasswordChange) {
      return null;
    }
  }

  return {
    user: {
      email: workspaceUser.email,
      id: workspaceUser.id,
      name: workspaceUser.name,
      role: roleForWorkspaceRole(workspaceUser.role),
      companyId: workspaceUser.companyId,
      companyName: workspaceUser.company?.name ?? null,
      customerRole: customerRoleForWorkspaceRole(workspaceUser.role),
      mustChangePassword: workspaceUser.mustChangePassword,
      supportAdmin: null,
    },
  };
}

/**
 * Provides a customer-safe state for the forced-password route. Unlike the
 * normal session helper, this distinguishes an expired or unprovisioned account
 * from a normal signed-out state so the route can never fail as a blank page.
 */
export async function getPasswordSetupState(): Promise<PasswordSetupState> {
  const resolved = await resolveCurrentWorkspaceUser();
  if (!resolved) return { status: "signed-out" };
  if (!resolved.workspaceUser) return { status: "not-provisioned" };

  const workspaceUser = resolved.workspaceUser;
  if (!workspaceUser.mustChangePassword) return { status: "already-complete" };
  if (workspaceUser.temporaryPasswordExpiresAt && workspaceUser.temporaryPasswordExpiresAt <= new Date()) {
    return { status: "expired" };
  }

  const session = await getCurrentSession({ allowPasswordChange: true });
  return session?.user.mustChangePassword
    ? { status: "ready", session }
    : { status: "not-provisioned" };
}
