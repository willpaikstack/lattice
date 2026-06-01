import Link from "next/link";
import { ArrowRight } from "lucide-react";

function PublicHeader() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <Link className="flex w-fit items-center gap-3" href="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-900 shadow-sm">
            <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2L14 8L8 14L2 8L8 2Z" fill="white" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-normal text-stone-900">Lattice</span>
        </Link>
      </div>
    </header>
  );
}

function TechnicalBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:100px_100px]" />

      <div className="absolute inset-0 opacity-[0.15]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.15) 60px,
              rgba(255,255,255,0.15) 61px
            )`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 60px,
              rgba(255,255,255,0.15) 60px,
              rgba(255,255,255,0.15) 61px
            )`,
          }}
        />
      </div>

      <div className="absolute left-1/4 top-1/2 h-32 w-32 opacity-10">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      </div>

      <div className="absolute right-1/4 top-1/3 h-24 w-24 opacity-10">
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
        <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
      </div>

      <div className="absolute bottom-1/4 left-1/3 h-40 w-40 opacity-5">
        <div className="absolute inset-0 rounded-full border-2 border-white" />
        <div className="absolute inset-4 rounded-full border border-white" />
        <div className="absolute inset-8 rounded-full border border-white" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white" />
      </div>

      <div className="absolute left-10 top-20 w-48 opacity-10">
        <div className="flex items-center gap-2">
          <div className="h-px w-2 bg-white" />
          <div className="h-px flex-1 bg-white" />
          <div className="h-px w-2 bg-white" />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[8px] text-white">
          <span>|</span>
          <span>|</span>
        </div>
      </div>

      <div className="absolute bottom-20 right-10 h-32 opacity-10">
        <div className="flex h-full flex-col items-center gap-2">
          <div className="h-2 w-px bg-white" />
          <div className="w-px flex-1 bg-white" />
          <div className="h-2 w-px bg-white" />
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-stone-900/60 via-stone-800/40 to-stone-900/60" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-stone-800/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-white/10">
      <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
        <path className="text-white" d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="hidden space-y-6 lg:block">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  <span className="text-xs font-medium uppercase tracking-wider text-white">Invite-only access</span>
                </div>
                <h1 className="text-4xl font-semibold tracking-normal text-white">Welcome back</h1>
                <p className="max-w-md text-lg leading-relaxed text-stone-300">
                  Access the private RFQ and procurement workspace for active Lattice teams.
                </p>
              </div>

              <div className="space-y-4 pt-8">
                {[
                  ["Submit CAD-backed RFQs", "Upload drawings and specifications"],
                  ["Review supplier quotes", "Compare pricing and lead times"],
                  ["Track production orders", "Monitor status through delivery"],
                ].map(([title, detail]) => (
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
                <div className="mb-6 lg:hidden">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-stone-600" />
                    <span className="text-xs font-medium uppercase tracking-wider text-stone-600">Invite-only access</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-normal text-stone-900">Log in</h1>
                    <p className="mt-1 text-sm text-stone-600">Enter your credentials to continue</p>
                  </div>

                  <form aria-label="Log in form" action="/dashboard" className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-stone-700" htmlFor="email">
                        Email
                      </label>
                      <input
                        autoComplete="email"
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-transparent focus:ring-2 focus:ring-stone-900"
                        id="email"
                        placeholder="you@company.com"
                        required
                        type="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-stone-700" htmlFor="password">
                        Password
                      </label>
                      <input
                        autoComplete="current-password"
                        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-transparent focus:ring-2 focus:ring-stone-900"
                        id="password"
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
