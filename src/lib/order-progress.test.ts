import { describe, expect, it } from "vitest";

import { buildDraftRequest, submitDraftRequest } from "./request-model";
import { isOrderMilestoneLate, orderNextStep } from "./order-progress";

describe("order progress", () => {
  it("uses a quoted delivery date as a late milestone fallback for existing orders", () => {
    const order = {
      ...submitDraftRequest(
        buildDraftRequest({
          buyerCompany: "Acme Manufacturing",
          requesterName: "Buyer",
          title: "Legacy production order",
          process: "CNC machining",
          dueDate: "2026-08-20",
          lineItems: [{ partName: "Bracket", quantity: 4, material: "6061 Aluminum" }],
          files: [{ name: "bracket.step", sizeBytes: 1024, type: "model/step" }],
        }),
      ),
      quote: {
        ...submitDraftRequest(
          buildDraftRequest({
            buyerCompany: "Acme Manufacturing",
            requesterName: "Buyer",
            title: "Legacy production order",
            process: "CNC machining",
            dueDate: "2026-08-20",
            lineItems: [{ partName: "Bracket", quantity: 4, material: "6061 Aluminum" }],
            files: [{ name: "bracket.step", sizeBytes: 1024, type: "model/step" }],
          }),
        ).quote,
        estimatedDeliveryDate: "2026-07-15",
      },
      supplierOrder: {
        ...submitDraftRequest(
          buildDraftRequest({
            buyerCompany: "Acme Manufacturing",
            requesterName: "Buyer",
            title: "Legacy production order",
            process: "CNC machining",
            dueDate: "2026-08-20",
            lineItems: [{ partName: "Bracket", quantity: 4, material: "6061 Aluminum" }],
            files: [{ name: "bracket.step", sizeBytes: 1024, type: "model/step" }],
          }),
        ).supplierOrder,
        nextMilestone: "",
        nextMilestoneDate: "",
      },
      status: "PURCHASED" as const,
    };

    expect(isOrderMilestoneLate(order, new Date("2026-08-01T12:00:00.000Z"))).toBe(true);
    expect(orderNextStep(order)).toBe("Estimated delivery by 2026-07-15 - Lattice");
  });
});
