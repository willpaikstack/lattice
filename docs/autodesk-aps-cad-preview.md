# Autodesk APS CAD Preview Setup

Lattice uses Autodesk Platform Services (APS) to translate native CAD files into browser-viewable models for the RFQ upload preview.

## Account Ownership

The `Lattice CAD Preview` APS application in the `Lattice OS Dev` developer hub is owned by `will@latticeos.co`. Autodesk confirmed the ownership transfer on 2026-10-08. The existing application was transferred, preserving its Client ID and app configuration; do not create a replacement app or rotate credentials solely because of the ownership change. The personal email `paik.e.william@gmail.com` was removed from the `Lattice OS Dev` hub on 2026-10-08. The work account remains a Hub Admin and app Owner. The corresponding `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and `APS_BUCKET_KEY` are already configured in Vercel Development, Preview, and Production (2026-08-18). Secret values must remain in the secret manager and must not be copied into this document.

## Local Setup

Capacity audit (2026-10-12): [Autodesk upload limits](audits/autodesk-upload-limits-2026-10-12.md) records the live hub usage and current rate sheet. Free Model Derivative allowances are 60 simple jobs, 20 complex jobs and 300,000 basic calls per month; paid rates shown are $1/simple job, $4.50/complex job and $3/300,000 basic calls. The work login owns the APS application but has the User role on the Autodesk billing team, so its actual offering and remaining balance require confirmation by the team's billing administrator. Do not infer Free/Paid status from an empty product list.

1. Create or open an Autodesk Platform Services app in the APS developer hub.
2. Copy the app's Client ID and Client Secret.
3. Add these values to `.env.local`:

```env
APS_CLIENT_ID="your-client-id"
APS_CLIENT_SECRET="replace-me"
APS_BUCKET_KEY="lattice-os-dev-cad-previews-your-name"
```

4. Restart the Next.js dev server.
5. Visit `/api/cad-previews/configuration` in the browser. A configured local server returns `status: "configured"`.
6. Upload a CAD file from `/requests/new`. The RFQ form should remain usable while APS translates the preview in the background.

## Bucket Key

`APS_BUCKET_KEY` must be globally unique, lowercase, and simple. Use letters, numbers, and hyphens only.

Good examples:

```env
APS_BUCKET_KEY="lattice-os-dev-cad-previews-william"
APS_BUCKET_KEY="lattice-os-prod-cad-previews"
```

## Secret Handling

Do not commit APS credentials. The repo ignores `.env.local` and other `.env*` files, while keeping `.env.example` as a safe template.

If a Client Secret is pasted into chat, logs, screenshots, or any shared place, regenerate it in Autodesk and replace the value in `.env.local` or the Vercel environment variables.

## Production Setup

For `latticeos.co`, add the same variables in Vercel project settings:

- `APS_CLIENT_ID`
- `APS_CLIENT_SECRET`
- `APS_BUCKET_KEY`

Then redeploy the app so the server can read the new environment variables.

You can verify production configuration at `/api/cad-previews/configuration`. The response never exposes the Client ID or Client Secret.

## Data Note

When APS preview is enabled, uploaded CAD files are sent to Autodesk for translation. Use sample or non-sensitive geometry until the production file-handling policy is finalized.

## Product Behavior

### Preview speed stage 1 — 2026-10-12

- Viewer JavaScript and CSS start loading as soon as a valid CAD selection opens the export-restrictions popup, overlapping the buyer’s decision time. Valid CAD selection now also starts upload and APS translation during the unanswered popup, using a distinct advance_cad_preview intent and an unconfirmed declaration. No → Continue reuses the cached upload and translation promises for each File object, avoiding a second upload or translation. The processing note beneath the file list was removed at the user’s request. Selecting Yes or discarding the popup blocks proceeding with the batch but does not retract uploaded bytes or cancel APS translation. Ordinary drawing intake and RFQ submission still require an unrestricted declaration. Multiple parts share one asset-loading promise. A failed preload can retry when a model becomes ready.
- Fitted geometry is shown before Measure, Explode, and Section finish loading. Tool loading no longer holds the preview behind the loading overlay.
- The RFQ browser uploads a file once to the private R2/S3 bucket using an authenticated, company-scoped, 15-minute signed PUT. The signature fixes its content type, byte length, original-name metadata, and unique object key. Upload completion verifies the object with HEAD before returning a usable file reference.
- `/api/cad-previews` accepts a saved storage reference, verifies current-session ownership and actual stored CAD size/extension, and streams that object to Autodesk. No second CAD upload from the browser is needed. Existing multipart callers remain supported.
- Submission awaits pending uploads and retries failed saves through the same upload path, then sends references only. Translation completion remains optional for submission. CAD and drawing uploads are limited to 200 MiB per file, shown as 200 MB in the UI.
- Private downloads authorize the request first, then redirect to a five-minute signed GET in remote-storage mode. This avoids Vercel's response-size limit for large CAD and PDF files. Development retains local file uploads/downloads.
- Translation reuse and completion webhooks are future stages. The existing five-second status checks and SVF2 output remain.

### Required bucket CORS setup for direct uploads

Before deploying stage 1, allow PUT/GET/HEAD requests from the exact customer app origin on the private R2/S3 bucket. CORS does not make objects public or replace upload signatures. Include any Preview origin explicitly when testing a preview deployment; do not broadly allow every Vercel project.

Use an environment file containing the intended bucket's `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. It must remain gitignored. The helper reads the existing configuration, merges a dedicated rule, and preserves other rules:

