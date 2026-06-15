import { NextResponse, type NextRequest } from "next/server";

import { canRoleAccessPath, defaultHomeForRole, roleForSession, SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-crypto";

const protectedPrefixes = [
  "/account",
  "/admin",
  "/analytics",
  "/capabilities",
  "/dashboard",
  "/equipment",
  "/materials",
  "/notifications",
  "/operator",
  "/orders",
  "/projects",
  "/quotes",
  "/requests",
  "/shipped",
  "/supplier",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  const isAuthenticated = Boolean(session?.userId);
  const role = session ? roleForSession(session) : null;

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL(defaultHomeForRole(role ?? "customer"), request.url));
  }

  if (isProtectedPath(pathname) && role && !canRoleAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(defaultHomeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
