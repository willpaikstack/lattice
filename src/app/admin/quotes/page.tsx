import Link from "next/link";

import { AdminQuoteManagement } from "@/components/admin-quote-management";
import { listAdminRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const requests = await listAdminRequests();

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#e6e6e6] bg-[#f8fafc] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Admin</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Quote submissions</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Manage active customer RFQs and the overseas fabrication shops quoting each request.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="rounded-md bg-[#171717] px-4 py-2 text-center text-sm font-semibold text-white" href="/admin/quotes/builder">
              Build Customer Quote
            </Link>
            <Link className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-center text-sm font-semibold text-[#262626]" href="/operator/requests">
              RFQ Queue
            </Link>
          </div>
        </div>
      </section>

      <AdminQuoteManagement requests={requests} />
    </div>
  );
}
