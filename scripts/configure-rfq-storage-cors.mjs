import dotenv from "dotenv";
import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";

const args = process.argv.slice(2);
const values = flag => args.flatMap((value, index) => value === flag ? [args[index + 1]] : []);
const envFile = values("--env-file")[0];
const origins = [...new Set(values("--origin"))];
if (!envFile || !origins.length || origins.some(origin => !origin || new URL(origin).origin !== origin || origin === "null")) {
  throw new Error("Use --env-file PATH and one or more --origin https://example.com values. Add --apply to save the reviewed rule.");
}
dotenv.config({ path: envFile, quiet: true });
const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
if (![S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY].every(value => value && value !== "replace-me")) {
  throw new Error("The selected environment must configure its private S3/R2 bucket and credentials.");
}
const client = new S3Client({ endpoint: S3_ENDPOINT, region: "auto", forcePathStyle: true, credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY } });
let rules = [];
try {
  rules = (await client.send(new GetBucketCorsCommand({ Bucket: S3_BUCKET }))).CORSRules ?? [];
} catch (error) {
  if (error.name !== "NoSuchCORSConfiguration" && error.$metadata?.httpStatusCode !== 404) throw error;
}
const id = "lattice-rfq-direct-upload";
const previous = rules.find(rule => rule.ID === id);
const rule = {
  ID: id,
  AllowedOrigins: [...new Set([...(previous?.AllowedOrigins ?? []), ...origins])],
  AllowedMethods: ["PUT", "GET", "HEAD"],
  AllowedHeaders: ["content-type", "content-length", "range"],
  ExposeHeaders: ["ETag", "Content-Length", "Content-Range"],
  MaxAgeSeconds: 3600,
};
const merged = [...rules.filter(rule => rule.ID !== id), rule];
console.log(JSON.stringify({ bucket: S3_BUCKET, rule, preservedOtherRules: rules.filter(rule => rule.ID !== id).length }, null, 2));
if (args.includes("--apply")) {
  await client.send(new PutBucketCorsCommand({ Bucket: S3_BUCKET, CORSConfiguration: { CORSRules: merged } }));
  console.log("Saved the direct RFQ upload CORS rule.");
} else {
  console.log("Read-only review complete. Add --apply to save this rule.");
}
