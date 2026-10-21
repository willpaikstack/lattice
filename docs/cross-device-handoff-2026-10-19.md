# Cross-device handoff — October 19, 2026

> Material selector follow-up (October 19): the single dropdown displays researched UNS/composition references, exact temper/condition choices, and `Other` guidance. Exact duplex rows S31803 and S32205 are hidden from RFQ browse/search but remain in the public Materials catalog; the broad dual-certified 2205 selection remains. `1018S` is an alias of the `1018 Steel` quote offering, while the supplier label remains in sourcing records. Earlier verification counts describe the preceding implementation; the follow-up receives a fresh typecheck and production build before Vercel Preview.


## Repository and branch

- Repository: https://github.com/willpaikstack/lattice
- Continue work on `codex/materials-catalog-handoff`.
- Parent: GitHub main `cb90b1398bd3781877a03256aebba0b885b91146`, the previously merged/deployed workflow synchronization (PR #1).
- Latest material work is not merged or promoted to Production. A branch push may trigger the project's normal Preview integration.
- This computer's active source folder is `Lattice OS 2 - Timing A`. The older environment path `Lattice OS 2` no longer exists. Use any suitable folder name on the other computer.
- The independent Production-source Git history is a local recovery reference, not an alternate history to force-push onto main.

## Changes since the last deployed baseline

1. **Catalog cleanup:** removed generic Brass/Bronze/Titanium entries and the approved incomplete/unspecified material listings; moved 330/RA330 into the nickel/specialty family, AerMet 100 into alloy steel, and added the cobalt/specialty subgroup. The broader family is displayed as Nickel & specialty alloys while retaining its URL slug. Full details are recorded in the completed-work log and materials audit.
2. **Shared catalog records:** featured cards, family examples and full grade directories now use published records and listed conditions. Removed display-only highlights absent from the directory; do not reintroduce an offering through independent presentation copy. Reference properties use the exact grade/condition and do not borrow single-grade properties for a combined stainless requirement.
3. **Quote/sourcing coverage:** every published grade and listed condition has a Request quote action backed by an existing RFQ variant, or an editable, prefilled Ask us to source inquiry. Catalog-only requirements are searchable in Configure, with clear sourcing status. Starting sourcing review from a draft opens a separate tab and preserves progress.
4. **Material and Condition:** grouped search/browsing plus a separate Condition field. Searching 6061-T651 fills both; selecting a parent does not silently pick T6. Existing unspecified variants remain deliberately selectable for confirmation. Distinct steel designations remain distinct even where a broad catalog lookup alias points to one parent.
5. **Persistence/validation:** exact historical material keys and full requirement labels remain intact; new optional grade/condition metadata is derived on the server. Incomplete/source-only choices cannot pass RFQ submission. Catalog selection survives the first CAD upload, and saved drafts/reorders take priority over query prefill. No schema migration or submitted-record rewrite was needed.

The earlier combined 304/304L and 316/316L, Invar 36, brass/copper/bronze naming cleanups, shared alias registry, quote layout/address/tour updates and broad test repairs are already in parent main. Preserve them.

## Verification and limitations

- Full Vitest suite: **758 passed, 1 skipped** (140 test files passed, 1 skipped).
- TypeScript, full ESLint and Git whitespace checks pass.
- Coverage includes every published grade/condition's action, preservation of existing RFQ choices, exact-temper search, keyboard selection, first CAD upload, draft roundtrip, authoritative metadata and quote/inquiry route prefill.
- The skipped database audit is opt-in; it was not run against a real database for this work.
- Authenticated browser/mobile checks and a new Production build/release were not performed for this material change.
- Rollback: `MaterialSelect` in `src/components/request-form.tsx` retains the previous picker; the active switch is `useMaterialConditionPicker`. Exact stored requirements stay readable. Tolerance design still supports its prior legacy/cards override.

## Continue on another computer

For a fresh clone:

```sh
git clone --branch codex/materials-catalog-handoff https://github.com/willpaikstack/lattice.git
cd lattice
```

For an existing clone with your work already saved:

```sh
git fetch origin
git switch codex/materials-catalog-handoff
git pull --ff-only
```

Use Node.js 24.x and the committed npm lockfile. Before installation, copy `.env.example` to the gitignored `.env.local` and configure a **development** database URL and the existing Clerk Development instance keys through your secure credential source. Prisma's postinstall generation needs its database URL configuration to be present. Then:

```sh
npm ci
npm run dev
```

`npm ci` generates Prisma and prepares the ignored bundled CAD runtime. Existing authenticated account access needs both the correct Clerk Development instance and its provisioned development database membership. Do not copy Production secrets into a test setup, reset a database or apply schema changes just to start this handoff. Optional APS/private storage/address/email integrations require their existing development credentials if you need those flows. See README.md and the relevant setup docs.

## What Git does not transfer

Local `.env.local`, Clerk/Vercel session configuration, local fallback `.data`, CAD uploads, browser-local drafts, dependencies, generated CAD runtime and private exact RFQ audit records are excluded. Reconfigure credentials securely on the other device. Server-saved records depend on the database/storage environment; browser-only drafts are specific to the originating browser. This handoff does not wipe data or reset accounts. Retain private recovery archives on the original device.

## Next work

Read AGENTS.md, PROJECT_CONTEXT.md, DECISIONS.md, TODO.md, docs/app-feature-map.md and the materials UX audit. Verify the authenticated customer tasks above, then review remaining audit recommendations. Ask separately before a Production merge/release. Do not treat older dated status notes as evidence of a newer deployment.
