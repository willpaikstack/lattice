import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { CopyObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
