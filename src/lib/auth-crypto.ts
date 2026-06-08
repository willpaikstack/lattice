import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "lattice_session";

export type SessionPayload = {
  email?: string;
  exp: number;
  name?: string;
  provider?: "google" | "password";
  userId: string;
};

export const authorizedUser = {
  email: "will@latticeos.co",
  id: "will-paik",
  name: "William Paik",
  passwordHash: "d17dd65becbabd8c4eceb855cfbe862d2bb9ccc3f2250693fec1e006a86d1804c003b55f7cce0717d9f930fdbf1b1ca01e62197c5c0d482222425f09a810e74c",
  passwordSalt: "lattice-os-local-v1",
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sessionSecret() {
  const secret = process.env.AUTH_SECRET;
  return secret && secret !== "replace-me" ? secret : "lattice-os-local-dev-session-secret";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expectedSignature = sign(body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload.userId || !payload.exp || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function verifyPassword(email: string, password: string) {
  if (email.trim().toLowerCase() !== authorizedUser.email) {
    return false;
  }

  const attemptedHash = scryptSync(password, authorizedUser.passwordSalt, 64).toString("hex");
  const attemptedBuffer = Buffer.from(attemptedHash, "hex");
  const expectedBuffer = Buffer.from(authorizedUser.passwordHash, "hex");

  return attemptedBuffer.length === expectedBuffer.length && timingSafeEqual(attemptedBuffer, expectedBuffer);
}
