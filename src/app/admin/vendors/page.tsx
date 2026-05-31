import { AdminVendorDatabase } from "@/components/admin-vendor-database";
import { buildOverseasVendors } from "@/lib/admin-vendors";
import { listAdminRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const requests = await listAdminRequests();
  const vendors = buildOverseasVendors(requests);

  return <AdminVendorDatabase vendors={vendors} />;
}
