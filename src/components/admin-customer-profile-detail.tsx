"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ChevronRight, ExternalLink, Pencil } from "lucide-react";
import { AdminCompanyUserManagement } from "./admin-company-user-management";
import { CustomerProfileIcon } from "./customer-profile-icon";
import {
  CustomerDialog,
  CustomerSubmit,
  CustomerTabs,
} from "./admin-customer-ui";
import type { CustomerProfile } from "@/lib/customer-profiles";
import type { LatticeRequest } from "@/lib/request-model";
import styles from "./admin-customers.module.css";

type ProfileAction = (formData: FormData) => void | Promise<void>;
const fields = [
  ["name", "Business name"],
  ["website", "Website"],
  ["industry", "Industry"],
  ["primaryContactName", "Primary contact"],
  ["primaryContactEmail", "Primary contact email"],
  ["billingEmail", "Billing email"],
  ["customerTier", "Customer tier"],
  ["accountStatus", "Account status"],
  ["notes", "Internal profile notes"],
] as const;
function safeWebsite(value: string) {
  if (!value.trim()) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function date(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
function money(value: number | null | undefined) {
  return value == null
    ? "Pending"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value / 100);
}
function href(request: LatticeRequest) {
  return request.status === "PURCHASED"
    ? `/admin/orders/${request.id}`
    : `/admin/quotes?requestId=${encodeURIComponent(request.id)}`;
}

function EditCompany({
  profile,
  updateAction,
  onClose,
}: {
  profile: CustomerProfile;
  updateAction?: ProfileAction;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const [state, action, pending] = useActionState(
    async (
      _previous: { status: string; message: string },
      formData: FormData,
    ) => {
      if (!updateAction)
        return { status: "error", message: "Company editing is unavailable." };
      try {
        await updateAction(formData);
        return { status: "success", message: "Customer profile saved." };
      } catch {
        return {
          status: "error",
          message: "The profile could not be saved. Please try again.",
        };
      }
    },
    { status: "idle", message: "" },
  );
  return (
    <CustomerDialog title="Edit company" onClose={onClose}>
      <form action={action} className={styles.form}>
        {fields.map(([key, label]) => (
          <label key={key}>
            {label}
            {key === "notes" ? (
              <textarea
                value={draft[key]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                name={key}
                rows={4}
              />
            ) : (
              <input
                value={draft[key]}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
                name={key}
                required={key === "name"}
                type={
                  key === "website"
                    ? "url"
                    : key.includes("Email")
                      ? "email"
                      : "text"
                }
              />
            )}
          </label>
        ))}
        {state.status !== "idle" ? (
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
            onClick={onClose}
            type="button"
          >
            {state.status === "success" && !pending ? "Done" : "Cancel"}
          </button>
          <CustomerSubmit>Save customer profile</CustomerSubmit>
        </div>
      </form>
    </CustomerDialog>
  );
}

function RequestHistory({
  requests,
  recent = false,
  onViewAll,
}: {
  requests: LatticeRequest[];
  recent?: boolean;
  onViewAll?: () => void;
}) {
  const sorted = [...requests].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const visible = recent ? sorted.slice(0, 5) : sorted;
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>{recent ? "Recent RFQs and orders" : "RFQs and orders"}</h2>
        {recent ? (
          <button
            className="text-[12px] font-medium text-[#245be8]"
            onClick={onViewAll}
            type="button"
          >
            View all ({requests.length})
          </button>
        ) : (
          <span className={styles.badge}>{requests.length} records</span>
        )}
      </div>
      {visible.length ? (
        <div className={styles.scroll}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Status</th>
                <th>Requester</th>
                <th>Updated</th>
                <th>Quote price</th>
                <th>Lead time</th>
                <th>
                  <span className="sr-only">Open record</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((request) => {
                const quote = request.customerQuotes.at(-1);
                return (
                  <tr key={request.id}>
                    <td>
                      <span className={styles.badge}>
                        {request.status === "PURCHASED" ? "Order" : "RFQ"}
                      </span>
                    </td>
                    <td className="min-w-52">
                      <Link
                        aria-label={`Open record: ${request.title}`}
                        className="font-medium"
                        href={href(request)}
                      >
                        {request.title}
                      </Link>
                      <small>
                        {request.lineItems.length}{" "}
                        {request.lineItems.length === 1 ? "part" : "parts"} ·{" "}
                        {request.files.length}{" "}
                        {request.files.length === 1 ? "file" : "files"}
                      </small>
                    </td>
                    <td>
                      <span className={styles.badge}>
                        {request.status
                          .toLowerCase()
                          .replaceAll("_", " ")
                          .replace(/^./, (c) => c.toUpperCase())}
                      </span>
                    </td>
                    <td>{request.requesterName}</td>
                    <td className="whitespace-nowrap">
                      {date(request.updatedAt)}
                    </td>
                    <td>
                      {money(
                        quote?.totalCents ?? request.quote.estimatedPriceCents,
                      )}
                    </td>
                    <td>
                      {request.quote.leadTimeDays
                        ? `${request.quote.leadTimeDays} days`
                        : "—"}
                    </td>
                    <td>
                      <Link
                        aria-label={`View details for ${request.title}`}
                        href={href(request)}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>
          No RFQs or orders are attached to this company yet.
        </p>
      )}
    </section>
  );
}

export function AdminCustomerProfileDetail({
  profile,
  updateAction,
}: {
  profile: CustomerProfile;
  updateAction?: ProfileAction;
}) {
  const [tab, setTab] = useState<"overview" | "users" | "history">("overview");
  const [editing, setEditing] = useState(false);
  const website = safeWebsite(profile.website);
  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/admin/customers">Customers</Link>
        <span aria-hidden="true">/</span>
        <span>{profile.name}</span>
      </div>
      <div className={styles.pageHeader}>
        <div className={styles.identity}>
          <CustomerProfileIcon icon={profile.icon} size="lg" />
          <div>
            <div className={styles.identityTitle}>
              <h1>{profile.name}</h1>
              <span
                className={`${styles.badge} ${profile.accountStatus.toLowerCase() === "active" ? styles.activeBadge : ""}`}
              >
                {profile.accountStatus}
              </span>
            </div>
            <div className={styles.meta}>
              {website ? (
                <a
                  className="inline-flex items-center gap-1"
                  href={website}
                  rel="noreferrer"
                  target="_blank"
                >
                  {profile.website
                    .replace(/^https?:\/\//, "")
                    .replace(/\/$/, "")}
                  <ExternalLink size={12} />
                </a>
              ) : null}
              {profile.industry ? <span>{profile.industry}</span> : null}
              <span>{profile.customerTier} tier</span>
            </div>
            <div className={styles.meta}>
              <span>
                {profile.users.length}{" "}
                {profile.users.length === 1 ? "user" : "users"}
              </span>
              <span>
                {profile.metrics.totalRequests} RFQs (
                {profile.metrics.activeQuoteRequests} active)
              </span>
              <span>{profile.metrics.placedOrders} orders</span>
              <span>
                {profile.fabricationShops.length} supplier{" "}
                {profile.fabricationShops.length === 1 ? "shop" : "shops"}
              </span>
            </div>
          </div>
        </div>
        <button
          className={styles.secondaryButton}
          disabled={!updateAction}
          onClick={() => setEditing(true)}
          type="button"
        >
          <Pencil size={14} />
          Edit company
        </button>
      </div>
      <CustomerTabs
        id="company-profile"
        label="Company profile"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "users", label: "Users" },
          { value: "history", label: "RFQs & orders" },
        ]}
      />
      {tab === "overview" ? (
        <div
          aria-labelledby="company-profile-tab-overview"
          className="space-y-5"
          id="company-profile-panel-overview"
          role="tabpanel"
        >
          <div className={styles.overview}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2>Business details</h2>
                <button
                  className={styles.secondaryButton}
                  disabled={!updateAction}
                  onClick={() => setEditing(true)}
                  type="button"
                >
                  <Pencil size={13} />
                  Edit
                </button>
              </div>
              <dl className={`${styles.panelBody} ${styles.fields}`}>
                {fields.map(([key, label]) => (
                  <div className="contents" key={key}>
                    <dt>{label}</dt>
                    <dd>
                      {key === "website" && website ? (
                        <a href={website} rel="noreferrer" target="_blank">
                          {profile[key]}
                        </a>
                      ) : (
                        profile[key] || "—"
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <AdminCompanyUserManagement
              compact
              companyId={profile.id}
              users={profile.users}
            />
          </div>
          <RequestHistory
            onViewAll={() => setTab("history")}
            recent
            requests={profile.requests}
          />
        </div>
      ) : null}
      {tab === "users" ? (
        <div
          aria-labelledby="company-profile-tab-users"
          id="company-profile-panel-users"
          role="tabpanel"
        >
          <AdminCompanyUserManagement
            companyId={profile.id}
            users={profile.users}
          />
        </div>
      ) : null}
      {tab === "history" ? (
        <div
          aria-labelledby="company-profile-tab-history"
          id="company-profile-panel-history"
          role="tabpanel"
        >
          <RequestHistory requests={profile.requests} />
        </div>
      ) : null}
      {editing ? (
        <EditCompany
          onClose={() => setEditing(false)}
          profile={profile}
          updateAction={updateAction}
        />
      ) : null}
    </div>
  );
}
