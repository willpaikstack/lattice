import { describe, expect, it } from "vitest";
import { buildDraftRequest } from "./request-model";
import { groupAdminRfqFiles, rfqFileHref } from "./admin-rfq-package";

function request() {
  return buildDraftRequest({ title: "Two parts", lineItems: [{ partName: "A", quantity: 1, material: "Steel" }, { partName: "B", quantity: 2, material: "Aluminum" }], files: [
    { name: "B.step", type: "model/step", sizeBytes: 10, lineItemIndex: 1 },
    { name: "A.pdf", type: "application/pdf", sizeBytes: 10, lineItemIndex: 0 },
    { name: "A.step", type: "model/step", sizeBytes: 10, lineItemIndex: 0 },
    { name: "shared.pdf", type: "application/pdf", sizeBytes: 10 },
    { name: "orphan.step", type: "model/step", sizeBytes: 10, lineItemIndex: 20 },
  ] });
}
describe("admin RFQ part package", () => {
  it("uses saved part indexes even when files arrive in a different order", () => {
    const { parts, unassignedFiles } = groupAdminRfqFiles(request());
    expect(parts[0].files.map(file => file.name)).toEqual(["A.pdf", "A.step"]);
    expect(parts[1].files.map(file => file.name)).toEqual(["B.step"]);
    expect(unassignedFiles.map(file => file.name)).toEqual(["shared.pdf", "orphan.step"]);
  });
  it("does not infer part ownership for legacy records", () => {
    const input = request();
    input.files = input.files.map(file => ({ ...file, lineItemIndex: undefined }));
    expect(groupAdminRfqFiles(input).parts.every(part => part.files.length === 0)).toBe(true);
    expect(groupAdminRfqFiles(input).unassignedFiles).toHaveLength(input.files.length);
  });
  it("encodes saved file keys and names through the authorized download endpoint", () => {
    const file = { ...request().files[0], storageKey: "rfq/test/part #1.step" };
    expect(rfqFileHref(file)).toBe("/api/local-files/rfq/test/part%20%231.step?name=B.step");
    expect(rfqFileHref(file, true)).toContain("preview=1");
    expect(rfqFileHref({ ...file, storageKey: undefined })).toBeNull();
  });
});
