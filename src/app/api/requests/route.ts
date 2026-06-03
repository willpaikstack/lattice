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
    const input = (await request.json()) as DraftRequestInput;
    assertStoredFileReferences(input);
    return input;
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
        throw new Error(`${fileMetadata.name} must be uploaded again before submitting.`);
      }

      if (uploadedFile.size <= 0) {
        throw new Error(`${fileMetadata.name} is empty and cannot be submitted.`);
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

function assertStoredFileReferences(input: DraftRequestInput) {
  const missingFileBytes = input.files.find((file) => !file.storageKey && file.sizeBytes <= 0);

  if (missingFileBytes) {
    throw new Error(`${missingFileBytes.name} must be uploaded again before submitting.`);
  }
}
