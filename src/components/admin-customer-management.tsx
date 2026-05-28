"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { CustomerProfile } from "@/lib/customer-profiles";
import type { WaitingListEntry } from "@/lib/waiting-list";

const customerFilters = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Standard", value: "STANDARD" },
  { label: "With orders", value: "WITH_ORDERS" },
] as const;

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
        <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-6 text-[#6f737a]">Companies will appear here after their first RFQ is submitted.</p>
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
                    isActive ? "border-[#4f3424] bg-[#4f3424] text-white" : "border-[#e4c0a3] bg-white text-[#6b4a34] hover:bg-[#fff6ee]"
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
            className="grid gap-4 px-4 py-4 transition hover:bg-[#fafafa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f3424] xl:grid-cols-[1.15fr_0.78fr_0.56fr_0.56fr_0.58fr_0.62fr] xl:items-center"
            href={`/admin/customers/${customer.id}`}
            key={customer.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7c818a]">{customer.website || "Website not set"}</span>
                <span className="inline-flex rounded-md border border-[#f0d0b5] bg-[#fff6ee] px-2 py-0.5 text-[11px] font-semibold text-[#7a4a22]">{customer.accountStatus}</span>
              </div>
              <h2 className="mt-2 truncate text-[15px] font-semibold text-[#202020]">{customer.name}</h2>
              <p className="mt-1 truncate text-[13px] text-[#69707a]">
                {customer.primaryContactName || customer.users[0]?.name || "No contact recorded"}
                {customer.primaryContactEmail ? ` - ${customer.primaryContactEmail}` : ""}
              </p>
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
              <p className="mt-1 text-[12px] text-[#8a8f98]">Open profile</p>
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
          <p className="w-fit rounded-md border border-[#f0d0b5] bg-[#fff6ee] px-3 py-2 text-[13px] font-semibold text-[#7a4a22]">{entries.length} joined</p>
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
                  <p className="mt-1 text-[13px] font-semibold text-[#7a4a22] xl:mt-0">{formatJoinedDate(entry.joinedAt)}</p>
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
      <WaitingListTable entries={waitingListEntries} />
      <CustomerCompanyTable customers={customers} />
    </div>
  );
}
