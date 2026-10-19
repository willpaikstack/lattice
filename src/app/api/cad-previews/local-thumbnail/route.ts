import { NextResponse } from "next/server";
import sharp from "sharp";
import { cadDemoFormat } from "@/lib/cad-demo";
import { cadThumbnailStorageKey, inspectStoredUpload, readLocalUpload, saveCadThumbnail } from "@/lib/local-file-storage";
import { canCurrentSessionAccessStorageKey } from "@/lib/request-access-policy";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const maxImageBytes = 512 * 1024;

async function authorizedSource(request: Request) {
  const key = new URL(request.url).searchParams.get("storageKey");
  if (!key || key.length > 2048 || !cadDemoFormat(key) || key.startsWith("/") || key.split("/").some(part => part === "." || part === "..")) {
    return { error: NextResponse.json({ error: "Invalid model reference." }, { status: 400, headers }) };
  }
  const access = await canCurrentSessionAccessStorageKey(key);
  if (!access.authenticated) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401, headers }) };
  if (!access.authorized) return { error: NextResponse.json({ error: "File not found." }, { status: 404, headers }) };
  return { key };
}

export async function GET(request: Request) {
  try {
    const source = await authorizedSource(request);
    if (source.error) return source.error;
    const { contents } = await readLocalUpload(cadThumbnailStorageKey(source.key!));
    return new Response(new Uint8Array(contents), { headers: { ...headers, "Content-Type": "image/png" } });
  } catch {
    return NextResponse.json({ error: "Thumbnail unavailable." }, { status: 404, headers });
  }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers });
    const source = await authorizedSource(request);
    if (source.error) return source.error;
    if (request.headers.get("content-type") !== "image/png" || Number(request.headers.get("content-length")) > maxImageBytes || !request.body) {
      return NextResponse.json({ error: "A PNG thumbnail up to 512 KB is required." }, { status: 400, headers });
    }
    await inspectStoredUpload(source.key!);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxImageBytes) { await reader.cancel(); return NextResponse.json({ error: "Thumbnail too large." }, { status: 413, headers }); }
      chunks.push(value);
    }
    const image = sharp(Buffer.concat(chunks), { limitInputPixels: 1024 * 1024 });
    const metadata = await image.metadata();
    if (metadata.format !== "png" || !metadata.width || !metadata.height || metadata.width > 1024 || metadata.height > 1024) {
      return NextResponse.json({ error: "Invalid thumbnail image." }, { status: 400, headers });
    }
    // Decode/re-encode the image so arbitrary uploaded metadata is not retained.
    const png = await image.resize(384, 384, { fit: "contain", background: "#f0f4f8" }).png().toBuffer();
    await saveCadThumbnail(source.key!, png);
    return NextResponse.json({ saved: true }, { status: 201, headers });
  } catch {
    return NextResponse.json({ error: "Unable to save thumbnail." }, { status: 400, headers });
  }
}
