import { NextResponse } from "next/server";

import { createGoogleSsoState, GOOGLE_SSO_STATE_COOKIE_NAME, googleAuthorizationUrl, googleSsoConfig, verifyGoogleSsoState } from "@/lib/google-sso";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const config = googleSsoConfig(requestUrl.origin);

  if (!config) {
    return NextResponse.redirect(new URL("/login?error=sso-not-configured", request.url));
  }

  const stateToken = createGoogleSsoState(requestUrl.searchParams.get("next"));
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
