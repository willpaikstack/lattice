import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicHeader, TechnicalBackground } from "@/components/public-entry";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
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
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10">
      <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
        <path className="text-white" d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;
  const next = safePath(params?.next);
  const hasInvalidCredentials = error === "invalid-credentials";
  const hasSsoError = error?.startsWith("sso-");

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="hidden space-y-6 lg:block">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-normal text-white">Welcome back</h1>
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
              <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xl lg:p-10">
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-normal text-stone-900">Log in</h1>
                    <p className="mt-1 text-sm text-stone-600">Enter your credentials to continue</p>
                  </div>

                  {hasInvalidCredentials ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      The email or password is incorrect.
                    </div>
                  ) : null}

                  {hasSsoError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                      Google Workspace sign-in is not available. Check the SSO configuration and allowed domain.
                    </div>
                  ) : null}

                  <Link
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 font-medium text-stone-900 transition-all hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                    href={`/api/auth/google?next=${encodeURIComponent(next)}`}
                  >
                    Continue with Google Workspace
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-stone-200" />
                    <span className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">or</span>
                    <div className="h-px flex-1 bg-stone-200" />
                  </div>

                  <form aria-label="Log in form" action={loginAction} className="space-y-5">
                    <input name="next" type="hidden" value={next} />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-stone-700" htmlFor="email">
                        Email
                      </label>
                      <input
                        autoComplete="email"
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-transparent focus:ring-2 focus:ring-stone-900"
                        id="email"
                        name="email"
                        placeholder="you@company.com"
                        required
                        type="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <label className="block text-sm font-medium text-stone-700" htmlFor="password">
                          Password
                        </label>
                        <Link className="text-sm font-medium text-stone-700 hover:text-stone-950 hover:underline" href="/forgot-password">
                          Forgot password?
                        </Link>
                      </div>
                      <input
                        autoComplete="current-password"
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-transparent focus:ring-2 focus:ring-stone-900"
                        id="password"
                        name="password"
                        placeholder="........"
                        required
                        type="password"
                      />
                    </div>

                    <button className="group flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 font-medium text-white transition-all hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" type="submit">
                      Continue
                      <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} />
                    </button>
                  </form>

                  <div className="border-t border-stone-200 pt-6">
                    <p className="text-center text-sm text-stone-600">
                      Need access?{" "}
                      <Link className="font-medium text-stone-900 hover:underline" href="/waiting-list">
                        Request an invite
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TechnicalBackground />
      </section>
    </main>
  );
}

function safePath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}
