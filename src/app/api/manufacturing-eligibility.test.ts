import { beforeEach, describe, expect, it, vi } from "vitest";
import { restrictionPolicyVersion } from "@/lib/rfq-manufacturing";

const mocks = vi.hoisted(() => ({ save: vi.fn(), translate: vi.fn() }));
vi.mock("@/lib/local-file-storage", () => ({ saveLocalUpload: mocks.save }));
vi.mock("@/lib/autodesk-platform-services", () => ({ startCadPreviewTranslation: mocks.translate }));
vi.mock("@/lib/cad-preview-access", () => ({ registerCadPreview: vi.fn(), registeredCadPreviewForSource: vi.fn(async () => null) }));
vi.mock("@/lib/route-authorization", () => ({ requireRouteRole: async () => null }));
vi.mock("@/lib/session", () => ({ getCurrentSession: async () => ({ user: { id: "test", role: "admin" } }) }));

describe("server upload eligibility gates", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each(["restricted", "unsure", "unconfirmed", ""])("blocks %s before storage or translation", async status => {
    const form = new FormData();
    form.set("restrictionStatus", status);
    form.set("restrictionPolicyVersion", restrictionPolicyVersion);
    for (const path of ["./request-draft-files/route", "./cad-previews/route"]) {
      const { POST } = await import(path);
      const response = await POST(new Request("http://localhost/api/upload", { method: "POST", body: form }));
      expect(response.status).toBe(422);
    }
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.translate).not.toHaveBeenCalled();
  });
  it("allows an explicitly eligible CAD upload through both guarded endpoints", async () => {
    const file = new File(["synthetic geometry"], "test.step", { type: "model/step" });
    const form = new FormData(); form.set("file", file);
    form.set("restrictionStatus", "unrestricted"); form.set("restrictionPolicyVersion", restrictionPolicyVersion);
    mocks.save.mockResolvedValue({ storageKey: "rfq-drafts/test/test.step", name: file.name });
    mocks.translate.mockResolvedValue({ status: "processing", urn: "synthetic" });
    const fakeRequest = { formData: async () => form } as Request;
    const storageRoute = await import("./request-draft-files/route");
    const previewRoute = await import("./cad-previews/route");
    expect((await storageRoute.POST(fakeRequest)).status).toBe(201);
    expect((await previewRoute.POST(fakeRequest)).status).toBe(200);
    expect(mocks.save).toHaveBeenCalledOnce(); expect(mocks.translate).not.toHaveBeenCalled();
  });
  it("keeps eligible native formats on Autodesk", async () => {
    const file = new File(["synthetic geometry"], "test.sldprt");
    const form = new FormData(); form.set("file", file);
    form.set("restrictionStatus", "unrestricted"); form.set("restrictionPolicyVersion", restrictionPolicyVersion);
    mocks.translate.mockResolvedValue({ status: "processing", urn: "synthetic" });
    const { POST } = await import("./cad-previews/route");
    expect((await POST({ formData: async () => form } as Request)).status).toBe(202);
    expect(mocks.translate).toHaveBeenCalledWith(file);
  });
  it("rejects an obsolete policy even with a no-restrictions declaration", async () => {
    const form = new FormData();
    form.set("restrictionStatus", "unrestricted"); form.set("restrictionPolicyVersion", "old-policy");
    const { POST } = await import("./cad-previews/route");
    expect((await POST(new Request("http://localhost/api/upload", { method: "POST", body: form }))).status).toBe(422);
    expect(mocks.translate).not.toHaveBeenCalled();
  });
});
