import { requirePageRole } from "@/lib/route-authorization";
import { AdminVendorDatabase } from "@/components/admin-vendor-database";
import { buildOverseasVendors } from "@/lib/admin-vendors";
import { applyOverseasVendorOverrides } from "@/lib/admin-vendor-overrides";
import { listAdminRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  await requirePageRole(["admin"]);
  const requests = await listAdminRequests();
  const vendors = await applyOverseasVendorOverrides(buildOverseasVendors(requests));

  return <AdminVendorDatabase vendors={vendors} />;
}
