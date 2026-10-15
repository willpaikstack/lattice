# Workflow reset for operator audit — October 14, 2026

User authorized removal of workflow data from local and Production while preserving accounts and setup.

Completed:

- Development database: removed 9 RFQs, 23 shared drafts, 2 invoices, 2 customer quote versions, 2 supplier quotes, 5 supplier documents, 21 file records, 18 parts, 22 status events and 7 lifecycle email events.
- Production database used by latticeos.co: removed 3 RFQs, 1 shared draft, 6 file records, 3 parts and 6 status events. All selected workflow tables verified empty.
- Removed local customer/mock fallback requests and mock quote renewals; wrote valid empty arrays so missing-file demo fallback cannot reseed the local app. Cleared local inquiry/roadmap-interest fallback stores.
- Removed 48 files from the active local upload store. Database workflow snapshots and local uploads are retained only in a restricted, ignored recovery directory under output/qa/workflow-reset-2026-10-14, outside application storage.
- Verified exact unchanged database contents for company/user/account-default/vendor-override/invitation/onboarding/sequence tables. Static catalogs and configuration were untouched. External Stripe payment history and authentication-provider accounts were not changed.
- Chrome LATTICE profile: Production admin draft cache was already empty; removed old local RFQ-draft and deleted-quote keys through browser storage UI. Production/local admin queues and customer Quotes visibly show zero records. Rechecked both databases after browser navigation: requests and shared drafts remain zero.

Provider cleanup completed:

- Used the existing signed-in Cloudflare session to remove all four existing objects in the Production upload bucket `lattice-production-files`. Verified the unfiltered object listing shows the empty-bucket state; bucket/access/CORS configuration retained. No API credential created or changed.
- Removed 14 unique Autodesk model manifests found in the saved workflow records/drafts, plus six remaining source objects. All 14 models return 404 for both manifest and source detail after deletion. The configured local APS bucket has zero remaining sources. See Autodesk's [manifest deletion reference](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/urn-manifest-DELETE) for the operation used; source deletion was separately verified.
- Cleared the one Production waiting-list lead and its local fallback store as workflow intake history; provisioned company/user records remain preserved.
- Local customer Orders and Production admin Orders verified empty in the browser.

No action is pending from the user for the current Chrome LATTICE profile. Other browser profiles/devices may retain drafts and must clear their workflow caches before opening Quotes/Request Quote, otherwise the current sync behavior can restore them. This session did not access every browser profile/device or erase recovery/audit artifacts outside application storage.

No application code change, deployment, customer email or payment was performed. This reset does not remediate the separately documented customer payload exposure.
