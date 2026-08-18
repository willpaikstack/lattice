import { NextResponse } from "next/server";

import { contactSnapshotFromAccountSettings, getAccountSettings } from "@/lib/account-settings";
import { copyLocalUpload, isDraftUploadStorageKey, readLocalUpload, saveLocalUpload } from "@/lib/local-file-storage";
import { createSubmittedRequest, listOperatorRequests } from "@/lib/request-repository";
import type { DraftRequestInput, UploadedFileInput } from "@/lib/request-model";
import { getCurrentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();

  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: session ? 403 : 401 });
  }

  const requests = await listOperatorRequests();
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();

    if (session?.user.role !== "customer" && session?.user.role !== "admin") {
      return NextResponse.json({ error: "Customer or admin access required." }, { status: session ? 403 : 401 });
    }

    const submittedInput = await withAccountDefaults(await parseSubmittedRequest(request));
    const companyId = session.user.role === "customer" ? session.user.companyId : null;

    if (session.user.role === "customer" && !companyId) {
      return NextResponse.json({ error: "Your account has not been assigned to a customer company yet. Contact Lattice to finish account setup." }, { status: 403 });
    }

    const companyName = session.user.role === "customer" ? session.user.companyName ?? submittedInput.buyerCompany : submittedInput.buyerCompany;
    const input = {
      ...submittedInput,
      buyerCompany: companyName,
      contact: {
        ...(submittedInput.contact ?? {}),
        shipToCompany: submittedInput.contact?.shipToCompany || companyName,
      },
    };
    const created = await createSubmittedRequest(input, { buyerCompanyId: companyId ?? undefined });
    return NextResponse.json({ request: created }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to create request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

async function withAccountDefaults(input: DraftRequestInput): Promise<DraftRequestInput> {
  const settings = await getAccountSettings();
  const defaults = contactSnapshotFromAccountSettings(settings);

  return {
    ...input,
    contact: {
      ...defaults,
      ...(input.contact ?? {}),
    },
  };
}

async function parseSubmittedRequest(request: Request): Promise<DraftRequestInput> {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    const input = (await request.json()) as DraftRequestInput;
    await assertStoredFileReferences(input);
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
        if (fileMetadata.storageKey) {
          return await normalizeStoredFileReference(fileMetadata);
        }

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

async function normalizeStoredFileReference(fileMetadata: UploadedFileInput) {
  if (!fileMetadata.storageKey) {
    throw new Error(`${fileMetadata.name} must be uploaded again before submitting.`);
  }

  if (isDraftUploadStorageKey(fileMetadata.storageKey)) {
    const stored = await copyLocalUpload(fileMetadata.storageKey, fileMetadata);

    if (!stored.storageKey) {
      throw new Error(`${fileMetadata.name} could not be copied into permanent RFQ storage.`);
    }

    return {
      ...fileMetadata,
      sizeBytes: stored.sizeBytes,
      type: stored.type || fileMetadata.type,
      storageKey: stored.storageKey,
    };
  }

  const stored = await readLocalUpload(fileMetadata.storageKey);

  return {
    ...fileMetadata,
    sizeBytes: fileMetadata.sizeBytes > 0 ? fileMetadata.sizeBytes : stored.sizeBytes,
  };
}

async function assertStoredFileReferences(input: DraftRequestInput) {
  const missingFileBytes = input.files.find((file) => !file.storageKey && file.sizeBytes <= 0);

  if (missingFileBytes) {
    throw new Error(`${missingFileBytes.name} must be uploaded again before submitting.`);
  }

  input.files = await Promise.all(
    input.files.map((file) =>
      file.storageKey ? normalizeStoredFileReference(file) : Promise.resolve(file),
    ),
  );
}
