// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({ access: vi.fn(), read: vi.fn(), save: vi.fn(), inspect: vi.fn() }));
vi.mock("@/lib/request-access-policy", () => ({ canCurrentSessionAccessStorageKey: mocks.access }));
vi.mock("@/lib/local-file-storage", () => ({
  cadThumbnailStorageKey: (key: string) => `derived:${key}`, readLocalUpload: mocks.read,
  saveCadThumbnail: mocks.save, inspectStoredUpload: mocks.inspect,
}));
import { GET, POST } from "./route";
const url = "https://app.test/api/cad-previews/local-thumbnail?storageKey=rfq%2Fowned.step";
function post(body: Uint8Array | string, extraHeaders = {}) {
  return new Request(url, { method: "POST", body: typeof body === "string" ? body : new Uint8Array(body), headers: { "Content-Type": "image/png", ...extraHeaders } });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.access.mockResolvedValue({ authenticated: true, authorized: true });
  mocks.inspect.mockResolvedValue({ sizeBytes: 50 });
  mocks.save.mockResolvedValue(undefined);
});
describe("private local CAD screenshots", () => {
  it.each([false, true])("denies unauthenticated/foreign reads and writes before touching storage (authenticated=%s)", async authenticated => {
    mocks.access.mockResolvedValue({ authenticated, authorized: false });
    expect((await GET(new Request(url))).status).toBe(authenticated ? 404 : 401);
    expect((await POST(post("png"))).status).toBe(authenticated ? 404 : 401);
    expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.inspect).not.toHaveBeenCalled();
  });
  it("serves an existing screenshot only after authorizing the original, without public caching", async () => {
    mocks.read.mockResolvedValue({ contents: Buffer.from("png") });
    const response = await GET(new Request(url));
    expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(mocks.access).toHaveBeenCalledWith("rfq/owned.step");
    expect(mocks.read).toHaveBeenCalledWith("derived:rfq/owned.step");
  });
  it("normalizes a real captured image before writing its private derivative", async () => {
    const png = await sharp({ create: { width: 600, height: 300, channels: 3, background: "#6789ab" } }).png().toBuffer();
    const response = await POST(post(png));
    expect(response.status).toBe(201);
    const [key, image] = mocks.save.mock.calls[0];
    expect(key).toBe("rfq/owned.step");
    expect(await sharp(image).metadata()).toMatchObject({ format: "png", width: 384, height: 384 });
  });
  it("rejects invalid, oversized, and foreign-origin uploads", async () => {
    expect((await POST(post("not a png"))).status).toBe(400);
    expect((await POST(post(new Uint8Array(512 * 1024 + 1)))).status).toBe(413);
    expect((await POST(post("png", { origin: "https://foreign.test" }))).status).toBe(403);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("does not accept derivatives for drawings or path traversal", async () => {
    for (const key of ["rfq/part.pdf", "../private.step", "/private.step"]) {
      expect((await GET(new Request(`${url.split("?")[0]}?${new URLSearchParams({ storageKey: key })}`))).status).toBe(400);
    }
    expect(mocks.access).not.toHaveBeenCalled();
  });
});
