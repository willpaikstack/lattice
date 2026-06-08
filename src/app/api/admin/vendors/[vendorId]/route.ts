import { NextResponse } from "next/server";

import { buildOverseasVendors, findOverseasVendor } from "@/lib/admin-vendors";
import { applyOverseasVendorOverrides, normalizeVendorSaveInput, saveOverseasVendorOverride } from "@/lib/admin-vendor-overrides";
import { listAdminRequests } from "@/lib/request-repository";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ vendorId: string }> }) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { vendorId } = await context.params;
    const requests = await listAdminRequests();
    const vendors = await applyOverseasVendorOverrides(buildOverseasVendors(requests));
    const vendor = findOverseasVendor(vendors, vendorId);

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const input = normalizeVendorSaveInput(await request.json());
    await saveOverseasVendorOverride(vendor.id, input);

    return NextResponse.json({
      detail: input.detail ?? {},
      vendor: {
        ...vendor,
        ...input.fields,
      },
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to save vendor.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
