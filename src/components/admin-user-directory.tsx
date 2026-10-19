"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import type { FormEvent } from "react";
import { platformUserRoleLabels, type PlatformUser } from "@/lib/admin-users-shared";
import pageStyles from "./admin-customers.module.css";
import styles from "./admin-users.module.css";
import { CustomerDialog } from "./admin-customer-ui";

const createdDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });

type DeleteUserResult = { error: string } | { success: true; deletedRfqs: number; cleanupWarnings: string[] };
type DeleteUserAction = (formData: FormData) => Promise<DeleteUserResult>;
type InvitationResult = { status: "success" | "error"; message: string };
type InvitationAction = (formData: FormData) => Promise<InvitationResult>;

export function AdminUserDirectory({ currentUserId, users, deleteUserAction, resendInvitationAction }: { currentUserId: string; users: PlatformUser[]; deleteUserAction: DeleteUserAction; resendInvitationAction: InvitationAction }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [company, setCompany] = useState("ALL");
  const [deleteTarget, setDeleteTarget] = useState<PlatformUser | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [cleanupNotice, setCleanupNotice] = useState("");
  const [inviteTarget, setInviteTarget] = useState<PlatformUser | null>(null);
  const [invitePending, startInviteTransition] = useTransition();
  const [inviteResult, setInviteResult] = useState<InvitationResult | null>(null);
  const companies = [...new Map(users.flatMap((user) => user.company ? [[user.company.id, user.company] as const] : [])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const remainingUsers = users.filter((user) => !deletedIds.has(user.id));
  const latticeAdminCount = remainingUsers.filter((user) => user.role === "LATTICE_ADMIN").length;
  const search = query.trim().toLowerCase();
  const filtered = remainingUsers.filter((user) =>
    (role === "ALL" || user.role === role)
    && (company === "ALL" || (company === "UNASSIGNED" ? !user.company : user.company?.id === company))
    && (!search || [user.name, user.email, user.company?.name ?? "", platformUserRoleLabels[user.role]].join(" ").toLowerCase().includes(search)),
  );
  const clear = () => { setQuery(""); setRole("ALL"); setCompany("ALL"); };

  function resendInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteTarget || invitePending) return;
    const formData = new FormData(event.currentTarget);
    setInviteResult(null);
    startInviteTransition(async () => {
      try {
        const result = await resendInvitationAction(formData);
        setInviteResult(result);
        if (result.status === "success") setInviteTarget(null);
        router.refresh();
      } catch {
        setInviteResult({ status: "error", message: "Unable to send the invitation. Please try again." });
      }
    });
  }

  async function deleteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteTarget || deletePending) return;
    setDeletePending(true);
    setDeleteError("");
    try {
      const result = await deleteUserAction(new FormData(event.currentTarget));
      if ("error" in result) {
        setDeleteError(result.error);
        return;
      }
      setDeletedIds((current) => new Set(current).add(deleteTarget.id));
      setDeleteTarget(null);
      setCleanupNotice(`The Lattice account and its database records were deleted, including ${result.deletedRfqs} attributed RFQ${result.deletedRfqs === 1 ? "" : "s"}. ${result.cleanupWarnings.join(" ")}`.trim());
      router.refresh();
    } catch {
      setDeleteError("Unable to delete this user. Please try again.");
    } finally {
      setDeletePending(false);
    }
  }

  return <div className={pageStyles.page}>
    <header className={pageStyles.pageHeader}><div><h1>Users</h1><p>All platform accounts, including Lattice admins and company users.</p></div></header>
    {cleanupNotice ? <p className={styles.cleanupNotice} role="status">The account and database records were deleted. {cleanupNotice}</p> : null}
    {!inviteTarget && inviteResult ? <p className={styles.inviteNotice} role={inviteResult.status === "error" ? "alert" : "status"}>{inviteResult.message}</p> : null}
    <section className={styles.directory} aria-label="Platform user directory">
      <div className={styles.filters}>
        <label className={styles.search}><Search aria-hidden="true" size={16} /><span className="sr-only">Search users</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search names, emails or companies…" type="search" value={query} /></label>
        <label><span className="sr-only">User role</span><select onChange={(event) => setRole(event.target.value)} value={role}><option value="ALL">All roles</option>{Object.entries(platformUserRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span className="sr-only">User company</span><select onChange={(event) => setCompany(event.target.value)} value={company}><option value="ALL">All companies</option><option value="UNASSIGNED">No company assigned</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      <div className={styles.scroll}><table className={styles.table} aria-label="Platform users">
        <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Company</th><th scope="col">Sign-in setup</th><th scope="col">Invitation</th><th scope="col">Created</th><th scope="col">Actions</th></tr></thead>
        <tbody>{filtered.map((user) => {
          const isLastCustomerAdmin = Boolean(user.role === "CUSTOMER_ADMIN" && user.company && remainingUsers.filter((candidate) => candidate.company?.id === user.company?.id && candidate.role === "CUSTOMER_ADMIN").length <= 1);
          const deleteDisabled = user.id === currentUserId || (user.role === "LATTICE_ADMIN" && latticeAdminCount <= 1) || isLastCustomerAdmin;
          const deleteTitle = user.id === currentUserId ? "You cannot delete your signed-in account." : user.role === "LATTICE_ADMIN" && latticeAdminCount <= 1 ? "The last Lattice Admin cannot be deleted." : isLastCustomerAdmin ? "The last Customer Admin for this company cannot be deleted." : undefined;
          return <tr key={user.id}>
          <td><div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{(user.name || user.email).split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{user.name || "Name not recorded"}</strong><a className={styles.email} href={`mailto:${user.email}`}>{user.email}</a></div></div></td>
          <td><span className={styles.role}>{platformUserRoleLabels[user.role]}</span></td>
          <td>{user.company ? <Link className={styles.company} href={`/admin/customers/${encodeURIComponent(user.company.id)}`}>{user.company.name}</Link> : <span className={styles.muted}>No company assigned</span>}</td>
          <td><span className={user.signInSetup === "Connected" ? styles.connected : styles.pending}>{user.signInSetup}</span></td>
          <td>{user.role !== "LATTICE_ADMIN" && user.company ? <button aria-label={`Reset and resend invitation to ${user.email}`} className={styles.inviteButton} disabled={invitePending || user.id === currentUserId} onClick={() => { setInviteTarget(user); setInviteResult(null); }} type="button">Reset &amp; resend invite</button> : <span className={styles.muted}>—</span>}</td>
          <td><time dateTime={user.createdAt}>{createdDate.format(new Date(user.createdAt))}</time></td>
          <td><button className={styles.deleteButton} disabled={deleteDisabled} onClick={() => { setDeleteTarget(user); setDeleteError(""); }} title={deleteTitle} type="button">Delete</button></td>
        </tr>})}</tbody>
      </table></div>
      {!filtered.length ? <div className={styles.empty}><Users aria-hidden="true" size={24} /><h2>{remainingUsers.length ? "No users match these filters" : "No platform users yet"}</h2><p>{remainingUsers.length ? "Try another name, email, role or company." : "Provisioned accounts will appear here."}</p>{remainingUsers.length ? <button type="button" onClick={clear}>Clear filters</button> : null}</div> : null}
      <footer className={styles.footer} aria-live="polite">Showing {filtered.length} of {remainingUsers.length} {remainingUsers.length === 1 ? "user" : "users"}</footer>
    </section>
    {inviteTarget ? <CustomerDialog onClose={() => setInviteTarget(null)} title="Reset password and resend invitation?">
      <form className={styles.inviteForm} onSubmit={resendInvitation}>
        <input name="userId" type="hidden" value={inviteTarget.id} />
        <p>A new temporary password will be emailed to <strong>{inviteTarget.email}</strong>.</p>
        <p>This replaces the current password and signs the user out of existing sessions. They must choose their own password within 72 hours.</p>
        {inviteResult?.status === "error" ? <p className={styles.deleteError} role="alert">{inviteResult.message}</p> : null}
        <div><button className={styles.cancelDelete} onClick={() => setInviteTarget(null)} type="button">{invitePending ? "Close" : "Cancel"}</button><button className={styles.inviteButton} disabled={invitePending} type="submit">{invitePending ? "Sending…" : "Reset & resend invite"}</button></div>
      </form>
    </CustomerDialog> : null}
    {deleteTarget ? <div className={styles.deleteBackdrop} onClick={(event) => { if (event.target === event.currentTarget && !deletePending) setDeleteTarget(null); }}>
      <section aria-labelledby="delete-user-title" aria-modal="true" className={styles.deleteDialog} onKeyDown={(event) => { if (event.key === "Escape" && !deletePending) setDeleteTarget(null); }} role="dialog">
        <h2 id="delete-user-title">Permanently delete this user?</h2>
        <p><strong>{deleteTarget.name}</strong> ({deleteTarget.email}) and their Lattice and sign-in accounts will be deleted. Unpurchased RFQs and their quote versions attributed to this email will also be deleted, along with account settings, support requests, and sign-in history.</p>
        <p>Purchased orders and invoices will remain as company records, with this user’s direct contact details removed. This cannot be undone.</p>
        {deleteError ? <p className={styles.deleteError} role="alert">{deleteError}</p> : null}
        <form onSubmit={deleteUser}>
          <input name="userId" type="hidden" value={deleteTarget.id} />
          <div><button className={styles.cancelDelete} disabled={deletePending} onClick={() => setDeleteTarget(null)} type="button">Cancel</button><button className={styles.confirmDelete} disabled={deletePending} type="submit">{deletePending ? "Deleting…" : "Permanently delete"}</button></div>
        </form>
      </section>
    </div> : null}
  </div>;
}
