# Account settings operational audit — 2026-10-15

Status: implemented and verified locally. Production migration completed during the authorized release follow-through below; deployment and hosted checks are in progress.

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

## Remaining release checks

Apply the additive migration to the intended hosted environment before deployment. Verify hosted Customer Admin/Member sessions, provider email delivery and user-driven password completion in a controlled account. Password-provider failure, policy rejection, one-time token contention and database synchronization are covered by automated tests; no real credential was changed during this work. Saved-card/team-management/provider address suggestions remain separately deferred features.

## Authorized release follow-through — 2026-10-15

William authorized Production migration/deployment, hosted checks using the two Apple accounts and recovery delivery to willclawpaik@gmail.com. Production confirms Will ClawPaik / willclawpaik@gmail.com is CUSTOMER_ADMIN and William Paik / paik.e.william@gmail.com is CUSTOMER_MEMBER, both linked to Clerk under Apple with initial password setup complete.

Production migration froze billing snapshots on all 15 existing requests; an independent per-record deep comparison verified every other Request field was unchanged and each new billing snapshot equals its pre-migration company defaults. There are no existing Invoice rows. A second run updated zero rows. The private baseline is kept only in ignored .vercel files.

Resolved the eleven baseline test failures by supplying complete commercial inputs, asserting required missing-field rejection/explicit zero-price acceptance and expiration overrides, and matching the approved Request submitted/Unable to quote notification labels. Full suite: 677 tests pass, one opt-in database test skipped. Typecheck and focused lint pass. Production deployment and hosted evidence follow below.