```bash
# Review without changing the bucket.
node scripts/configure-rfq-storage-cors.mjs --env-file /absolute/path/to/storage.env --origin https://latticeos.co

# Apply the reviewed rule using credentials allowed to manage bucket CORS.
node scripts/configure-rfq-storage-cors.mjs --env-file /absolute/path/to/storage.env --origin https://latticeos.co --apply
```

For remote-storage development, also set `LOCAL_FILE_STORAGE_ENABLED=false` and allow the local app origin. The helper permits Content-Type/Content-Length/Range headers and exposes ETag/Content-Length/Content-Range. The SDK signs byte length; browsers supply Content-Length from the selected File automatically. No storage secret reaches the browser, and signed URLs are not persisted in drafts.

Official references: [R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).

Deployment checks: upload a synthetic CAD file larger than 4.5 MB, confirm it saves and translates, submit during translation, reopen the draft, download the stored CAD/drawing, and confirm another company cannot complete, translate, or download those keys. Test the browser CORS preflight and signed PUT against the actual bucket. Verify rendering and Measure/Explode/Section on a representative solid model. The implementation computer has local storage enabled and no remote S3/R2 credentials; the live bucket rule, browser upload, and measured latency improvement have not been verified here. No deployment was performed in this session.

CAD translation is asynchronous. Do not block RFQ configuration or submission on APS preview readiness. The upload form should show a clear background-processing state while persisting the CAD file and any returned preview URN for later reuse.

The embedded Autodesk Viewer should expose a focused native Autodesk toolbar. Avoid adding a separate Lattice toolbar overlay for controls Autodesk already provides.

Viewer extensions loaded for native Autodesk controls:

- `Measure` - loads `Autodesk.Measure` for distance and angle measurements.
- `Explode` - loads `Autodesk.Explode` for visual assembly separation when the model has separable structure.
- `Section` - loads `Autodesk.Section` for sectional inspection through Autodesk's native section analysis tool.

The RFQ upload preview intentionally hides the default navigation, camera, model tree, properties, settings, and full-screen toolbar buttons for now so the customer only sees the manufacturing-relevant actions: measure, explode model, and section analysis.

## Upload policy verification — 2026-10-10

An authenticated read of APS `GET /modelderivative/v2/designdata/formats` returned HTTP 200 and confirmed that STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, and IPT all support SVF2. Lattice intentionally accepts this manufacturing-part subset, rather than every Autodesk input type. The shared policy is `src/lib/cad-upload-policy.ts`; it powers picker hints, labels, client guards, and server preview validation. CAD files must be nonempty and at most 200 MiB. PDF/DXF/DWG/PNG/JPG/JPEG remain separate drawing attachments; PDF is not accepted as a part model. Format support does not certify a particular file’s integrity, native version, or external dependencies. No test geometry was uploaded to Autodesk during this verification.


