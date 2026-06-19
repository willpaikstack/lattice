# Autodesk APS CAD Preview Setup

Lattice uses Autodesk Platform Services (APS) to translate native CAD files into browser-viewable models for the RFQ upload preview.

## Local Setup

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

CAD translation is asynchronous. Do not block RFQ configuration or submission on APS preview readiness. The upload form should show a clear background-processing state while persisting the CAD file and any returned preview URN for later reuse.

The embedded Autodesk Viewer should expose a focused native Autodesk toolbar. Avoid adding a separate Lattice toolbar overlay for controls Autodesk already provides.

Viewer extensions loaded for native Autodesk controls:

- `Measure` - loads `Autodesk.Measure` for distance and angle measurements.
- `Explode` - loads `Autodesk.Explode` for visual assembly separation when the model has separable structure.
- `Section` - loads `Autodesk.Section` for sectional inspection through Autodesk's native section analysis tool.

The RFQ upload preview intentionally hides the default navigation, camera, model tree, properties, settings, and full-screen toolbar buttons for now so the customer only sees the manufacturing-relevant actions: measure, explode model, and section analysis.
