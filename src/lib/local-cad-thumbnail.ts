/** The original file remains the authorization boundary for its derived image. */
export function localCadThumbnailUrl(storageKey: string) {
  return `/api/cad-previews/local-thumbnail?${new URLSearchParams({ storageKey })}`;
}

export async function saveLocalCadThumbnail(storageKey: string, image: Blob, signal?: AbortSignal) {
  const response = await fetch(localCadThumbnailUrl(storageKey), {
    method: "POST", body: image, headers: { "Content-Type": "image/png" }, signal,
  });
  if (!response.ok) throw new Error("Unable to save the part thumbnail.");
}

// Older parts are converted one at a time, releasing geometry before the next
// thumbnail starts. Cancelling a queued row must not leave the queue blocked.
let previousThumbnail: Promise<void> = Promise.resolve();
export async function acquireThumbnailSlot(signal: AbortSignal): Promise<() => void> {
  const previous = previousThumbnail;
  let release!: () => void;
  previousThumbnail = new Promise<void>(resolve => { release = resolve; });
  await previous;
  if (signal.aborted) { release(); signal.throwIfAborted(); }
  return release;
}
