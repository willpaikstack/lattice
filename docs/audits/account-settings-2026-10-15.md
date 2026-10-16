# Account settings operational audit — 2026-10-15

Status: released to Production with migration and genuine Customer Admin/Member checks complete. William confirmed recovery email receipt and reset completion, corroborated by Production token/credential/audit state. A separate new-password sign-in was not independently exercised. Earlier local-only checkpoints below are historical; the authorized release section records current evidence.

## Scope and decisions

A signed-in user edits personal details or an authorized company default, the server resolves the actual identity/company and saves the edited field group, and subsequent screens and RFQs read the persisted result. William approved shared-default editing for Customer Admins and Lattice Admins. Customer Members retain personal name, phone and avatar editing. Company renaming remains Lattice Admin-only.

Shipping, billing address and billing contact changes are defaults for future RFQ submissions, including submissions from previously saved drafts. Submitted RFQs, issued quotes and orders retain their saved contact/address values. An explicit in-review RFQ shipping edit remains available and changes only that RFQ.

## Findings and repairs

| Finding | Repair and evidence |
| --- | --- |
| The direct File menu created a blob preview without opening the dialog containing Save avatar. | File selection opens the dialog. Empty, unsupported and oversized files have visible errors. A synthetic PNG was selected through the native browser chooser, saved to Clerk and reloaded successfully. Both settings and sidebar loaded the same durable provider image. |
| Sidebar always rendered initials; Clerk's generated default image could hide a saved emoji. | Shared avatar rendering displays photos, emoji or initials. Only `hasImage` exposes an uploaded image; explicit presets take priority. A real photo-to-emoji save/reload displayed the emoji in both locations. The original slate/wave avatar was restored and independently checked through Clerk. |
| Saving a whole stale settings object could overwrite unrelated newer company defaults. | Actions require an allowed field group and update only its columns. Identity, role and company ownership come from the session. A stale phone/billing save cannot overwrite shipping, and forged permission flags cannot authorize a member. Server validation rejects incomplete addresses and malformed billing contacts. Legacy per-user company defaults are cleared after adoption. |
| Established shared defaults were restricted to Lattice Admins. | Customer Admins can now update shipping, billing address and billing contact after onboarding. Members remain denied by server checks. Company name editing stays Lattice Admin-only. |
| Cache/layout refresh was missing from the generic save action. | Successful saves invalidate the shared layout; settings refresh from the saved server result. Name writes update Clerk plus the linked `User` row. A real local phone edit was confirmed in PostgreSQL and after browser reload, then restored to its original blank value. |
| Checkout initialized shipping from the current account defaults; incomplete old RFQs could display later shared addresses. | Quote detail and routed checkout use request-owned snapshots. An in-review shipping editor starts from that RFQ's saved values. Issued quote shipping no longer links to a shared-default editor labeled Change. |
| Billing address/contact had no RFQ-owned snapshot. | Added nullable `Request.billingSnapshot` JSONB with a field-limited reader and server-only initialization from current defaults. New RFQs retain billing address, AP email and routing notes. Quote, checkout and order detail display them; invoice creation and legacy order invoice rendering use the request snapshot. Existing issued `Invoice` snapshots are untouched. |
| Settings exposed direct password editing; recovery updated the old local hash without changing Clerk sign-in. | Replaced editing with Reset password, linking to the email-prefilled recovery page. Recovery claims its one-time token atomically, updates the linked Clerk password, invalidates other sessions and completes local credential/audit updates. Policy/service errors have distinct recovery messages. No real password or email was changed/sent during verification. |
| A verified email with no Clerk verification timestamp displayed an unavailable status. | A provider-confirmed verified status remains visible as Email verified; dates are displayed only when supplied. Support views do not attribute the operator's image or identity dates to the customer. |
| Account Summary included unnecessary currency and called the company Account. | Removed currency and changed the label to Company. Browser verified the new presentation and Reset password link. |

## Database migration and historical limits

Run before releasing this source to an environment:

```sh
node scripts/migrate-account-settings.mjs /absolute/path/to/target-environment-file
```

