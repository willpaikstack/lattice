import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PublicHeader, TechnicalBackground } from "@/components/public-entry";
import { forgotPasswordAction } from "./actions";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const status = (await searchParams)?.status;
  const isSent = status === "sent";

  return (
    <main className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-stone-200">
      <PublicHeader />
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-6 py-20 pt-40 lg:px-8">
        <div className="relative z-10 mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-xl lg:p-10">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-normal text-stone-900">Forgot password</h1>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {isSent ? "If that account exists, reset instructions have been sent." : "Enter your account email and we will send reset instructions."}
                </p>
              </div>

              {isSent ? (
                <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-stone-900 px-4 font-medium text-white transition-all hover:bg-stone-800" href="/">
                  Back to Home
                </Link>
              ) : (
                <form action={forgotPasswordAction} aria-label="Forgot password form" className="space-y-5">
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

                  <button className="group flex w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-3 font-medium text-white transition-all hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2" type="submit">
                    Send reset instructions
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" size={16} />
                  </button>
                </form>
              )}

              <div className="border-t border-stone-200 pt-6">
                <p className="text-center text-sm text-stone-600">
                  Remembered it?{" "}
                  <Link className="font-medium text-stone-900 hover:underline" href="/login">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <TechnicalBackground />
      </section>
    </main>
  );
}
