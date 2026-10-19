import { afterEach, expect, it, vi } from "vitest";
import { acquireThumbnailSlot, localCadThumbnailUrl, saveLocalCadThumbnail } from "./local-cad-thumbnail";
afterEach(() => vi.unstubAllGlobals());
it("serializes backfills and releases a cancelled queued row for the next part", async () => {
  const first = await acquireThumbnailSlot(new AbortController().signal);
  const cancelled = new AbortController();
  const second = acquireThumbnailSlot(cancelled.signal).catch(error => error.name);
  let thirdActive = false;
  const third = acquireThumbnailSlot(new AbortController().signal).then(release => { thirdActive = true; return release; });
  await Promise.resolve(); expect(thirdActive).toBe(false);
  cancelled.abort(); first();
  expect(await second).toBe("AbortError");
  const release = await third; expect(thirdActive).toBe(true); release();
});
it("encodes original-file references and reports unsuccessful screenshot saves", async () => {
  expect(localCadThumbnailUrl("rfq/part & revision.step")).toContain("storageKey=rfq%2Fpart+%26+revision.step");
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(saveLocalCadThumbnail("rfq/part.step", new Blob(["image"]))).rejects.toThrow("Unable to save");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("storageKey=rfq%2Fpart.step"), expect.objectContaining({ method: "POST", headers: { "Content-Type": "image/png" } }));
});
