import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { CadUploadPreview } from "./cad-upload-preview";
vi.mock("./local-cad-preview", () => ({ LocalCadPreview: ({ name, url }: { name: string; url?: string }) => <p data-source={url}>Local viewer: {name}</p> }));
vi.mock("./prepared-cad-viewer", () => ({ ReusableCadViewer: () => <p>Autodesk viewer</p> }));
vi.mock("./autodesk-model-viewer", () => ({ preloadAutodeskViewerAssets: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

it.each(["step", "stp", "iges", "igs", "stl", "obj", "gltf", "glb"])("uses saved %s originals locally even when an old APS URN exists", extension => {
  const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
  render(<CadUploadPreview state={{ status: "processing", fileName: `part.${extension}`, urn: "old-aps-urn", progress: "pending" }} onStatus={vi.fn()} recovery={{ storageKey: `rfq/company/part.${extension}` }} />);
  expect(screen.getByText(`Local viewer: part.${extension}`)).toHaveAttribute("data-source", `/api/local-files/rfq/company/part.${extension}?name=part.${extension}&read=1`);
  expect(fetchMock).not.toHaveBeenCalled();
});

it("keeps native formats on the existing Autodesk renderer", () => {
  render(<CadUploadPreview state={{ status: "ready", fileName: "part.sldprt", urn: "native-aps" }} onStatus={vi.fn()} />);
  expect(screen.getByText("Autodesk viewer")).toBeInTheDocument();
});
