import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { CopyObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type StoredLocalUpload = {
  name: string;
  sizeBytes: number;
  type: string;
  storageKey?: string;
};

const localUploadRoot = path.join(process.cwd(), ".data", "uploads");

type R2Configuration = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  secretAccessKey: string;
};

let r2Client: S3Client | undefined;

function localStorageEnabled() {
  return process.env.LOCAL_FILE_STORAGE_ENABLED === "true" ||
    (process.env.NODE_ENV !== "production" && process.env.LOCAL_FILE_STORAGE_ENABLED !== "false");
}

function r2Configuration(): R2Configuration | null {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accessKeyId, bucket, endpoint, secretAccessKey };
}

function getR2Client(config: R2Configuration) {
  r2Client ??= new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: "auto",
    requestChecksumCalculation: "WHEN_REQUIRED",
  });

  return r2Client;
}

function remoteStorage() {
  if (localStorageEnabled()) {
    return null;
  }

  const config = r2Configuration();

  if (!config) {
    throw new Error("Production file storage is not configured.");
  }

  return { client: getR2Client(config), config };
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
    throw new Error("Invalid file storage key");
  }

  return normalized;
}

function localUploadPath(storageKey: string) {
  const safeKey = assertSafeStorageKey(storageKey);
  const fullPath = path.join(localUploadRoot, safeKey);
  const relative = path.relative(localUploadRoot, fullPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file storage key");
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

// Only a short-lived, object-specific URL leaves the server. The browser sends
// the file bytes to the bucket, with its exact length included in the signature.
export async function prepareDirectUpload(metadata: Omit<StoredLocalUpload, "storageKey">, folder: string) {
  const remote = remoteStorage();
  if (!remote) return { mode: "local" as const };

  const storageKey = path.posix.join(folder, new Date().toISOString().slice(0, 10), `${randomUUID()}-${safeFileName(metadata.name)}`);
  const type = metadata.type || "application/octet-stream";
  // R2 does not persist S3 metadata hoisted into a presigned URL. Keep the
  // expected upload in a server-written record that the signed PUT cannot edit.
  await writePrivateStorageRecord(uploadRecordKey(storageKey), { ...metadata, type, storageKey });
  const uploadUrl = await getSignedUrl(remote.client, new PutObjectCommand({
    Bucket: remote.config.bucket,
    Key: storageKey,
    ContentLength: metadata.sizeBytes,
    ContentType: type,
  }), { expiresIn: 900, signableHeaders: new Set(["content-type", "content-length"]) });

  return { mode: "direct" as const, storageKey, uploadUrl, headers: { "Content-Type": type } };
}

// HEAD avoids downloading large CAD files just to validate or submit a reference.
export async function inspectStoredUpload(storageKey: string) {
  const safeKey = assertSafeStorageKey(storageKey);
  const remote = remoteStorage();
  if (!remote) {
    return { name: path.posix.basename(safeKey), sizeBytes: (await stat(localUploadPath(safeKey))).size, type: "application/octet-stream" };
  }
  const response = await remote.client.send(new HeadObjectCommand({ Bucket: remote.config.bucket, Key: safeKey }));
  const expected = isDraftUploadStorageKey(safeKey) ? await readExpectedUpload(safeKey) : null;
  return {
    name: expected?.name ?? (response.Metadata?.["lattice-name"] ? decodeURIComponent(response.Metadata["lattice-name"]) : path.posix.basename(safeKey)),
    sizeBytes: response.ContentLength ?? 0,
    type: response.ContentType || "application/octet-stream",
    expectedSizeBytes: response.Metadata?.["lattice-size"] ? Number(response.Metadata["lattice-size"]) : undefined,
  };
}

export async function completeDirectUpload(storageKey: string): Promise<StoredLocalUpload> {
  const expected = await readExpectedUpload(storageKey);
  const stored = await inspectStoredUpload(storageKey);
  if (!expected || expected.sizeBytes !== stored.sizeBytes || expected.type !== stored.type || stored.sizeBytes <= 0) {
    throw new Error("The file upload is incomplete. Upload the file again before continuing.");
  }
  return { name: expected.name, sizeBytes: stored.sizeBytes, type: stored.type, storageKey };
}

function uploadRecordKey(storageKey: string) {
  return `internal/upload-intents/${createHash("sha256").update(storageKey).digest("hex")}.json`;
}

async function readExpectedUpload(storageKey: string) {
  const value = await readPrivateStorageRecord(uploadRecordKey(storageKey));
  if (!value || value.storageKey !== storageKey || typeof value.name !== "string" ||
      typeof value.type !== "string" || !Number.isSafeInteger(value.sizeBytes) || Number(value.sizeBytes) <= 0) return null;
  return value as { storageKey: string; name: string; type: string; sizeBytes: number };
}

/** Private server records are never returned through file-download authorization. */
export async function writePrivateStorageRecord(key: string, value: Record<string, unknown>) {
  if (!/^internal\/[a-z-]+\/[a-f0-9]{64}\.json$/.test(key)) throw new Error("Invalid private record key");
  const contents = Buffer.from(JSON.stringify(value));
  if (contents.length > 16384) throw new Error("Private record is too large");
  const remote = remoteStorage();
  if (remote) {
    await remote.client.send(new PutObjectCommand({ Bucket: remote.config.bucket, Key: key, Body: contents, ContentType: "application/json", ContentLength: contents.length }));
  } else {
    const destination = localUploadPath(key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
}

export async function readPrivateStorageRecord(key: string): Promise<Record<string, unknown> | null> {
  if (!/^internal\/[a-z-]+\/[a-f0-9]{64}\.json$/.test(key)) throw new Error("Invalid private record key");
  try {
    const remote = remoteStorage();
    let contents: string;
    if (remote) {
      const result = await remote.client.send(new GetObjectCommand({ Bucket: remote.config.bucket, Key: key }));
      if (!result.Body || Number(result.ContentLength) > 16384) throw new Error("Invalid private record");
      contents = await result.Body.transformToString();
    } else { contents = await readFile(localUploadPath(key), "utf8"); }
    if (contents.length > 16384) throw new Error("Invalid private record");
    const value: unknown = JSON.parse(contents);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid private record");
    return value as Record<string, unknown>;
  } catch (error) {
    if (error && typeof error === "object" && (("code" in error && error.code === "ENOENT") ||
        ("name" in error && ["NoSuchKey", "NotFound"].includes(String(error.name))))) return null;
    throw error; // Storage outages must not turn into successful/unrestricted access.
  }
}

// Stream the saved CAD file to Autodesk without buffering the whole file in a
// function or sending it from the customer a second time.
export async function openStoredUploadStream(storageKey: string): Promise<ReadableStream<Uint8Array>> {
  const safeKey = assertSafeStorageKey(storageKey);
  const remote = remoteStorage();
  if (!remote) return Readable.toWeb(createReadStream(localUploadPath(safeKey))) as ReadableStream<Uint8Array>;
  const response = await remote.client.send(new GetObjectCommand({ Bucket: remote.config.bucket, Key: safeKey }));
  if (!response.Body) throw new Error("Stored file has no contents");
  return response.Body.transformToWebStream();
}

export async function storedUploadDownloadUrl(storageKey: string, contentType: string, contentDisposition: string) {
  const safeKey = assertSafeStorageKey(storageKey);
  const remote = remoteStorage();
  if (!remote) return null;
  return getSignedUrl(remote.client, new GetObjectCommand({
    Bucket: remote.config.bucket,
    Key: safeKey,
    ResponseContentType: contentType,
    ResponseContentDisposition: contentDisposition,
  }), { expiresIn: 300 });
}

async function saveLocalUploadBytes(
  metadata: Omit<StoredLocalUpload, "storageKey">,
  contents: Buffer,
  folder = "rfq",
): Promise<StoredLocalUpload> {
  const today = new Date().toISOString().slice(0, 10);
  const storageKey = path.posix.join(folder, today, `${randomUUID()}-${safeFileName(metadata.name)}`);

  const remote = remoteStorage();

  if (remote) {
    await remote.client.send(
      new PutObjectCommand({
        Body: contents,
        Bucket: remote.config.bucket,
        ContentLength: contents.length,
        ContentType: metadata.type || "application/octet-stream",
        Key: storageKey,
      }),
    );

    return {
      ...metadata,
      storageKey,
    };
  }

  const destination = localUploadPath(storageKey);

  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, contents);

  return {
    ...metadata,
    storageKey,
  };
}

export async function readLocalUpload(storageKey: string) {
  const safeKey = assertSafeStorageKey(storageKey);
  const remote = remoteStorage();

  if (remote) {
    const response = await remote.client.send(
      new GetObjectCommand({
        Bucket: remote.config.bucket,
        Key: safeKey,
      }),
    );

    if (!response.Body) {
      throw new Error("Stored file has no contents");
    }

    const contents = Buffer.from(await response.Body.transformToByteArray());

    return {
      contents,
      sizeBytes: response.ContentLength ?? contents.length,
    };
  }

  const filePath = localUploadPath(safeKey);
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
  const safeKey = assertSafeStorageKey(storageKey);
  const remote = remoteStorage();

  if (remote) {
    const today = new Date().toISOString().slice(0, 10);
    const destinationKey = path.posix.join(folder, today, `${randomUUID()}-${safeFileName(metadata.name)}`);
    const copySource = [remote.config.bucket, ...safeKey.split("/").map(encodeURIComponent)].join("/");
    const sourceMetadata = await remote.client.send(
      new HeadObjectCommand({
        Bucket: remote.config.bucket,
        Key: safeKey,
      }),
    );

    await remote.client.send(
      new CopyObjectCommand({
        Bucket: remote.config.bucket,
        ContentType: metadata.type || "application/octet-stream",
        CopySource: copySource,
        Key: destinationKey,
        MetadataDirective: "REPLACE",
      }),
    );

    return {
      name: metadata.name,
      sizeBytes: sourceMetadata.ContentLength ?? 0,
      storageKey: destinationKey,
      type: metadata.type || "application/octet-stream",
    };
  }

  const { contents, sizeBytes } = await readLocalUpload(safeKey);

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
