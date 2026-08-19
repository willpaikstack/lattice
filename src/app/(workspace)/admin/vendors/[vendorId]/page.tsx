import { notFound } from "next/navigation";

import { AdminVendorDetail } from "@/components/admin-vendor-detail";
import { buildOverseasVendors, findOverseasVendor } from "@/lib/admin-vendors";
import { applyOverseasVendorOverrides, getOverseasVendorDetailOverrides } from "@/lib/admin-vendor-overrides";
import { listAdminRequests } from "@/lib/request-repository";

export const dynamic = "force-dynamic";

type VendorDetailPageProps = {
  params: Promise<{
    vendorId: string;
  }>;
};

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const { vendorId } = await params;
  const requests = await listAdminRequests();
  const vendors = await applyOverseasVendorOverrides(buildOverseasVendors(requests));
  const vendor = findOverseasVendor(vendors, vendorId);

  if (!vendor) {
    notFound();
  }

  const detailOverrides = await getOverseasVendorDetailOverrides(vendor.id);

  return <AdminVendorDetail detailOverrides={detailOverrides} vendor={vendor} />;
}
