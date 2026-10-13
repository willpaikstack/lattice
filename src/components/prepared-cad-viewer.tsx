"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AutodeskModelViewer } from "./autodesk-model-viewer";
import type { CadMetadata } from "@/lib/rfq-manufacturing";

export type PreparedCadModel = { urn: string; metadata?: CadMetadata };
export const PreparedCadViewerContext = createContext<{
  models: PreparedCadModel[];
  attachTarget: (urn: string, target: HTMLDivElement | null) => void;
} | null>(null);

/** The portal container stays identical when it moves from parking to the part card. */
export function PreparedCadModelHost({ urn, target, onMetadata }: {
  urn: string;
  target: HTMLDivElement | null;
  onMetadata: (metadata: CadMetadata) => void;
}) {
  const parkingRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  const attachParking = useCallback((node: HTMLDivElement | null) => {
    parkingRef.current = node;
    if (node && !rootRef.current) { rootRef.current = document.createElement("div"); setPortalRoot(rootRef.current); }
  }, []);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.style.width = "100%";
    root.inert = !target;
    (target ?? parkingRef.current)?.appendChild(root);
    return () => { root.remove(); };
  }, [portalRoot, target]);

  return <>
    <div ref={attachParking} aria-hidden="true" inert className="pointer-events-none fixed left-0 top-0 -z-10 h-80 w-[600px] opacity-0" />
    {portalRoot ? createPortal(<AutodeskModelViewer urn={urn} onMetadata={onMetadata} />, portalRoot) : null}
  </>;
}

function PreparedViewerSlot({ urn, metadata, attachTarget, onMetadata }: {
  urn: string;
  metadata?: CadMetadata;
  attachTarget: (urn: string, target: HTMLDivElement | null) => void;
  onMetadata?: (metadata: CadMetadata) => void;
}) {
  const metadataCallback = useRef(onMetadata);
  useEffect(() => { metadataCallback.current = onMetadata; }, [onMetadata]);
  useEffect(() => { if (metadata) metadataCallback.current?.(metadata); }, [metadata]);
  const attach = useCallback((node: HTMLDivElement | null) => attachTarget(urn, node), [attachTarget, urn]);
  return <div ref={attach} className="min-w-0 h-80" data-prepared-cad-urn={urn} />;
}

export function ReusableCadViewer({ urn, onMetadata }: { urn: string; onMetadata?: (metadata: CadMetadata) => void }) {
  const context = useContext(PreparedCadViewerContext);
  const prepared = context?.models.find(model => model.urn === urn);
  return prepared && context
    ? <PreparedViewerSlot urn={urn} metadata={prepared.metadata} attachTarget={context.attachTarget} onMetadata={onMetadata} />
    : <AutodeskModelViewer urn={urn} onMetadata={onMetadata} />;
}
