# Autodesk and Lattice upload limits — 2026-10-12

Read-only inspection requested by William using the logged-in Chrome Autodesk account, plus source inspection and Autodesk primary documentation. No uploads, purchases, account permission changes, app configuration changes, or deployment.

## Verified account evidence

- APS hub: Lattice OS Dev; single application: Lattice CAD Preview, owned by William Paik (work account). Hub settings associate it with team William paik - 3614.
- Hub analytics, October 5–12, 2026: 20 Model Derivative simple jobs, 0 complex jobs, 379 basic interaction API calls. This is a seven-day range, not a complete monthly total or a remaining balance.
- Autodesk Account confirmed the work login. Account Home identifies its team role as User, with no products assigned; Subscriptions and Contracts lists no accessible subscription and Reporting has no API-balance view. The legacy feature-usage URL redirects to Home. Hub/app ownership does not provide access to the team's billing entitlement.
- Therefore the actual hub billing tier, remaining allowance, token balance, and refresh date are not verified. Do not infer a Free plan or no subscription from the account's empty product list. A billing team administrator must confirm the offering for William paik - 3614.

## Published limits and pricing

Read the current Autodesk product-details rate sheet in Chrome (its tables were not available through web text extraction):

| Activity | Free tier monthly allowance | Published paid rate (USD) |
| --- | --- | --- |
| Model Derivative simple jobs | 60 | 1 token / $3 per 3 jobs; equivalent $1 per job |
| Model Derivative complex jobs | 20 | 3 tokens / $9 per 2 jobs; equivalent $4.50 per job |
| Model Derivative basic interactions | 300,000 calls | 1 token / $3 per 300,000 calls |
| Data Management uploads, downloads and basic interactions | No monthly limit in pricing sheet | No additional cost in pricing sheet |

The Data Management pricing entry is not a statement of unlimited bytes per individual file, translation capacity or request throughput. No authoritative universal maximum translatable CAD file size was established in this inspection. Autodesk's signed-S3 workflow supports multipart uploads; Lattice currently uses one part for its allowed 200 MiB files.

Autodesk Model Derivative POST /job limit: 500 requests per minute per app/client ID; rates are not service guarantees and excess traffic returns HTTP 429. Free-tier rated API usage can be suspended until the next monthly period when its allowance is exhausted; paid usage is metered and should not be assumed to retain free monthly allowances. Raw file upload and CAD conversion are distinct services.

## Lattice source limits

- `src/lib/cad-upload-policy.ts`: 200 * 1024 * 1024 bytes per CAD file or drawing (200 MiB, displayed as 200 MB). Files must be nonempty.
- CAD subset: STEP/STP, IGES/IGS, SLDPRT, SAT, X_T, X_B, IPT. Drawing subset: PDF, DXF, DWG, PNG, JPG/JPEG.
- No per-RFQ file-count or aggregate-byte ceiling is defined in the inspected upload policy.
- Stage 1 uses signed uploads to private R2/S3, verified completion, saved-reference submission and an authorized stored-file stream to Autodesk. Before rollout, bucket CORS and deployed large-file browser checks are required. Repository implementation does not prove the current production deployment uses that path. A Vercel multipart request path retains the provider's 4.5 MB body limit, even if the UI accepts 200 MB.

## Sources

- [Current APS rate sheet](https://www.autodesk.com/products/autodesk-platform-services/product-details) — read in Chrome.
- [Model Derivative endpoint rate limits](https://aps.autodesk.com/en/docs/model-derivative/v2/developers_guide/rate-limiting/md-rate-limits).
- [APS tiers and allowance exhaustion](https://aps.autodesk.com/blog/aps-business-model-evolution).
- [Autodesk team offering assignment](https://aps.autodesk.com/blog/aps-developer-hub-setup-and-app-migration).
- [Autodesk signed-S3 upload workflow](https://aps.autodesk.com/blog/data-management-oss-object-storage-service-migrating-direct-s3-approach).
- [Vercel payload limit](https://vercel.com/docs/functions/limitations).
