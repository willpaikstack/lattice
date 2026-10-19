# Reversible tolerance configuration

Implemented locally on October 18, 2026. Not deployed.

The default design now offers three absolute general linear tolerance requests:

- ±0.010″ (±0.254 mm)
- ±0.005″ (±0.127 mm), the default for newly added parts
- Tighter than ±0.005″ (±0.127 mm), requiring a drawing and review

Inches control; metric equivalents are exact. Individual drawing callouts take precedence. These options do not define angles, fits or GD&T and are requests for Lattice to confirm in the issued quote, not a blanket supplier capability promise. Threads, fits and sharp internal corners retain their separate requirements.

Saved ISO Medium/Fine values are preserved and displayed as an additional selected legacy requirement until the customer explicitly replaces them. ISO classes are never silently converted to fixed distances. Existing drawing-specific flags remain enforced. Numeric values and labels round-trip through existing draft/RFQ data; the server also requires a drawing for the tighter option independently of feature flags. No schema migration is needed.

## Compare and roll back

- Numeric cards: `http://localhost:3001/requests/new?toleranceDesign=cards`
- Original dropdown/checkbox layout: `http://localhost:3001/requests/new?toleranceDesign=legacy`
- For a saved draft, retain its `draft=...` parameter and append `&toleranceDesign=legacy` or `&toleranceDesign=cards`.
- Set `LATTICE_TOLERANCE_DESIGN=legacy` in ignored `.env.local` and restart to restore the old layout globally. Explicit URL choice takes precedence.

Legacy mode retains ISO Medium/Fine choices alongside saved numeric requirements, so changing layouts never discards selected values. To restore the old ISO behavior for a part, select ISO Medium/Fine in the legacy dropdown. A presentation rollback does not reinterpret existing numeric requirements.

## Verification

TypeScript, scoped ESLint and git diff --check pass for the absolute-distance update; no tests or authenticated browser review performed. Local only, not deployed.

## Screenshot wording update — October 18, 2026

The three card headings/descriptions now reproduce the supplied Xometry screenshot verbatim at the customer's request, including rounded metric values, drawing overrides and reamed-hole exceptions. This supersedes the preceding description of visible card copy. The old helper text stating drawing precedence has been removed. Persisted values/labels, required-drawing validation and inspection controls remain unchanged; copying the Standard inspection sentence does not automatically restrict inspection selections. The legacy layout switch still works.
