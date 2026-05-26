import Link from "next/link";

import { CustomerQuoteBuilder } from "@/components/customer-quote-builder";

export default function AdminQuoteBuilderPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#e6e6e6] bg-[#f8fafc] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Admin</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Customer quote builder</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Type essential pricing details for each line item and generate a customer-ready quote file.
            </p>
          </div>
          <Link className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-center text-sm font-semibold text-[#262626]" href="/admin/quotes">
            Quote Submissions
          </Link>
        </div>
      </section>

      <CustomerQuoteBuilder />
    </div>
  );
}
