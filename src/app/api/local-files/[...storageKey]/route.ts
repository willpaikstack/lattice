import { NextResponse } from "next/server";

import { readLocalUpload, storedUploadDownloadUrl } from "@/lib/local-file-storage";
import { canCurrentSessionAccessStorageKey } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";

function downloadName(storageKey: string, request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("name") || storageKey.split("/").pop() || "download";
}

export async function GET(request: Request, { params }: { params: Promise<{ storageKey: string[] }> }) {
  try {
    const { storageKey: storageKeyParts } = await params;
    const storageKey = storageKeyParts.join("/");
    const access = await canCurrentSessionAccessStorageKey(storageKey);

    if (!access.authenticated) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!access.authorized) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const extension = storageKey.split(".").at(-1)?.toLowerCase();
    const previewTypes: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
    const contentType = previewTypes[extension ?? ""] || "application/octet-stream";
    const fileName = downloadName(storageKey, request).replace(/["\r\n\\]/g, "");
    const disposition = url.searchParams.get("preview") === "1" && contentType !== "application/octet-stream" ? "inline" : "attachment";
    const contentDisposition = `${disposition}; filename="${fileName.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
    const remoteUrl = await storedUploadDownloadUrl(storageKey, contentType, contentDisposition);
    if (remoteUrl) {
      return new Response(null, { status: 307, headers: { Location: remoteUrl, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
    }
    const { contents, sizeBytes } = await readLocalUpload(storageKey);

    return new Response(contents, {
      headers: {
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
        "Content-Length": String(sizeBytes),
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
