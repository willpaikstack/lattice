# Local quote timing — Design C

## Current handoff status — October 19, 2026

Use `docs/cross-device-handoff-2026-10-19.md` for current Git synchronization and other-device setup. The GitHub remote is now configured. PR #1 was merged as `cb90b13` and deployed; the newer material catalog/condition changes are published separately on `codex/materials-catalog-handoff`. The experiment notes below describe the original October 18 setup and its historical verification, not current release readiness. The latest full source suite has 758 passes and one opt-in database skip; TypeScript/ESLint pass.

## Original experiment record

This independent local repository starts from all 997 source files of Production deployment `dpl_2PVFWrjYurFom1vhiEb9xeVgQtQ6`. Every file was verified against the deployment's SHA-1 manifest before changes. The original working repo had 13 differing runtime files. On 2026-10-18, William chose this Production-derived repository as the working copy and requested deletion of the original folder. Its Git history, uncommitted files and local configuration were preserved in the private recovery archive `/Users/williampaik/Documents/ChatGPT/Lattice Recovery Archives/lattice-original-2026-10-18.tar.gz` before removal.

- Production baseline commit: `de73b9b`, tagged `production-baseline-20261018`.
- Earlier Design A implementation commit: `79d8aae` (superseded by Design C).
- Design C replaces the inline timing footer with the sidebar delivery card.
- Local branch: `codex/quote-timing-a`.
- No remote is configured and no deployment was created.

## Review

Open http://127.0.0.1:3000/design-preview/timing-c.

The toolbar compares Design C with Previous layout, shows a two-part example (20 and 12 production business days), exercises missing shipping duration, and opens a 390px mobile preview. All quote examples are synthetic and built in memory. The checkout action is a local anchor; it cannot place an order.

To restart from this folder:

```sh
npm run preview:timing
```

Installed dependencies now live directly in this repository, using the matching package lock; the original workspace is no longer required. If moving this independent repo to another computer, install its dependencies with `npm ci` and create a gitignored `.env.local` with:

```dotenv
LOCAL_TIMING_PREVIEW=1
LATTICE_DATA_MODE=mock
LATTICE_QUOTE_TIMING_LAYOUT=sidebar
```

The dev-only preview bypasses authentication only on its two exact synthetic preview routes (timing-c and the compatible timing-a bookmark), and skips the root Clerk provider in this local harness mode. Protected routes retain their middleware. The harness contains no database URL, customer credentials, or production environment variables. Next production mode does not expose the preview route. Turbopack uses the parent directory as its root only when the local harness flag is enabled, to resolve the shared dependencies.

## Reversibility

For immediate visual comparison, click **Previous layout** in the toolbar. This changes only the preview URL.

To use the previous layout by default, stop the local server and run:

```sh
npm run preview:timing:legacy
```

Or change `LATTICE_QUOTE_TIMING_LAYOUT=legacy` in the local `.env.local` and restart. Set it back to `sidebar` to restore C. The quoted-detail component preserves its previous rendering branch.

Each implementation is committed locally; use Git revert on the Design C change to recover Design A, or choose Previous layout for the Production baseline presentation. Save later edits before reverting.

The Production baseline tag remains available for comparison. This is the retained working repository. No Git remote is configured, so commits are local until remote sync is configured.

## Timing rules

- Each part shows production lead time, with the longest part identified.
- One Delivery estimate card above the purchase summary separates production and shipping durations and calculates viewing date + longest part production duration + shipping duration.
- The viewer's local calendar date refreshes at midnight and on tab focus/visibility changes.
- Use the app's existing Domestic = 2 / International = 5 shipping presets, treated as business days for this local experiment.
- Count weekdays after the viewing date; holiday calendars are not applied.
- An unknown shipping method or a part without timing leaves the delivery estimate pending.
- Single-part legacy quotes can use their saved overall production duration. Multi-part quotes need timing for every part.

This experiment implements quote-screen presentation and calculation. Stored quote dates, purchase/order date persistence, PDFs, and checkout calculations retain baseline behavior; align those before a future production rollout.

## Verification

- 13 focused timing/layout checks pass after the Design C change, including longest-part aggregation, missing inputs, weekends, DST/year boundaries, midnight/focus refresh and the rollback switch.
- TypeScript and scoped ESLint pass.
- Browser checks passed for desktop, two-part, missing-shipping, previous-layout and 390px mobile views. The server returned HTTP 200 for the synthetic route.
- The existing BuyerQuoteDetail test group has 9 passes and 2 inherited failures, unchanged when `LATTICE_QUOTE_TIMING_LAYOUT=legacy`: a removed request-title assertion and an outdated checkout-label assertion. These are baseline test drift rather than timing regressions.
- The initial Webpack preview failed on an existing global selector in the tour CSS. The preview now uses Turbopack, as the Production build does.
- Design A screenshots are historical. Design C browser visual verification was blocked by the browser URL policy; the updated layout and sidebar placement are covered by the focused component checks.


## GitHub review handoff — October 19, 2026

[Draft workflow synchronization PR](https://github.com/willpaikstack/lattice/pull/1) carries this current application source on a branch based on GitHub main. It includes the necessary source reconciliation because main predates this Production-source snapshot. The original independent local checkout and baseline tag remain intact; the PR uses the existing GitHub repository history. The review branch passes the full suite (733 passed, one opt-in database audit skipped), TypeScript and ESLint. No merge or deployment was performed.
