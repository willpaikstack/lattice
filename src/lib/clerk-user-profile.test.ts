import { describe, expect, it } from "vitest";

import { clerkUserDisplayName } from "./clerk-user-profile";

describe("clerkUserDisplayName", () => {
  it("prefers the Clerk full name and has safe account-name fallbacks", () => {
    expect(clerkUserDisplayName({ fullName: "Avery Hoyer", firstName: "Avery" })).toBe("Avery Hoyer");
    expect(clerkUserDisplayName({ firstName: "Avery" })).toBe("Avery");
    expect(clerkUserDisplayName({ username: "ahoyyer" })).toBe("ahoyyer");
    expect(clerkUserDisplayName({ primaryEmailAddress: { emailAddress: "ahoyyer@gmail.com" } })).toBe("ahoyyer");
  });
});
