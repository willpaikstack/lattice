// @vitest-environment node
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { completeDirectUpload, openStoredUploadStream, prepareDirectUpload } from "./local-file-storage";

beforeEach(() => {
  vi.stubEnv("LOCAL_FILE_STORAGE_ENABLED", "false");
  vi.stubEnv("S3_ENDPOINT", "https://storage.example.test"); vi.stubEnv("S3_BUCKET", "private-rfq");
  vi.stubEnv("S3_ACCESS_KEY_ID", "synthetic-key"); vi.stubEnv("S3_SECRET_ACCESS_KEY", "synthetic-secret");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

function storage(length = 9) {
  const records = new Map<string, string>();
  const send = vi.spyOn(S3Client.prototype, "send").mockImplementation(async (command: unknown) => {
    if (command instanceof PutObjectCommand) { records.set(command.input.Key!, String(command.input.Body)); return {} as never; }
    if (command instanceof GetObjectCommand) {
      const record = records.get(command.input.Key!);
      if (!record) throw Object.assign(new Error("missing"), { name: "NoSuchKey" });
      return { ContentLength: record.length, Body: { transformToString: async () => record } } as never;
    }
    if (command instanceof HeadObjectCommand) return { ContentLength: length, ContentType: "model/step", Metadata: {} } as never;
    throw new Error("Unexpected storage operation");
  });
  return { records, send };
}

describe("private direct storage", () => {
  it("signs exact length/type while keeping expected metadata out of the browser-editable object", async () => {
    const { records } = storage();
    const upload = await prepareDirectUpload({ name: "part.step", sizeBytes: 9, type: "model/step" }, "rfq-drafts/company");
    if (upload.mode !== "direct") throw new Error("Expected direct upload");
    const signed = new URL(upload.uploadUrl);
    expect(signed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(signed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
    expect(signed.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(signed.searchParams.has("x-amz-meta-lattice-size")).toBe(false);
    expect([...records.keys()][0]).toMatch(/^internal\/upload-intents\/[a-f0-9]{64}\.json$/);
    await expect(completeDirectUpload(upload.storageKey)).resolves.toMatchObject({ name: "part.step", sizeBytes: 9 });
  });

  it("rejects incomplete bytes even when the client claims a different size", async () => {
    storage(8);
    const upload = await prepareDirectUpload({ name: "part.step", sizeBytes: 9, type: "model/step" }, "rfq-drafts/company");
    if (upload.mode !== "direct") throw new Error("Expected direct upload");
    await expect(completeDirectUpload(upload.storageKey)).rejects.toThrow("incomplete");
  });

  it("does not complete an object without a server-written intent", async () => {
    storage(9);
    await expect(completeDirectUpload("rfq-drafts/company/unknown.step")).rejects.toThrow("incomplete");
  });

  it("fails closed when the private intent store is unavailable", async () => {
    vi.spyOn(S3Client.prototype, "send").mockRejectedValue(new Error("Storage unavailable"));
    await expect(completeDirectUpload("rfq-drafts/company/part.step")).rejects.toThrow("Storage unavailable");
  });

  it("returns the object stream without reading the full file into memory", async () => {
    const stream = new ReadableStream<Uint8Array>();
    const body = { transformToWebStream: vi.fn(() => stream), transformToByteArray: vi.fn() };
    vi.spyOn(S3Client.prototype, "send").mockResolvedValue({ Body: body } as never);
    expect(await openStoredUploadStream("rfq-drafts/company/part.step")).toBe(stream);
    expect(body.transformToByteArray).not.toHaveBeenCalled();
  });
});
