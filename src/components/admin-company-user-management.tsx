"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MoreVertical, Plus } from "lucide-react";
import {
  manageCustomerUserAction,
  startCustomerSupportSessionAction,
  type UserManagementActionState,
} from "@/app/(workspace)/admin/customers/[companyId]/actions";
import type { CustomerProfile } from "@/lib/customer-profiles";
import { initialsForName } from "@/lib/current-user";
import { CustomerDialog, CustomerSubmit } from "./admin-customer-ui";
import styles from "./admin-customers.module.css";

type Operation =
  | "add"
  | "change-role"
  | "reset-and-resend"
  | "set-password"
  | "change-email"
  | "remove"
  | "support";
const titles: Record<Operation, string> = {
  add: "Add user",
  "change-role": "Manage role",
  "reset-and-resend": "Reset & resend invitation",
  "set-password": "Set custom password",
  "change-email": "Verify email change",
  remove: "Remove user",
  support: "View customer workspace",
};
function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(value))
    : "Not issued";
}
function roleLabel(role: CustomerProfile["users"][number]["role"]) {
  return role === "CUSTOMER_ADMIN"
    ? "Customer Admin"
    : role === "CUSTOMER_MEMBER"
      ? "Customer Member"
      : "Lattice Admin";
}

export function AdminCompanyUserManagement({
  companyId,
  users,
  compact = false,
}: {
  companyId: string;
  users: CustomerProfile["users"];
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    UserManagementActionState,
    FormData
  >(manageCustomerUserAction.bind(null, companyId), {
    message: "",
    status: "idle",
  });
  const [menu, setMenu] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    operation: Operation;
    userId?: string;
  } | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    email: "",
    role: "CUSTOMER_MEMBER",
    password: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const user = users.find((item) => item.id === editor?.userId);
  const linkedExistingSignIn = Boolean(user?.mustChangePassword && !user.temporaryPasswordExpiresAt && !user.passwordEnabled);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function outside(event: PointerEvent) {
      if (
        !menuRef.current?.contains(event.target as Node) &&
        !triggerRefs.current[menu!]?.contains(event.target as Node)
      )
        setMenu(null);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [menu]);
  function open(operation: Operation, userId?: string) {
    setSubmitted(false);
    setDraft({
      name: "",
      email: "",
      role: users.find((item) => item.id === userId)?.role ?? "CUSTOMER_MEMBER",
      password: "",
    });
    setMenu(null);
    setEditor({ operation, userId });
  }
  function close() {
    const id = editor?.userId;
    setEditor(null);
    setDraft({ name: "", email: "", role: "CUSTOMER_MEMBER", password: "" });
    if (id) triggerRefs.current[id]?.focus();
  }
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2>Business users{!compact ? ` (${users.length})` : ""}</h2>
          {!compact ? (
            <p className="mt-1 text-[12px] text-slate-500">
              Company access is managed by Lattice admins.
            </p>
          ) : null}
        </div>
        <button
          className={styles.primaryButton}
          onClick={() => open("add")}
          type="button"
        >
          <Plus aria-hidden="true" size={14} />
          Add user
        </button>
      </div>
      {!editor && submitted && state.status !== "idle" ? (
        <div
          aria-live="polite"
          className={`${styles.message} ${state.status === "error" ? styles.error : ""}`}
        >
          {state.message}
        </div>
      ) : null}
      <div className={styles.usersList}>
        {users.map((member) => (
          <article key={member.id}>
            <span aria-hidden="true" className={styles.avatar}>
              {initialsForName(member.name)}
            </span>
            <div className={styles.userIdentity}>
              <strong>{member.name}</strong>
              <p>{member.email}</p>
              <span className={styles.badge}>{roleLabel(member.role)}</span>
              <p className="!mt-2">
                {member.mustChangePassword
                  ? member.temporaryPasswordExpiresAt
                    ? `Password setup required · Expires ${date(member.temporaryPasswordExpiresAt)}`
                    : "Existing sign-in linked · Password setup required on first login"
                  : member.passwordEnabled
                    ? `Password issued ${date(member.passwordChangedAt)}`
                    : "No password issued"}
              </p>
              {member.pendingEmail ? (
                <p className="!text-amber-700">
                  Verification pending: {member.pendingEmail}
                </p>
              ) : null}
            </div>
            <div className="relative shrink-0">
              <button
                aria-expanded={menu === member.id}
                aria-haspopup="menu"
                aria-label={`Actions for ${member.name}`}
                className={styles.iconButton}
                onClick={() => setMenu(menu === member.id ? null : member.id)}
                ref={(node) => {
                  triggerRefs.current[member.id] = node;
                }}
                type="button"
              >
                <MoreVertical size={16} />
              </button>
              {menu === member.id ? (
                <div
                  aria-label={`Actions for ${member.name}`}
                  className={styles.menu}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      setMenu(null);
                      triggerRefs.current[member.id]?.focus();
                    }
                    if (
                      ["ArrowDown", "ArrowUp", "Home", "End"].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault();
                      const items = Array.from(
                        event.currentTarget.querySelectorAll<HTMLButtonElement>(
                          "button",
                        ),
                      );
                      const index = items.indexOf(
                        document.activeElement as HTMLButtonElement,
                      );
                      const next =
                        event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? items.length - 1
                            : (index +
                                (event.key === "ArrowDown" ? 1 : -1) +
                                items.length) %
                              items.length;
                      items[next]?.focus();
                    }
                    if (event.key === "Tab") setMenu(null);
                  }}
                  ref={menuRef}
                  role="menu"
                >
                  {(
                    [
                      "change-role",
                      "reset-and-resend",
                      "set-password",
                      "change-email",
                      ...(!member.mustChangePassword ? ["support"] : []),
                      "remove",
                    ] as Operation[]
                  ).map((operation) => (
                    <button
                      key={operation}
                      onClick={() => open(operation, member.id)}
                      role="menuitem"
                      tabIndex={-1}
                      type="button"
                    >
                      {operation === "reset-and-resend" && member.mustChangePassword && !member.temporaryPasswordExpiresAt && !member.passwordEnabled
                        ? "Resend sign-in instructions"
                        : titles[operation]}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {!users.length ? (
          <p className={styles.empty}>
            No users are attached to this company yet.
          </p>
        ) : null}
      </div>
      {editor ? (
        <CustomerDialog onClose={close} title={linkedExistingSignIn && editor.operation === "reset-and-resend" ? "Resend sign-in instructions" : titles[editor.operation]}>
          <form
            action={
              editor.operation === "support"
                ? startCustomerSupportSessionAction.bind(null, companyId)
                : formAction
            }
            className={styles.form}
            key={`${editor.operation}-${editor.userId ?? "new"}`}
            onSubmit={() => setSubmitted(true)}
          >
            <input name="operation" type="hidden" value={editor.operation} />
            {user ? (
              <>
                <input name="userId" type="hidden" value={user.id} />
                <p>
                  <strong>{user.name}</strong>
                  <br />
                  {user.email}
                </p>
              </>
            ) : null}
            {editor.operation === "add" ? (
              <>
                <label>
                  Full name
                  <input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    name="name"
                    required
                    autoComplete="name"
                  />
                </label>
                <label>
                  Work email
                  <input
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                  />
                </label>
                <p>
                  The user will receive a temporary-password invitation by
                  email.
                </p>
              </>
            ) : null}
            {editor.operation === "add" ||
            editor.operation === "change-role" ? (
              <label>
                Customer role
                <select
                  value={draft.role}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  name="role"
                >
                  <option value="CUSTOMER_MEMBER">Customer Member</option>
                  <option value="CUSTOMER_ADMIN">Customer Admin</option>
                </select>
              </label>
            ) : null}
            {editor.operation === "set-password" ? (
              <>
                <label>
                  New custom password
                  <input
                    autoComplete="new-password"
                    minLength={8}
                    value={draft.password}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    name="password"
                    required
                    type="password"
                  />
                </label>
                <p>
                  This replaces the current password and invalidates existing
                  sessions.
                </p>
              </>
            ) : null}
            {editor.operation === "change-email" ? (
              <>
                <label>
                  New work email
                  <input
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    name="email"
                    required
                    type="email"
                  />
                </label>
                <p>
                  The current email remains active until the new inbox confirms
                  its verification link.
                </p>
              </>
            ) : null}
            {editor.operation === "reset-and-resend" ? (
              <p>{linkedExistingSignIn
                ? "Resend instructions to use the existing sign-in for this email. The existing password will stay unchanged."
                : "Issue a new temporary password and send a replacement invitation. The previous invitation and password will be invalidated."}</p>
            ) : null}
            {editor.operation === "remove" ? (
              <p>
                Remove this user&apos;s company membership and revoke their
                access to this workspace.
              </p>
            ) : null}
            {editor.operation === "support" ? (
              <p>
                Open this company&apos;s workspace as {user?.name}. The support
                session will be clearly labelled, with an option to return to
                admin.
              </p>
            ) : null}
            {submitted && state.status !== "idle" && !pending ? (
              <div
                aria-live="polite"
                className={`${styles.message} ${state.status === "error" ? styles.error : ""}`}
              >
                {state.message}
              </div>
            ) : null}
            <div className={styles.formFooter}>
              <button
                className={styles.secondaryButton}
                onClick={close}
                type="button"
              >
                {submitted && state.status === "success" && !pending
                  ? "Done"
                  : "Cancel"}
              </button>
              {!(submitted && state.status === "success" && !pending) ? (
                <CustomerSubmit danger={editor.operation === "remove"}>
                  {editor.operation === "change-role"
                    ? "Save role"
                    : editor.operation === "change-email"
                      ? "Send email verification"
                      : editor.operation === "set-password"
                      ? "Set password"
                      : editor.operation === "reset-and-resend" && linkedExistingSignIn
                        ? "Resend instructions"
                      : titles[editor.operation]}
                </CustomerSubmit>
              ) : null}
            </div>
          </form>
        </CustomerDialog>
      ) : null}
    </section>
  );
}
