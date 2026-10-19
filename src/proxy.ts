import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/account",
  "/customer-onboarding-workspace",
  "/admin",
  "/analytics",
  "/dashboard",
  "/equipment",
  "/equipment-explorer",
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

const workspaceMiddleware = clerkMiddleware(async (auth, request) => {
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

/** The isolated synthetic preview never needs authentication or customer data. */
export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NODE_ENV === "development" && process.env.LOCAL_TIMING_PREVIEW === "1" && ["/design-preview/timing-a", "/design-preview/timing-c"].includes(request.nextUrl.pathname)) return NextResponse.next();
  return workspaceMiddleware(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
