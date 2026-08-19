"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

function messageFor(error: unknown) {
  if (typeof error === "object" && error && "errors" in error && Array.isArray((error as { errors?: unknown[] }).errors)) {
    const first = (error as { errors: Array<{ longMessage?: string; message?: string }> }).errors[0];
    if (first?.longMessage || first?.message) return first.longMessage || first.message || "Unable to update password.";
  }
  return "Unable to update your password. Please try again.";
}

export function ClerkPasswordEditor() {
  const { user, isLoaded } = useUser(); const router = useRouter();
  const [open, setOpen] = useState(false); const [currentPassword, setCurrentPassword] = useState(""); const [nextPassword, setNextPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [saving, setSaving] = useState(false);
  async function save() {
    if (!user) return setError("Your account is still loading. Please try again.");
    if (nextPassword.length < 8) return setError("Use at least 8 characters for your new password.");
    if (nextPassword !== confirmation) return setError("The password confirmation does not match.");
    if (user.passwordEnabled && !currentPassword) return setError("Enter your current password.");
    setSaving(true); setError("");
    try { await user.updatePassword({ currentPassword: user.passwordEnabled ? currentPassword : undefined, newPassword: nextPassword }); setOpen(false); setCurrentPassword(""); setNextPassword(""); setConfirmation(""); setSuccess("Password updated in your secure sign-in account."); router.refresh(); } catch (cause) { setError(messageFor(cause)); } finally { setSaving(false); }
  }
  if (!isLoaded) return <p className="text-[#737b86]">Loading password settings…</p>;
  if (!open) return <div><p>••••••••••••</p><p className="mt-1 text-[12px] text-[#737b86]">Managed securely by Clerk.</p>{success ? <p className="mt-1 text-[12px] font-medium text-[#008f72]">{success}</p> : null}<button className="mt-2 text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" onClick={() => { setOpen(true); setSuccess(""); }} type="button">Edit password</button></div>;
  return <div className="space-y-3"><p className="text-[13px] text-[#737b86]">{user?.passwordEnabled ? "Confirm your current password before choosing a new one." : "Create a password for your account. Clerk may ask you to re-verify your identity."}</p>{user?.passwordEnabled ? <label className="block text-[13px] font-semibold">Current password<input className="mt-2 w-full rounded-md border px-3 py-2" onChange={(e) => setCurrentPassword(e.target.value)} type="password" value={currentPassword} /></label> : null}<label className="block text-[13px] font-semibold">New password<input className="mt-2 w-full rounded-md border px-3 py-2" onChange={(e) => setNextPassword(e.target.value)} type="password" value={nextPassword} /></label><label className="block text-[13px] font-semibold">Confirm new password<input className="mt-2 w-full rounded-md border px-3 py-2" onChange={(e) => setConfirmation(e.target.value)} type="password" value={confirmation} /></label>{error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}<div className="flex gap-2"><button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={save} type="button">{saving ? "Saving…" : "Save password"}</button><button className="rounded-md border px-4 py-2 text-sm font-semibold" disabled={saving} onClick={() => { setOpen(false); setError(""); }} type="button">Cancel</button></div></div>;
}
