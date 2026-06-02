const APS_BASE_URL = "https://developer.api.autodesk.com";
const APS_TOKEN_URL = `${APS_BASE_URL}/authentication/v2/token`;
const APS_BUCKET_POLICY = "transient";

export type CadPreviewStartResult =
  | {
      status: "configuration_required";
      message: string;
      provider: "autodesk-platform-services";
    }
  | {
      status: "processing";
      urn: string;
      objectId: string;
      provider: "autodesk-platform-services";
    };

export type CadPreviewStatusResult =
  | {
      status: "configuration_required";
      message: string;
      provider: "autodesk-platform-services";
    }
  | {
      status: "processing" | "ready" | "failed";
      urn: string;
      progress: string;
      provider: "autodesk-platform-services";
    };

export type CadPreviewConfigurationStatus =
  | {
      status: "missing_credentials";
      provider: "autodesk-platform-services";
      hasClientId: boolean;
      hasClientSecret: boolean;
      hasBucketKey: boolean;
      message: string;
    }
  | {
      status: "configured";
      provider: "autodesk-platform-services";
      bucketKey: string;
      message: string;
    };

function apsCredentials() {
  const clientId = process.env.APS_CLIENT_ID ?? process.env.AUTODESK_CLIENT_ID;
  const clientSecret = process.env.APS_CLIENT_SECRET ?? process.env.AUTODESK_CLIENT_SECRET;
  const bucketKey = process.env.APS_BUCKET_KEY ?? process.env.AUTODESK_BUCKET_KEY;

  if (!clientId || !clientSecret || !bucketKey || clientId === "replace-me" || clientSecret === "replace-me" || bucketKey === "replace-me") {
    return null;
  }

  return {
    clientId,
    clientSecret,
    bucketKey: bucketKey.toLowerCase(),
  };
}

function envValueConfigured(value: string | undefined) {
  return Boolean(value?.trim()) && value !== "replace-me";
}

function apsCredentialPresence() {
  const clientId = process.env.APS_CLIENT_ID ?? process.env.AUTODESK_CLIENT_ID;
  const clientSecret = process.env.APS_CLIENT_SECRET ?? process.env.AUTODESK_CLIENT_SECRET;
  const bucketKey = process.env.APS_BUCKET_KEY ?? process.env.AUTODESK_BUCKET_KEY;

  return {
    hasClientId: envValueConfigured(clientId),
    hasClientSecret: envValueConfigured(clientSecret),
    hasBucketKey: envValueConfigured(bucketKey),
  };
}

function configurationRequired(): Extract<CadPreviewStartResult, { status: "configuration_required" }> {
  return {
    status: "configuration_required",
    provider: "autodesk-platform-services",
    message: "Add APS_CLIENT_ID, APS_CLIENT_SECRET, and APS_BUCKET_KEY to enable live CAD translation previews.",
  };
}

function urnify(value: string) {
  return Buffer.from(value).toString("base64").replace(/=/g, "");
}

function safeObjectKey(fileName: string) {
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return `${Date.now()}-${normalized || "cad-file"}`;
}

async function getApsToken(scopes: string[]) {
  const credentials = apsCredentials();

  if (!credentials) {
    return null;
  }

  const response = await fetch(APS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: scopes.join(" "),
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to authenticate with Autodesk Platform Services (${response.status})`);
  }

  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

async function ensureBucket(bucketKey: string, token: string) {
  const lookup = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/details`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (lookup.ok) {
    return;
  }

  if (lookup.status !== 404) {
    throw new Error(`Unable to inspect Autodesk bucket (${lookup.status})`);
  }

  const created = await fetch(`${APS_BASE_URL}/oss/v2/buckets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketKey,
      policyKey: APS_BUCKET_POLICY,
    }),
  });

  if (!created.ok && created.status !== 409) {
    throw new Error(`Unable to create Autodesk bucket (${created.status})`);
  }
}

async function uploadObject(bucketKey: string, file: File, token: string) {
  const objectKey = safeObjectKey(file.name);
  const signedUrlResponse = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!signedUrlResponse.ok) {
    throw new Error(`Unable to create Autodesk upload URL (${signedUrlResponse.status})`);
  }

  const signedUpload = await signedUrlResponse.json() as { urls: string[]; uploadKey: string };
  const uploadUrl = signedUpload.urls[0];

  if (!uploadUrl) {
    throw new Error("Autodesk did not return an upload URL");
  }

  const uploaded = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
  });

  if (!uploaded.ok) {
    throw new Error(`Unable to upload CAD file to Autodesk (${uploaded.status})`);
  }

  const finalized = await fetch(`${APS_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${encodeURIComponent(objectKey)}/signeds3upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uploadKey: signedUpload.uploadKey }),
  });

  if (!finalized.ok) {
    throw new Error(`Unable to finalize Autodesk upload (${finalized.status})`);
  }

  return finalized.json() as Promise<{ objectId: string }>;
}

async function startTranslation(urn: string, token: string) {
  const response = await fetch(`${APS_BASE_URL}/modelderivative/v2/designdata/job`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { urn },
      output: {
        formats: [
          {
            type: "svf2",
            views: ["2d", "3d"],
          },
        ],
      },
    }),
  });

  if (!response.ok && response.status !== 409) {
    throw new Error(`Unable to start Autodesk translation (${response.status})`);
  }
}

export async function startCadPreviewTranslation(file: File): Promise<CadPreviewStartResult> {
  const credentials = apsCredentials();

  if (!credentials) {
    return configurationRequired();
  }

  const token = await getApsToken(["data:read", "data:write", "data:create", "bucket:read", "bucket:create"]);

  if (!token) {
    return configurationRequired();
  }

  await ensureBucket(credentials.bucketKey, token.access_token);
  const uploaded = await uploadObject(credentials.bucketKey, file, token.access_token);
  const urn = urnify(uploaded.objectId);
  await startTranslation(urn, token.access_token);

  return {
    status: "processing",
    urn,
    objectId: uploaded.objectId,
    provider: "autodesk-platform-services",
  };
}

export async function checkCadPreviewConfiguration(): Promise<CadPreviewConfigurationStatus> {
  const presence = apsCredentialPresence();
  const credentials = apsCredentials();

  if (!credentials) {
    return {
      status: "missing_credentials",
      provider: "autodesk-platform-services",
      ...presence,
      message: "APS credentials are not fully configured on the server.",
    };
  }

  await getApsToken(["data:read"]);

  return {
    status: "configured",
    provider: "autodesk-platform-services",
    bucketKey: credentials.bucketKey,
    message: "APS credentials are configured and Autodesk authentication succeeded.",
  };
}

export async function getCadPreviewStatus(urn: string): Promise<CadPreviewStatusResult> {
  const token = await getApsToken(["data:read"]);

  if (!token) {
    return {
      status: "configuration_required",
      provider: "autodesk-platform-services",
      message: configurationRequired().message,
    };
  }

  const response = await fetch(`${APS_BASE_URL}/modelderivative/v2/designdata/${encodeURIComponent(urn)}/manifest`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });

  if (!response.ok) {
    throw new Error(`Unable to inspect Autodesk translation (${response.status})`);
  }

  const manifest = await response.json() as { status?: string; progress?: string };
  const status = manifest.status === "success" ? "ready" : manifest.status === "failed" ? "failed" : "processing";

  return {
    status,
    urn,
    progress: manifest.progress ?? (status === "ready" ? "complete" : "pending"),
    provider: "autodesk-platform-services",
  };
}

export async function getViewerToken() {
  const token = await getApsToken(["viewables:read"]);

  if (!token) {
    return null;
  }

  return token;
}
