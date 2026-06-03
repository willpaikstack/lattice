import { AdminQuoteManagement } from "@/components/admin-quote-management";
import { listCustomerProfiles } from "@/lib/customer-profiles";
import { listAdminRequests } from "@/lib/request-repository";

import { updateAdminQuoteStatusAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const [requests, customerProfiles] = await Promise.all([listAdminRequests(), listCustomerProfiles()]);
  const customerProfileHrefs = Object.fromEntries(
    customerProfiles.map((customer) => [customer.name, `/admin/customers/${customer.id}`]),
  );

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#ffd1d4] bg-[#fff7f7] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Admin quote operations</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Quote submissions</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Review customer RFQ packets, track supplier quote basis, and assemble the customer-facing quote with pricing, lead time, shipping, tax, files, and DFM notes.
            </p>
          </div>
          <div className="grid gap-2 text-[12px] font-semibold text-[#767676] sm:grid-cols-3 xl:min-w-[520px]">
            <span className="rounded-md border border-[#ffd1d4] bg-white px-3 py-2">1. Intake</span>
            <span className="rounded-md border border-[#ffd1d4] bg-white px-3 py-2">2. Supplier basis</span>
            <span className="rounded-md border border-[#ffd1d4] bg-white px-3 py-2">3. Issue quote</span>
          </div>
        </div>
      </section>

      <AdminQuoteManagement
        customerProfileHrefs={customerProfileHrefs}
        requests={requests}
        updateStatusAction={updateAdminQuoteStatusAction}
      />
    </div>
  );
}
