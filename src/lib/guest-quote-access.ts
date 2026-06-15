import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import type { LatticeRequest } from "./request-model";

const DEFAULT_TOKEN_TTL_DAYS = 45;

function hashGuestQuoteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function expiryIso(ttlDays = DEFAULT_TOKEN_TTL_DAYS) {
  return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createGuestQuoteAccess(ttlDays = DEFAULT_TOKEN_TTL_DAYS) {
  const token = randomBytes(32).toString("base64url");

  return {
    expiresAt: expiryIso(ttlDays),
    token,
    tokenHash: hashGuestQuoteToken(token),
  };
}

export function isGuestSimpleQuoteRequest(request: Pick<LatticeRequest, "requestOrigin">) {
  return request.requestOrigin === "GUEST_SIMPLE_QUOTE";
}

export function validateGuestQuoteAccess(request: Pick<LatticeRequest, "guestAccessTokenExpiresAt" | "guestAccessTokenHash" | "requestOrigin">, token: string | null | undefined) {
  if (!isGuestSimpleQuoteRequest(request) || !token) {
    return false;
  }

  if (!request.guestAccessTokenHash || !request.guestAccessTokenExpiresAt) {
    return false;
  }

  const expiresAt = new Date(request.guestAccessTokenExpiresAt).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  return safeEqualHex(hashGuestQuoteToken(token), request.guestAccessTokenHash);
}

export function guestQuoteHref(requestId: string, token: string) {
  return `/simple-quote/${encodeURIComponent(requestId)}?token=${encodeURIComponent(token)}`;
}
