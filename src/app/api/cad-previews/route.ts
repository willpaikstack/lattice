import { NextResponse } from "next/server";

import { startCadPreviewTranslation } from "@/lib/autodesk-platform-services";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A CAD file is required" }, { status: 400 });
    }

    const preview = await startCadPreviewTranslation(file);
    const status = preview.status === "configuration_required" ? 501 : 202;

    return NextResponse.json({ preview }, { status });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to start CAD preview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
