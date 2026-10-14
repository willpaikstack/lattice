import { NextResponse } from "next/server";

import { getCadPreviewThumbnail } from "@/lib/autodesk-platform-services";
import { requireRouteRole } from "@/lib/route-authorization";
import { canCurrentSessionAccessCadPreview } from "@/lib/cad-preview-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const unauthorized = await requireRouteRole(["customer", "admin"]);
    if (unauthorized) {
      return unauthorized;
    }

    const searchParams = new URL(request.url).searchParams;
    const urn = searchParams.get("urn");
    const size = Number(searchParams.get("size") ?? 320);

    if (!urn) {
      return NextResponse.json({ error: "A translated model URN is required" }, { status: 400 });
    }

    if (!await canCurrentSessionAccessCadPreview(urn)) return NextResponse.json({ error: "CAD preview not found." }, { status: 404 });
    const thumbnail = await getCadPreviewThumbnail(urn, size);

    if (!thumbnail) {
      return NextResponse.json({ error: "Autodesk Platform Services credentials are not configured" }, { status: 501 });
    }

    if (thumbnail.status === "pending") {
      return NextResponse.json({ error: "CAD thumbnail is still processing" }, { status: 202 });
    }

    return new Response(thumbnail.bytes, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": thumbnail.contentType,
      },
      status: 200,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to fetch CAD thumbnail";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
