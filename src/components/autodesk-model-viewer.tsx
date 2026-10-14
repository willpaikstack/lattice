"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cadMetadataFromModel, type CadModelGeometry } from "@/lib/cad-model-metadata";
import type { CadMetadata } from "@/lib/rfq-manufacturing";

type AutodeskViewerExtension = {
  activate?: () => boolean | void;
  deactivate?: () => boolean | void;
};

type AutodeskViewerInstance = {
  addEventListener: (eventName: string, callback: () => void) => void;
  fitToView: () => void;
  getExtension?: (extensionId: string) => AutodeskViewerExtension | null;
  start: () => number;
  finish: () => void;
  loadExtension?: (extensionId: string, options?: unknown) => Promise<AutodeskViewerExtension>;
  loadDocumentNode: (document: AutodeskDocument, viewable: unknown) => Promise<unknown>;
  navigation?: {
    getPosition?: () => AutodeskVector3;
    getTarget?: () => AutodeskVector3;
    setPosition?: (position: AutodeskVector3) => void;
  };
  removeEventListener: (eventName: string, callback: () => void) => void;
  resize: () => void;
  setLightPreset?: (preset: number) => void;
  setTheme?: (theme: string) => void;
  waitForLoadDone?: (include: { geometry: boolean; onlyModels: unknown[] }) => Promise<void>;
};

type AutodeskDocument = {
  getRoot: () => {
    getDefaultGeometry: () => unknown;
  };
};

type AutodeskVector3 = {
  x: number;
  y: number;
  z: number;
  add?: (vector: AutodeskVector3) => AutodeskVector3;
  clone?: () => AutodeskVector3;
  multiplyScalar?: (scalar: number) => AutodeskVector3;
  sub?: (vector: AutodeskVector3) => AutodeskVector3;
};

type AutodeskNamespace = {
  Viewing: {
    GEOMETRY_LOADED_EVENT: string;
    Initializer: (
      options: {
        env: string;
        api: string;
        getAccessToken: (callback: (token: string, expiresIn: number) => void) => void;
      },
      callback: () => void,
    ) => void;
    GuiViewer3D: new (element: HTMLElement) => AutodeskViewerInstance;
    Document: {
      load: (urn: string, onSuccess: (document: AutodeskDocument) => void, onError: (errorCode?: number, errorMessage?: string) => void) => void;
    };
  };
};

declare global {
  interface Window {
    Autodesk?: AutodeskNamespace;
  }
}

const viewerVersion = "7.108.0";
const viewerAssetBaseUrl = `https://developer.api.autodesk.com/modelderivative/v2/viewers/${viewerVersion}`;
const defaultViewerExtensions = ["Autodesk.Measure", "Autodesk.Explode", "Autodesk.Section"];
const allowedToolbarControlIds = new Set(["toolbar-measurementSubmenuTool", "toolbar-explodeTool", "toolbar-sectionTool"]);
const allowedToolbarControlIdPrefixes = ["toolbar-sectionTool-"];
let viewerAssetsPromise: Promise<void> | null = null;

function ensureViewerStylesheet() {
  if (document.querySelector(`link[data-autodesk-viewer-version="${viewerVersion}"]`)) {
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.dataset.autodeskViewerVersion = viewerVersion;
  stylesheet.rel = "stylesheet";
  stylesheet.href = `${viewerAssetBaseUrl}/style.min.css`;
  document.head.appendChild(stylesheet);
}

function loadViewerScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.Autodesk) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(`script[data-autodesk-viewer-version="${viewerVersion}"]`);
    const script = existingScript ?? document.createElement("script");
    const timeout = window.setTimeout(() => reject(new Error("Autodesk Viewer took too long to load.")), 20000);
    const finish = () => {
      window.clearTimeout(timeout);
      if (window.Autodesk) {
        resolve();
      } else {
        reject(new Error("Autodesk Viewer loaded, but did not initialize."));
      }
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeout);
        reject(new Error("Unable to load Autodesk Viewer assets."));
      },
      { once: true },
    );

    if (!existingScript) {
      script.dataset.autodeskViewerVersion = viewerVersion;
      script.src = `${viewerAssetBaseUrl}/viewer3D.min.js`;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export function preloadAutodeskViewerAssets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  ensureViewerStylesheet();
  if (window.Autodesk) return Promise.resolve();
  viewerAssetsPromise ??= loadViewerScript().catch((error) => {
    viewerAssetsPromise = null;
    document.querySelector(`script[data-autodesk-viewer-version="${viewerVersion}"]`)?.remove();
    throw error;
  });
  return viewerAssetsPromise;
}

// APS initialization and token refresh are global to the SDK, not per viewer.
// Concurrent Initializer calls can leave one authentication callback unresolved.
let viewerRuntimePromise: Promise<void> | null = null;
let viewerRuntimeModels = "";
const activeModels = new Map<string, number>();

