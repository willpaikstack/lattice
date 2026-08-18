"use client";

import { useActionState, type ReactNode } from "react";

import {
  manageCustomerUserAction,
  startCustomerSupportSessionAction,
  type UserManagementActionState,
} from "@/app/admin/customers/[companyId]/actions";
import type { CustomerProfile } from "@/lib/customer-profiles";

function formatDate(value: string | null) {
  if (!value) return "Not issued";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function passwordStatus(user: CustomerProfile["users"][number]) {
  if (user.mustChangePassword) {
    return `Temporary password expires ${formatDate(user.temporaryPasswordExpiresAt)}`;
  }

  return user.passwordEnabled ? `Password issued ${formatDate(user.passwordChangedAt)}` : "No password issued";
}

function roleLabel(role: CustomerProfile["users"][number]["role"]) {
  return role === "CUSTOMER_ADMIN" ? "Customer Admin" : role === "CUSTOMER_MEMBER" ? "Customer Member" : "Lattice Admin";
}

function SubmitButton({ children, tone = "secondary" }: { children: ReactNode; tone?: "danger" | "primary" | "secondary" }) {
  const color =
    tone === "primary"
      ? "bg-[#171717] text-white hover:bg-[#2f3237]"
      : tone === "danger"
        ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
        : "border border-[#d7d7d7] bg-white text-[#30343a] hover:bg-[#fafafa]";
  return (
    <button className={`rounded-md px-3 py-2 text-[13px] font-semibold transition disabled:cursor-wait disabled:opacity-60 ${color}`} type="submit">
      {children}
    </button>
  );
}

export function AdminCompanyUserManagement({ companyId, users }: { companyId: string; users: CustomerProfile["users"] }) {
  const action = manageCustomerUserAction.bind(null, companyId);
  const [state, formAction, pending] = useActionState<UserManagementActionState, FormData>(action, { message: "", status: "idle" });
  const startSupportSession = startCustomerSupportSessionAction.bind(null, companyId);

  return (
    <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Access management</p>
        <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-[#202020]">Business users</h2>
        <p className="mt-2 text-[13px] leading-5 text-[#707782]">
          Users are limited to this company&apos;s customer workspace. Passwords are stored securely and cannot be viewed; reset one to issue a new temporary password once.
        </p>
      </div>

      {state.status !== "idle" ? (
        <div aria-live="polite" className={`mt-4 rounded-md border p-3 text-sm ${state.status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
          <p>{state.message}</p>
          {state.temporaryPassword ? (
            <p className="mt-3 rounded bg-white px-3 py-2 font-mono text-[14px] font-semibold text-[#171717]">Temporary password: {state.temporaryPassword}</p>
          ) : null}
        </div>
      ) : null}

      <form action={formAction} className="mt-5 rounded-md border border-[#e7e7e7] bg-[#f8fafc] p-4">
        <input name="operation" type="hidden" value="add" />
        <h3 className="text-[14px] font-semibold text-[#202020]">Add user</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-[12px] font-semibold text-[#4b525b]">
            Full name
            <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="name" placeholder="Avery Chen" required />
          </label>
          <label className="text-[12px] font-semibold text-[#4b525b]">
            Work email
            <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="email" placeholder="avery@company.com" required type="email" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-[12px] font-semibold text-[#4b525b]">
            Customer role
            <select className="mt-1 block h-10 rounded-md border border-[#dddddd] bg-white px-3 text-sm" defaultValue="CUSTOMER_MEMBER" name="role">
              <option value="CUSTOMER_MEMBER">Customer Member</option>
              <option value="CUSTOMER_ADMIN">Customer Admin</option>
            </select>
          </label>
          <SubmitButton tone="primary">{pending ? "Saving…" : "Add user"}</SubmitButton>
        </div>
      </form>

      <div className="mt-4 space-y-3">
        {users.length ? (
          users.map((user) => (
            <article className="rounded-md border border-[#e7e7e7] p-4" key={user.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#202020]">{user.name}</p>
                  <p className="mt-1 break-all text-[13px] text-[#707782]">{user.email}</p>
                  {user.pendingEmail ? <p className="mt-1 break-all text-[12px] text-amber-800">Verification pending for {user.pendingEmail}</p> : null}
                  <p className="mt-2 text-[12px] text-[#707782]">
                    {passwordStatus(user)} · Added {formatDate(user.createdAt)}
                  </p>
                </div>
                <span className="w-fit rounded-md border border-[#d7d7d7] bg-[#f8fafc] px-2 py-1 text-[11px] font-semibold text-[#4b525b]">{roleLabel(user.role)}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#eeeeee] pt-3">
                <form action={formAction} className="flex flex-wrap gap-2">
                  <input name="operation" type="hidden" value="change-role" />
                  <input name="userId" type="hidden" value={user.id} />
                  <select aria-label={`Role for ${user.name}`} className="h-9 rounded-md border border-[#d7d7d7] bg-white px-2 text-[12px]" defaultValue={user.role} name="role">
                    <option value="CUSTOMER_MEMBER">Customer Member</option>
                    <option value="CUSTOMER_ADMIN">Customer Admin</option>
                  </select>
                  <SubmitButton>Save role</SubmitButton>
                </form>
                <form action={formAction}>
                  <input name="operation" type="hidden" value="reset-password" />
                  <input name="userId" type="hidden" value={user.id} />
                  <SubmitButton>Reset password</SubmitButton>
                </form>
                <form action={formAction} className="flex flex-wrap gap-2">
                  <input name="operation" type="hidden" value="set-password" />
                  <input name="userId" type="hidden" value={user.id} />
                  <label className="sr-only" htmlFor={`custom-password-${user.id}`}>Custom password for {user.name}</label>
                  <input
                    autoComplete="new-password"
                    className="h-9 min-w-52 rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px]"
                    id={`custom-password-${user.id}`}
                    minLength={12}
                    name="password"
                    placeholder="Set custom password"
                    required
                    type="password"
                  />
                  <SubmitButton>Set password</SubmitButton>
                </form>
                <form action={formAction} className="flex flex-wrap gap-2">
                  <input name="operation" type="hidden" value="change-email" />
                  <input name="userId" type="hidden" value={user.id} />
                  <label className="sr-only" htmlFor={`new-email-${user.id}`}>New email for {user.name}</label>
                  <input
                    autoComplete="email"
                    className="h-9 min-w-52 rounded-md border border-[#d7d7d7] bg-white px-3 text-[12px]"
                    id={`new-email-${user.id}`}
                    name="email"
                    placeholder="New work email"
                    required
                    type="email"
                  />
                  <SubmitButton>Send email verification</SubmitButton>
                </form>
                <form action={formAction} onSubmit={(event) => { if (!window.confirm(`Remove ${user.name} from this customer company?`)) event.preventDefault(); }}>
                  <input name="operation" type="hidden" value="remove" />
                  <input name="userId" type="hidden" value={user.id} />
                  <SubmitButton tone="danger">Remove user</SubmitButton>
                </form>
                {!user.mustChangePassword ? (
                  <form action={startSupportSession}>
                    <input name="userId" type="hidden" value={user.id} />
                    <SubmitButton>View customer workspace</SubmitButton>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-md bg-[#f8fafc] p-3 text-[14px] leading-6 text-[#707782]">No users are attached to this business yet.</p>
        )}
      </div>
    </section>
  );
}
