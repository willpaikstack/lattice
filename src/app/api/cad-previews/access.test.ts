// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ role: vi.fn(), access: vi.fn(), token: vi.fn(), status: vi.fn(), thumbnail: vi.fn() }));
vi.mock("@/lib/route-authorization", () => ({ requireRouteRole: mocks.role }));
vi.mock("@/lib/cad-preview-access", () => ({ canCurrentSessionAccessCadPreview: mocks.access }));
vi.mock("@/lib/autodesk-platform-services", () => ({ getViewerToken: mocks.token, getCadPreviewStatus: mocks.status, getCadPreviewThumbnail: mocks.thumbnail }));
import { GET as token } from "./token/route";
import { GET as status } from "./status/route";
import { GET as thumbnail } from "./thumbnail/route";
beforeEach(() => { vi.clearAllMocks(); mocks.role.mockResolvedValue(null); mocks.access.mockResolvedValue(false); });
describe("CAD derivative authorization", () => {
  it.each([["token", token], ["status", status], ["thumbnail", thumbnail]] as const)("denies foreign %s before any provider request", async (name, get) => {
    expect((await get(new Request("https://app.test/api/cad-previews/"+name+"?urn=foreign"))).status).toBe(404);
    expect(mocks.token).not.toHaveBeenCalled(); expect(mocks.status).not.toHaveBeenCalled(); expect(mocks.thumbnail).not.toHaveBeenCalled();
  });
  it("refuses an unscoped token and a group containing even one foreign model", async () => {
    expect((await token(new Request("https://app.test/api/cad-previews/token"))).status).toBe(400);
    mocks.access.mockImplementation(async urn => urn === "owned");
    expect((await token(new Request("https://app.test/api/cad-previews/token?urn=owned&urn=foreign"))).status).toBe(404);
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it("issues a non-cacheable token only for the authorized model group", async () => {
    mocks.access.mockResolvedValue(true); mocks.token.mockResolvedValue({ access_token: "test-only", expires_in: 3600 });
    const r = await token(new Request("https://app.test/api/cad-previews/token?urn=one&urn=two"));
    expect(r.status).toBe(200); expect(r.headers.get("cache-control")).toBe("no-store");
    expect(mocks.token).toHaveBeenCalledWith(["one", "two"]);
  });
});