function ensureViewerRuntime(): Promise<void> {
  const urns = [...activeModels.keys()].sort();
  const modelKey = JSON.stringify(urns);
  if (viewerRuntimePromise && viewerRuntimeModels === modelKey) return viewerRuntimePromise;
  const previous = viewerRuntimePromise;
  viewerRuntimeModels = modelKey;
  // Serialize SDK initialization. The new token covers only the mounted models,
  // so adding a second part does not replace the first part's access with a
  // global token or leave it using a token scoped to a different model.
  viewerRuntimePromise = (async () => {
    await previous?.catch(() => {});
    await preloadAutodeskViewerAssets();
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("Autodesk Viewer initialization timed out. Please reopen the preview.")), 30000);
      const fail = (error: unknown) => { window.clearTimeout(timeout); reject(error); };
      try {
        if (!window.Autodesk) throw new Error("Autodesk Viewer is unavailable.");
        window.Autodesk.Viewing.Initializer({
          env: "AutodeskProduction2",
          api: "streamingV2",
          getAccessToken: (callback) => {
            void (async () => {
              const query = new URLSearchParams();
              urns.forEach(urn => query.append("urn", urn));
              const response = await fetch(`/api/cad-previews/token?${query}`, { cache: "no-store" });
              const payload = await response.json();
              if (!response.ok) throw new Error(payload.error ?? "Unable to get an Autodesk Viewer token.");
              callback(payload.access_token, payload.expires_in);
            })().catch(fail);
          },
        }, () => { window.clearTimeout(timeout); resolve(); });
      } catch (error) { fail(error); }
    });
  })().catch(error => { if (viewerRuntimeModels === modelKey) { viewerRuntimePromise = null; viewerRuntimeModels = ""; } throw error; });
  return viewerRuntimePromise;
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}

function hasUsableViewerSize(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  return bounds.width > 20 && bounds.height > 20;
}

function waitForViewerContainerSize(element: HTMLElement) {
  if (hasUsableViewerSize(element)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    let frame = 0;
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("The CAD preview area is not ready yet. Try reopening this line item."));
    }, 5000);

    const observer =
      typeof window.ResizeObserver === "function"
        ? new window.ResizeObserver(() => checkSize())
        : null;

    function cleanup() {
      window.clearTimeout(timeout);
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    }

    function checkSize() {
      if (hasUsableViewerSize(element)) {
        cleanup();
        resolve();
        return;
      }

      frame = window.requestAnimationFrame(checkSize);
    }

    observer?.observe(element);
    checkSize();
  });
}

async function waitForGeometry(viewer: AutodeskViewerInstance, model: unknown) {
  if (viewer.waitForLoadDone) {
    await viewer.waitForLoadDone({ geometry: true, onlyModels: [model] });
    return;
  }

  const geometryLoadedEvent = window.Autodesk?.Viewing.GEOMETRY_LOADED_EVENT;
  if (!geometryLoadedEvent) {
    await waitForNextFrame();
    return;
  }

  await new Promise<void>((resolve) => {
    const fallback = window.setTimeout(resolve, 2500);
    const onGeometryLoaded = () => {
      window.clearTimeout(fallback);
      viewer.removeEventListener(geometryLoadedEvent, onGeometryLoaded);
      resolve();
    };
    viewer.addEventListener(geometryLoadedEvent, onGeometryLoaded);
  });
}

function addInitialCameraPadding(viewer: AutodeskViewerInstance) {
  const position = viewer.navigation?.getPosition?.();
  const target = viewer.navigation?.getTarget?.();

  if (!position || !target || !viewer.navigation?.setPosition) {
    return;
  }

  const { add, clone, multiplyScalar, sub } = position;
  if (clone && sub && multiplyScalar && add) {
    const moved = sub.call(clone.call(position), target);
    const padded = multiplyScalar.call(moved, 1.35);
    viewer.navigation.setPosition(add.call(padded, target));
    return;
  }

  viewer.navigation.setPosition({
    x: target.x + (position.x - target.x) * 1.35,
    y: target.y + (position.y - target.y) * 1.35,
    z: target.z + (position.z - target.z) * 1.35,
  });
}

async function fitInitialView(viewer: AutodeskViewerInstance, model: unknown) {
  await waitForGeometry(viewer, model);
  await waitForNextFrame();
  viewer.resize();
  viewer.fitToView();
  addInitialCameraPadding(viewer);
  await waitForNextFrame();
  viewer.fitToView();
  addInitialCameraPadding(viewer);
}

async function loadViewerExtension(viewer: AutodeskViewerInstance, extensionId: string) {
  const loadedExtension = viewer.getExtension?.(extensionId);

  if (loadedExtension) {
    return loadedExtension;
  }

  if (!viewer.loadExtension) {
    return null;
  }

  try {
    return await viewer.loadExtension(extensionId);
  } catch {
    return null;
  }
}

