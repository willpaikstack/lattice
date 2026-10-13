# RFQ hidden/obsolete requirements audit — October 13, 2026

## Scope

Source audit of the current request form, new-request page, submission API, account-default handling, model validation, persistence and reorder prefill. Trigger: buyer reports Buyer company is required after submitting a configured RFQ. No RFQ was submitted, existing draft changed, or application behavior modified. Findings describe code paths; the exact current draft/account payload was not captured.

## Findings

### 1. Buyer company remains mandatory despite no intake field — high priority

`request-model.ts` assertValidDraft requires buyerCompany. The client sends hidden projectForm.buyerCompany. The page supplies accountSettings.companyName, but a blank string overrides the form's old demo default. Restored drafts can likewise supply an empty value.

The API replaces the name from session only for customer-role users. Admin submissions retain the submitted hidden value. Thus an admin using the normal request page with blank account/draft company reaches exactly the reported validation error. Customer replacement uses nullish fallback, so an empty session companyName also remains empty rather than falling back.

Company identity is legitimate operational metadata, but it should not be an invisible customer-entered requirement. Resolve customer identity on the server from its authorized company record. For admin-created RFQs, define an explicit on-behalf-of customer selection/context instead of inventing a buyer or dropping ownership. Keep company ownership enforcement.

### 2. Requester name is hidden, mandatory, and initialized to William Paik — high priority

The form defaults requesterName to William Paik; existing draft/reorder values can override it, including blanks. The new-request page does not pass a requester-name default. The API fills contact defaults but does not replace the top-level requesterName from authenticated identity. Model validation still requires it.

Risks: another user can submit with the wrong identity, or an old blank draft hits Requester name is required with no editable field. Populate authenticated requester identity server-side; preserve an explicit separate buyer/contact only where that workflow exists.

### 3. Legacy dueDate is hidden and required — high priority

The form initializes a request-level dueDate to 14 days ahead, includes it in readiness and sends it on submission. Model validation requires it. Reorder prefill generates a different date (quoted lead time plus seven days, otherwise 21 days). It is separate from the newly visible optional per-part targetShipDate.

Risks: hidden invented urgency, stale draft dates, and blank legacy dueDate blocking readiness without a repair control. Remove this obsolete intake requirement/default. Retain historical dates for existing RFQs and keep targetShipDate optional. Update consumers deliberately; database dueDate is already nullable, but conversion code currently constructs a Date from the supplied string.

### 4. Hidden customerPo can still alter manufacturing notes — medium priority

The form carries customerPo although no input is rendered. Submission injects a nonblank hidden value as Customer PO# on the first part's notes. Old drafts can therefore carry an invisible commercial instruction. Reorder prefill clears it, but local draft restoration can retain it.

Recommendation: stop generating new note text from this hidden draft field. Preserve existing historical request notes; collect a PO at the designed purchase workflow if needed.

### 5. Hidden partName is required and its checklist explanation is misleading — medium priority

Part names are normally generated from CAD filenames. Both readiness/model validation require partName. The missing-field checklist treats a blank partName as Upload the CAD file, even when CAD is already attached. There is no dedicated part-name edit control in Configure.

Recommendation: reliably derive a nonblank part label from the current filename before readiness/submission, with a safe fallback for unusual filenames. Do not force re-upload solely because a legacy hidden label is blank.

### 6. Hidden project-level process is redundant in readiness — low priority

The form checks project.process even though visible process is per-part and the submission API derives the aggregate from those part processes. A stale/blank request-level draft value can reduce completion without a corrective control.

Recommendation: base readiness on the visible per-part process only; retain derived aggregate process for operator summaries.

## Removed fields that are not submission blockers

Customer part number, CAD revision and Drawing revision have no mandatory assertions in current intake validation. Their internal historical fields remain but do not cause this error. Target ship date is genuinely optional and validated only when provided. CoC/MTR/custom inspection are selectable requests, not required fields beyond Standard Inspection's included default.

## Other validation gap found

Drawing-required documents and engineering flags block the normal form via readiness and file-byte checks. The submission API validates declaration, process/material/finish and file ownership, but does not enforce the same drawing-required document-to-part rule. It also does not validate the quality-documentation catalog/supported tolerance selections through equivalent server rules. This is an API parity issue, not vestigial data: retain these legitimate requirements and enforce them server-side. Do not remove a drawing requirement merely because its automatic popup was removed.

## Recommended correction order

1. Resolve company/requester identity from trusted account context; explicitly handle admin on-behalf-of RFQs.
2. Retire hidden dueDate default/requirement and redundant project-process readiness; retain optional target dates.
3. Normalize filename-derived part labels and remove hidden customerPo note injection.
4. Match backend drawing/document/tolerance validation to the visible form.
5. Verify affected blank legacy drafts, customer/admin identities, multipart drawing requirements, and persistence without submitting the user's live draft.
