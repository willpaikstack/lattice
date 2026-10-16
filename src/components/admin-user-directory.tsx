"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { platformUserRoleLabels, type PlatformUser } from "@/lib/admin-users-shared";
import pageStyles from "./admin-customers.module.css";
import styles from "./admin-users.module.css";

const createdDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York" });

export function AdminUserDirectory({ users }: { users: PlatformUser[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [company, setCompany] = useState("ALL");
  const companies = [...new Map(users.flatMap((user) => user.company ? [[user.company.id, user.company] as const] : [])).values()].sort((a, b) => a.name.localeCompare(b.name));
  const search = query.trim().toLowerCase();
  const filtered = users.filter((user) =>
    (role === "ALL" || user.role === role)
    && (company === "ALL" || (company === "UNASSIGNED" ? !user.company : user.company?.id === company))
    && (!search || [user.name, user.email, user.company?.name ?? "", platformUserRoleLabels[user.role]].join(" ").toLowerCase().includes(search)),
  );
  const clear = () => { setQuery(""); setRole("ALL"); setCompany("ALL"); };

  return <div className={pageStyles.page}>
    <header className={pageStyles.pageHeader}><div><h1>Users</h1><p>All platform accounts, including Lattice admins and company users.</p></div></header>
    <section className={styles.directory} aria-label="Platform user directory">
      <div className={styles.filters}>
        <label className={styles.search}><Search aria-hidden="true" size={16} /><span className="sr-only">Search users</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Search names, emails or companies…" type="search" value={query} /></label>
        <label><span className="sr-only">User role</span><select onChange={(event) => setRole(event.target.value)} value={role}><option value="ALL">All roles</option>{Object.entries(platformUserRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span className="sr-only">User company</span><select onChange={(event) => setCompany(event.target.value)} value={company}><option value="ALL">All companies</option><option value="UNASSIGNED">No company assigned</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      <div className={styles.scroll}><table className={styles.table} aria-label="Platform users">
        <thead><tr><th scope="col">User</th><th scope="col">Role</th><th scope="col">Company</th><th scope="col">Sign-in setup</th><th scope="col">Created</th></tr></thead>
        <tbody>{filtered.map((user) => <tr key={user.id}>
          <td><div className={styles.identity}><span className={styles.avatar} aria-hidden="true">{(user.name || user.email).split(/\s+/).filter(Boolean).map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{user.name || "Name not recorded"}</strong><a className={styles.email} href={`mailto:${user.email}`}>{user.email}</a></div></div></td>
          <td><span className={styles.role}>{platformUserRoleLabels[user.role]}</span></td>
          <td>{user.company ? <Link className={styles.company} href={`/admin/customers/${encodeURIComponent(user.company.id)}`}>{user.company.name}</Link> : <span className={styles.muted}>No company assigned</span>}</td>
          <td><span className={user.signInSetup === "Connected" ? styles.connected : styles.pending}>{user.signInSetup}</span></td>
          <td><time dateTime={user.createdAt}>{createdDate.format(new Date(user.createdAt))}</time></td>
        </tr>)}</tbody>
      </table></div>
      {!filtered.length ? <div className={styles.empty}><Users aria-hidden="true" size={24} /><h2>{users.length ? "No users match these filters" : "No platform users yet"}</h2><p>{users.length ? "Try another name, email, role or company." : "Provisioned accounts will appear here."}</p>{users.length ? <button type="button" onClick={clear}>Clear filters</button> : null}</div> : null}
      <footer className={styles.footer} aria-live="polite">Showing {filtered.length} of {users.length} {users.length === 1 ? "user" : "users"}</footer>
    </section>
  </div>;
}
