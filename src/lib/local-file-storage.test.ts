import { rm } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { copyLocalUpload, isDraftUploadStorageKey, readLocalUpload, saveLocalUpload } from "./local-file-storage";

const uploadsRoot = path.join(process.cwd(), ".data", "uploads");
const storedKeys: string[] = [];

describe("local file storage", () => {
  afterEach(async () => {
    await Promise.all(
      storedKeys.splice(0).map((storageKey) =>
        rm(path.join(uploadsRoot, storageKey), { force: true }),
      ),
    );
  });

  it("stores upload bytes under a scoped sanitized key", async () => {
    const file = new File(["cad-bytes"], "../spacer bracket 😅.step", { type: "model/step" });

    const stored = await saveLocalUpload(file, "qc-tests");

    expect(stored.storageKey).toMatch(/^qc-tests\/\d{4}-\d{2}-\d{2}\//);
    expect(path.posix.basename(stored.storageKey!)).not.toContain("/");
    expect(path.posix.basename(stored.storageKey!)).not.toContain("😅");
    storedKeys.push(stored.storageKey!);

    await expect(readLocalUpload(stored.storageKey!)).resolves.toMatchObject({
      contents: Buffer.from("cad-bytes"),
      sizeBytes: 9,
    });
  });

  it("rejects traversal storage keys", async () => {
    await expect(readLocalUpload("../secrets.env")).rejects.toThrow("Invalid file storage key");
    await expect(copyLocalUpload("/tmp/secrets.env", { name: "secret.step", type: "model/step" })).rejects.toThrow("Invalid file storage key");
  });

  it("detects draft upload namespaces before RFQ submission promotion", () => {
    expect(isDraftUploadStorageKey("rfq-drafts/2026-06-18/part.step")).toBe(true);
    expect(isDraftUploadStorageKey("rfq/2026-06-18/part.step")).toBe(false);
    expect(isDraftUploadStorageKey("supplier-quotes/2026-06-18/shop.pdf")).toBe(false);
  });
});
