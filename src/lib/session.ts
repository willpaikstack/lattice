import "server-only";

import { cookies } from "next/headers";

import { authorizedUser, createSessionToken, SESSION_COOKIE_NAME, verifySessionToken } from "./auth-crypto";

const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export async function createSession() {
  const expires = new Date(Date.now() + sessionDurationMs);
  const token = createSessionToken({
    exp: expires.getTime(),
    userId: authorizedUser.id,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session || session.userId !== authorizedUser.id) {
    return null;
  }

  return {
    user: {
      email: authorizedUser.email,
      id: authorizedUser.id,
      name: authorizedUser.name,
    },
  };
}
