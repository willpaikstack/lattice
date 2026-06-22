"use client";

import { useEffect, useRef, useState } from "react";

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

async function loadViewerAssets() {
  if (window.Autodesk) {
    return;
  }

  ensureViewerStylesheet();
  await loadViewerScript();
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

export function AutodeskModelViewer({ urn }: { urn: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<AutodeskViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let stopToolbarFilter: (() => void) | null = null;

    async function initializeViewer() {
      try {
        setError(null);
        setIsLoading(true);
        await loadViewerAssets();

        if (!window.Autodesk || !containerRef.current || !isMounted) {
          return;
        }

        const container = containerRef.current;
        await waitForViewerContainerSize(container);

        if (!window.Autodesk || containerRef.current !== container || !isMounted) {
          return;
        }

        window.Autodesk.Viewing.Initializer(
          {
            env: "AutodeskProduction2",
            api: "streamingV2",
            getAccessToken: async (callback) => {
              const response = await fetch("/api/cad-previews/token");
              const payload = await response.json();
              if (!response.ok) {
                throw new Error(payload.error ?? "Unable to get an Autodesk Viewer token.");
              }
              callback(payload.access_token, payload.expires_in);
            },
          },
          () => {
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
                  await fitInitialView(viewer, model);
                  await Promise.all(defaultViewerExtensions.map((extensionId) => loadViewerExtension(viewer, extensionId)));
                  if (containerRef.current) {
                    stopToolbarFilter?.();
                    stopToolbarFilter = scheduleAutodeskToolbarFilter(containerRef.current);
                  }
                  if (!isMounted) {
                    return;
                  }
                  setIsLoading(false);
                }).catch((caught) => {
                  setError(caught instanceof Error ? caught.message : "The translated CAD model could not be loaded.");
                  setIsLoading(false);
                });
              },
              (errorCode, errorMessage) => {
                setError(errorMessage || `The translated CAD model could not be loaded (${errorCode ?? "unknown error"}).`);
                setIsLoading(false);
              },
            );
          },
        );
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load the Autodesk Viewer.");
      }
    }

    void initializeViewer();

    return () => {
      isMounted = false;
      stopToolbarFilter?.();
      viewerRef.current?.finish();
    };
  }, [urn]);

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>;
  }

  return (
    <div className="lattice-cad-viewer relative h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-50" ref={containerRef}>
      {isLoading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">
          Loading interactive CAD preview...
        </div>
      ) : null}
    </div>
  );
}
