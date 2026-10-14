import { NextResponse } from "next/server";

import { getViewerToken } from "@/lib/autodesk-platform-services";
import { requireRouteRole } from "@/lib/route-authorization";
import { canCurrentSessionAccessCadPreview } from "@/lib/cad-preview-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireRouteRole(["customer", "admin"]);
    if (unauthorized) {
      return unauthorized;
    }

    const urns = [...new Set(new URL(request.url).searchParams.getAll("urn"))];
    if (!urns.length || urns.length > 64 || urns.some(urn => !urn || urn.length > 4096)) return NextResponse.json({ error: "Choose the CAD models to preview." }, { status: 400 });
    for (const urn of urns) if (!await canCurrentSessionAccessCadPreview(urn)) return NextResponse.json({ error: "CAD preview not found." }, { status: 404 });
    const token = await getViewerToken(urns);

    if (!token) {
      return NextResponse.json({ error: "Autodesk Platform Services credentials are not configured" }, { status: 501 });
    }

    return NextResponse.json({
      access_token: token.access_token,
      expires_in: token.expires_in,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to create viewer token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
