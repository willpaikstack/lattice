import { NextResponse } from "next/server";

import { saveLocalUpload } from "@/lib/local-file-storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Choose a file before saving the draft upload." }, { status: 400 });
    }

    const stored = await saveLocalUpload(file, "rfq-drafts");

    if (!stored.storageKey) {
      return NextResponse.json({ error: "Draft file storage is not configured." }, { status: 503 });
    }

    return NextResponse.json({ file: stored }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to save draft file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
