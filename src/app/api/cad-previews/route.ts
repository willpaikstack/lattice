import { cadProcessingIntakeError } from "@/lib/rfq-manufacturing";
import { NextResponse } from "next/server";

import { startCadPreviewFromSource, startCadPreviewTranslation } from "@/lib/autodesk-platform-services";
import { inspectStoredUpload, openStoredUploadStream } from "@/lib/local-file-storage";
import { canCurrentSessionAccessStorageKey } from "@/lib/request-access-policy";
import { requireRouteRole } from "@/lib/route-authorization";
import { cadDemoFormat } from "@/lib/cad-demo";
import { cadUploadError } from "@/lib/cad-upload-policy";
import { registerCadPreview, registeredCadPreviewForSource } from "@/lib/cad-preview-access";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const unauthorized = await requireRouteRole(["customer", "admin"]);
    if (unauthorized) {
      return unauthorized;
    }

    if (request.headers?.get("content-type")?.includes("application/json")) {
      const input = await request.json();
      const restrictionError = cadProcessingIntakeError(input?.restrictionStatus, input?.restrictionPolicyVersion, input?.processingIntent);
      if (restrictionError) return NextResponse.json({ error: restrictionError }, { status: 422 });
      if (typeof input.storageKey !== "string") return NextResponse.json({ error: "A saved CAD file is required" }, { status: 400 });
      const access = await canCurrentSessionAccessStorageKey(input.storageKey);
      if (!access.authorized) return NextResponse.json({ error: "File not found" }, { status: 404 });
      const stored = await inspectStoredUpload(input.storageKey);
      const uploadError = cadUploadError({ name: stored.name, size: stored.sizeBytes });
      if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 });
      if (cadDemoFormat(stored.name)) return NextResponse.json({ preview: { status: "local", provider: "local-cad" } }, { headers: { "Cache-Control": "no-store" } });
      if (input.reuseExisting === true) {
        const urn = await registeredCadPreviewForSource(input.storageKey);
        if (urn) return NextResponse.json({ preview: { status: "processing", urn, provider: "autodesk-platform-services" } }, { status: 202, headers: { "Cache-Control": "no-store" } });
      }
      const preview = await startCadPreviewFromSource({
        name: stored.name,
        size: stored.sizeBytes,
        openBody: () => openStoredUploadStream(input.storageKey),
      });
      if (preview.status === "processing") await registerCadPreview(preview.urn, input.storageKey);
      return NextResponse.json({ preview }, { status: preview.status === "configuration_required" ? 501 : 202 });
    }

    const formData = await request.formData();
    const restrictionError = cadProcessingIntakeError(formData.get("restrictionStatus"), formData.get("restrictionPolicyVersion"), formData.get("processingIntent"));
    if (restrictionError) return NextResponse.json({ error: restrictionError }, { status: 422 });
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A CAD file is required" }, { status: 400 });
    }

    const uploadError = cadUploadError(file);
    if (uploadError) return NextResponse.json({ error: uploadError }, { status: 400 });
    if (cadDemoFormat(file.name)) return NextResponse.json({ preview: { status: "local", provider: "local-cad" } }, { headers: { "Cache-Control": "no-store" } });
    const preview = await startCadPreviewTranslation(file);
    if (preview.status === "processing") await registerCadPreview(preview.urn);
    const status = preview.status === "configuration_required" ? 501 : 202;

    return NextResponse.json({ preview }, { status });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to start CAD preview";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
