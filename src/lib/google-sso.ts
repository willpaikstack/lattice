import "server-only";

import { createHmac, randomBytes, timingSafeEqual, webcrypto } from "node:crypto";

const googleAuthorizationEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenEndpoint = "https://oauth2.googleapis.com/token";
const googleJwksEndpoint = "https://www.googleapis.com/oauth2/v3/certs";
const googleIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);
const stateTtlMs = 10 * 60 * 1000;

export const GOOGLE_SSO_STATE_COOKIE_NAME = "lattice_google_sso_state";

type GoogleSsoConfig = {
  allowedDomains: string[];
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleSsoState = {
  exp: number;
  next: string;
  nonce: string;
  state: string;
};

export type GoogleIdTokenClaims = {
  aud: string;
  email?: string;
  email_verified?: boolean;
  exp: number;
  hd?: string;
  iss: string;
  name?: string;
  nonce?: string;
  sub: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleJwk = JsonWebKey & {
  alg?: string;
  kid?: string;
  use?: string;
};

type GoogleJwks = {
  keys: GoogleJwk[];
};

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  return secret && secret !== "replace-me" ? secret : "lattice-os-local-dev-session-secret";
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", authSecret()).update(value).digest("base64url");
}

function safePath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export function googleSsoConfig(origin: string): GoogleSsoConfig | null {
  const clientId = process.env.GOOGLE_SSO_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_SSO_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret || clientId === "replace-me" || clientSecret === "replace-me") {
    return null;
  }

  const allowedDomains = (process.env.GOOGLE_SSO_ALLOWED_DOMAINS ?? process.env.GOOGLE_WORKSPACE_DOMAIN ?? "")
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

  return {
    allowedDomains,
    clientId,
    clientSecret,
    redirectUri: process.env.GOOGLE_SSO_REDIRECT_URI?.trim() || `${origin}/api/auth/google/callback`,
  };
}

export function createGoogleSsoState(next: string | null) {
  const state: GoogleSsoState = {
    exp: Date.now() + stateTtlMs,
    next: safePath(next),
    nonce: randomBytes(24).toString("base64url"),
    state: randomBytes(24).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(state), "utf8").toString("base64url");

  return `${body}.${sign(body)}`;
}

export function verifyGoogleSsoState(token: string | undefined, returnedState: string | null) {
  if (!token || !returnedState || token !== returnedState) {
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
    const state = JSON.parse(base64UrlDecode(body)) as GoogleSsoState;
    if (!state.state || !state.nonce || !state.next || state.exp <= Date.now()) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

export function googleAuthorizationUrl(config: GoogleSsoConfig, stateToken: string, state: GoogleSsoState) {
  const url = new URL(googleAuthorizationEndpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", stateToken);
  url.searchParams.set("nonce", state.nonce);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");

  if (config.allowedDomains.length === 1) {
    url.searchParams.set("hd", config.allowedDomains[0]);
  }

  return url;
}

export async function exchangeGoogleCode(config: GoogleSsoConfig, code: string) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(googleTokenEndpoint, {
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !tokenResponse.id_token) {
    throw new Error(tokenResponse.error_description || tokenResponse.error || "Google did not return an ID token.");
  }

  return tokenResponse.id_token;
}

async function googlePublicKey(kid: string) {
  const response = await fetch(googleJwksEndpoint, {
    next: {
      revalidate: 60 * 60,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Google signing keys.");
  }

  const jwks = (await response.json()) as GoogleJwks;
  const jwk = jwks.keys.find((key) => key.kid === kid && key.kty === "RSA");

  if (!jwk) {
    throw new Error("Google signing key was not found.");
  }

  return webcrypto.subtle.importKey(
    "jwk",
    jwk,
    {
      hash: "SHA-256",
      name: "RSASSA-PKCS1-v1_5",
    },
    false,
    ["verify"],
  );
}

export async function verifyGoogleIdToken(config: GoogleSsoConfig, idToken: string, nonce: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = idToken.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    throw new Error("Google returned a malformed ID token.");
  }

  const header = JSON.parse(base64UrlDecode(encodedHeader)) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Google returned an unsupported ID token signature.");
  }

  const key = await googlePublicKey(header.kid);
  const isValid = await webcrypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    Buffer.from(encodedSignature, "base64url"),
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
  );

  if (!isValid) {
    throw new Error("Google ID token signature could not be verified.");
  }

  const claims = JSON.parse(base64UrlDecode(encodedPayload)) as GoogleIdTokenClaims;
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!googleIssuers.has(claims.iss) || claims.aud !== config.clientId || claims.exp <= nowSeconds || claims.nonce !== nonce) {
    throw new Error("Google ID token claims are not valid for this application.");
  }

  if (!claims.sub || !claims.email || claims.email_verified !== true) {
    throw new Error("Google account email is not verified.");
  }

  if (config.allowedDomains.length > 0 && (!claims.hd || !config.allowedDomains.includes(claims.hd.toLowerCase()))) {
    throw new Error("This Google Workspace domain is not allowed for Lattice OS.");
  }

  return claims;
}
