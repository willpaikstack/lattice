import { beforeEach, describe, expect, it, vi } from "vitest";
import { restrictionPolicyVersion } from "@/lib/rfq-manufacturing";

const mocks = vi.hoisted(() => ({ role: vi.fn(), access: vi.fn(), inspect: vi.fn(), open: vi.fn(), start: vi.fn() }));
vi.mock("@/lib/route-authorization", () => ({ requireRouteRole: mocks.role }));
vi.mock("@/lib/request-access-policy", () => ({ canCurrentSessionAccessStorageKey: mocks.access }));
vi.mock("@/lib/local-file-storage", () => ({ inspectStoredUpload: mocks.inspect, openStoredUploadStream: mocks.open }));
vi.mock("@/lib/autodesk-platform-services", () => ({ startCadPreviewFromSource: mocks.start, startCadPreviewTranslation: vi.fn() }));
import { POST } from "./route";

const request = (extra: object = {}) => new Request("http://localhost/api/cad-previews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storageKey: "rfq-drafts/company/part.step", restrictionStatus: "unrestricted", restrictionPolicyVersion, ...extra }) });
describe("CAD preview from saved files", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.role.mockResolvedValue(null); mocks.access.mockResolvedValue({ authorized: true });
    mocks.inspect.mockResolvedValue({ name: "part.step", sizeBytes: 8 * 1024 * 1024 });
    mocks.start.mockResolvedValue({ status: "processing", urn: "translated-urn" });
  });

  it("rejects unauthorized file references before opening or translating them", async () => {
    mocks.access.mockResolvedValue({ authorized: false });
    expect((await POST(request())).status).toBe(404);
    expect(mocks.inspect).not.toHaveBeenCalled(); expect(mocks.open).not.toHaveBeenCalled(); expect(mocks.start).not.toHaveBeenCalled();
  });

  it("rejects restricted packages before touching saved files", async () => {
    expect((await POST(request({ restrictionStatus: "restricted" }))).status).toBe(422);
    expect(mocks.access).not.toHaveBeenCalled(); expect(mocks.start).not.toHaveBeenCalled();
  });

  it("uses actual stored CAD metadata and opens the stream only when Autodesk needs it", async () => {
    const response = await POST(request({ name: "spoof.step", sizeBytes: 1 }));
    expect(response.status).toBe(202);
    expect(mocks.start).toHaveBeenCalledWith(expect.objectContaining({ name: "part.step", size: 8 * 1024 * 1024 }));
    expect(mocks.open).not.toHaveBeenCalled();
    await mocks.start.mock.calls[0][0].openBody();
    expect(mocks.open).toHaveBeenCalledWith("rfq-drafts/company/part.step");
  });

  it("cannot translate a drawing by claiming it is CAD", async () => {
    mocks.inspect.mockResolvedValue({ name: "drawing.pdf", sizeBytes: 100 });
    expect((await POST(request({ name: "spoof.step" }))).status).toBe(400);
    expect(mocks.start).not.toHaveBeenCalled();
  });
});