The explicit target file must contain that environment's `DATABASE_URL`. Credentials are never printed. The migration adds `Request.billingSnapshot` and freezes current company billing defaults for existing company-owned requests only when their snapshot is absent. Repeat runs preserve existing snapshots.

The local `.env.local` database is migrated; both migration runs updated zero existing billing snapshots. This does not certify the Production schema. Apply the same migration to Production before deploying this application change.

Historical RFQs did **not** store a separate billing address/contact snapshot. The migration can preserve company billing values available at migration time; it cannot reconstruct older billing values that were never recorded. Existing shipping columns and already-issued invoice records are preserved. Missing historical shipping remains missing until an explicit permitted RFQ edit.

## Verification

- **121 focused tests pass** across settings/actions/avatar, request API/persistence, customer access, quote detail/checkout, shell, invoice issuance and password recovery.
- **Real PostgreSQL audit passes**, using the actual repository persistence mapping and account-settings service with synthetic authenticated contexts. It verifies shipping, billing, AP contact/routing notes and personal phone persistence; visibility to another company member; isolation of a second company; unchanged full old RFQ after all edits; updated new RFQ snapshots; server rejection of forged member permissions; and one-time legacy billing backfill with repeat-run preservation. Synthetic company/request/default records are rolled back; a post-transaction query confirms no audit companies remain.
- **Real signed-in local browser** verifies file chooser → save dialog → Clerk upload → settings/sidebar image → full reload, then emoji persistence and original-avatar restoration. Phone form → server action → PostgreSQL → full reload also passes; the original phone is restored. Reset link opens the recovery page with the correct email; no reset message is sent.
- TypeScript, changed-file ESLint, whitespace checks and local production build pass. Final rerun evidence is recorded in the completed-work log.
- Full suite at the initial audit checkpoint: **655 pass, 11 fail, 1 opt-in test skipped**. All 11 failures reproduce against a clean archive of the starting commit: 7 admin quote-action expectations, 2 quote-workbench tests and 2 notification-page copy tests. They concern prior quote-validation/copy changes, outside this settings repair. The later focused tests cover the final settings refinements.
- The PostgreSQL driver emits a deprecation warning about Prisma's concurrent relation reads inside the audit transaction; assertions and rollback pass.

Browser image evidence is local: `/tmp/lattice-settings-photo-verified.jpg` and `/tmp/lattice-settings-final.jpg`. No customer workflow records, orders, emails or Production data were changed by this audit.

## Initial release checklist (superseded by follow-through below)

Apply the additive migration to the intended hosted environment before deployment. Verify hosted Customer Admin/Member sessions, provider email delivery and user-driven password completion in a controlled account. Password-provider failure, policy rejection, one-time token contention and database synchronization are covered by automated tests; no real credential was changed during this work. Saved-card/team-management/provider address suggestions remain separately deferred features.

## Authorized release follow-through — 2026-10-15

William authorized Production migration/deployment, hosted checks using the two Apple accounts and recovery delivery to willclawpaik@gmail.com. Production confirms Will ClawPaik / willclawpaik@gmail.com is CUSTOMER_ADMIN and William Paik / paik.e.william@gmail.com is CUSTOMER_MEMBER, both linked to Clerk under Apple with initial password setup complete.

Production migration froze billing snapshots on all 15 existing requests; an independent per-record deep comparison verified every other Request field was unchanged and each new billing snapshot equals its pre-migration company defaults. There are no existing Invoice rows. A second run updated zero rows. The private baseline is kept only in ignored .vercel files.

Resolved the eleven baseline test failures by supplying complete commercial inputs, asserting required missing-field rejection/explicit zero-price acceptance and expiration overrides, and matching the approved Request submitted/Unable to quote notification labels. Full suite: 677 tests pass, one opt-in database test skipped. Typecheck and focused lint pass. Production deployment and hosted evidence follow below.

### Production release and hosted evidence

