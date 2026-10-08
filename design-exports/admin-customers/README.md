# Customer admin design options — 2026-10-07

Three paired directory/profile mockups generated with the built-in imagegen tool for layout selection. These are design proposals using fictional data; no application implementation changes were made.

- `01-tabbed-directory.png`: company directory with Companies/Waiting list tabs; company profile with Overview, Users, and RFQs & orders tabs. Recommended for clarity and growth.
- `02-split-workspace.png`: directory with selected company preview; full company record with local navigation and contextual user editing.
- `03-account-overview.png`: conventional company table and a single scannable account dossier with business, users, and history sections.

## Inspected schema

Directory rows represent Company records. Visible columns are Customer (company name, website, contact), Industry (user count), RFQs (total/active), Orders (count/supplier shops), Tier, and Status. Waiting-list entries remain separate with Name, Email, Company, Need, and Joined fields.

The detail page edits business name, website, industry, primary contact name/email, billing email, tier, status, and internal notes. Related User records support company-scoped roles, setup state, verified email changes, invitation/password reset, removal, and support workspace access. Related Request records provide RFQ/order history, pricing, lead time, files, supplier details, and line items. Activity counts are derived from requests; Company owns users and requests. Shipping/billing address fields exist on Company but are not exposed in this profile form.

## Implementation constraints

Preserve the current official logo asset and admin palette. Customer workspace remains unchanged. All membership management stays Lattice Admin-only. In option 2, the generated helper sentence claiming Customer Admins can manage company users is inaccurate and must not be implemented. Generated status names, sample dates/counts, sorting affordances, and email formatting are illustrative; map actual statuses and implement any new controls deliberately. Passwords never appear in read-only views. Company-wide support access remains a named-user action.

The exact generation prompts are preserved in `prompts.md`.
