import Link from "next/link";

import type { CustomerProfile } from "@/lib/customer-profiles";

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-2 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function AdminCustomerProfileDetail({
  profile,
  updateAction,
}: {
  profile: CustomerProfile;
  updateAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <Link className="inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-950" href="/admin/customers">
        Back to customers
      </Link>

      <section className="rounded-md border border-[#e6e6e6] bg-[#f8fafc] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Customer profile</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">{profile.name}</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              This profile is attached to the platform business record that owns this customer&apos;s users, RFQs, quotes, and orders.
            </p>
          </div>
          <div className="rounded-md border border-[#d7d7d7] bg-white px-4 py-3 text-sm text-[#4b5563]">
            <p className="font-semibold text-[#202020]">{profile.accountStatus}</p>
            <p className="mt-1">{profile.customerTier} tier</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">RFQs</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{profile.metrics.totalRequests}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Active quotes</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{profile.metrics.activeQuoteRequests}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Orders</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{profile.metrics.placedOrders}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Purchased</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{formatCurrency(profile.metrics.orderValueCents)}</p>
        </article>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
          <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Business details</h2>
          <form action={updateAction} className="mt-5 space-y-5">
            <Field defaultValue={profile.name} label="Business name" name="name" placeholder="Customer business name" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field defaultValue={profile.website} label="Website" name="website" placeholder="https://example.com" type="url" />
              <Field defaultValue={profile.industry} label="Industry" name="industry" placeholder="Energy, robotics, aerospace" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field defaultValue={profile.primaryContactName} label="Primary contact" name="primaryContactName" placeholder="Contact name" />
              <Field defaultValue={profile.primaryContactEmail} label="Primary contact email" name="primaryContactEmail" placeholder="contact@example.com" type="email" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field defaultValue={profile.billingEmail} label="Billing email" name="billingEmail" placeholder="ap@example.com" type="email" />
              <Field defaultValue={profile.customerTier} label="Customer tier" name="customerTier" placeholder="Standard" />
              <Field defaultValue={profile.accountStatus} label="Account status" name="accountStatus" placeholder="Active" />
            </div>
            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Internal profile notes
              <textarea
                className="min-h-32 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                defaultValue={profile.notes}
                name="notes"
                placeholder="Commercial context, buying preferences, communication notes, payment terms, or support considerations."
              />
            </label>
            <button
              className="rounded-md bg-[#171717] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2f3237] disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!updateAction}
              type="submit"
            >
              Save customer profile
            </button>
          </form>
        </section>

        <div className="space-y-5">
          <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
            <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Business users</h2>
            <div className="mt-4 space-y-3">
              {profile.users.length ? (
                profile.users.map((user) => (
                  <div className="rounded-md bg-[#f8fafc] p-3" key={user.id}>
                    <p className="text-[14px] font-semibold text-[#202020]">{user.name}</p>
                    <p className="mt-1 text-[13px] text-[#707782]">{user.email || "No email recorded"}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-[#f8fafc] p-3 text-[14px] leading-6 text-[#707782]">No users are attached to this business yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-md border border-[#e6e6e6] bg-white p-5">
            <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Overseas fabrication shops</h2>
            <div className="mt-4 space-y-3">
              {profile.fabricationShops.length ? (
                profile.fabricationShops.map((shop) => (
                  <div className="rounded-md bg-[#f8fafc] p-3" key={`${shop.name}-${shop.country}`}>
                    <p className="text-[14px] font-semibold text-[#202020]">{shop.name}</p>
                    <p className="mt-1 text-[13px] text-[#707782]">
                      {shop.country} - {shop.quoteCount} quote(s) - {shop.selectedOrderCount} selected
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-[#f8fafc] p-3 text-[14px] leading-6 text-[#707782]">No shop activity is attached to this customer yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
