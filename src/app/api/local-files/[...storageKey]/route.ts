import { NextResponse } from "next/server";

import { readLocalUpload } from "@/lib/local-file-storage";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function downloadName(storageKey: string, request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("name") || storageKey.split("/").pop() || "download";
}

export async function GET(request: Request, { params }: { params: Promise<{ storageKey: string[] }> }) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { storageKey: storageKeyParts } = await params;
    const storageKey = storageKeyParts.join("/");
    const { contents, sizeBytes } = await readLocalUpload(storageKey);
    const url = new URL(request.url);
    const contentType = url.searchParams.get("type") || "application/octet-stream";
    const fileName = downloadName(storageKey, request).replace(/"/g, "");
    const disposition = url.searchParams.get("preview") === "1" ? "inline" : "attachment";

    return new Response(contents, {
      headers: {
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "Content-Length": String(sizeBytes),
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Local file not found" }, { status: 404 });
  }
}
