import { NextResponse } from "next/server";

import { getCadPreviewStatus } from "@/lib/autodesk-platform-services";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireRouteRole(["customer", "admin"]);
    if (unauthorized) {
      return unauthorized;
    }

    const urn = new URL(request.url).searchParams.get("urn");

    if (!urn) {
      return NextResponse.json({ error: "A translated model URN is required" }, { status: 400 });
    }

    const preview = await getCadPreviewStatus(urn);
    return NextResponse.json({ preview });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to inspect CAD preview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
