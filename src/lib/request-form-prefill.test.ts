import { describe, expect, it } from "vitest";
import { buildDraftRequest } from "./request-model";
import { draftInitialState } from "./request-form-prefill";

describe("saved drawing requirements when resuming an RFQ", () => {
  it("restores selected flags without interpreting prose and supports exact legacy requirement lines", () => {
    const request = buildDraftRequest({ title: "QA flag restoration", lineItems: [{ quantity: 1, material: "6061", notes: "No engineering fits or threads requested; no drawing required.",
      manufacturingDetails: { process: "cnc_milling", customerPartNumber: "", cadRevision: "", drawingRevision: "", materialKey: "", finishKey: "", fileHistory: [], drawingRequirements: { partMarkings: true, threads: false } } }],
      files: [{ name: "part.step", sizeBytes: 10, type: "model/step", lineItemIndex: 0 }] });
    expect(draftInitialState(request).lineItems?.[0]).toMatchObject({ partMarkings: true, threads: false, engineeringFits: false });
    delete request.lineItems[0].manufacturingDetails!.drawingRequirements;
    expect(draftInitialState(request).lineItems?.[0]).toMatchObject({ partMarkings: false, threads: false, engineeringFits: false });
    request.lineItems[0].notes += "\nThreads requested; drawing required.";
    expect(draftInitialState(request).lineItems?.[0].threads).toBe(true);
  });
});
