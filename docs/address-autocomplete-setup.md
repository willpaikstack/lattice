# U.S. address autocomplete

## Current connection

Activated 2026-10-16: Geoapify project **Lattice** uses the Free plan. GEOAPIFY_API_KEY is stored as a Vercel Secret in **Production** and **Preview**. Production is redeployed and genuine Customer Admin shipping/billing autocomplete and native full-name state selection are verified. A live diagnosis found valid street-only results taking about 5.5 seconds, beyond the former 5-second timeout; the server now allows 15 seconds and reports timeout distinctly. Street suggestions open again when the field is focused or clicked, including a previously entered value. Number-only input stays local and prompts the user to continue with a street name. Optional ZIP proximity biases result ranking without excluding other U.S. addresses. No local Development key was added. Key values belong only in secret storage.

## Provider and activation

Lattice uses Geoapify Address Autocomplete for street suggestions. The app requests up to five U.S. matches after 350 ms without typing. Choosing a result fills street/city/state/ZIP; name, company, unit/suite and address phone remain editable. Users may enter the complete address manually. Existing bundled city/ZIP suggestions remain available if street lookup is unavailable. Suggestions help entry; they do not certify deliverability.

1. Open [Geoapify MyProjects](https://myprojects.geoapify.com/) and create an account. The account owner completes sign-in and accepts the provider terms.
2. Create a project named **Lattice**. Open **API Keys** and copy the generated key.
3. In the existing Vercel **lattice** project, open **Settings → Environment Variables**. Add **GEOAPIFY_API_KEY** as a sensitive server-side variable for Production and Preview. Do not prefix it with `NEXT_PUBLIC_`.
4. Redeploy the application after adding or changing the variable. Environment changes do not update an existing deployment.
5. For local development, put a development key in ignored `.env.local` and restart the dev server. Do not overwrite the local database or Clerk configuration with Production environment values.
6. Confirm street suggestions with a public address, select a match, and check city/state/ZIP and manual entry in both shipping and billing editors. Provider failures/quotas must leave manual saving available.

At implementation time (2026-10-16), the Free plan offers 3,000 credits/day, up to 5 requests/second, commercial Production use and no credit card requirement. These limits can change; check [current pricing](https://www.geoapify.com/pricing/). Autocomplete is debounced, but every completed search consumes provider quota. Configure the account's available usage controls and monitor usage before expanding volume.

The key is used by an authenticated same-origin POST route, never returned to the browser. Only street-search text is sent to Geoapify, with a fixed U.S. filter; when a valid ZIP is already present, its public ZIP-area center is used as a soft proximity bias. The ZIP does not restrict the search. Requests time out after 15 seconds; the UI indicates a slow lookup and offers retry. Names and phone numbers are not forwarded. Results are returned with `private, no-store`; only safe provider HTTP status/reason codes are logged; provider URLs, response bodies and exceptions are never logged because they may include the key and search address. The dropdown includes Geoapify and OpenStreetMap attribution. Because the integration runs server-side, browser referrer/origin restrictions must not be applied to this key; only use IP restrictions if the deployment has a known fixed outbound IP.

## Diagnosing unavailable suggestions

- **Not enabled yet**: GEOAPIFY_API_KEY is missing from the running deployment. Add it to the correct Vercel environment and redeploy.
- **Lookup needs attention**: provider returned HTTP 401/403. Check the key and restrictions in the provider dashboard; use a valid server-side key and redeploy if changed.
- **Search limit reached**: provider returned HTTP 429. Review the provider quota/rate limit.
- **Search took too long**: provider exceeded the 15-second server cutoff. Retry, add city/ZIP, or enter manually.
- **Temporarily unavailable**: network failure, malformed response or another provider error. Manual entry remains available.
- **No matching streets**: provider responded successfully but returned no usable U.S. street matches. Try a fuller address or enter it manually.

The state field uses a custom searchable picker styled to match Lattice form controls. It lists full alphabetical state and territory names with two-letter postal codes, supports keyboard selection, and stores the selected postal abbreviation. An existing legacy region remains available until the user chooses a U.S. state.

## Address phones and snapshots

Each company/standalone-account shipping and billing address has its own optional, validated, formatted phone field. Billing linked to shipping copies the address phone too. Existing address phones start blank. Personal account phone remains independent. New requests use the shipping phone when supplied, with the existing account-phone fallback for legacy/blank addresses; the billing phone is stored in the request billing snapshot and included in billing lines. Existing RFQ/order/invoice snapshots are not backfilled or changed.

Before deploying the new Prisma client, run the explicit additive migration against each intended database:

```sh
node scripts/migrate-account-address-phones.mjs path/to/target.env
```

The migration adds only `shippingPhone` and `billingPhone` columns to Company and AccountDefaults. It does not rewrite any request or existing address/contact data.

## References

- [Geoapify API and key setup](https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/)
- [Geoapify pricing](https://www.geoapify.com/pricing/)
- [Geoapify attribution requirements](https://www.geoapify.com/terms-and-conditions/)
