import { describe, expect, it } from "vitest";

import { buildDraftRequest, submitDraftRequest } from "./request-model";
import { getOperatorQueueRequests, sortRequestsNewestFirst } from "./request-queue";

describe("request queue", () => {
  it("shows submitted buyer requests in the operator queue and hides drafts", () => {
    const submitted = submitDraftRequest(
      buildDraftRequest({
        buyerCompany: "Amogy Manufacturing",
        requesterName: "William Paik",
        title: "Submitted RFQ",
        process: "CNC machining",
        dueDate: "2026-06-15",
        lineItems: [{ partName: "Bracket", quantity: 12, material: "6061 Aluminum" }],
        files: [{ name: "bracket.step", sizeBytes: 1000, type: "model/step" }],
      }),
    );
    const draft = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Draft RFQ",
      process: "Laser cutting",
      dueDate: "2026-06-18",
      lineItems: [{ partName: "Panel", quantity: 4, material: "5052 Aluminum" }],
      files: [{ name: "panel.dxf", sizeBytes: 500, type: "application/dxf" }],
    });

    const queue = getOperatorQueueRequests([draft, submitted]);

    expect(queue).toEqual([submitted]);
  });

  it("sorts request records newest first by updated timestamp", () => {
    const older = buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      requesterName: "William Paik",
      title: "Older RFQ",
      process: "CNC machining",
      dueDate: "2026-06-15",
      lineItems: [{ partName: "Older Part", quantity: 1, material: "Steel" }],
      files: [],
    });
    const newer = { ...older, id: "req_newer", title: "Newer RFQ", updatedAt: "2030-01-01T00:00:00.000Z" };

    expect(sortRequestsNewestFirst([older, newer]).map((request) => request.title)).toEqual([
      "Newer RFQ",
      "Older RFQ",
    ]);
  });
});
