import { describe, expect, it } from "vitest";

import { findWaitingListRequestConflict, type WaitingListEntry } from "./waiting-list";

const existingEntry: WaitingListEntry = {
  id: "wait-1",
  name: "Avery Chen",
  email: "avery@forgeworks.com",
  company: "ForgeWorks",
  procurementNeeds: "Recurring CNC RFQs",
  joinedAt: "2026-05-27T14:30:00.000Z",
};

describe("waiting list requests", () => {
  it("detects an exact email request that is already on the waiting list", () => {
    const conflict = findWaitingListRequestConflict({ ...existingEntry, id: "wait-2" }, [existingEntry]);

    expect(conflict?.status).toBe("already-requested");
  });

  it("detects another requester from the same email domain", () => {
    const conflict = findWaitingListRequestConflict(
      {
        ...existingEntry,
        id: "wait-2",
        name: "Jordan Lee",
        email: "jordan@forgeworks.com",
      },
      [existingEntry],
    );

    expect(conflict?.status).toBe("domain-already-requested");
  });
});
