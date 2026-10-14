// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getViewerToken, startCadPreviewFromSource } from "./autodesk-platform-services";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe("Autodesk saved-file transfer", () => {
  it("streams the stored file with its exact length and requests the existing SVF2 format", async () => {
    vi.stubEnv("APS_CLIENT_ID", "synthetic-client"); vi.stubEnv("APS_CLIENT_SECRET", "synthetic-secret"); vi.stubEnv("APS_BUCKET_KEY", "synthetic-bucket");
    const json = (body: object) => new Response(JSON.stringify(body), { status: 200 });
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ access_token: "synthetic-token", expires_in: 3600 }))
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({ urls: ["https://aps-storage.example/upload"], uploadKey: "synthetic-upload" }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(json({ objectId: "synthetic-object" }))
      .mockResolvedValueOnce(json({}));
    vi.stubGlobal("fetch", fetchMock);
    const stream = new ReadableStream<Uint8Array>();
    const openBody = vi.fn(async () => stream);
    await expect(startCadPreviewFromSource({ name: "part.step", size: 8 * 1024 * 1024, openBody })).resolves.toMatchObject({ status: "processing" });
    expect(openBody).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenNthCalledWith(4, "https://aps-storage.example/upload", expect.objectContaining({ body: stream, duplex: "half", headers: { "Content-Length": String(8 * 1024 * 1024) } }));
    expect(JSON.parse(fetchMock.mock.calls[5][1].body).output.formats[0].type).toBe("svf2");
  });
});

const urn = (key: string) => Buffer.from(`urn:adsk.objects:os.object:synthetic-bucket/${key}`).toString("base64").replace(/=+$/, "");
it("mints only resource-scoped viewer tokens, never a broad read token", async () => {
  vi.stubEnv("APS_CLIENT_ID", "synthetic-client"); vi.stubEnv("APS_CLIENT_SECRET", "synthetic-secret"); vi.stubEnv("APS_BUCKET_KEY", "synthetic-bucket");
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ access_token: "scoped", expires_in: 3600 })));
  vi.stubGlobal("fetch", fetchMock);
  await getViewerToken([urn("one.step"), urn("two.step")]);
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  const scope = (call[1].body as URLSearchParams).get("scope");
  expect(scope).toBe("data:read:urn:adsk.objects:os.object:synthetic-bucket/one.step data:read:urn:adsk.objects:os.object:synthetic-bucket/two.step");
  await expect(getViewerToken([])).rejects.toThrow();
  await expect(getViewerToken([urn("one.step viewables:read")])).rejects.toThrow("Invalid");
  expect(fetchMock).toHaveBeenCalledOnce();
});
