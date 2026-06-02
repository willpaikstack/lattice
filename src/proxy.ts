import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME, authorizedUser, verifySessionToken } from "@/lib/auth-crypto";

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
  const isAuthenticated = session?.userId === authorizedUser.id;

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
