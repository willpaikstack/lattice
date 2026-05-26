import { NextResponse } from "next/server";

import { getViewerToken } from "@/lib/autodesk-platform-services";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await getViewerToken();

    if (!token) {
      return NextResponse.json({ error: "Autodesk Platform Services credentials are not configured" }, { status: 501 });
    }

    return NextResponse.json({
      access_token: token.access_token,
      expires_in: token.expires_in,
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to create viewer token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
