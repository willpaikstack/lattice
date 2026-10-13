import { cadProcessingIntakeError } from "@/lib/rfq-manufacturing";
import { draftUploadFolder, ownsDraftUpload } from "@/lib/draft-upload-scope";
import { NextResponse } from "next/server";

import { completeDirectUpload, prepareDirectUpload, saveLocalUpload } from "@/lib/local-file-storage";
import { getCurrentSession } from "@/lib/session";
import { cadUploadError, manufacturingUploadError, maxCadUploadBytes } from "@/lib/cad-upload-policy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (session?.user.role !== "customer" && session?.user.role !== "admin") {
      return NextResponse.json({ error: "Customer or admin access required." }, { status: session ? 403 : 401 });
    }

    if (request.headers?.get("content-type")?.includes("application/json")) {
      const input = await request.json();
      const restrictionError = cadProcessingIntakeError(input?.restrictionStatus, input?.restrictionPolicyVersion, input?.processingIntent);
      if (restrictionError) return NextResponse.json({ error: restrictionError }, { status: 422 });

      if (input.action === "complete") {
        if (typeof input.storageKey !== "string" || !ownsDraftUpload(session, input.storageKey)) {
          return NextResponse.json({ error: "File not found" }, { status: 404 });
        }
        const stored = await completeDirectUpload(input.storageKey);
        const uploadError = (input.processingIntent === "advance_cad_preview" ? cadUploadError : manufacturingUploadError)({ name: stored.name, size: stored.sizeBytes });
        if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 });
        return NextResponse.json({ file: stored }, { status: 201, headers: { "Cache-Control": "no-store" } });
      }

      const file = input.file;
      if (input.action !== "prepare" || !file || typeof file.name !== "string" || file.name.length > 255 || /[\x00-\x1f\x7f/\\]/.test(file.name) ||
          !Number.isSafeInteger(file.sizeBytes) || file.sizeBytes <= 0 || file.sizeBytes > maxCadUploadBytes ||
          typeof file.type !== "string" || file.type.length > 255 || /[\r\n]/.test(file.type)) {
        return NextResponse.json({ error: "Choose a supported CAD file or drawing up to 200 MB." }, { status: 400 });
      }
      const uploadError = (input.processingIntent === "advance_cad_preview" ? cadUploadError : manufacturingUploadError)({ name: file.name, size: file.sizeBytes });
      if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 });
      const upload = await prepareDirectUpload(file, draftUploadFolder(session));
      return NextResponse.json({ upload }, { headers: { "Cache-Control": "no-store" } });
    }

    const formData = await request.formData();
    const restrictionError = cadProcessingIntakeError(formData.get("restrictionStatus"), formData.get("restrictionPolicyVersion"), formData.get("processingIntent"));
    if (restrictionError) return NextResponse.json({ error: restrictionError }, { status: 422 });
    const file = formData.get("file");

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "Choose a file before saving the draft upload." }, { status: 400 });
    }

    const uploadError = (formData.get("processingIntent") === "advance_cad_preview" ? cadUploadError : manufacturingUploadError)(file);
    if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 });
    const stored = await saveLocalUpload(file, draftUploadFolder(session));

    if (!stored.storageKey) {
      return NextResponse.json({ error: "Draft file storage is not configured." }, { status: 503 });
    }

    return NextResponse.json({ file: stored }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to save draft file";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
