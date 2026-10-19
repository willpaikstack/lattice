"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import styles from "./admin-rfq-detail.module.css";

export function DrawingPdfPreview({ url, name }: { url: string; name: string }) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(500);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [pageText, setPageText] = useState("");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let loading: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    void import("pdfjs-dist").then(async pdfjs => {
      if (!active) return;
      pdfjs.GlobalWorkerOptions.workerSrc = `/api/pdf-viewer-worker?v=${encodeURIComponent(pdfjs.version)}`;
      const response = await fetch(url, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Drawing file unavailable");
      const data = new Uint8Array(await response.arrayBuffer());
      if (!active) return;
      loading = pdfjs.getDocument({ data, useSystemFonts: true });
      return loading.promise.then(pdf => {
        if (active) setDocument(pdf);
      });
    }).catch(caught => { if (active) { console.error("Drawing preview could not load", caught instanceof Error ? caught.message : "Unknown PDF loading error"); setError("The drawing could not be previewed. Download the original file below to review it."); setBusy(false); } });
    return () => { active = false; controller.abort(); void loading?.destroy(); };
  }, [url]);

  useEffect(() => {
    if (!container.current) return;
    const resize = new ResizeObserver(entries => {
      const next = Math.floor(entries[0].contentRect.width);
      if (next > 0) setWidth(next);
    });
    resize.observe(container.current);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    if (!document || !canvas.current) return;
    let active = true;
    let rendering: RenderTask | undefined;
    const target = canvas.current;
    void document.getPage(pageNumber).then(async page => {
      if (!active) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.max(0.1, (width - 24) / base.width) * zoom });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      target.width = Math.floor(viewport.width * pixelRatio);
      target.height = Math.floor(viewport.height * pixelRatio);
      target.style.width = `${viewport.width}px`;
      target.style.height = `${viewport.height}px`;
      rendering = page.render({ canvas: target, viewport, transform: [pixelRatio, 0, 0, pixelRatio, 0, 0] });
      await rendering.promise;
      const text = await page.getTextContent();
      if (active) { setPageText(text.items.map(item => "str" in item ? item.str : "").join(" ")); setBusy(false); }
    }).catch(() => { if (active) { setError("The drawing page could not be rendered. Download the original file below."); setBusy(false); } });
    return () => { active = false; rendering?.cancel(); };
  }, [document, pageNumber, width, zoom]);

  return <div aria-label={`Drawing preview: ${name}`} className={styles.pdfPreview}>
    <div className={styles.pdfControls}>
      <button type="button" disabled={!document || pageNumber <= 1 || busy} onClick={() => { setBusy(true); setPageNumber(value => value - 1); }}>Previous</button>
      <span>Page {pageNumber} of {document?.numPages ?? "…"}</span>
      <button type="button" disabled={!document || pageNumber >= document.numPages || busy} onClick={() => { setBusy(true); setPageNumber(value => value + 1); }}>Next</button>
      <label>Zoom <select aria-label="Drawing zoom" value={zoom} disabled={!document || busy} onChange={event => { setBusy(true); setZoom(Number(event.target.value)); }}><option value={1}>Fit width</option><option value={1.5}>150%</option><option value={2}>200%</option></select></label>
    </div>
    {error ? <p role="alert" className={styles.empty}>{error}</p> : null}
    {busy && !error ? <p role="status" className={styles.caption}>Loading drawing…</p> : null}
    <div ref={container} className={styles.pdfCanvas}><canvas ref={canvas} role="img" aria-label={`${name}, page ${pageNumber}`} /><p className="sr-only">{pageText}</p></div>
  </div>;
}
