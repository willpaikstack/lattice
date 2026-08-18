import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PublicHeader, TechnicalBackground } from "@/components/public-entry";

import { verifyEmailChangeAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function VerifyEmailChangePage({ searchParams }: { searchParams: Promise<{ error?: string; token?: string }> }) {
  const { error, token = "" } = await searchParams;
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <PublicHeader />
      <section className="flex min-h-screen items-center justify-center bg-stone-900 px-6 pt-28">
        <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold">Confirm your new email</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">Confirming will make this address your Lattice OS sign-in email and sign you out of any active sessions.</p>
          {error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">This verification link is invalid or has expired.</p> : null}
          <form action={verifyEmailChangeAction} className="mt-6">
            <input name="token" type="hidden" value={token} />
            <AuthSubmitButton label="Confirm email change" pendingLabel="Confirming email…" />
          </form>
          <Link className="mt-5 block text-center text-sm underline" href="/login">Return to sign in</Link>
        </div>
        <TechnicalBackground />
      </section>
    </main>
  );
}
