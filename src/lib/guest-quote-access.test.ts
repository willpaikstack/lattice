import { describe, expect, it } from "vitest";

import { createGuestQuoteAccess, validateGuestQuoteAccess } from "./guest-quote-access";

describe("guest quote access", () => {
  it("validates a fresh guest quote token without exposing the stored token", () => {
    const access = createGuestQuoteAccess();

    expect(access.token).not.toBe(access.tokenHash);
    expect(validateGuestQuoteAccess(
      {
        guestAccessTokenExpiresAt: access.expiresAt,
        guestAccessTokenHash: access.tokenHash,
        requestOrigin: "GUEST_SIMPLE_QUOTE",
      },
      access.token,
    )).toBe(true);
  });

  it("rejects invalid, expired, and non-guest access attempts", () => {
    const access = createGuestQuoteAccess();

    expect(validateGuestQuoteAccess(
      {
        guestAccessTokenExpiresAt: access.expiresAt,
        guestAccessTokenHash: access.tokenHash,
        requestOrigin: "GUEST_SIMPLE_QUOTE",
      },
      "wrong-token",
    )).toBe(false);

    expect(validateGuestQuoteAccess(
      {
        guestAccessTokenExpiresAt: "2020-01-01T00:00:00.000Z",
        guestAccessTokenHash: access.tokenHash,
        requestOrigin: "GUEST_SIMPLE_QUOTE",
      },
      access.token,
    )).toBe(false);

    expect(validateGuestQuoteAccess(
      {
        guestAccessTokenExpiresAt: access.expiresAt,
        guestAccessTokenHash: access.tokenHash,
        requestOrigin: "ACCOUNT",
      },
      access.token,
    )).toBe(false);
  });
});
