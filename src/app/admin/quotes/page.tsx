import { AdminQuoteManagement } from "@/components/admin-quote-management";
import { listCustomerProfiles } from "@/lib/customer-profiles";
import { buildOverseasVendors } from "@/lib/admin-vendors";
import { applyOverseasVendorOverrides } from "@/lib/admin-vendor-overrides";
import { listAdminRequests } from "@/lib/request-repository";

import { updateAdminQuoteStatusAction, updateAdminRfqDecisionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const [requests, customerProfiles] = await Promise.all([listAdminRequests(), listCustomerProfiles()]);
  const overseasVendors = await applyOverseasVendorOverrides(buildOverseasVendors(requests));
  const customerProfileHrefs = Object.fromEntries(
    customerProfiles.map((customer) => [customer.name, `/admin/customers/${customer.id}`]),
  );

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#ffd1d4] bg-[#fff7f7] p-5">
        <div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Admin quote operations</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Quote submissions</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Review customer RFQ packets, track supplier quote basis, and assemble the customer-facing quote with pricing, lead time, shipping, tax, files, and DFM notes.
            </p>
          </div>
        </div>
      </section>

      <AdminQuoteManagement
        customerProfileHrefs={customerProfileHrefs}
        overseasVendors={overseasVendors}
        requests={requests}
        updateDecisionAction={updateAdminRfqDecisionAction}
        updateStatusAction={updateAdminQuoteStatusAction}
      />
    </div>
  );
}
