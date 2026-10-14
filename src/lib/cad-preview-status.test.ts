import { afterEach, describe, expect, it, vi } from "vitest";
import { refreshCadPreviewState } from "./cad-preview-status";

const processing = { status: "processing" as const, fileName: "part.step", urn: "model-urn", progress: "queued" };
afterEach(() => vi.unstubAllGlobals());
describe("refreshCadPreviewState", () => {
  it("replaces the initial queued state with completed translation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: { status: "ready" } }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await refreshCadPreviewState(processing)).toEqual({ status: "ready", fileName: "part.step", urn: "model-urn" });
    expect(fetchMock).toHaveBeenCalledWith("/api/cad-previews/status?urn=model-urn", { cache: "no-store" });
  });
  it("reads current progress without starting another translation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ preview: { status: "processing", progress: "60% complete" } }) }));
    expect(await refreshCadPreviewState(processing)).toEqual({ ...processing, progress: "60% complete" });
  });
  it("retains the running job on transient status failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    expect(await refreshCadPreviewState(processing)).toEqual(processing);
  });
});
it("recovers a legacy model only by reusing or translating an authorized saved original", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce({ status: 404, ok: false })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ preview: { urn: "secure-new-model" } }) });
  vi.stubGlobal("fetch", fetchMock);
  const recovery = { storageKey: "rfq/owned/part.step", restrictionStatus: "unrestricted", restrictionPolicyVersion: "current" };
  expect(await refreshCadPreviewState(processing, recovery)).toEqual({ ...processing, urn: "secure-new-model", progress: "Preparing a secure preview" });
  expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ ...recovery, reuseExisting: true });
});
it("shows a download fallback rather than polling an unauthorized model indefinitely", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ status: 404, ok: false })));
  expect(await refreshCadPreviewState(processing)).toMatchObject({ status: "reference_only" });
});