### Early processing status correction — 2026-10-12

Step 1 already starts APS translation after file persistence finishes. Previously the cached start result always read queued, and polling began only when Configure mounted, after an additional five-second wait. The popup now polls each pending translation every two seconds; Configure refreshes the cached result immediately before displaying it and its own polling starts immediately. Both the local status endpoint and the Autodesk manifest request avoid cached responses. Temporary status/network failures preserve the running job and retry on the next poll, without submitting another translation. APS may still genuinely be queued or processing after a minute; completed translation also still requires browser model download/render.


### Prepared model handoff — 2026-10-12

After the first CAD file in a staged batch translates successfully, its actual model loads into a sized, invisible/inert parking region behind the restrictions popup. A stable React portal container is reparented into the configured part’s viewer slot on Continue. The Autodesk viewer component and WebGL canvases are preserved; no second Document.load/loadDocumentNode is required for that handoff. A ResizeObserver resizes/refits the preserved model to the configured card. Geometry metadata captured during preparation flows into the existing part metadata callback. Other parts in the batch load normally; only one unconfirmed model per batch is prepared. Previously accepted prepared viewers remain associated with their own parts until removal/replacement/unmount.

Back/Close removes unaccepted prepared viewers; removing a staged file or an accepted part, replacing its CAD, or leaving the form disposes unused viewer instances and detaches portal containers. This does not cancel APS cloud jobs or erase already uploaded files. Prepared models are scoped to the current form session, not a persistent cross-user or content-hash cache. Fresh translation time is unchanged; continuing before translation/preparation completes still shows normal loading.

Live A10201.SLDPRT verification found a ready 600 × 320 viewer with two canvases while the popup remained open. After Continue, the same instance ID and canvas count appeared in the card at approximately 351 × 320, with visibility observed about 0.295 seconds after the click. This is one local warm-model observation including automation overhead, not a latency guarantee. Evidence: `output/qa/cad-model-preload-2026-10-12/viewer-handoff.json`.

## Production upload release — 2026-10-13

- Configured the existing private `lattice-production-files` bucket in Cloudflare Dashboard for exact origins `https://latticeos.co`, `https://www.latticeos.co`, and `https://lattice-phi-plum.vercel.app`; PUT/GET/HEAD, content-type/content-length/range headers, ETag/Content-Length/Content-Range exposure, and 3600-second preflight cache. Public access remains disabled. All three origin preflights return 204; an unrelated origin returns 403 with no allow-origin header.
- Vercel storage credentials cannot read/change bucket CORS through the S3 bucket-settings API (AccessDenied); use Cloudflare Dashboard for this configuration. `scripts/verify-rfq-storage-cors.mjs` can check a signed upload preflight from a protected environment without uploading an object or printing the signed URL.
- Application release is `dpl_31kujdnkXEq4S3nwWfkmQ4CaX8ZT`, source commit `71b21df`. The full synthetic large-file upload/APS, draft reopen and cross-company browser workflow remain to be exercised.

## P0 ownership and upload contract — 2026-10-13

The released app stores expected direct-upload metadata and server-created CAD model ownership/source associations in private internal R2 records. Browser PUTs sign exact content length/type; completion checks the private expected record instead of relying on metadata in presigned URL query parameters. Existing exact-origin CORS headers suffice. These records are not downloadable customer attachments; no database migration is required.

Status/thumbnail/viewer-token requests require a registered model belonging to the current company or an authorized Lattice operator. Viewer token requests specify the mounted model URNs; APS dynamic resource scopes prohibit direct provider reads of unrelated models. Broad tokens are no longer issued. Previously issued tokens expire on the provider's normal schedule. Client-supplied saved URNs do not establish ownership. Eligible legacy files can regenerate from authorized originals and retain the customer's ownership even when an operator starts recovery. Missing ownership/eligibility/original bytes use the original-file/replacement fallback. See [P0 verification](audits/p0-remediation-2026-10-13.md); native browser follow-through remains pending until the Mac is unlocked.
