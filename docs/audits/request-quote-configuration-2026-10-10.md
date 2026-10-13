# Request quote configuration audit — 2026-10-10

## Scope

Reviewed the customer RFQ builder at `/requests/new` as the “quote configuration page,” based on the route and product context. This was a read-only source audit informed by the existing customer experience audit and request-form browser notes. The current local app redirected to sign-in because Chrome had no authenticated app session, so this pass does not claim a fresh visual/browser walkthrough. No app behavior was changed.

## Findings

### P1 — The request silently commits to an uneditable process and due date

The form initializes `process` to CNC milling and `dueDate` to 14 days from the current date (`src/components/request-form.tsx:151-160`). Both values are included in the submitted RFQ and required by the submit readiness check (`src/components/request-form.tsx:3044-3063`), but the rendered form exposes no process or requested-date control. A buyer can therefore submit a manufacturing process and requested timing that they never selected or reviewed. This is especially risky for mixed-process/multi-part requests.

**Recommendation:** expose an explicit process per line item (or a clearly named project-wide process when appropriate) and a requested delivery date, or remove those assumptions from the customer submission until the operator confirms them. Show the saved values in a final review before submission.

### P2 — Progress UI promises Review and Submit stages that do not exist

The progress indicator always renders Upload, Configure, Review, and Submit, but its state can only be step 1 or 2 (`src/components/request-form.tsx:1474-1523`, mounted at `:3887`). After configuration, the page submits directly from the same form via `Request Quote` (`:4027-4035`); there is no review stage or submit-stage transition. The heading also says “review the package” before submit (`src/components/request-form-loading.tsx:1-9`). This creates a false expectation and removes a useful opportunity to catch file, quantity, finish, and timing mistakes.

**Recommendation:** implement a concise review/confirmation state with an explicit submit action, or simplify the progress indicator and intro copy to describe the actual upload/configure/submit flow.

### P2 — Submission readiness can be opaque

The submit button is disabled until all configuration, CAD bytes, drawing bytes, and drawing-dependent requirements pass (`src/components/request-form.tsx:3044-3063`, `:4027-4035`). Some invalid states show a message only after a user action (for example, choosing a drawing-dependent requirement); otherwise the disabled button itself does not explain what remains. Since the form contains multiple long configuration sections, buyers may not know why they cannot submit.

**Recommendation:** provide a visible, current completion checklist near the submit action (and focus or scroll to the first unresolved field) rather than relying on a disabled button or late error.

## Existing strengths and context

- The page starts with file upload, creates one configurable line item per CAD file, supports additional parts, and includes CAD/drawing file checks before submission.
- Material, quantity, finish, tolerance, inspection/certificate, and manufacturing notes are represented in the configured part card.
- The October 8 customer experience audit recorded local desktop checks for the empty upload state, saved-draft resume, ISO tolerance dialog, and quality selector. It could not complete an actual CAD upload/submission, test a genuine customer role, or verify mobile behavior.
- Request-quote loading now has a dedicated skeleton and an existing audit record documents the draft/navigation fixes from October 10.

## Suggested next pass

After the product chooses whether process and date belong at project or part level, update the form and run a fresh authenticated customer-role walkthrough on desktop and mobile. Verify a single-part request, mixed-process multi-part request, drawing-required configuration, saved-draft resume, and the final submitted RFQ values. Keep this separate from production payment validation.
