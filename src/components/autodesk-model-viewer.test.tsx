import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AutodeskModelViewer, preloadAutodeskViewerAssets } from "./autodesk-model-viewer";

afterEach(() => {
  cleanup(); delete window.Autodesk; vi.restoreAllMocks();
  document.querySelectorAll("[data-autodesk-viewer-version]").forEach(element => element.remove());
});

describe("CAD viewer startup", () => {
  it("shares an in-flight asset preload across parts", async () => {
    const first = preloadAutodeskViewerAssets();
    const second = preloadAutodeskViewerAssets();
    expect(first).toBe(second);
    expect(document.querySelectorAll("script[data-autodesk-viewer-version]")).toHaveLength(1);
    Object.defineProperty(window, "Autodesk", { configurable: true, writable: true, value: {} });
    document.querySelector("script[data-autodesk-viewer-version]")!.dispatchEvent(new Event("load"));
    await first;
  });

  it("reveals fitted geometry even while all optional toolbar tools are pending", async () => {
    const finish = vi.fn();
    const extension = new Promise(() => {});
    const loadExtension = vi.fn(() => extension);
    class Viewer {
      start = () => 0;
      finish = finish;
      resize = vi.fn();
      fitToView = vi.fn();
      waitForLoadDone = async () => {};
      loadDocumentNode = async () => ({});
      loadExtension = loadExtension;
    }
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 600, height: 320, left: 0, top: 0, right: 600, bottom: 320, x: 0, y: 0, toJSON: () => ({}) });
    Object.defineProperty(window, "Autodesk", { configurable: true, writable: true, value: {
      Viewing: {
        Initializer: (_options: unknown, ready: () => void) => ready(), GuiViewer3D: Viewer,
        Document: { load: (_urn: string, success: (doc: unknown) => void) => success({ getRoot: () => ({ getDefaultGeometry: () => ({}) }) }) },
      },
    } });
    const view = render(<AutodeskModelViewer urn="synthetic-urn" />);
    expect(screen.getByText("Loading interactive CAD preview...")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Loading interactive CAD preview...")).not.toBeInTheDocument());
    expect(loadExtension).toHaveBeenCalledTimes(3);
    view.unmount(); expect(finish).toHaveBeenCalledOnce();
  });
});
