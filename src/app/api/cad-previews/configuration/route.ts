import { NextResponse } from "next/server";

import { checkCadPreviewConfiguration } from "@/lib/autodesk-platform-services";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const unauthorized = await requireRouteRole(["customer", "admin"]);
    if (unauthorized) {
      return unauthorized;
    }

    const configuration = await checkCadPreviewConfiguration();
    const status = configuration.status === "configured" ? 200 : 501;

    return NextResponse.json({ configuration }, { status });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to verify Autodesk Platform Services configuration";

    return NextResponse.json(
      {
        configuration: {
          status: "authentication_failed",
          provider: "autodesk-platform-services",
          message,
        },
      },
      { status: 502 },
    );
  }
}
