import { signedInRecoveryEmail } from "@/lib/password-reset-identity";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PublicAuthLayout } from "@/components/public-marketing";
import { forgotPasswordAction } from "./actions";

export const metadata: Metadata = {
  title: "Reset password | Lattice",
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<{
    email?: string;
    status?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const params = await searchParams;
  const status = params?.status;
  const accountEmail = await signedInRecoveryEmail();
  const initialEmail = accountEmail ?? normalizeEmail(params?.email);
  const isSent = status === "sent";

  return (
    <PublicAuthLayout recovery>
      <div className="rounded-lg border border-stone-200 bg-white p-8 shadow-xl lg:p-10">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-stone-900">
              Reset your password
            </h1>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              {isSent
                ? "If that account exists, reset instructions are on the way."
                : accountEmail
                  ? "We will send reset instructions to your signed-in account email."
                  : "Enter your work email and we will send secure reset instructions."}
            </p>
          </div>

          {isSent ? (
            <div className="space-y-4" role="status">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                Check your inbox and spam folder. The reset link is time-limited
                for your security.
              </div>
              <Link
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-stone-900 px-4 font-medium text-white transition-colors hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                href="/login"
              >
                Return to sign in
              </Link>
              {!accountEmail ? (
                <Link
                  className="inline-flex min-h-6 w-full items-center justify-center text-sm font-medium text-stone-700 underline-offset-4 hover:text-stone-950 hover:underline focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                  href="/forgot-password"
                >
                  Try another email
                </Link>
              ) : null}
            </div>
          ) : (
            <form
              action={forgotPasswordAction}
              aria-label="Forgot password form"
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-stone-700"
                  htmlFor="email"
                >
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
                  defaultValue={initialEmail}
                  readOnly={Boolean(accountEmail)}
                />
              </div>

              <AuthSubmitButton
                label="Send reset instructions"
                pendingLabel="Sending instructions..."
              />
            </form>
          )}

          <div className="border-t border-stone-200 pt-5">
            <p className="text-center text-sm text-stone-600">
              Remembered it?{" "}
              <Link
                className="inline-flex min-h-6 items-center font-medium text-stone-900 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                href={
                  initialEmail
                    ? `/login?email=${encodeURIComponent(initialEmail)}`
                    : "/login"
                }
              >
                Sign in
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-stone-600">
              Still need help?{" "}
              <a
                className="inline-flex min-h-6 items-center font-medium text-stone-900 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2"
                href="mailto:support@latticeos.co"
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </PublicAuthLayout>
  );
}

function normalizeEmail(email?: string) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized.includes("@") ? normalized : "";
}
