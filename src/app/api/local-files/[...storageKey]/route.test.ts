import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canCurrentSessionAccessStorageKey: vi.fn(),
  readLocalUpload: vi.fn(),
}));

vi.mock("@/lib/request-access-policy", () => ({
  canCurrentSessionAccessStorageKey: mocks.canCurrentSessionAccessStorageKey,
}));

vi.mock("@/lib/local-file-storage", () => ({
  readLocalUpload: mocks.readLocalUpload,
}));

import { GET } from "./route";

function requestFor(path = "rfq/2026-06-18/part.step") {
  return new Request(`http://localhost/api/local-files/${path}?name=part.step&type=model%2Fstep&preview=1`);
}

function paramsFor(storageKey: string) {
  return {
    params: Promise.resolve({ storageKey: storageKey.split("/") }),
  };
}

describe("local file route authorization", () => {
  beforeEach(() => {
    mocks.canCurrentSessionAccessStorageKey.mockReset();
    mocks.readLocalUpload.mockReset();
  });

  it("returns 401 when there is no authenticated session", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: false, authorized: false });

    const response = await GET(requestFor(), paramsFor("rfq/2026-06-18/part.step"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Authentication required." });
    expect(mocks.readLocalUpload).not.toHaveBeenCalled();
  });

  it("returns 404 for known-but-unauthorized or unknown storage keys", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: false });

    const response = await GET(requestFor(), paramsFor("supplier-quotes/2026-06-18/shop.pdf"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Local file not found" });
    expect(mocks.readLocalUpload).not.toHaveBeenCalled();
  });

  it("serves bytes only after the storage key is authorized", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: true });
    mocks.readLocalUpload.mockResolvedValue({ contents: Buffer.from("step-bytes"), sizeBytes: 10 });

    const response = await GET(requestFor(), paramsFor("rfq/2026-06-18/part.step"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toBe('inline; filename="part.step"');
    expect(response.headers.get("content-length")).toBe("10");
    expect(response.headers.get("content-type")).toBe("model/step");
    await expect(response.text()).resolves.toBe("step-bytes");
    expect(mocks.readLocalUpload).toHaveBeenCalledWith("rfq/2026-06-18/part.step");
  });
});
