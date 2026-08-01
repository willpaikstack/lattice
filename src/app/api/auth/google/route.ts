import { NextResponse } from "next/server";

import { createGoogleSsoState, GOOGLE_SSO_STATE_COOKIE_NAME, googleAuthorizationUrl, googleSsoConfig, verifyGoogleSsoState } from "@/lib/google-sso";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const config = googleSsoConfig(requestUrl.origin);
  const email = requestUrl.searchParams.get("email");
  const next = requestUrl.searchParams.get("next");

  if (!config) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "sso-not-configured");
    if (email) loginUrl.searchParams.set("email", email);
    if (next) loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  // The state cookie must be set on the same host that Google redirects back to.
  // Local development can be reached through 0.0.0.0, but Google returns to the
  // registered localhost callback URI.
  const callbackOrigin = new URL(config.redirectUri).origin;
  if (requestUrl.origin !== callbackOrigin) {
    const startUrl = new URL(requestUrl.pathname, callbackOrigin);
    startUrl.search = requestUrl.search;
    return NextResponse.redirect(startUrl);
  }

  const stateToken = createGoogleSsoState(next, email);
  const state = verifyGoogleSsoState(stateToken, stateToken);

  if (!state) {
    return NextResponse.redirect(new URL("/login?error=sso-state", request.url));
  }

  const response = NextResponse.redirect(googleAuthorizationUrl(config, stateToken, state));
  response.cookies.set(GOOGLE_SSO_STATE_COOKIE_NAME, stateToken, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
