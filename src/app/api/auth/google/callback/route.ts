import { NextResponse, type NextRequest } from "next/server";

import { exchangeGoogleCode, GOOGLE_SSO_STATE_COOKIE_NAME, googleSsoConfig, verifyGoogleIdToken, verifyGoogleSsoState } from "@/lib/google-sso";
import { canRoleAccessPath, defaultHomeForRole, resolveRoleForEmail, SESSION_COOKIE_NAME } from "@/lib/auth-crypto";
import { createSessionCookie } from "@/lib/session";

export const dynamic = "force-dynamic";

function redirectWithError(request: Request, error: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const config = googleSsoConfig(requestUrl.origin);

  if (!config) {
    return redirectWithError(request, "sso-not-configured");
  }

  const oauthError = requestUrl.searchParams.get("error");
  if (oauthError) {
    return redirectWithError(request, "sso-cancelled");
  }

  const state = verifyGoogleSsoState(request.cookies.get(GOOGLE_SSO_STATE_COOKIE_NAME)?.value, requestUrl.searchParams.get("state"));

  if (!state) {
    return redirectWithError(request, "sso-state");
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return redirectWithError(request, "sso-missing-code");
  }

  try {
    const idToken = await exchangeGoogleCode(config, code);
    const claims = await verifyGoogleIdToken(config, idToken, state.nonce);
    const role = resolveRoleForEmail(claims.email);
    const sessionCookie = createSessionCookie({
      email: claims.email,
      id: `google:${claims.sub}`,
      name: claims.name ?? claims.email,
      provider: "google",
      role,
    });
    const redirectPath = canRoleAccessPath(role, state.next) ? state.next : defaultHomeForRole(role);
    const response = NextResponse.redirect(new URL(redirectPath, request.url));
    response.cookies.delete(GOOGLE_SSO_STATE_COOKIE_NAME);
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie.token, {
      expires: sessionCookie.expires,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch {
    const response = redirectWithError(request, "sso-failed");
    response.cookies.delete(GOOGLE_SSO_STATE_COOKIE_NAME);
    return response;
  }
}