- Source commit `6f05bfd` and deployment-packaging commit `2cdac4f` pushed to `origin/codex/opencascade-admin-demo`. Packaging excludes ignored local audit/design artifacts from uploads. Hosted Production build succeeded as `dpl_G4gNx6XcserXJMyV5rEheNFan6en`; staged login rendered, then deployment was promoted to https://latticeos.co.
- Genuine signed-in Apple Customer Admin `willclawpaik@gmail.com`: temporarily saved a synthetic name, phone, shipping address, billing address, AP email and routing note through the hosted UI. Reload and direct Production database reads confirmed all writes. Uploaded a synthetic PNG via the real file chooser, saved and reloaded; settings/sidebar both loaded the durable provider image. Switched to an emoji and reloaded; both surfaces rendered it.
- Submitted one explicitly labeled synthetic RFQ `rfq_f18ce944786a6fcd3439d5c24ce09744b9cd3bb0` (`QA Account Settings 2026 10 15`, reference `LQ-RFQ_F18C`) with the repository demo cube. Its notes explicitly state no manufacturing or supplier outreach is requested. No quote was issued or purchase made. The record remains as identifiable audit evidence.
- Restored the original Admin name, blank phone, initials avatar, shipping/billing addresses, AP email and blank routing notes through the UI. Production reads independently confirm restoration. All 15 original Request records are still deeply equal to the pre-migration baseline excluding only the additive billing snapshot. The new QA RFQ retains its changed requester/shipping/billing/AP snapshots after restoration, verified in both the database and reloaded quote UI.
- Local evidence: `/tmp/lattice-settings-production-photo.jpg`, `/tmp/lattice-settings-production-restored.jpg`, `/tmp/lattice-settings-production-rfq.jpg`. Private baseline and boolean proof are stored only in ignored `.vercel` files, not source control.
- Deployment logs over the audit window show zero HTTP 500+ requests. Eight runtime stderr entries were PostgreSQL/Node deprecation warnings (seven SSL-mode warnings and one concurrent-query warning), with no application failure observed in that window.

### User handoffs at initial release checkpoint (completed below)

The genuine Member check requires William to sign in as `paik.e.william@gmail.com` in the retained Production login tab. The browser still shows the login page. Member permissions, cross-company isolation and shared-default visibility already have automated/database coverage, but this does not substitute for a genuine hosted Member session.

The Production recovery form accepted the authorized request for `willclawpaik@gmail.com` and persisted an unconsumed one-hour token at 8:14 PM Eastern on October 15 (expires 9:14 PM Eastern). Inbox receipt is not confirmed. Browser credential-change policy requires William to enter, confirm and submit the new password himself; no password was entered or changed by the agent. After completion, verify token consumption, password-reset audit state and genuine Clerk sign-in. If the link expires, request a new one through the normal recovery form. Do not treat the generic sent confirmation as proof of inbox delivery.

### Completed Member and recovery follow-through — 2026-10-15

William confirmed genuine Member sign-in and receipt/completion of the reset email. The retained Production browser showed `paik.e.william@gmail.com` / Customer Member / Apple. Shared shipping, billing address and AP contact matched the restored company defaults, with no shared-edit buttons; name, phone and avatar controls remained available. Saved synthetic phone `555-0103` through the form and reloaded successfully, then restored the original blank phone through the form. A final browser navigation and Production AccountDefaults query confirm restoration. The same Member could open the Admin-created QA RFQ and view its saved shipping/billing/AP snapshots after company defaults had been restored. Screenshot: `/tmp/lattice-settings-production-member.jpg`.

Production recovery evidence: the authorized token created October 15 at 8:14:47 PM Eastern was consumed at 8:28:19 PM Eastern before expiration; User.passwordChangedAt updated and mustChangePassword is false. PASSWORD_RESET_COMPLETED was recorded in the same completion transaction. That code records completion only after Clerk accepts the password update and session-revocation request. William entered/submitted the new password himself; no credential was accessed by the agent. User confirmation establishes inbox receipt and completion; database evidence corroborates successful recovery. A separate sign-in using the new password was not independently exercised.

All four authorized follow-through items are now handled: Production migration/release, genuine Admin/Member checks, user-completed recovery, and eleven baseline test repairs. No additional application changes or test rerun were needed for these final hosted checks.

## Account settings usability follow-up — 2026-10-15

Phone numbers now format while editing and in the read view, with `(555) 123-4567` guidance and server validation for complete domestic/international numbers. Blank remains allowed. Billing email syntax is checked by the same stricter shared validator in the client and server; malformed local parts/domain labels are rejected and Save is disabled while invalid. This checks format, not mailbox ownership or deliverability.

