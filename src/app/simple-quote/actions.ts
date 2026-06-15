"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createGuestQuoteAccess } from "@/lib/guest-quote-access";
import { sendGuestQuoteAcknowledgementEmail } from "@/lib/guest-quote-email";
import { saveLocalUpload } from "@/lib/local-file-storage";
import type { DraftRequestInput, UploadedFileInput } from "@/lib/request-model";
import { createSubmittedRequest } from "@/lib/request-repository";
import {
  generalToleranceOptions,
  optionLabel,
  processOptions,
  qualityDocumentationOptions,
  rfqMaterialOptions,
  surfaceFinishOptions,
} from "@/lib/rfq-options";

export type SimpleQuoteFormState = {
  error?: string;
};

function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formInteger(formData: FormData, key: string) {
  const parsed = Number.parseInt(formText(formData, key), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).name === "string" &&
    typeof (value as File).size === "number" &&
    (value as File).size > 0
  );
}

function requireText(formData: FormData, key: string, label: string) {
  const value = formText(formData, key);
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

async function storedFileMetadata(file: File): Promise<UploadedFileInput> {
  const stored = await saveLocalUpload(file);

  return {
    name: stored.name || file.name,
    sizeBytes: stored.sizeBytes,
    storageKey: stored.storageKey,
    type: stored.type || file.type || "application/octet-stream",
  };
}

function partIdsFromForm(formData: FormData) {
  return formText(formData, "partIds")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 8);
}

async function draftInputFromForm(formData: FormData): Promise<DraftRequestInput> {
  const requesterName = requireText(formData, "requesterName", "Your name");
  const requesterEmail = requireText(formData, "requesterEmail", "Email");
  const requesterPhone = requireText(formData, "requesterPhone", "Phone");
  const buyerCompany = requireText(formData, "buyerCompany", "Company");
  const title = requireText(formData, "title", "Project name");
  const process = requireText(formData, "process", "Manufacturing process");
  const dueDate = requireText(formData, "dueDate", "Target date");
  const partIds = partIdsFromForm(formData);

  if (!requesterEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (partIds.length === 0) {
    throw new Error("Add at least one part.");
  }

  const files: UploadedFileInput[] = [];
  const lineItems = [];

  for (const [index, partId] of partIds.entries()) {
    const label = `Part ${index + 1}`;
    const cadFile = formData.get(`cadFile:${partId}`);
    const drawingFile = formData.get(`drawingFile:${partId}`);
    const partName = requireText(formData, `partName:${partId}`, `${label} name`);
    const quantity = formInteger(formData, `quantity:${partId}`);

    if (quantity <= 0) {
      throw new Error(`${label} quantity must be greater than zero.`);
    }

    if (!isUploadFile(cadFile)) {
      throw new Error(`${label} needs a CAD file.`);
    }

    const storedCadFile = await storedFileMetadata(cadFile);
    files.push(storedCadFile);

    if (isUploadFile(drawingFile)) {
      files.push(await storedFileMetadata(drawingFile));
    }

    lineItems.push({
      generalTolerance: optionLabel(generalToleranceOptions, formText(formData, `generalTolerance:${partId}`)),
      material: optionLabel(rfqMaterialOptions, formText(formData, `material:${partId}`)),
      notes: formText(formData, `notes:${partId}`),
      partName,
      qualityDocumentation: [optionLabel(qualityDocumentationOptions, formText(formData, `qualityDocumentation:${partId}`) || "standard_inspection")],
      quantity,
      surfaceFinish: optionLabel(surfaceFinishOptions, formText(formData, `surfaceFinish:${partId}`)),
    });
  }

  const guestAccess = createGuestQuoteAccess();

  return {
    buyerCompany,
    contact: {
      requesterEmail,
      requesterPhone,
      shipToAddress1: formText(formData, "shipToAddress1"),
      shipToAddress2: formText(formData, "shipToAddress2"),
      shipToCity: formText(formData, "shipToCity"),
      shipToCompany: formText(formData, "shipToCompany") || buyerCompany,
      shipToName: formText(formData, "shipToName") || requesterName,
      shipToPhone: formText(formData, "shipToPhone") || requesterPhone,
      shipToState: formText(formData, "shipToState"),
      shipToZipCode: formText(formData, "shipToZipCode"),
    },
    dueDate,
    files,
    guestAccessTokenExpiresAt: guestAccess.expiresAt,
    guestAccessTokenHash: guestAccess.tokenHash,
    lineItems,
    process: optionLabel(processOptions, process),
    requesterName,
    requestOrigin: "GUEST_SIMPLE_QUOTE",
    title,
  };
}

export async function submitSimpleQuoteAction(_previousState: SimpleQuoteFormState, formData: FormData): Promise<SimpleQuoteFormState> {
  try {
    const input = await draftInputFromForm(formData);
    const created = await createSubmittedRequest(input);

    await sendGuestQuoteAcknowledgementEmail(created);
    revalidatePath("/admin");
    revalidatePath("/admin/quotes");
    redirect(`/simple-quote/thanks?request=${encodeURIComponent(created.id)}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    return {
      error: error instanceof Error ? error.message : "Unable to submit your quote request.",
    };
  }
}
