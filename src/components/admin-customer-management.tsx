"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { createCustomerCompanyAction, type CreateCustomerCompanyActionState } from "@/app/(workspace)/admin/customers/actions";
import { CustomerProfileIcon } from "@/components/customer-profile-icon";
import type { CustomerProfile } from "@/lib/customer-profiles";
import type { WaitingListEntry } from "@/lib/waiting-list";

const customerFilters = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Standard", value: "STANDARD" },
  { label: "With orders", value: "WITH_ORDERS" },
] as const;

const initialCreateCustomerState: CreateCustomerCompanyActionState = { message: "", status: "idle" };

function CreateCustomerCompany() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCustomerCompanyAction, initialCreateCustomerState);

  return (
    <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Provisioning</p>
          <h2 className="mt-1 text-[19px] font-semibold tracking-tight text-[#202020]">Create customer company</h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#707782]">Create the company, its first Customer Admin, and the matching Clerk sign-in in one secure step.</p>
        </div>
        <button className="w-fit rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f3237]" onClick={() => setIsOpen((open) => !open)} type="button">
          {isOpen ? "Close" : "Create customer"}
        </button>
      </div>

      {isOpen ? (
        <form action={formAction} className="mt-5 space-y-5 border-t border-[#eeeeee] pt-5">
          <div>
            <h3 className="text-[14px] font-semibold text-[#202020]">Customer company</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-[12px] font-semibold text-[#4b525b]">
                Company name
                <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="companyName" placeholder="Acme Manufacturing" required />
              </label>
              <label className="text-[12px] font-semibold text-[#4b525b]">
                Website <span className="font-normal text-[#707782]">(optional)</span>
                <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="website" placeholder="https://acme.example" type="url" />
              </label>
              <label className="text-[12px] font-semibold text-[#4b525b]">
                Industry <span className="font-normal text-[#707782]">(optional)</span>
                <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="industry" placeholder="Precision machining" />
              </label>
              <label className="text-[12px] font-semibold text-[#4b525b]">
                Billing email <span className="font-normal text-[#707782]">(optional)</span>
                <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="billingEmail" placeholder="ap@acme.example" type="email" />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-[#202020]">First Customer Admin</h3>
            <p className="mt-1 text-[13px] text-[#707782]">This user can access the new company workspace. Additional users can be added from the company profile.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-[12px] font-semibold text-[#4b525b]">
                Full name
                <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="primaryAdminName" placeholder="Avery Chen" required />
              </label>
              <label className="text-[12px] font-semibold text-[#4b525b]">
                Work email
                <input className="mt-1 h-10 w-full rounded-md border border-[#dddddd] bg-white px-3 text-sm" name="primaryAdminEmail" placeholder="avery@acme.example" required type="email" />
              </label>
            </div>
          </div>

          {state.status !== "idle" ? (
            <div aria-live="polite" className={`rounded-md border p-3 text-sm ${state.status === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
              <p>{state.message}</p>
              {state.customerHref ? <Link className="mt-3 inline-flex font-semibold underline" href={state.customerHref}>Open customer profile</Link> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
              {pending ? "Creating…" : "Create company and admin"}
            </button>
            <p className="text-[12px] text-[#707782]">The invitation includes a temporary password that expires after 72 hours.</p>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function formatJoinedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function EmptyState({ detail, title }: { detail: string; title: string }) {
  return (
    <div className="p-8 text-center">
      <p className="text-[15px] font-semibold text-[#202020]">{title}</p>
      <p className="mt-2 text-[14px] text-[#707782]">{detail}</p>
    </div>
  );
}

function AdminSearchIcon() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" fill="none" viewBox="0 0 20 20">
      <path d="m14 14 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CustomerCompanyTable({ customers }: { customers: CustomerProfile[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof customerFilters)[number]["value"]>("ALL");

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "ACTIVE" && customer.accountStatus.toLowerCase().includes("active")) ||
        (filter === "STANDARD" && customer.customerTier.toLowerCase() === "standard") ||
        (filter === "WITH_ORDERS" && customer.metrics.placedOrders > 0);
      const searchable = [
        customer.name,
        customer.primaryContactName,
        customer.primaryContactEmail,
        customer.industry,
        customer.website,
        customer.customerTier,
        customer.accountStatus,
        ...customer.users.map((user) => `${user.name} ${user.email}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [customers, filter, query]);

  if (customers.length === 0) {
    return (
      <section className="rounded-md border border-dashed border-[#cfcfcf] bg-white p-8 text-center">
        <h2 className="text-[22px] font-semibold text-[#202020]">Customer companies</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">Customer companies and their user access will appear here once they are provisioned.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <h2 className="sr-only">Customer companies</h2>
      <div className="border-b border-[#eeeeee] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-[360px]">
            <span className="sr-only">Search customers</span>
            <AdminSearchIcon />
            <input
              className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer, contact, industry..."
              type="search"
              value={query}
            />
          </label>
          <div aria-label="Customer filters" className="flex gap-2 overflow-x-auto pb-1">
            {customerFilters.map((item) => {
              const isActive = filter === item.value;

              return (
                <button
                  className={`h-9 shrink-0 rounded-md border px-3 text-[13px] font-semibold transition ${
                    isActive ? "border-[#FF5A5F] bg-[#FF5A5F] text-white" : "border-[#ffd1d4] bg-white text-[#767676] hover:bg-[#fff1f2]"
                  }`}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.15fr_0.78fr_0.56fr_0.56fr_0.58fr_0.62fr] gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
        <span>Customer</span>
        <span>Industry</span>
        <span>RFQs</span>
        <span>Orders</span>
        <span>Tier</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-[#eeeeee]">
        {filteredCustomers.map((customer) => (
          <Link
            aria-label={`Open customer profile for ${customer.name}`}
            className="group grid cursor-pointer gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FF5A5F] xl:grid-cols-[1.15fr_0.78fr_0.56fr_0.56fr_0.58fr_0.62fr] xl:items-center"
            href={`/admin/customers/${customer.id}`}
            key={customer.id}
          >
            <div className="flex min-w-0 items-start gap-3">
              <CustomerProfileIcon icon={customer.icon} size="sm" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{customer.website || "Website not set"}</span>
                  <span className="inline-flex rounded-md border border-[#ffd1d4] bg-[#fff1f2] px-2 py-0.5 text-[11px] font-semibold text-[#767676]">{customer.accountStatus}</span>
                </div>
                <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{customer.name}</h2>
                <p className="mt-1 truncate text-[13px] text-[#69707a]">
                  {customer.primaryContactName || customer.users[0]?.name || "No contact recorded"}
                  {customer.primaryContactEmail ? ` - ${customer.primaryContactEmail}` : ""}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Industry</p>
              <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{customer.industry || "Industry not set"}</p>
              <p className="mt-1 text-[12px] text-[#8a8f98]">{customer.users.length} user(s)</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">RFQs</p>
              <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{customer.metrics.totalRequests}</p>
              <p className="mt-1 text-[12px] text-[#8a8f98]">{customer.metrics.activeQuoteRequests} active</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Orders</p>
              <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{customer.metrics.placedOrders}</p>
              <p className="mt-1 text-[12px] text-[#8a8f98]">{customer.fabricationShops.length} shops</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Tier</p>
              <p className="mt-1 text-[14px] text-[#4b525b] xl:mt-0">{customer.customerTier}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Status</p>
              <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{customer.accountStatus}</p>
              <p className="mt-1 text-[12px] font-semibold text-[#767676] transition group-hover:text-[#171717]">Open profile</p>
            </div>
          </Link>
        ))}

        {filteredCustomers.length === 0 ? (
          <EmptyState detail="Clear the search or choose a different customer filter." title="No customers match this view." />
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
        <span>
          Showing {filteredCustomers.length} of {customers.length} customers
        </span>
        <span>Rows open customer profiles</span>
      </div>
    </section>
  );
}

function WaitingListTable({ entries }: { entries: WaitingListEntry[] }) {
  const [query, setQuery] = useState("");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return entries.filter((entry) => {
      const searchable = [entry.name, entry.email, entry.company, entry.procurementNeeds].join(" ").toLowerCase();
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [entries, query]);

  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <h2 className="sr-only">Waiting list</h2>
      <div className="border-b border-[#eeeeee] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block xl:w-[360px]">
            <span className="sr-only">Search waiting list</span>
            <AdminSearchIcon />
            <input
              className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, company..."
              type="search"
              value={query}
            />
          </label>
          <p className="w-fit rounded-md border border-[#ffd1d4] bg-[#fff1f2] px-3 py-2 text-[13px] font-semibold text-[#767676]">{entries.length} joined</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState detail="New public access requests will appear here after submission." title="No waiting list requests yet" />
      ) : (
        <>
          <div className="grid grid-cols-[0.82fr_0.86fr_0.7fr_1.05fr_0.52fr] gap-4 border-b border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-xl:hidden">
            <span>Name</span>
            <span>Email</span>
            <span>Company</span>
            <span>Need</span>
            <span>Joined</span>
          </div>
          <div className="divide-y divide-[#eeeeee]">
            {filteredEntries.map((entry) => (
              <article className="grid gap-4 px-4 py-4 xl:grid-cols-[0.82fr_0.86fr_0.7fr_1.05fr_0.52fr] xl:items-start" key={entry.id}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Name</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#202020] xl:mt-0">{entry.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Email</p>
                  <p className="mt-1 break-words text-[14px] text-[#4b525b] xl:mt-0">{entry.email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Company</p>
                  <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{entry.company}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Need</p>
                  <p className="mt-1 line-clamp-2 text-[14px] leading-5 text-[#4b525b] xl:mt-0">{entry.procurementNeeds}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Joined</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#767676] xl:mt-0">{formatJoinedDate(entry.joinedAt)}</p>
                </div>
              </article>
            ))}

            {filteredEntries.length === 0 ? (
              <EmptyState detail="Clear the search to see all waiting list requests." title="No waiting list requests match this view." />
            ) : null}
          </div>
          <div className="flex items-center justify-between border-t border-[#eeeeee] bg-[#fafafa] px-4 py-3 text-[12px] text-[#777d86]">
            <span>
              Showing {filteredEntries.length} of {entries.length} requests
            </span>
            <span>Newest public access requests</span>
          </div>
        </>
      )}
    </section>
  );
}

export function AdminCustomerManagement({ customers, waitingListEntries = [] }: { customers: CustomerProfile[]; waitingListEntries?: WaitingListEntry[] }) {
  return (
    <div className="space-y-5">
      <CreateCustomerCompany />
      <WaitingListTable entries={waitingListEntries} />
      <CustomerCompanyTable customers={customers} />
    </div>
  );
}
