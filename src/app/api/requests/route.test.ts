import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { DraftRequestInput } from "@/lib/request-model";

const createSubmittedRequestMock = vi.fn();

vi.mock("@/lib/request-repository", () => ({
  createSubmittedRequest: createSubmittedRequestMock,
  listOperatorRequests: vi.fn(async () => []),
}));

vi.mock("@/lib/account-settings", () => ({
  contactSnapshotFromAccountSettings: vi.fn(() => ({})),
  getAccountSettings: vi.fn(async () => ({})),
}));

const uploadsRoot = path.join(process.cwd(), ".data", "uploads");
let promotedStorageKeys: string[] = [];

describe("requests API file persistence", () => {
  afterEach(async () => {
    createSubmittedRequestMock.mockReset();
    await Promise.all(
      promotedStorageKeys.map((storageKey) =>
        rm(path.join(uploadsRoot, storageKey), { force: true }),
      ),
    );
    promotedStorageKeys = [];
    await rm(path.join(uploadsRoot, "rfq-drafts", "test-route"), {
      force: true,
      recursive: true,
    });
  });

  it("promotes saved draft CAD and drawing files into permanent RFQ storage on submit", async () => {
    const { POST } = await import("./route");
    const draftFolder = path.join(uploadsRoot, "rfq-drafts", "test-route");
    await mkdir(draftFolder, { recursive: true });
    await writeFile(path.join(draftFolder, "plate.step"), "cad-bytes");
    await writeFile(path.join(draftFolder, "plate-drawing.pdf"), "drawing-bytes");

    createSubmittedRequestMock.mockImplementation(async (input: DraftRequestInput) => ({
      id: "req_promoted",
      files: input.files,
    }));

    const input: DraftRequestInput = {
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Plate",
      process: "CNC machining",
      dueDate: "2026-06-20",
      lineItems: [
        {
          partName: "Plate",
          quantity: 1,
          material: "SS 304",
          qualityDocumentation: ["Standard Inspection"],
        },
      ],
      files: [
        {
          name: "plate.step",
          sizeBytes: 9,
          storageKey: "rfq-drafts/test-route/plate.step",
          type: "model/step",
        },
        {
          name: "plate-drawing.pdf",
          sizeBytes: 13,
          storageKey: "rfq-drafts/test-route/plate-drawing.pdf",
          type: "application/pdf",
        },
      ],
    };
    const formData = new FormData();
    formData.append("request", JSON.stringify(input));

    const response = await POST(
      new Request("http://localhost/api/requests", {
        body: formData,
        method: "POST",
      }),
    );

    expect(response.status).toBe(201);
    expect(createSubmittedRequestMock).toHaveBeenCalledOnce();

    const submitted = createSubmittedRequestMock.mock.calls[0][0] as DraftRequestInput;
    promotedStorageKeys = submitted.files.flatMap((file) => file.storageKey ?? []);
    expect(submitted.files).toEqual([
      expect.objectContaining({
        name: "plate.step",
        sizeBytes: 9,
        storageKey: expect.stringMatching(/^rfq\/\d{4}-\d{2}-\d{2}\/.+-plate\.step$/),
        type: "model/step",
      }),
      expect.objectContaining({
        name: "plate-drawing.pdf",
        sizeBytes: 13,
        storageKey: expect.stringMatching(/^rfq\/\d{4}-\d{2}-\d{2}\/.+-plate-drawing\.pdf$/),
        type: "application/pdf",
      }),
    ]);
    expect(submitted.files[0].storageKey).not.toContain("rfq-drafts");
    expect(submitted.files[1].storageKey).not.toContain("rfq-drafts");

    await expect(readFile(path.join(uploadsRoot, submitted.files[0].storageKey!), "utf8")).resolves.toBe("cad-bytes");
    await expect(readFile(path.join(uploadsRoot, submitted.files[1].storageKey!), "utf8")).resolves.toBe("drawing-bytes");
  });
});
