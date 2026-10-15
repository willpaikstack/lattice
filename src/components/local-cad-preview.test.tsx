import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { LocalCadPreview } from "./local-cad-preview";
import { loadLocalCadFile } from "@/lib/local-cad-loader";

vi.mock("@/lib/local-cad-loader", () => ({ loadLocalCadFile: vi.fn() }));
vi.mock("next/dynamic", () => ({ default: () => () => <p>Local geometry rendered</p> }));
const model = { dimensionsUnit: "mm" as const, meshes: [{ name: "part", attributes: { position: { array: [0, 0, 0, 20, 0, 0, 0, 10, 5] } }, index: { array: [0, 1, 2] } }] };
beforeEach(() => { vi.mocked(loadLocalCadFile).mockReset(); });
afterEach(() => vi.unstubAllGlobals());

it("renders selected bytes and reports millimeter bounds without contacting a server", async () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  vi.mocked(loadLocalCadFile).mockResolvedValue(model);
  const onMetadata = vi.fn();
  render(<LocalCadPreview name="part.step" file={new File(["solid"], "part.step")} onMetadata={onMetadata} />);
  expect(await screen.findByText("Local geometry rendered")).toBeInTheDocument();
  expect(onMetadata).toHaveBeenCalledWith({ dimensionsMm: [20, 10, 5], sourceUnit: "Not reported; normalized to mm" });
  expect(fetchMock).not.toHaveBeenCalled();
});

it("does not invent millimeter metadata for unitless meshes", async () => {
  vi.mocked(loadLocalCadFile).mockResolvedValue({ ...model, dimensionsUnit: "model units" });
  const onMetadata = vi.fn();
  render(<LocalCadPreview name="part.stl" file={new File(["solid"], "part.stl")} onMetadata={onMetadata} />);
  await screen.findByText("Local geometry rendered");
  expect(onMetadata).not.toHaveBeenCalled();
});

it("reads a saved original through its authorized URL and surfaces access failures", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 })); vi.stubGlobal("fetch", fetchMock);
  render(<LocalCadPreview name="part.glb" url="/api/local-files/rfq/owned/part.glb?read=1" />);
  expect(await screen.findByText(/no longer be available to your account/)).toBeInTheDocument();
  expect(loadLocalCadFile).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith("/api/local-files/rfq/owned/part.glb?read=1", expect.objectContaining({ cache: "no-store" }));
});

it("shows parse errors without an Autodesk retry or any conversion request", async () => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  vi.mocked(loadLocalCadFile).mockRejectedValue(new Error("No viewable geometry was found."));
  render(<LocalCadPreview name="invalid.step" file={new File(["invalid"], "invalid.step")} />);
  expect(await screen.findByText("No viewable geometry was found.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Autodesk/i })).not.toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it("aborts processing on cancellation and releases processing on unmount", async () => {
  vi.mocked(loadLocalCadFile).mockReturnValue(new Promise(() => {}));
  const { unmount } = render(<LocalCadPreview name="part.step" file={new File(["solid"], "part.step")} />);
  await waitFor(() => expect(loadLocalCadFile).toHaveBeenCalled());
  const signal = vi.mocked(loadLocalCadFile).mock.calls[0][1];
  fireEvent.click(screen.getByRole("button", { name: "Cancel preview" }));
  expect(signal.aborted).toBe(true);
  expect(screen.getByText(/original file remains attached/)).toBeInTheDocument();
  unmount();
});
