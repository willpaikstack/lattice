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
