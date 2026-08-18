import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-crypto";
import { createSessionCookie } from "@/lib/session";

export async function GET(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]+)`))?.[1];
  const session = verifySessionToken(token);
  const supportAdmin = session?.supportAdmin;
  if (!supportAdmin) return NextResponse.redirect(new URL("/login", request.url));

  const restored = createSessionCookie({
    email: supportAdmin.email,
    id: supportAdmin.id,
    name: supportAdmin.name,
    provider: "password",
    role: "admin",
  });
  const response = NextResponse.redirect(new URL("/admin/customers", request.url));
  response.cookies.set(SESSION_COOKIE_NAME, restored.token, {
    expires: restored.expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
