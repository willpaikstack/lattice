import { describe, expect, it } from "vitest";

import { buildWaitingListAlreadyRepresentedEmail, buildWaitingListThankYouEmail } from "./waiting-list-email";

describe("waiting list thank-you email", () => {
  it("thanks the person who joined the waiting list", () => {
    const email = buildWaitingListThankYouEmail({
      id: "wait-1",
      name: "Avery Chen",
      email: "avery@forgeworks.com",
      company: "ForgeWorks",
      procurementNeeds: "Recurring CNC RFQs",
      joinedAt: "2026-05-27T14:30:00.000Z",
    });

    expect(email.to).toBe("avery@forgeworks.com");
    expect(email.subject).toBe("Thanks for joining the Lattice waiting list");
    expect(email.text).toContain("Hi Avery,");
    expect(email.text).toContain("Thanks for joining the Lattice waiting list.");
    expect(email.text).toContain("ForgeWorks");
  });

  it("tells same-domain requesters who already represents their company", () => {
    const email = buildWaitingListAlreadyRepresentedEmail(
      {
        id: "wait-2",
        name: "Jordan Lee",
        email: "jordan@forgeworks.com",
        company: "ForgeWorks",
        procurementNeeds: "Production order follow-up",
        joinedAt: "2026-05-27T15:30:00.000Z",
      },
      {
        id: "wait-1",
        name: "Avery Chen",
        email: "avery@forgeworks.com",
        company: "ForgeWorks",
        procurementNeeds: "Recurring CNC RFQs",
        joinedAt: "2026-05-27T14:30:00.000Z",
      },
    );

    expect(email.to).toBe("jordan@forgeworks.com");
    expect(email.subject).toBe("Your company is already on the Lattice waiting list");
    expect(email.text).toContain("Hi Jordan,");
    expect(email.text).toContain("Current waitlist contact: Avery Chen (avery@forgeworks.com)");
  });
});
