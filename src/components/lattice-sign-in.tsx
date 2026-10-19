"use client";

import { SignIn, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { createSocialSignInUrl, type SocialSignInStrategy } from "@/lib/clerk-social-sign-in";

export function LatticeSignIn() {
  const clerk = useClerk();
  const pathname = usePathname();
  const starting = useRef(false);
  const [pending, setPending] = useState<SocialSignInStrategy | null>(null);
  const [error, setError] = useState("");
  const isStart = pathname === "/login" || pathname === "/login/";

  async function continueWith(strategy: SocialSignInStrategy) {
    if (!clerk.loaded || !clerk.client || starting.current) return;
    starting.current = true;
    setPending(strategy);
    setError("");
    try {
      const callbackUrl = clerk.buildUrlWithAuth(new URL("/login/sso-callback", window.location.origin).href);
      const url = await createSocialSignInUrl(clerk.client.signIn, strategy, window.location.origin, callbackUrl);
      window.location.assign(url);
    } catch {
      setError("We couldn’t start sign-in. Please try again or use your email and password.");
      starting.current = false;
      setPending(null);
    }
  }

  const signIn = <SignIn
    forceRedirectUrl="/account/continue"
    oidcPrompt="select_account"
    path="/login"
    routing="path"
    signUpUrl="/sign-up"
    appearance={isStart ? { elements: {
      rootBox: { width: "100%" },
      cardBox: { width: "100%", boxShadow: "none", borderRadius: 0 },
      card: { paddingTop: 0, boxShadow: "none" },
      header: { display: "none" },
      socialButtons: { display: "none" },
      dividerRow: { display: "none" },
    } } : undefined}
  />;

  // Clerk renders callback, recovery, MFA and other challenges on nested paths.
  if (!isStart) return signIn;

  return <div className="overflow-hidden rounded-xl bg-white shadow-xl">
    <div className="px-8 pb-6 pt-8 text-center">
      <h1 className="text-xl font-semibold text-stone-900">Sign in to Lattice OS</h1>
      <p className="mt-2 text-sm text-stone-500">Welcome back! Please sign in to continue</p>
      <div className="mt-6 grid gap-3">
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:opacity-50" disabled={!clerk.loaded || pending !== null} onClick={() => void continueWith("oauth_google")} type="button">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.82 1.51l2.86-2.86A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z"/></svg>
          {pending === "oauth_google" ? "Opening Google…" : "Continue with Google"}
        </button>
        <button className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-700 disabled:opacity-50" disabled={!clerk.loaded || pending !== null} onClick={() => void continueWith("oauth_microsoft")} type="button">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 21 21"><path fill="#f25022" d="M0 0h10v10H0z"/><path fill="#7fba00" d="M11 0h10v10H11z"/><path fill="#00a4ef" d="M0 11h10v10H0z"/><path fill="#ffb900" d="M11 11h10v10H11z"/></svg>
          {pending === "oauth_microsoft" ? "Opening Microsoft…" : "Continue with Microsoft"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="mt-6 flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />or<span className="h-px flex-1 bg-stone-200" /></div>
    </div>
    {signIn}
  </div>;
}
