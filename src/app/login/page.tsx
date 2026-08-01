import type { Metadata } from "next";

import { LoginPanel } from "@/components/login-panel";
import { PublicHeader, TechnicalBackground } from "@/components/public-entry";
import { googleSsoAvailability } from "@/lib/google-sso";

export const metadata: Metadata = {
  title: "Sign in | Lattice",
};

type LoginPageProps = {
  searchParams?: Promise<{
    email?: string;
    error?: string;
    next?: string;
  }>;
};

const loginBenefits = [
  ["Submit CAD-backed RFQs", "Upload drawings and specifications"],
  ["Review supplier quotes", "Compare pricing and lead times"],
  ["Track production orders", "Monitor status through delivery"],
];

function CheckIcon() {
  return (
    <span aria-hidden="true" className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10">
      <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
        <path className="text-white" d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;
  const initialEmail = normalizeEmail(params?.email);
  const next = safePath(params?.next);
  const sso = googleSsoAvailability();
  const initialErrorMessage = loginErrorMessage(error);

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="hidden space-y-6 lg:block">
              <div className="space-y-2">
                <h2 className="text-4xl font-semibold tracking-normal text-white">Welcome back</h2>
                <p className="max-w-md text-lg leading-relaxed text-stone-300">
                  Access the private RFQ and procurement workspace for active Lattice teams.
                </p>
              </div>

              <div className="space-y-4 pt-8">
                {loginBenefits.map(([title, detail]) => (
                  <div className="flex items-start gap-3" key={title}>
                    <CheckIcon />
                    <div>
                      <div className="text-sm font-medium text-white">{title}</div>
                      <div className="text-sm text-stone-400">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
              <LoginPanel
                initialEmail={initialEmail}
                initialErrorMessage={initialErrorMessage}
                next={next}
                ssoEnabled={sso.enabled}
              />
            </div>
          </div>
        </div>

        <TechnicalBackground />
      </section>
    </main>
  );
}

function loginErrorMessage(error?: string) {
  if (error === "invalid-credentials") {
    return "The email or password is incorrect. Try again or reset your password.";
  }

  if (error === "sso-not-configured") {
    return "Single sign-on is unavailable right now. Use your password or contact Lattice support.";
  }

  if (error === "sso-cancelled") {
    return "Single sign-on was canceled. Try again when you are ready.";
  }

  if (error === "sso-state") {
    return "Your secure sign-in session expired. Start again with your work email.";
  }

  if (error?.startsWith("sso-")) {
    return "We could not complete single sign-on. Try again or contact Lattice support.";
  }

  return "";
}

function normalizeEmail(email?: string) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.includes("@") ? normalized : "";
}

function safePath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}
