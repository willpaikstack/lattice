import "server-only";

import { cookies } from "next/headers";

import { authorizedUser, createSessionToken, resolveRoleForEmail, SESSION_COOKIE_NAME, verifySessionToken, type LatticeRole } from "./auth-crypto";
import { customerRoleForWorkspaceRole, findWorkspaceUser, roleForWorkspaceRole } from "./workspace-user";

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

type SessionUserInput = {
  email?: string;
  id: string;
  name?: string;
  provider?: "google" | "password";
  role?: LatticeRole;
};

export function createSessionCookie(user: SessionUserInput) {
  const expires = new Date(Date.now() + sessionDurationMs);
  const token = createSessionToken({
    email: user.email,
    exp: expires.getTime(),
    name: user.name,
    provider: user.provider,
    role: user.role ?? resolveRoleForEmail(user.email),
    userId: user.id,
  });

  return { expires, token };
}

async function createSessionForUser(user: SessionUserInput) {
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
  await createSessionForUser({
    email: authorizedUser.email,
    id: authorizedUser.id,
    name: authorizedUser.name,
    provider: "password",
    role: authorizedUser.role,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const email = session.email ?? authorizedUser.email;
  const workspaceUser = await findWorkspaceUser(email);
  const workspaceRole = workspaceUser ? roleForWorkspaceRole(workspaceUser.role) : null;

  return {
    user: {
      email,
      id: workspaceUser?.id ?? session.userId,
      name: workspaceUser?.name ?? session.name ?? authorizedUser.name,
      role: workspaceRole ?? session.role ?? resolveRoleForEmail(session.email),
      companyId: workspaceUser?.companyId ?? null,
      companyName: workspaceUser?.company?.name ?? null,
      customerRole: workspaceUser ? customerRoleForWorkspaceRole(workspaceUser.role) : null,
    },
  };
}
