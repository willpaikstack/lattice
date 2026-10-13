import { beforeEach, describe, expect, it, vi } from "vitest";
import { restrictionPolicyVersion } from "@/lib/rfq-manufacturing";
import { draftUploadFolder } from "@/lib/draft-upload-scope";

const mocks = vi.hoisted(() => ({ session: vi.fn(), prepare: vi.fn(), complete: vi.fn(), save: vi.fn() }));
vi.mock("@/lib/session", () => ({ getCurrentSession: mocks.session }));
vi.mock("@/lib/local-file-storage", () => ({ prepareDirectUpload: mocks.prepare, completeDirectUpload: mocks.complete, saveLocalUpload: mocks.save }));
import { POST } from "./route";

const session = { user: { id: "customer-a", role: "customer", companyId: "company-a" } };
const declaration = { restrictionStatus: "unrestricted", restrictionPolicyVersion };
const jsonRequest = (input: object) => new Request("http://localhost/api/request-draft-files", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...declaration, ...input }) });

describe("draft upload grants and completion", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.session.mockResolvedValue(session); });

  it("requires a customer or admin before issuing an upload URL", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await POST(jsonRequest({ action: "prepare" }))).status).toBe(401);
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it.each(["unsure", "restricted", "unconfirmed"])("blocks %s before issuing an upload URL", async restrictionStatus => {
    expect((await POST(jsonRequest({ action: "prepare", restrictionStatus }))).status).toBe(422);
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it("issues a grant for large files under the authenticated company's folder", async () => {
    const file = { name: "part.step", sizeBytes: 8 * 1024 * 1024, type: "model/step" };
    mocks.prepare.mockResolvedValue({ mode: "direct", storageKey: "signed-key", uploadUrl: "signed-url" });
    const response = await POST(jsonRequest({ action: "prepare", file, storageKey: "rfq-drafts/other-company/file" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.prepare).toHaveBeenCalledWith(file, draftUploadFolder(session));
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    { name: "part.step", sizeBytes: 201 * 1024 * 1024, type: "model/step" },
    { name: "part.pdf", sizeBytes: 201 * 1024 * 1024, type: "application/pdf" },
    { name: "part.step", sizeBytes: -1, type: "model/step" },
    { name: "part.exe", sizeBytes: 5, type: "application/octet-stream" },
  ])("rejects unsupported upload metadata %#", async file => {
    expect((await POST(jsonRequest({ action: "prepare", file }))).status).toBe(400);
    expect(mocks.prepare).not.toHaveBeenCalled();
  });

  it("rejects another company's or traversal completion key before inspecting storage", async () => {
    for (const storageKey of ["rfq-drafts/other-company/part.step", `${draftUploadFolder(session)}/../part.step`]) {
      expect((await POST(jsonRequest({ action: "complete", storageKey }))).status).toBe(404);
    }
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("returns server-verified metadata, ignoring client size and filename claims", async () => {
    const storageKey = `${draftUploadFolder(session)}/part.step`;
    const stored = { name: "part.step", sizeBytes: 8 * 1024 * 1024, storageKey, type: "model/step" };
    mocks.complete.mockResolvedValue(stored);
    const response = await POST(jsonRequest({ action: "complete", storageKey, file: { name: "spoof.pdf", sizeBytes: 1 } }));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ file: stored });
  });

  it("does not confirm incomplete uploads", async () => {
    mocks.complete.mockRejectedValue(new Error("The file upload is incomplete."));
    expect((await POST(jsonRequest({ action: "complete", storageKey: `${draftUploadFolder(session)}/part.step` }))).status).toBe(400);
  });
});
