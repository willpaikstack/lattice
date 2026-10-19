import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  canCurrentSessionAccessStorageKey: vi.fn(),
  readLocalUpload: vi.fn(),
  storedUploadDownloadUrl: vi.fn(),
  inspectStoredUpload: vi.fn(),
  openStoredUploadStream: vi.fn(),
}));

vi.mock("@/lib/request-access-policy", () => ({
  canCurrentSessionAccessStorageKey: mocks.canCurrentSessionAccessStorageKey,
}));

vi.mock("@/lib/local-file-storage", () => ({
  readLocalUpload: mocks.readLocalUpload,
  storedUploadDownloadUrl: mocks.storedUploadDownloadUrl,
  inspectStoredUpload: mocks.inspectStoredUpload,
  openStoredUploadStream: mocks.openStoredUploadStream,
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
    mocks.storedUploadDownloadUrl.mockReset().mockResolvedValue(null);
    mocks.inspectStoredUpload.mockReset().mockResolvedValue({ sizeBytes: 9 });
    mocks.openStoredUploadStream.mockReset().mockImplementation(async () => new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode("%PDF-test")); controller.close(); } }));
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
    await expect(response.json()).resolves.toEqual({ error: "File not found" });
    expect(mocks.readLocalUpload).not.toHaveBeenCalled();
  });

  it("serves bytes only after the storage key is authorized", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: true });
    mocks.readLocalUpload.mockResolvedValue({ contents: Buffer.from("step-bytes"), sizeBytes: 10 });

    const response = await GET(requestFor(), paramsFor("rfq/2026-06-18/part.step"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain('attachment; filename="part.step"');
    expect(response.headers.get("content-length")).toBe("10");
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    await expect(response.text()).resolves.toBe("step-bytes");
    expect(mocks.readLocalUpload).toHaveBeenCalledWith("rfq/2026-06-18/part.step");
  });

  it("streams authorized CAD reads on the app origin instead of redirecting the viewer", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: true });
    const response = await GET(new Request("http://localhost/api/local-files/rfq/test/part.glb?name=part.glb&read=1"), paramsFor("rfq/test/part.glb"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.storedUploadDownloadUrl).not.toHaveBeenCalled();
    expect(mocks.openStoredUploadStream).toHaveBeenCalledWith("rfq/test/part.glb");
  });

  it("denies CAD reads for another company before touching private storage", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: false });
    const response = await GET(new Request("http://localhost/api/local-files/rfq/test/part.glb?read=1"), paramsFor("rfq/test/part.glb"));
    expect(response.status).toBe(404);
    expect(mocks.inspectStoredUpload).not.toHaveBeenCalled();
    expect(mocks.openStoredUploadStream).not.toHaveBeenCalled();
  });

  it("serves authorized PDF drawing bytes with private caching and sandbox protection", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: true });
    mocks.readLocalUpload.mockResolvedValue({ contents: Buffer.from("%PDF-test"), sizeBytes: 9 });
    const response = await GET(new Request("http://localhost/api/local-files/rfq/test/drawing.pdf?name=drawing.pdf&preview=1"), paramsFor("rfq/test/drawing.pdf"));
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("inline;");
    expect(response.headers.get("content-security-policy")).toBe("sandbox");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("%PDF-test");
    expect(mocks.storedUploadDownloadUrl).not.toHaveBeenCalled();
    expect(mocks.openStoredUploadStream).toHaveBeenCalledWith("rfq/test/drawing.pdf");
  });

  it("never opens the PDF stream for a foreign company", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: false });
    const response = await GET(new Request("http://localhost/api/local-files/rfq/test/drawing.pdf?preview=1"), paramsFor("rfq/test/drawing.pdf"));
    expect(response.status).toBe(404);
    expect(mocks.inspectStoredUpload).not.toHaveBeenCalled();
    expect(mocks.openStoredUploadStream).not.toHaveBeenCalled();
  });

  it("redirects authorized large-file downloads to private storage without reading bytes", async () => {
    mocks.canCurrentSessionAccessStorageKey.mockResolvedValue({ authenticated: true, authorized: true });
    mocks.storedUploadDownloadUrl.mockResolvedValue("https://storage.example/short-lived-download");
    const response = await GET(requestFor(), paramsFor("rfq/2026-06-18/part.step"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://storage.example/short-lived-download");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.readLocalUpload).not.toHaveBeenCalled();
  });
});
