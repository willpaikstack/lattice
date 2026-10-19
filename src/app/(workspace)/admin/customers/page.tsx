import type { Metadata } from "next";
import { requirePageRole } from "@/lib/route-authorization";
import { AdminCustomerManagement } from "@/components/admin-customer-management";
import { listCustomerProfiles } from "@/lib/customer-profiles";
import { listWaitingListEntries } from "@/lib/waiting-list";

export const metadata: Metadata = { title: "Companies | Lattice" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ companyDeleted?: string; cleanup?: string }> }) {
  await requirePageRole(["admin"]);
  const [customers, waitingListEntries] = await Promise.all([
    listCustomerProfiles(),
    listWaitingListEntries(),
  ]);

  const notice = await searchParams;
  return (
    <>
    {notice.companyDeleted === "1" ? <div role="status" className="mb-5 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
      Company and attached users deleted. Its RFQs and quotes are archived; existing orders and invoices are retained.
      {notice.cleanup === "1" ? <p className="mt-2 text-amber-800">Some external sign-in or payment profiles still need cleanup. Contact Lattice support before reusing those accounts.</p> : null}
    </div> : null}
    <AdminCustomerManagement
      customers={customers}
      waitingListEntries={waitingListEntries}
    />
    </>
  );
}
