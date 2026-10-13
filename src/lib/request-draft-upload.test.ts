import { afterEach, describe, expect, it, vi } from "vitest";
import { uploadRequestDraftFile } from "./request-draft-upload";

const declaration = { restrictionStatus: "unrestricted", restrictionPolicyVersion: "current-policy" };
const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status });
afterEach(() => vi.unstubAllGlobals());

describe("direct draft upload", () => {
  it("sends a large file only to storage and returns a verified reference", async () => {
    const file = new File([new Uint8Array(8 * 1024 * 1024)], "large.step", { type: "model/step" });
    const stored = { name: file.name, sizeBytes: file.size, storageKey: "rfq-drafts/company/large.step", type: file.type };
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ upload: { mode: "direct", uploadUrl: "https://storage.example/signed", storageKey: stored.storageKey, headers: { "Content-Type": file.type } } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 })).mockResolvedValueOnce(json({ file: stored }, 201));
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadRequestDraftFile(file, declaration)).resolves.toEqual(stored);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://storage.example/signed", expect.objectContaining({ method: "PUT", body: file, credentials: "omit" }));
    const prepare = JSON.parse(fetchMock.mock.calls[0][1].body);
    const complete = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(prepare).toMatchObject({ action: "prepare", file: { sizeBytes: file.size }, ...declaration });
    expect(complete).toEqual({ action: "complete", storageKey: stored.storageKey, ...declaration });
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/request-draft-files").every(([, init]) => typeof init.body === "string")).toBe(true);
  });

  it("keeps development local uploads after the server explicitly selects local mode", async () => {
    const file = new File(["cad"], "part.step");
    const stored = { name: file.name, sizeBytes: file.size, storageKey: "rfq-drafts/local/part.step", type: "model/step" };
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ upload: { mode: "local" } })).mockResolvedValueOnce(json({ file: stored }, 201));
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadRequestDraftFile(file, declaration)).resolves.toEqual(stored);
    const form = fetchMock.mock.calls[1][1].body as FormData;
    expect(form.get("file")).toBe(file);
    expect(form.get("restrictionStatus")).toBe("unrestricted");
  });

  it("does not upload when eligibility is rejected", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ error: "Confirm eligibility" }, 422));
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadRequestDraftFile(new File(["cad"], "part.step"), declaration)).rejects.toThrow("Confirm eligibility");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("does not fall back to app-server file uploads after storage fails", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ upload: { mode: "direct", uploadUrl: "https://storage.example/signed", storageKey: "draft/part.step" } }))
      .mockRejectedValue(new TypeError("Network unavailable"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadRequestDraftFile(new File(["cad"], "part.step"), declaration)).rejects.toThrow("Network unavailable");
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/request-draft-files")).toHaveLength(1);
  });

  it("does not expose a usable reference until the server confirms storage", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(json({ upload: { mode: "direct", uploadUrl: "https://storage.example/signed", storageKey: "draft/part.step" } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 })).mockResolvedValueOnce(json({ error: "Upload incomplete" }, 400));
    vi.stubGlobal("fetch", fetchMock);
    await expect(uploadRequestDraftFile(new File(["cad"], "part.step"), declaration)).rejects.toThrow("Upload incomplete");
  });
});
