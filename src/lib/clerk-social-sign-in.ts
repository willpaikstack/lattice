import type { SignInResource } from "@clerk/nextjs/types";

export type SocialSignInStrategy = "oauth_google" | "oauth_microsoft";

export async function createSocialSignInUrl(
  signIn: Pick<SignInResource, "create">,
  strategy: SocialSignInStrategy,
  origin: string,
  callbackUrl = new URL("/login/sso-callback", origin).href,
) {
  // Clerk JS 6.39's authenticateWithRedirect drops oidcPrompt for social OAuth.
  // Create the attempt directly so Clerk still owns state, PKCE and callbacks.
  const attempt = await signIn.create({
    strategy,
    oidcPrompt: "select_account",
    redirectUrl: callbackUrl,
    actionCompleteRedirectUrl: new URL("/account/continue", origin).href,
  });
  const destination = attempt.firstFactorVerification.externalVerificationRedirectURL;
  if (!destination) throw new Error("The sign-in provider did not return a redirect.");

  const url = new URL(destination);
  // Explicitly request Google's chooser even if Clerk's API omits the prompt.
  // All provider-generated state, scopes and callback parameters stay intact.
  if (strategy === "oauth_google" && url.origin === "https://accounts.google.com") {
    const prompts = (url.searchParams.get("prompt") || "").split(/\s+/).filter((prompt) => prompt && prompt !== "none");
    url.searchParams.set("prompt", [...new Set([...prompts, "select_account"])].join(" "));
    url.searchParams.delete("login_hint");
  }
  return url.href;
}
