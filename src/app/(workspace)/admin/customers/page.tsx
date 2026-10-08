import { AdminCustomerManagement } from "@/components/admin-customer-management";
import { listCustomerProfiles } from "@/lib/customer-profiles";
import { listWaitingListEntries } from "@/lib/waiting-list";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const [customers, waitingListEntries] = await Promise.all([
    listCustomerProfiles(),
    listWaitingListEntries(),
  ]);

  return (
    <AdminCustomerManagement
      customers={customers}
      waitingListEntries={waitingListEntries}
    />
  );
}