function filterAutodeskToolbarControls(container: HTMLElement) {
  const toolbar = container.querySelector<HTMLElement>("#guiviewer3d-toolbar");

  if (!toolbar) {
    return;
  }

  const controls = toolbar.querySelectorAll<HTMLElement>(".adsk-button, button");

  controls.forEach((control) => {
    const controlTitle = control.getAttribute("title") ?? control.getAttribute("aria-label") ?? "";
    const shouldKeepControl =
      allowedToolbarControlIds.has(control.id) ||
      allowedToolbarControlIdPrefixes.some((prefix) => control.id.startsWith(prefix)) ||
      controlTitle === "Measure" ||
      controlTitle === "Explode model" ||
      controlTitle === "Section analysis";
    control.style.display = shouldKeepControl ? "" : "none";
  });

  toolbar.querySelectorAll<HTMLElement>(".adsk-control-group, .adsk-toolbar-group, .toolbar-group").forEach((group) => {
    const visibleControls = Array.from(group.querySelectorAll<HTMLElement>(".adsk-button, button")).some((control) => control.style.display !== "none");
    group.style.display = visibleControls ? "" : "none";
  });
}

function scheduleAutodeskToolbarFilter(container: HTMLElement) {
  filterAutodeskToolbarControls(container);

  let attempts = 0;
  const interval = window.setInterval(() => {
    attempts += 1;
    filterAutodeskToolbarControls(container);

    if (attempts >= 28) {
      window.clearInterval(interval);
    }
  }, 250);

  return () => window.clearInterval(interval);
}

export function AutodeskModelViewer({ urn, onMetadata }: { urn: string; onMetadata?: (metadata: CadMetadata) => void }) {
  const viewerInstanceId = useId();
  const metadataCallback = useRef(onMetadata);
  useEffect(() => { metadataCallback.current = onMetadata; }, [onMetadata]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<AutodeskViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    activeModels.set(urn, (activeModels.get(urn) ?? 0) + 1);
    let stopToolbarFilter: (() => void) | null = null;

    async function initializeViewer() {
      try {
        setError(null);
        setIsLoading(true);
        await ensureViewerRuntime();

        if (!window.Autodesk || !containerRef.current || !isMounted) {
          return;
        }

        const container = containerRef.current;
        await waitForViewerContainerSize(container);

        if (!window.Autodesk || containerRef.current !== container || !isMounted) {
          return;
        }

        const viewer = new window.Autodesk.Viewing.GuiViewer3D(container);
        stopToolbarFilter = scheduleAutodeskToolbarFilter(container);
        viewerRef.current = viewer;
        const startCode = viewer.start();

        if (startCode > 0) {
          setError(`Autodesk Viewer failed to start (${startCode}).`);
          setIsLoading(false);
          return;
        }

        viewer.setTheme?.("light-theme");
        viewer.setLightPreset?.(0);

        window.Autodesk.Viewing.Document.load(
          `urn:${urn}`,
          (document) => {
            void viewer.loadDocumentNode(document, document.getRoot().getDefaultGeometry()).then(async (model) => {
              if (!isMounted) {
                return;
              }
              const extensionsLoaded = Promise.all(defaultViewerExtensions.map((extensionId) => loadViewerExtension(viewer, extensionId)));
              await fitInitialView(viewer, model);
              if (!isMounted) return;
              // Geometry is usable now; optional toolbar tools can finish
              // loading after the customer starts inspecting the part.
              setIsLoading(false);
              const metadata = cadMetadataFromModel(model as CadModelGeometry);
              if (metadata) metadataCallback.current?.(metadata);
              await extensionsLoaded;
              if (isMounted && containerRef.current) {
                stopToolbarFilter?.();
                stopToolbarFilter = scheduleAutodeskToolbarFilter(containerRef.current);
              }
            }).catch((caught) => {
              if (!isMounted) return;
              setError(caught instanceof Error ? caught.message : "The translated CAD model could not be loaded.");
              setIsLoading(false);
            });
          },
          (errorCode, errorMessage) => {
            if (!isMounted) return;
            setError(errorMessage || `The translated CAD model could not be loaded (${errorCode ?? "unknown error"}).`);
            setIsLoading(false);
          },
        );

      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load the Autodesk Viewer.");
          setIsLoading(false);
        }
      }
    }

    void initializeViewer();

    return () => {
      isMounted = false;
      const remaining = (activeModels.get(urn) ?? 1) - 1;
      if (remaining > 0) activeModels.set(urn, remaining); else activeModels.delete(urn);
      stopToolbarFilter?.();
      viewerRef.current?.finish();
    };
  }, [urn]);

  useEffect(() => {
    if (isLoading || !containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      viewerRef.current?.resize();
      viewerRef.current?.fitToView();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isLoading]);

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>;
  }

  return (
    <div data-cad-viewer-instance={viewerInstanceId} data-cad-viewer-state={isLoading ? "loading" : "ready"} className="lattice-cad-viewer relative h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-50" ref={containerRef}>
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">
          Loading interactive CAD preview...
        </div>
      ) : null}
    </div>
  );
}
