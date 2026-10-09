import { describe, it, expect } from "vitest";
import { bundledFilesByLineItem } from "./document-line-item-details";
import { buildDraftRequest } from "./request-model";
describe("file to part association", () => {
  it("keeps a second part drawing with the second part when the first part has no drawing", () => {
    const request = buildDraftRequest({ buyerCompany: "Test", requesterName: "Test", title: "Two parts", process: "CNC", dueDate: "2026-11-01", lineItems: [{ partName: "A", material: "Steel", quantity: 1 }, { partName: "B", material: "Steel", quantity: 1 }], files: [{ name: "A.step", sizeBytes: 10, type: "model/step", lineItemIndex: 0 }, { name: "B.step", sizeBytes: 10, type: "model/step", lineItemIndex: 1 }, { name: "B.pdf", sizeBytes: 10, type: "application/pdf", lineItemIndex: 1 }] });
    const bundles = bundledFilesByLineItem(request);
    expect(bundles[0].drawingFile).toBeNull(); expect(bundles[1].drawingFile?.name).toBe("B.pdf");
  });
  it("does not guess part ownership for ambiguous legacy drawings", () => {
    const request = buildDraftRequest({ buyerCompany: "Test", requesterName: "Test", title: "Two parts", process: "CNC", dueDate: "2026-11-01", lineItems: [{ partName: "A", material: "Steel", quantity: 1 }, { partName: "B", material: "Steel", quantity: 1 }], files: [{ name: "Unknown.pdf", sizeBytes: 10, type: "application/pdf" }] });
    expect(bundledFilesByLineItem(request).every((bundle) => bundle.drawingFile === null)).toBe(true);
  });
});
