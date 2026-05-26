import Link from "next/link";

import type { CustomerProfile } from "@/lib/customer-profiles";

function EmptyState() {
  return (
    <div className="p-8 text-center">
      <p className="text-[15px] font-semibold text-[#202020]">No companies yet</p>
      <p className="mt-2 text-[14px] text-[#707782]">Companies will appear here after their first RFQ is submitted.</p>
    </div>
  );
}

function CustomerCompanyList({ customers }: { customers: CustomerProfile[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] px-5 py-4">
        <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Customer companies</h2>
        <p className="mt-1 text-[14px] leading-5 text-[#707782]">A simple list of every customer company on the platform.</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-[#eeeeee]">
          {customers.map((customer) => (
            <Link
              className="grid gap-3 px-5 py-4 transition hover:bg-[#f8fafc] md:grid-cols-[1fr_0.8fr_0.45fr_0.45fr] md:items-center"
              href={`/admin/customers/${customer.id}`}
              key={`customer-${customer.id}`}
            >
              <div>
                <p className="text-[15px] font-semibold text-[#202020]">{customer.name}</p>
                <p className="mt-1 text-[13px] text-[#707782]">
                  {customer.primaryContactName || customer.users[0]?.name || "No contact recorded"}
                  {customer.primaryContactEmail ? ` - ${customer.primaryContactEmail}` : ""}
                </p>
              </div>
              <p className="text-[14px] text-[#4b5563]">{customer.industry || "Industry not set"}</p>
              <p className="text-[14px] text-[#4b5563]">{customer.metrics.totalRequests} RFQs</p>
              <p className="text-[14px] font-semibold text-[#202020]">{customer.accountStatus}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function PlatformBusinessList({ customers }: { customers: CustomerProfile[] }) {
  return (
    <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
      <div className="border-b border-[#eeeeee] px-5 py-4">
        <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Platform business records</h2>
        <p className="mt-1 text-[14px] leading-5 text-[#707782]">The same companies shown as business records tied to users, requests, quotes, and orders.</p>
      </div>

      {customers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-[#eeeeee]">
          {customers.map((customer) => (
            <Link
              className="grid gap-3 px-5 py-4 transition hover:bg-[#f8fafc] md:grid-cols-[1fr_0.65fr_0.55fr_0.55fr] md:items-center"
              href={`/admin/customers/${customer.id}`}
              key={`business-${customer.id}`}
            >
              <div>
                <p className="text-[15px] font-semibold text-[#202020]">{customer.name}</p>
                <p className="mt-1 text-[13px] text-[#707782]">{customer.website || "Website not set"}</p>
              </div>
              <p className="text-[14px] text-[#4b5563]">{customer.customerTier} tier</p>
              <p className="text-[14px] text-[#4b5563]">{customer.metrics.activeQuoteRequests} active quotes</p>
              <p className="text-[14px] font-semibold text-[#202020]">{customer.metrics.placedOrders} orders</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function AdminCustomerManagement({ customers }: { customers: CustomerProfile[] }) {
  return (
    <div className="space-y-5">
      <CustomerCompanyList customers={customers} />
      <PlatformBusinessList customers={customers} />
    </div>
  );
}
