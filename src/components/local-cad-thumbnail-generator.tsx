"use client";

import { useEffect, useRef, useState } from "react";
import { localCadFileUrl } from "@/lib/cad-demo";
import { acquireThumbnailSlot, localCadThumbnailUrl } from "@/lib/local-cad-thumbnail";
import { LocalCadPreview } from "./local-cad-preview";

/** Render missing legacy screenshots without retaining models in the RFQ list. */
export default function LocalCadThumbnailGenerator({ name, storageKey, onComplete }: {
  name: string; storageKey: string; onComplete: (saved: boolean) => void;
}) {
  const [active, setActive] = useState(false);
  const complete = useRef(onComplete);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => {
    const abort = new AbortController();
    let release: (() => void) | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    void acquireThumbnailSlot(abort.signal).then(async slot => {
      if (abort.signal.aborted) { slot(); return; }
      release = slot;
      timeout = setTimeout(() => complete.current(false), 150000);
      // Another mounted view may already have captured this part while queued.
      const existing = await fetch(localCadThumbnailUrl(storageKey), { cache: "no-store", signal: abort.signal });
      if (abort.signal.aborted) return;
      if (existing.ok) complete.current(true);
      else if (existing.status === 404) setActive(true);
      else complete.current(false);
    }).catch(() => { if (!abort.signal.aborted) complete.current(false); });
    return () => { abort.abort(); clearTimeout(timeout); release?.(); };
  }, [storageKey]);
  if (!active) return null;
  return <div aria-hidden="true" inert className="pointer-events-none fixed left-[-10000px] top-0 w-[384px]">
    <LocalCadPreview name={name} storageKey={storageKey} url={localCadFileUrl(storageKey, name)}
      onThumbnailSaved={saved => complete.current(saved)} onError={() => complete.current(false)} />
  </div>;
}
