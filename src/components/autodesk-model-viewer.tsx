"use client";

import { useEffect, useRef, useState } from "react";

type AutodeskViewerInstance = {
  start: () => number;
  finish: () => void;
  loadDocumentNode: (document: AutodeskDocument, viewable: unknown) => Promise<unknown>;
};

type AutodeskDocument = {
  getRoot: () => {
    getDefaultGeometry: () => unknown;
  };
};

type AutodeskNamespace = {
  Viewing: {
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
      load: (urn: string, onSuccess: (document: AutodeskDocument) => void, onError: () => void) => void;
    };
  };
};

declare global {
  interface Window {
    Autodesk?: AutodeskNamespace;
  }
}

function loadExternalAsset(element: HTMLScriptElement | HTMLLinkElement) {
  return new Promise<void>((resolve, reject) => {
    element.addEventListener("load", () => resolve(), { once: true });
    element.addEventListener("error", () => reject(new Error("Unable to load Autodesk Viewer assets")), { once: true });
    document.head.appendChild(element);
  });
}

async function loadViewerAssets() {
  if (window.Autodesk) {
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css";

  const script = document.createElement("script");
  script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js";
  script.async = true;

  await loadExternalAsset(stylesheet);
  await loadExternalAsset(script);
}

export function AutodeskModelViewer({ urn }: { urn: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<AutodeskViewerInstance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initializeViewer() {
      try {
        await loadViewerAssets();

        if (!window.Autodesk || !containerRef.current || !isMounted) {
          return;
        }

        window.Autodesk.Viewing.Initializer(
          {
            env: "AutodeskProduction2",
            api: "streamingV2",
            getAccessToken: async (callback) => {
              const response = await fetch("/api/cad-previews/token");
              const payload = await response.json();
              callback(payload.access_token, payload.expires_in);
            },
          },
          () => {
            if (!window.Autodesk || !containerRef.current || !isMounted) {
              return;
            }

            const viewer = new window.Autodesk.Viewing.GuiViewer3D(containerRef.current);
            viewerRef.current = viewer;
            viewer.start();

            window.Autodesk.Viewing.Document.load(
              `urn:${urn}`,
              (document) => {
                void viewer.loadDocumentNode(document, document.getRoot().getDefaultGeometry());
              },
              () => {
                setError("The translated CAD model could not be loaded.");
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
      viewerRef.current?.finish();
    };
  }, [urn]);

  if (error) {
    return <p className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p>;
  }

  return <div className="h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-950" ref={containerRef} />;
}
