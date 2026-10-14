import { validateSubmissionShape } from "@/lib/rfq-submission-validation";
import { validateManufacturingIntake } from "@/lib/rfq-manufacturing";
import { canCurrentSessionAccessStorageKey } from "@/lib/request-access-policy";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { contactSnapshotFromAccountSettings, getAccountSettings } from "@/lib/account-settings";
import { copyLocalUpload, isDraftUploadStorageKey, inspectStoredUpload, saveLocalUpload } from "@/lib/local-file-storage";
import { manufacturingUploadError } from "@/lib/cad-upload-policy";
import { createSubmittedRequest, getRequestById, listOperatorRequests } from "@/lib/request-repository";
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

    const companyId = session.user.role === "customer" ? session.user.companyId : null;

    if (session.user.role === "customer" && !companyId) {
      return NextResponse.json({ error: "Your account has not been assigned to a customer company yet. Contact Lattice to finish account setup." }, { status: 403 });
    }

    const submissionKey = request.headers.get("Idempotency-Key");
    if (submissionKey !== null && !/^[A-Za-z0-9_-]{8,128}$/.test(submissionKey)) {
      return NextResponse.json({ error: "Invalid RFQ submission identifier." }, { status: 400 });
    }
    // A stable, identity-scoped primary key deduplicates concurrent requests
    // across server instances without relying on process memory or a migration.
    const submissionId = submissionKey ? `rfq_${createHash("sha256").update(`${session.user.id}\0${companyId ?? ""}\0${submissionKey}`).digest("hex").slice(0,40)}` : undefined;
    if (submissionId) {
      try {
        const existing = await getRequestById(submissionId, { requireDatabase: true });
        if (existing) return NextResponse.json({ request: existing }, { status: 200 });
      } catch {
        return NextResponse.json({ error: "The RFQ database is unavailable. Your draft is retained; please try again." }, { status: 503 });
      }
    }
    const submittedInput = await withAccountDefaults(await parseSubmittedRequest(request));

    const companyName = session.user.role === "customer" ? session.user.companyName?.trim() || submittedInput.buyerCompany || "" : "";
    const input = {
      ...submittedInput,
      buyerCompany: companyName,
      contact: {
        ...(submittedInput.contact ?? {}),
        shipToCompany: submittedInput.contact?.shipToCompany || companyName,
      },
    };
    try {
      const created = await createSubmittedRequest(input, { buyerCompanyId: companyId ?? undefined, ...(submissionId ? { submissionId } : {}), requireDatabase: true });
      return NextResponse.json({ request: created }, { status: 201 });
    } catch {
      return NextResponse.json({ error: "The RFQ could not be saved to the database. Your draft is retained; please try again." }, { status: 503 });
    }
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
    // Resolve the display name on the server; ownership comes from the session company ID.
    buyerCompany: settings.companyName,
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
    validateSubmissionShape(input);
    validateManufacturingIntake(input);
    await assertStoredFileReferences(input);
    return input;
  }

  const formData = await request.formData();
  const rawInput = formData.get("request");

  if (typeof rawInput !== "string") {
    throw new Error("Request metadata is required");
  }

  const input = JSON.parse(rawInput) as DraftRequestInput;
  validateSubmissionShape(input);
    validateManufacturingIntake(input);

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
      const uploadError = manufacturingUploadError(uploadedFile);
      if (uploadError) throw new Error(uploadError);

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

  if (fileMetadata.storageKey.startsWith("/") || fileMetadata.storageKey.split("/").some((part) => part === ".." || part === ".")) throw new Error("Invalid file storage key");
  const access = await canCurrentSessionAccessStorageKey(fileMetadata.storageKey);
  if (!access.authorized) throw new Error("This file is not available to your company. Upload it again.");

  const inspected = await inspectStoredUpload(fileMetadata.storageKey);
  const uploadError = manufacturingUploadError({ name: fileMetadata.name, size: inspected.sizeBytes });
  if (uploadError) throw new Error(uploadError);
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

  const stored = await inspectStoredUpload(fileMetadata.storageKey);

  return {
    ...fileMetadata,
    sizeBytes: stored.sizeBytes,
  };
}

async function assertStoredFileReferences(input: DraftRequestInput) {
  const missingFileBytes = input.files.find((file) => !file.storageKey);

  if (missingFileBytes) {
    throw new Error(`${missingFileBytes.name} must be uploaded again before submitting.`);
  }

  input.files = await Promise.all(
    input.files.map((file) =>
      normalizeStoredFileReference(file),
    ),
  );
}
