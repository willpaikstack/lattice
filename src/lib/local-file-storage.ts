import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredLocalUpload = {
  name: string;
  sizeBytes: number;
  type: string;
  storageKey?: string;
};

const localUploadRoot = path.join(process.cwd(), ".data", "uploads");

function localStorageEnabled() {
  return process.env.LOCAL_FILE_STORAGE_ENABLED === "true" || (!process.env.VERCEL && process.env.LOCAL_FILE_STORAGE_ENABLED !== "false");
}

function safeFileName(fileName: string) {
  const normalized = fileName
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  return normalized || "upload.bin";
}

function assertSafeStorageKey(storageKey: string) {
  const normalized = path.posix.normalize(storageKey);

  if (normalized.startsWith("../") || normalized === ".." || path.isAbsolute(normalized)) {
    throw new Error("Invalid local file storage key");
  }

  return normalized;
}

export function localUploadPath(storageKey: string) {
  const safeKey = assertSafeStorageKey(storageKey);
  const fullPath = path.join(localUploadRoot, safeKey);
  const relative = path.relative(localUploadRoot, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid local file storage key");
  }

  return fullPath;
}

export async function saveLocalUpload(file: File, folder = "rfq"): Promise<StoredLocalUpload> {
  const metadata = {
    name: file.name,
    sizeBytes: file.size,
    type: file.type || "application/octet-stream",
  };

  return saveLocalUploadBytes(metadata, Buffer.from(await file.arrayBuffer()), folder);
}

async function saveLocalUploadBytes(
  metadata: Omit<StoredLocalUpload, "storageKey">,
  contents: Buffer,
  folder = "rfq",
): Promise<StoredLocalUpload> {
  if (!localStorageEnabled()) {
    return metadata;
  }

  const today = new Date().toISOString().slice(0, 10);
  const storageKey = path.posix.join(folder, today, `${randomUUID()}-${safeFileName(metadata.name)}`);
  const destination = localUploadPath(storageKey);

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);

  return {
    ...metadata,
    storageKey,
  };
}

export async function readLocalUpload(storageKey: string) {
  const filePath = localUploadPath(storageKey);
  const [contents, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);

  return {
    contents,
    sizeBytes: fileStat.size,
  };
}

export function isDraftUploadStorageKey(storageKey: string) {
  return storageKey.startsWith("rfq-drafts/");
}

export async function copyLocalUpload(
  storageKey: string,
  metadata: Pick<StoredLocalUpload, "name" | "type">,
  folder = "rfq",
): Promise<StoredLocalUpload> {
  const { contents, sizeBytes } = await readLocalUpload(storageKey);

  return saveLocalUploadBytes(
    {
      name: metadata.name,
      sizeBytes,
      type: metadata.type || "application/octet-stream",
    },
    contents,
    folder,
  );
}
