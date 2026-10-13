import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Check the same signed URL the browser uses without uploading any object.
const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
if (![S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY].every(Boolean)) {
  throw new Error("Private storage configuration is required.");
}
const origin = process.argv[2] ?? "https://latticeos.co";
if (new URL(origin).origin !== origin) throw new Error("An exact origin is required.");
const client = new S3Client({
  endpoint: S3_ENDPOINT, region: "auto", forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
});
const uploadUrl = await getSignedUrl(client, new PutObjectCommand({
  Bucket: S3_BUCKET, Key: "rfq-drafts/cors-verification/no-object-uploaded.step", ContentType: "model/step",
}), { expiresIn: 60 });
const response = await fetch(uploadUrl, {
  method: "OPTIONS", signal: AbortSignal.timeout(15000),
  headers: { Origin: origin, "Access-Control-Request-Method": "PUT", "Access-Control-Request-Headers": "content-type" },
});
const allowedOrigin = response.headers.get("access-control-allow-origin");
const methods = response.headers.get("access-control-allow-methods") ?? "";
const headers = response.headers.get("access-control-allow-headers") ?? "";
const ready = response.ok && allowedOrigin === origin && methods.split(",").some(value => value.trim() === "PUT") &&
  headers.toLowerCase().split(",").some(value => ["content-type", "*"].includes(value.trim()));
console.log(JSON.stringify({ origin, status: response.status, allowedOrigin, methods, headers, ready }));
if (!ready) throw new Error("Direct RFQ upload CORS verification failed.");