Signed-in recovery now resolves the verified primary Clerk email on the server, displays it read-only, ignores submitted/query email replacements and removes Try another email. Completion also refuses a token owned by another Clerk identity while signed in. Signed-out recovery still requires the emailed one-time token, as normal. Support sessions cannot initiate personal recovery. No password reset email was sent or credential changed during this follow-up.

Added the opt-in Billing address is the same as shipping checkbox to account settings and address onboarding. A persisted boolean on Company/AccountDefaults tracks the choice. Server-side updates copy the current authoritative shipping fields and serialize company address mutations in a transaction, so later shipping edits also update linked billing. Unchecking permits a separate billing address. AP contact remains independent; saved RFQ/order/invoice snapshots remain unchanged. Additive idempotent schema applied to Development and Production using scripts/migrate-account-address-link.mjs; existing addresses remain unchanged and all accounts start unlinked.

Shared shipping/billing fields offer state/territory dropdown suggestions and searchable city/ZIP results from the bundled zipcodes dataset through an authenticated same-origin endpoint. Selecting a suggestion fills city, state and ZIP together. All fields allow manual entry, including when suggestions fail or lack the address. Street fields support browser address autofill; no external street-search or deliverability service is connected. Dataset reference: https://github.com/davglass/zipcodes. Search terms are not sent to a third-party lookup provider.

Typecheck, changed-file ESLint and local production build pass. Automated tests were not added or run for this follow-up. Hosted release evidence follows.

### Usability follow-up release — 2026-10-16

Source `1d5877c` is pushed and released at latticeos.co as Ready Production `dpl_Bz8CdC7v4JduhdfPQZZ7uoRbRmir`. Hosted production build passes. A genuine Member session visibly formats a typed synthetic phone as `(310) 555-0123`; the unsaved edit was canceled. Navigating to recovery with another account's email in the query still renders the signed-in Member's email with readOnly=true and no alternate-email link; no reset was requested.

The hosted shipping editor on the synthetic audit RFQ returned Rancho Palos Verdes, CA for ZIP 90275. Selecting the suggestion filled city/state/ZIP together. Arbitrary manual city/region values remained editable. All address changes were canceled and the original RFQ address reappeared; no account or RFQ values changed. Evidence: /tmp/lattice-settings-phone-format.jpg, /tmp/lattice-settings-reset-bound.jpg, /tmp/lattice-settings-address-suggestions.jpg.

At the initial follow-up release checkpoint only the Member session was available; Admin verification was pending. That handoff is now complete below. This follow-up did not run automated tests, send reset email, or change a credential.

### Completed Admin usability checks — 2026-10-16

Genuine willclawpaik@gmail.com Customer Admin session is available after Google sign-in; the current profile name is Erin Paik, as independently changed by the user, and was preserved. Its existing stored phone displays `(310) 386-0825`. A malformed billing email disables Save and shows an inline error; a syntactically valid plus-address enables Save. Both drafts were canceled, preserving the original AP email and invoice notes.

The Billing address is the same as shipping checkbox hides duplicate entry fields and displays the shipping address. Saved it, confirmed the Company boolean in Production, reloaded and saw Same as shipping. Current shipping/billing addresses were already identical, so their values did not change. Unchecked/saved it to restore the original independent-billing preference, then reloaded to confirm. The billing editor also displays live city/state/ZIP suggestions. No shipping values were changed to exercise subsequent propagation in Production; that behavior is implemented by the serialized server update, not claimed as a hosted distinct-address mutation test.

Independent Production comparison confirms original preference restored, every shipping/billing field and AP contact/routing note unchanged, and all 17 Request records deeply unchanged from the immediate pre-check baseline. Private baseline/boolean proof are kept only in ignored .vercel files. Evidence: /tmp/lattice-settings-invalid-email.jpg and /tmp/lattice-settings-linked-billing.jpg. Short-window request logs returned zero HTTP 500+ records. No remaining user handoff for this follow-up. Automated tests were not run; static checks and local/hosted builds passed.
