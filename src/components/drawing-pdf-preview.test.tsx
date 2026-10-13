import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getDocument: vi.fn(), getPage: vi.fn(), destroy: vi.fn(), render: vi.fn(), workerOptions: { workerSrc: "" } }));
vi.mock("pdfjs-dist", () => ({ getDocument: mocks.getDocument, GlobalWorkerOptions: mocks.workerOptions, version: "test" }));
import { DrawingPdfPreview } from "./drawing-pdf-preview";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(10) }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  mocks.render.mockReturnValue({ promise: Promise.resolve(), cancel: vi.fn() });
  mocks.getPage.mockResolvedValue({ getViewport: ({ scale }: { scale: number }) => ({ width: 400 * scale, height: 500 * scale }), render: mocks.render, getTextContent: async () => ({ items: [{ str: "Drawing dimensions" }] }) });
  mocks.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2, getPage: mocks.getPage }), destroy: mocks.destroy });
});
afterEach(() => vi.unstubAllGlobals());
describe("drawing PDF preview", () => {
  it("loads the authorized file, renders pages and supports navigation", async () => {
    render(<DrawingPdfPreview url="/api/local-files/rfq/drawing.pdf?preview=1" name="drawing.pdf" />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Next" })).toBeEnabled());
    expect(fetch).toHaveBeenCalledWith("/api/local-files/rfq/drawing.pdf?preview=1", expect.objectContaining({ credentials: "same-origin", cache: "no-store" }));
    expect(mocks.getDocument).toHaveBeenCalledWith(expect.objectContaining({ data: expect.any(Uint8Array) }));
    expect(mocks.workerOptions.workerSrc).toBe("/api/pdf-viewer-worker?v=test");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(mocks.getPage).toHaveBeenCalledWith(2));
    expect(screen.getByRole("img", { name: "drawing.pdf, page 2" })).toBeInTheDocument();
  });
  it("shows recovery guidance if the saved drawing cannot be read", async () => {
    mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error("404")), destroy: mocks.destroy });
    render(<DrawingPdfPreview url="/api/local-files/rfq/missing.pdf" name="missing.pdf" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Download the original file");
  });
});
