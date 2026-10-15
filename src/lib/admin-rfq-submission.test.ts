import { describe, expect, it } from "vitest";
import { adminSubmissionDate, withAdminSubmitterNames } from "./admin-rfq-submission";

describe("admin RFQ submission metadata", () => {
  it.each([
    ["2026-01-15T12:00:00Z", "Jan 15, 2026, 7:00 AM EST"],
    ["2026-07-15T12:00:00Z", "Jul 15, 2026, 8:00 AM EDT"],
  ])("displays Eastern time and its seasonal zone for %s", (createdAt, expected) => {
    expect(adminSubmissionDate({ createdAt, statusEvents: [] })).toBe(expected);
  });
  it("uses submission time rather than the draft creation date", () => {
    expect(adminSubmissionDate({ createdAt: "2026-01-01T00:00:00Z", statusEvents: [{ id: "submitted", from: "DRAFT", to: "SUBMITTED", actor: "buyer", at: "2026-07-15T12:00:00Z" }] })).toBe("Jul 15, 2026, 8:00 AM EDT");
  });
  it("preserves saved names and only resolves legacy emails within the owning company", () => {
    const companies = [{ id: "A", users: [{ email: "buyer@example.com", name: "Current name" }] }];
    const requests = [
      { buyerCompanyId: "A", requesterEmail: "buyer@example.com", requesterName: "Saved name" },
      { buyerCompanyId: "A", requesterEmail: "BUYER@example.com", requesterName: "" },
      { buyerCompanyId: "B", requesterEmail: "buyer@example.com", requesterName: "" },
    ];
    expect(withAdminSubmitterNames(requests, companies).map(request => request.requesterName)).toEqual(["Saved name", "Current name", ""]);
    expect(requests[1].requesterName).toBe("");
  });
});
