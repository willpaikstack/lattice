import Link from "next/link";

import { AuthSubmitButton } from "@/components/auth-submit-button";
import { PublicHeader, TechnicalBackground } from "@/components/public-entry";
import { resetPasswordAction } from "./actions";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token = "", error } = await searchParams;
  return <main className="min-h-screen bg-stone-50 text-stone-900"><PublicHeader /><section className="flex min-h-screen items-center justify-center bg-stone-900 px-6 pt-28"><div className="relative z-10 w-full max-w-md rounded-lg bg-white p-8 shadow-xl"><h1 className="text-2xl font-semibold">Choose a new password</h1><p className="mt-2 text-sm text-stone-600">Use at least 8 characters. This link can be used once.</p>{error ? <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error === "mismatch" ? "Passwords do not match." : "This reset link is invalid or has expired."}</p> : null}<form action={resetPasswordAction} className="mt-6 space-y-4"><input name="token" type="hidden" value={token} /><label className="block text-sm font-medium">New password<input className="mt-2 w-full rounded border p-3" minLength={8} name="password" required type="password" /></label><label className="block text-sm font-medium">Confirm password<input className="mt-2 w-full rounded border p-3" minLength={8} name="confirmation" required type="password" /></label><AuthSubmitButton label="Reset password" pendingLabel="Resetting password…" /></form><Link className="mt-5 block text-center text-sm underline" href="/login">Return to sign in</Link></div><TechnicalBackground /></section></main>;
}
