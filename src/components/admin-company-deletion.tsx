"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import type { CustomerProfile } from "@/lib/customer-profiles";
import { CustomerDialog } from "./admin-customer-ui";
import styles from "./admin-customers.module.css";

type DeleteAction = (previous: { message: string }, formData: FormData) => Promise<{ message: string }>;

export function AdminCompanyDeletion({ profile, deleteAction }: { profile: CustomerProfile; deleteAction: DeleteAction }) {
  const [open, setOpen] = useState(false);
  return <>
    <button className={styles.dangerButton} onClick={() => setOpen(true)} type="button"><Trash2 size={14} />Delete company</button>
    {open ? <DeleteCompanyDialog profile={profile} deleteAction={deleteAction} onClose={() => setOpen(false)} /> : null}
  </>;
}

function DeleteCompanyDialog({ profile, deleteAction, onClose }: { profile: CustomerProfile; deleteAction: DeleteAction; onClose: () => void }) {
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteAction, { message: "" });
  const quoteCount = profile.requests.filter((request) => request.status !== "PURCHASED").length;
  const hasAdmin = profile.users.some((user) => user.role === "LATTICE_ADMIN");
  return <CustomerDialog title={`Delete ${profile.name}?`} onClose={() => { if (!pending) onClose(); }}>
    <form action={action} className={styles.form}>
      <p className="text-sm leading-6 text-slate-600">This permanently deletes the company and its {profile.users.length} attached user {profile.users.length === 1 ? "account" : "accounts"}, including sign-in access.</p>
      {profile.users.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{profile.users.map((user) => <li key={user.id}>{user.name} <span className="text-slate-500">({user.email})</span></li>)}</ul> : null}
      <p className="text-sm leading-6 text-slate-600">All {quoteCount} RFQs and quotes will move to Archive with their files and pricing history. Existing orders and invoices will be kept as historical records with direct user contact details removed.</p>
      <p className="text-sm font-medium text-red-800">The company and its users cannot be restored.</p>
      {hasAdmin ? <p role="alert" className={styles.error}>Move Lattice Admin accounts out of this company before deleting it.</p> : null}
      <label><span>Type <strong>{profile.name}</strong> to confirm</span>
        <input autoComplete="off" disabled={pending} name="confirmationName" onChange={(event) => setConfirmation(event.target.value)} required value={confirmation} />
      </label>
      {state.message ? <p role="alert" className={styles.error}>{state.message}</p> : null}
      <div className={styles.formFooter}>
        <button className={styles.secondaryButton} disabled={pending} onClick={onClose} type="button">Cancel</button>
        <button className={styles.dangerButton} disabled={pending || hasAdmin || confirmation.trim() !== profile.name} type="submit">{pending ? "Deleting company…" : "Delete company and users"}</button>
      </div>
    </form>
  </CustomerDialog>;
}
