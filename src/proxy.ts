import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const protectedPrefixes = [
  "/account",
  "/admin",
  "/analytics",
  "/dashboard",
  "/equipment",
  "/materials",
  "/notifications",
  "/operator",
  "/orders",
  "/projects",
  "/quotes",
  "/requests",
  "/roadmap",
  "/shipped",
  "/supplier",
];
function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;
  const { isAuthenticated } = await auth();

  // A pending Clerk challenge may carry a user ID before the session is fully
  // authenticated. Protected Lattice routes require a completed session.
  if (isProtectedPath(pathname) && !isAuthenticated) {
    // Keep authentication inside the Lattice-designed sign-in flow rather than
    // sending customers to Clerk's hosted account domain.
    const signInUrl = request.nextUrl.clone();
    signInUrl.pathname = "/login";
    signInUrl.search = "";
    signInUrl.searchParams.set("redirect_url", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lattice-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
