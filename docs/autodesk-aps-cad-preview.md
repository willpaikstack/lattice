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
6. Upload a CAD file from `/requests/new` and wait for the preview translation.

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
