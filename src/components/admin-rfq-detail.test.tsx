import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDraftRequest, submitDraftRequest } from "@/lib/request-model";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("next/dynamic", () => ({ default: () => ({ url, name }: { url?: string; name?: string }) => url ? <div data-testid="pdf-preview" aria-label={`Drawing preview: ${name}`} data-source={url} /> : <p>CAD viewer</p> }));
import { AdminRfqDetail } from "./admin-rfq-detail";
afterEach(() => vi.unstubAllGlobals());
function request() {
  const input = submitDraftRequest(buildDraftRequest({ title: "Multi-part RFQ", process: "CNC milling", lineItems: [
    { partName: "Steel bracket", quantity: 3, material: "304 Stainless Steel", generalTolerance: "ISO 2768 Medium", surfaceFinish: "As machined", qualityDocumentation: ["CMM Inspection Report"], notes: "Threads M6 per drawing.\nMark serial number.", manufacturingDetails: { process: "cnc_milling", materialKey: "ss_304", finishKey: "as_machined", targetShipDate: "2026-11-01", customerPartNumber: "", cadRevision: "", drawingRevision: "", fileHistory: [] } },
    { partName: "Aluminum plate", quantity: 5, material: "6061 Aluminum", notes: "Do not deburr sealing face." },
  ], files: [
    { name: "plate.step", type: "model/step", sizeBytes: 10, storageKey: "rfq/test/plate.step", lineItemIndex: 1 },
    { name: "bracket.step", type: "model/step", sizeBytes: 10, storageKey: "rfq/test/bracket.step", lineItemIndex: 0 },
    { name: "bracket.pdf", type: "application/pdf", sizeBytes: 10, storageKey: "rfq/test/bracket.pdf", lineItemIndex: 0 },
  ] }));
  return { ...input, id: "req_detail" };
}
describe("AdminRfqDetail", () => {
  it("retries the selected saved original and explains an Autodesk capacity refusal", async () => {
    const input = request();
    input.intakeDeclaration = { restrictionStatus: "unrestricted", policyVersion: "overseas-intake-2026-10-12", endUse: "prototype", endUseNotes: "" };
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ error: "Autodesk conversion capacity is unavailable." }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<AdminRfqDetail request={input} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry CAD preview" }));
    expect(await screen.findByText("Autodesk conversion capacity is unavailable.")).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toMatchObject({ storageKey: "rfq/test/bracket.step", restrictionStatus: "unrestricted", reuseExisting: true });
    expect(screen.getByRole("link", { name: "bracket.step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry CAD preview" })).toBeEnabled();
  });
  it("shows saved manufacturing requirements, full notes and the correct file for each part", () => {
    render(<AdminRfqDetail request={request()} />);
    expect(screen.getByText("304 Stainless Steel")).toBeInTheDocument();
    expect(screen.getByText("CMM Inspection Report")).toBeInTheDocument();
    expect(screen.getByText("2026-11-01")).toBeInTheDocument();
    expect(screen.getByText(/Threads M6 per drawing/)).toHaveTextContent("Mark serial number.");
    expect(screen.getByRole("link", { name: "bracket.step" })).toHaveAttribute("href", "/api/local-files/rfq/test/bracket.step?name=bracket.step");
    fireEvent.click(screen.getByRole("button", { name: /Drawing · bracket.pdf/ }));
    expect(screen.getByTestId("pdf-preview")).toHaveAttribute("data-source", "/api/local-files/rfq/test/bracket.pdf?name=bracket.pdf&preview=1");
    fireEvent.click(screen.getByRole("button", { name: /Aluminum plate/ }));
    expect(screen.getByText("6061 Aluminum")).toBeInTheDocument();
    expect(screen.getByText("Do not deburr sealing face.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "bracket.step" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "plate.step" })).toBeInTheDocument();
  });
  it("keeps missing file ownership explicit instead of showing another part's CAD", () => {
    const input = request();
    input.files = input.files.map(file => ({ ...file, lineItemIndex: undefined }));
    render(<AdminRfqDetail request={input} />);
    expect(screen.getByRole("heading", { name: "Shared RFQ files" })).toBeInTheDocument();
    expect(screen.getByText(/No files have a saved association/)).toBeInTheDocument();
  });
});
