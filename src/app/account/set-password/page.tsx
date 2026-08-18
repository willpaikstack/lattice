import { redirect } from "next/navigation";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { getCurrentSession } from "@/lib/session";

import { setTemporaryPasswordAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, params] = await Promise.all([getCurrentSession({ allowPasswordChange: true }), searchParams]);

  if (!session?.user.mustChangePassword) {
    redirect("/login");
  }

  const message = params.error === "mismatch"
    ? "Passwords do not match."
    : params.error === "invalid"
      ? "This temporary password is no longer valid. Ask a Lattice administrator to issue a new one."
      : null;

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-12 text-stone-900 sm:flex sm:items-center sm:justify-center">
      <section className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Security update required</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Choose your password</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Your administrator issued a temporary password. Choose a personal password to continue to your workspace.
        </p>
        {message ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">{message}</p> : null}
        <form action={setTemporaryPasswordAction} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-stone-800">
            New password
            <input autoComplete="new-password" className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2.5" minLength={12} name="password" required type="password" />
          </label>
          <label className="block text-sm font-medium text-stone-800">
            Confirm password
            <input autoComplete="new-password" className="mt-2 w-full rounded-md border border-stone-300 px-3 py-2.5" minLength={12} name="confirmation" required type="password" />
          </label>
          <AuthSubmitButton label="Save password and continue" pendingLabel="Saving password…" />
        </form>
        <a className="mt-5 inline-flex text-sm font-medium text-stone-600 underline hover:text-stone-950" href="/api/logout">Sign out</a>
      </section>
    </main>
  );
}
