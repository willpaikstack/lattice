// @vitest-environment node
import { S3Client } from "@aws-sdk/client-s3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { completeDirectUpload, openStoredUploadStream, prepareDirectUpload } from "./local-file-storage";

beforeEach(() => {
  vi.stubEnv("LOCAL_FILE_STORAGE_ENABLED", "false");
  vi.stubEnv("S3_ENDPOINT", "https://storage.example.test"); vi.stubEnv("S3_BUCKET", "private-rfq");
  vi.stubEnv("S3_ACCESS_KEY_ID", "synthetic-key"); vi.stubEnv("S3_SECRET_ACCESS_KEY", "synthetic-secret");
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("private direct storage", () => {
  it("signs the exact length, content type and original metadata for one new object", async () => {
    const send = vi.spyOn(S3Client.prototype, "send");
    const upload = await prepareDirectUpload({ name: "part.step", sizeBytes: 8 * 1024 * 1024, type: "model/step" }, "rfq-drafts/company");
    expect(upload.mode).toBe("direct");
    if (upload.mode !== "direct") throw new Error("Expected direct upload");
    const signed = new URL(upload.uploadUrl);
    expect(upload.storageKey).toMatch(/^rfq-drafts\/company\/\d{4}-\d{2}-\d{2}\/.+-part\.step$/);
    expect(signed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-length");
    expect(signed.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
    expect(signed.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(signed.searchParams.get("x-amz-meta-lattice-size")).toBe(String(8 * 1024 * 1024));
    expect(send).not.toHaveBeenCalled();
  });

  it("checks stored length against signed metadata before completing an upload", async () => {
    const send = vi.spyOn(S3Client.prototype, "send").mockResolvedValue({ ContentLength: 8, ContentType: "model/step", Metadata: { "lattice-name": "part.step", "lattice-size": "9" } } as never);
    await expect(completeDirectUpload("rfq-drafts/company/part.step")).rejects.toThrow("incomplete");
    send.mockResolvedValue({ ContentLength: 9, ContentType: "model/step", Metadata: { "lattice-name": "part.step", "lattice-size": "9" } } as never);
    await expect(completeDirectUpload("rfq-drafts/company/part.step")).resolves.toMatchObject({ name: "part.step", sizeBytes: 9 });
  });

  it("returns the object stream without reading the full file into memory", async () => {
    const stream = new ReadableStream<Uint8Array>();
    const body = { transformToWebStream: vi.fn(() => stream), transformToByteArray: vi.fn() };
    vi.spyOn(S3Client.prototype, "send").mockResolvedValue({ Body: body } as never);
    expect(await openStoredUploadStream("rfq-drafts/company/part.step")).toBe(stream);
    expect(body.transformToByteArray).not.toHaveBeenCalled();
  });
});
