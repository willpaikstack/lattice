import { NextResponse } from "next/server";

import { saveLocalUpload } from "@/lib/local-file-storage";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (session?.user.role !== "customer" && session?.user.role !== "admin") {
      return NextResponse.json({ error: "Customer or admin access required." }, { status: session ? 403 : 401 });
    }

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
