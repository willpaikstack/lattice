export type PersistedDraftUpload = { name: string; sizeBytes: number; storageKey: string; type: string };
export type UploadDeclaration = { restrictionStatus: string; restrictionPolicyVersion: string; processingIntent?: "advance_cad_preview" };

async function uploadResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Unable to save this file. Please try again.");
  return payload;
}

export async function uploadRequestDraftFile(file: File, declaration: UploadDeclaration): Promise<PersistedDraftUpload> {
  const prepare = await uploadResponse(await fetch("/api/request-draft-files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "prepare", file: { name: file.name, sizeBytes: file.size, type: file.type || "application/octet-stream" }, ...declaration }),
  }));

  // Development keeps its existing local-file path. Production never falls
  // back to proxying file bytes when a direct upload fails.
  if (prepare.upload?.mode === "local") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("restrictionStatus", declaration.restrictionStatus);
    formData.append("restrictionPolicyVersion", declaration.restrictionPolicyVersion);
    if (declaration.processingIntent) formData.append("processingIntent", declaration.processingIntent);
    const payload = await uploadResponse(await fetch("/api/request-draft-files", { method: "POST", body: formData }));
    if (!payload.file?.storageKey) throw new Error("The file could not be saved. Please try again.");
    return payload.file;
  }

  if (prepare.upload?.mode !== "direct" || !prepare.upload.uploadUrl || !prepare.upload.storageKey) {
    throw new Error("File storage is unavailable. Please try again.");
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(prepare.upload.uploadUrl, {
        method: "PUT", body: file, headers: prepare.upload.headers, credentials: "omit",
      });
      if (response.ok) break;
      if (attempt === 0 && response.status >= 500) continue;
      throw new Error("The file could not be uploaded. Please try again.");
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  const complete = await uploadResponse(await fetch("/api/request-draft-files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "complete", storageKey: prepare.upload.storageKey, ...declaration }),
  }));
  if (!complete.file?.storageKey) throw new Error("The file upload could not be confirmed. Please try again.");
  return complete.file;
}
