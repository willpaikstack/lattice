import type { SignInResource } from "@clerk/nextjs/types";
import { describe, expect, it, vi } from "vitest";

import { createSocialSignInUrl } from "./clerk-social-sign-in";

function signInWithRedirect(destination: string | null) {
  const create = vi.fn().mockResolvedValue({ firstFactorVerification: { externalVerificationRedirectURL: destination } });
  return { create } as unknown as Pick<SignInResource, "create">;
}

describe("social account selection", () => {
  it("passes the prompt directly to Clerk and preserves Google's OAuth state and callback", async () => {
    const signIn = signInWithRedirect("https://accounts.google.com/o/oauth2/v2/auth?state=opaque-state&redirect_uri=https%3A%2F%2Fclerk.latticeos.co%2Fv1%2Foauth_callback&code_challenge=opaque-pkce&login_hint=previous%40example.com");
    const url = new URL(await createSocialSignInUrl(signIn, "oauth_google", "https://latticeos.co"));
    expect(signIn.create).toHaveBeenCalledWith({ strategy: "oauth_google", oidcPrompt: "select_account", redirectUrl: "https://latticeos.co/login/sso-callback", actionCompleteRedirectUrl: "https://latticeos.co/account/continue" });
    expect(url.searchParams.get("prompt")).toBe("select_account");
    expect(url.searchParams.get("state")).toBe("opaque-state");
    expect(url.searchParams.get("code_challenge")).toBe("opaque-pkce");
    expect(url.searchParams.get("redirect_uri")).toBe("https://clerk.latticeos.co/v1/oauth_callback");
    expect(url.searchParams.has("login_hint")).toBe(false);
  });

  it("preserves required consent while adding account selection and a decorated callback", async () => {
    const signIn = signInWithRedirect("https://accounts.google.com/o/oauth2/v2/auth?state=opaque&prompt=consent");
    const callback = "https://latticeos.co/login/sso-callback?__clerk_db_jwt=opaque-development-token";
    const url = new URL(await createSocialSignInUrl(signIn, "oauth_google", "https://latticeos.co", callback));
    expect(url.searchParams.get("prompt")).toBe("consent select_account");
    expect(signIn.create).toHaveBeenCalledWith(expect.objectContaining({ redirectUrl: callback }));
  });

  it("preserves Clerk challenge URLs instead of bypassing provider protection", async () => {
    const destination = "https://clerk.latticeos.co/v1/protect?state=opaque";
    expect(await createSocialSignInUrl(signInWithRedirect(destination), "oauth_google", "https://latticeos.co")).toBe(destination);
  });

  it("keeps Microsoft on its Clerk-provided redirect", async () => {
    const destination = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?state=opaque";
    expect(await createSocialSignInUrl(signInWithRedirect(destination), "oauth_microsoft", "https://latticeos.co")).toBe(destination);
  });

  it("fails visibly when Clerk cannot provide a redirect", async () => {
    await expect(createSocialSignInUrl(signInWithRedirect(null), "oauth_google", "https://latticeos.co")).rejects.toThrow("did not return a redirect");
  });
});
