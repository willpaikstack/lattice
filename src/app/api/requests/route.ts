import { NextResponse } from "next/server";

import { saveLocalUpload } from "@/lib/local-file-storage";
import { createSubmittedRequest, listOperatorRequests } from "@/lib/request-repository";
import type { DraftRequestInput } from "@/lib/request-model";

export const dynamic = "force-dynamic";

export async function GET() {
  const requests = await listOperatorRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    const input = await parseSubmittedRequest(request);
    const created = await createSubmittedRequest(input);
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to create request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function parseSubmittedRequest(request: Request): Promise<DraftRequestInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return request.json() as Promise<DraftRequestInput>;
  }

  const formData = await request.formData();
  const rawInput = formData.get("request");

  if (typeof rawInput !== "string") {
    throw new Error("Request metadata is required");
  }

  const input = JSON.parse(rawInput) as DraftRequestInput;

  input.files = await Promise.all(
    input.files.map(async (fileMetadata, index) => {
      const uploadedFile = formData.get(`file-${index}`);

      if (!(uploadedFile instanceof File)) {
        return fileMetadata;
      }

      const stored = await saveLocalUpload(uploadedFile);

      return {
        ...fileMetadata,
        name: stored.name || fileMetadata.name,
        sizeBytes: stored.sizeBytes,
        type: stored.type || fileMetadata.type,
        storageKey: stored.storageKey,
      };
    }),
  );

  return input;
}
