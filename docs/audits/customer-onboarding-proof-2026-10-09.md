# Controlled Production customer onboarding proof — 2026-10-09

Environment: latticeos.co, application repair e7d5db5, controlled company Apple (`cmt26hdiv000004kwq8qoze1q`), customer `willclawpaik@gmail.com`. No payments, orders, quote issuance or supplier outreach. The user completed credential-changing actions; the agent operated the signed-in customer's separate Chrome profile for addresses and RFQ submission.

## Passed

- Reset/resend succeeded after the persisted-expiry repair. Actual invitation received in Gmail; downloaded `Lattice - How It Works.pdf` matches `public/email/lattice-invitation-overview.pdf` by SHA-256.
- Operator completed personal-password setup; actual customer session is active without a Support view badge and refreshed admin credential state shows setup complete.
- Address onboarding opened explicitly using `/account/settings?onboarding=addresses`. Shipping save advanced to billing with autofilled values. Blank billing ZIP was blocked with required-field feedback; restored ZIP saved and returned to dashboard. Fresh settings read shows both addresses persisted. All address fields are synthetic and explicitly marked TEST ONLY - DO NOT SHIP.
- Submitted CAD `fixtures/manual-testing/cad/lattice-qc-bracket.step` and drawing `fixtures/manual-testing/drawings/lattice-qc-drawing-rev-a.pdf` as RFQ `cmv1kwix8000006jkor2qk48u`, customer reference LQ-CMV1KWIX / operator reference RFQ-CMV1KWIX. Title: ONBOARDING TEST - DO NOT QUOTE OR MANUFACTURE. Notes prohibit suppliers, quoting, manufacturing and shipping.
- Customer sees submitted details and saved shipping snapshot; operator queue sees the same title, Submitted status and two permanent file links. Customer CAD and operator drawing downloads match source bytes by SHA-256.
- Anonymous CAD/drawing requests return HTTP 401; anonymous customer RFQ page redirects to login. Established a read-only scoped support session as controlled Will Testpaik / Greno Industries, verified badge and identity, then requested only the Apple proof RFQ and its known file URLs: RFQ renders 404 and both file routes return File not found. Exited back to operator afterward. This tests server company scoping through support, not a genuine second-customer login.

- Old temporary-password rejection passed: isolated Incognito login with the invitation credential returned “Password is incorrect. Try again, or use another method.” Closed the isolated window; genuine customer session was preserved.
- Production documentation deployment `dpl_3ykgU6kKzJXdchfrQK2r9hdpjDje` (commit a14955e, lattice-6kr0dq3py-willpaikstacks-projects.vercel.app) became Ready and aliased to latticeos.co. Reloaded operator proof record and downloaded the same CAD/drawing links afterward; both still match fixture bytes.
- Genuine customer Help → Replay showed the welcome, all four tour steps and completion. Reload at step two resumed step two; reload after completion did not reopen welcome/tour. Customer identity and RFQ remained available.

## Limits and outstanding checks

- The reused test company retained its earlier Skip for now timestamp; `/account/continue` therefore legitimately bypassed incomplete addresses. Password reset does not erase company deferral. A clean account's automatic gate is still unproven; completed address persistence is proven.
- Mobile/accessibility, skip behavior and a clean-account first welcome have not been verified in this session.
- Customer quote detail lists the drawing filename as text with no download link; operator drawing download works. Review customer drawing retrieval before rollout.
- Settings displays card-payment availability although live checkout remains disabled. Review the copy; do not infer that ordering is enabled.
- The synthetic STEP has no solids, so APS translation/rendering is not proven.
- Receiving support replies and broader recovery remain untested.

Screenshots: `output/qa/customer-addresses-2026-10-09.png`, `output/qa/customer-rfq-submitted-2026-10-09.png`, `output/qa/customer-tour-resume-2026-10-09.png`, and `output/qa/customer-rfq-verified-2026-10-09.png` (local, untracked).
