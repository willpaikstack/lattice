import { afterEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const originalEnvironment = {
  authSecret: process.env.AUTH_SECRET,
  clientId: process.env.GOOGLE_SSO_CLIENT_ID,
  clientSecret: process.env.GOOGLE_SSO_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_SSO_REDIRECT_URI,
};

function configureGoogleSso() {
  process.env.AUTH_SECRET = "test-auth-secret";
  process.env.GOOGLE_SSO_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_SSO_CLIENT_SECRET = "test-client-secret";
  process.env.GOOGLE_SSO_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
}

afterEach(() => {
  process.env.AUTH_SECRET = originalEnvironment.authSecret;
  process.env.GOOGLE_SSO_CLIENT_ID = originalEnvironment.clientId;
  process.env.GOOGLE_SSO_CLIENT_SECRET = originalEnvironment.clientSecret;
  process.env.GOOGLE_SSO_REDIRECT_URI = originalEnvironment.redirectUri;
});

describe("Google SSO start route", () => {
  it("normalizes a local wildcard host to the registered callback host before setting state", async () => {
    configureGoogleSso();

    const response = await GET(new Request("http://0.0.0.0:3000/api/auth/google?email=will%40latticeos.co&next=%2Fadmin%2Fquotes"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/api/auth/google?email=will%40latticeos.co&next=%2Fadmin%2Fquotes");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets state and begins authorization on the registered callback host", async () => {
    configureGoogleSso();

    const response = await GET(new Request("http://localhost:3000/api/auth/google?email=will%40latticeos.co"));
    const authorizationUrl = new URL(response.headers.get("location") ?? "");

    expect(authorizationUrl.origin).toBe("https://accounts.google.com");
    expect(authorizationUrl.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/google/callback");
    expect(response.headers.get("set-cookie")).toContain("lattice_google_sso_state=");
  });
});
