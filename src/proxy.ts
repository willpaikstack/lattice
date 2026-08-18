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
  const { userId, redirectToSignIn } = await auth();

  if (isProtectedPath(pathname) && !userId) {
    return redirectToSignIn({ returnBackUrl: request.url });
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
