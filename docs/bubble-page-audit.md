# Bubble Page Audit for Local Lattice Rebuild

Source inspected: public Bubble preview/runtime at `https://nexus-77465.bubbleapps.io/version-test/`.

Inspection date: 2026-05-24.

Purpose: capture the visible contents of the Bubble prototype page-by-page so the local Next.js Lattice app can emulate the useful product structure while improving unfinished/no-code placeholder areas.

## Inspection boundary

This pass inspected the **rendered Bubble preview pages**, not the private Bubble editor internals. That means:

- Visible layouts, text, fields, buttons, page hierarchy, and likely interactions were inspected.
- Editor-only implementation details such as exact workflows, database data types, conditional rules, and reusable-element internals were not directly inspectable from the public preview.
- Where behavior is inferred, it is marked as inferred.

## App-wide shell pattern

Most non-auth pages share a persistent left sidebar:

- Top dark geometric logo mark.
- Primary CTA button: `Request Quote`.
- `ADMIN`
  - Home
  - Analytics
  - Project Management
- `MANAGE`
  - Our Quotes
  - Our Orders
- `RESOURCES`
  - Materials
  - Capabilities
- Light/white background, muted gray nav text/icons, thin section dividers.
- Some pages include a lower vertical three-dot overflow control.

Local implication:

- Keep `src/components/app-shell.tsx` as the common shell.
- Replace hash-only sidebar links with real routes as those pages are built.
- Use the Bubble shell as the IA reference, but clean up labels/active states and remove Bubble branding.

---

## Page inventory

### 1. `index`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/`

Title: `Dashboard Surface`

Visible purpose:

- Main dashboard / command center.

Visible content:

- Greeting: `Hi` with current user's first name blank in this preview.
- Metric cards:
  - `Active RFQs` = `34`; detail `43 unread quotes`
  - `Orders` = `1,253`; detail `10 status changes`
  - `Shipped` = `+912`; detail `4 in the past 3 days`
  - `Alerts` = `4`; detail `2 unread`
- `Inbox` section.
- `Transactions` section:
  - subtitle: `Here are your latest quotes with status changes`
  - button: `View All`
  - table/list columns: `User`, `Amount`
  - sample rows:
    - Frank Bennett / frank.bennett@gmail.com / `$641.00`
    - Jennifer Li / jennifer.li@gmail.com / `$370.00`
    - Amir Sharma / amir.sharma@gmail.com / `$1,200.00`
    - Simon Abiola / simon.abiola@gmail.com / `$400.00`
    - Linda Williams / linda.williams@gmail.com / `$800.00`
    - Jasmine Jones / jasmine.jones@gmail.com / `$50.00`
- `Orders` section:
  - subtitle: `Here are the latest signed up users`
  - columns: `User`, `Time`
  - sample users: William, Simon Abiola, Gregory John, Jennifer Li, Linda Williams, Frank Bennett, Amir Sharma, Jasmine Jones.

Visible/likely behavior:

- `View All` likely navigates to a quote/order list.
- Sidebar nav routes to module pages.

Local carryover:

- Keep the dashboard card pattern.
- Replace generic users/emails with manufacturing RFQs, buyers, suppliers, due dates, quote/order states, and next actions.
- Preserve sections for metrics, inbox/activity, latest quote/order changes.

### 2. `old_index`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/old_index`

Visible content:

- Only `Built on Bubble` appears.

Local carryover:

- Treat as abandoned/empty. Do not build as a user-facing route unless needed for redirect/backward compatibility.

### 3. `account_details__team_members`

Preview URL tried: `https://nexus-77465.bubbleapps.io/version-test/account_details__team_members`

Visible content:

- Bubble 404 boilerplate:
  - `Oops! 404 error`
  - `The page you're looking for does not exist.`

Local carryover:

- The editor page list indicated this page exists, but it is not reachable in the inspected runtime URL.
- Build later as `/settings/team` or `/account/team` only after core RFQ/order/resource pages are in place.

### 4. `project_management`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/project_management`

Visible content:

- Sidebar shell only.
- No visible main page content beyond the shared navigation.

Local carryover:

- Placeholder module.
- Future route: `/projects` or `/operator/projects`.
- Local first version can be a simple project list/status page, but Bubble does not provide meaningful content to copy yet.

### 5. `analytics`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/analytics`

Visible content:

- Sidebar shell only.
- No visible analytics widgets/charts in preview.

Local carryover:

- Placeholder module.
- Future route: `/analytics`.
- Do not prioritize until real RFQ/order data exists.

### 6. `request_quote`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/request_quote`

Visible purpose:

- Buyer RFQ intake page.

Visible layout:

- Shared sidebar.
- Main content has rough/unfinished header area:
  - `HEADER`
  - `Quote Number` repeated twice
  - `yes(No quote line items)` debug/conditional-style text
- Large blank area under the header, likely intended for quote line items or uploaded-part summary.
- Large upload/dropzone area:
  - `Drag & drop files here, or browse`
  - suggested file types: `STEP, STP, IGES, IGS, SLDPRT, SAT, X_T, X_B, IPT`
  - `Upload another CAD file`
  - native `Choose File` control
- Customer details section:
  - heading: `CUSTOMER DETAILS`
  - fields/placeholders visible from accessibility tree:
    - `Customer PO#`
    - `Company Name`
    - `Project Names`
    - `Type here...`
- Bottom/right primary button: `Request Quote`.

Visible/likely behavior:

- File upload accepts CAD/manufacturing file formats.
- Submit button likely creates a quote/RFQ.
- `yes(No quote line items)` indicates an unfinished conditional state for empty line items.

Local carryover:

- This is the highest-priority local rebuild page.
- Keep: upload-first flow, customer details, quote/project/PO fields, CAD file type guidance.
- Improve: replace placeholder header/debug text with a guided RFQ structure.
- Add missing manufacturing fields locally:
  - part name / drawing number
  - quantity
  - process
  - material
  - tolerance
  - finish
  - quality documentation
  - due date
  - notes

Screenshot captured:

- `/Users/willsclaw/.hermes/profiles/adam/cache/screenshots/browser_screenshot_d7113f4a1b94442bbbc24dd6cce1b638.png`

### 7. `checkout_page`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/checkout_page`

Visible content:

- Only `Built on Bubble` appears.

Local carryover:

- Treat as abandoned/empty for now.
- Checkout/payment should not be prioritized until quote acceptance and order conversion exist.

### 8. `sample_upload_page`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/sample_upload_page`

Title: `Design Tutorial`

Visible content:

- Only `Built on Bubble` appears.

Local carryover:

- Treat as abandoned/tutorial residue.
- The real upload concept lives in `request_quote`.

### 9. `fabrication_capabilities`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/fabrication_capabilities`

Title: `Available Materials`

Visible purpose:

- Resource page explaining Lattice's manufacturing/fabrication capabilities.

Visible layout/content:

- Shared sidebar.
- Large page title: `FABRICATION CAPABILTIES` (misspelled in Bubble; should be `CAPABILITIES`).
- Intro card heading: `Fabrication Capabilities`.
- Body copy:
  - Lattice connects domestic fabrication demand with vetted manufacturing partners.
  - Current capabilities focus on precision CNC machining supported by modern 3-axis, 4-axis, and 5-axis equipment.
  - Material platforms include stainless, aluminum, alloy steels, titanium, and nickel alloys.
  - Partner facilities selected based on quality systems, equipment depth, tolerance control, and production scalability.
  - Workflows supported by inspection processes, material traceability, and specification-driven execution for ASTM/ASME/industry standards.
- Below intro: approximately six accordion/card rows with chevrons, but visible labels are blank or not loaded.

Visible/likely behavior:

- Accordion rows are probably expandable capability categories.

Local carryover:

- Build as `/capabilities`.
- Keep the narrative positioning around domestic vetted manufacturing partners and precision CNC.
- Fill in currently blank capability accordions with real categories:
  - CNC milling: 3-axis, 4-axis, 5-axis
  - CNC turning / mill-turn
  - sheet metal / laser cutting / forming, if intended
  - welding/fabrication, if intended
  - inspection / CMM / first article inspection
  - material traceability / certifications
- Fix spelling.

Screenshot captured:

- `/Users/willsclaw/.hermes/profiles/adam/cache/screenshots/browser_screenshot_06cbefe049c24cb0ac22329e04d79dd6.png`

### 10. `test_page_dashboard`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/test_page_dashboard`

Title: `Dashboard Surface`

Visible purpose:

- Alternate dashboard/test surface with account footer.

Visible content:

- Similar dashboard metrics to `index`:
  - `Active RFQs` = `34`
  - `Orders` = `1,253`
  - `Shipped` = `+912`
  - `Alerts` = `4`
- Similar `Transactions` and `Orders` lists.
- Greeting: `Hi William`.
- Sidebar labels differ slightly:
  - Manage section uses `Quotes` and `Orders` rather than `Our Quotes` / `Our Orders`.
- Account/footer area visible:
  - `William Paik`
  - `william.paik@amogy.co`

Local carryover:

- Use this page as a better dashboard personalization reference than `index` because it shows `Hi William` and an account footer area.
- Keep production sidebar labels aligned with the main `index`/reference unless William prefers the shorter `Quotes` / `Orders` labels.

### 11. `materialscatalog_page`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/materialscatalog_page`

Title: `Available Materials`

Visible purpose:

- Full materials catalog/resource page.

Visible layout/content:

- Shared sidebar.
- Large heading: `Material Catalog`.
- Intro copy:
  - Lattice uses supplier partnerships and consolidated purchasing power for competitive material pricing across stainless, nickel alloys, aluminum, and specialty grades.
  - Direct mill/authorized distributor relationships provide wholesale pricing without restrictive MOQs.
  - Every material supplied with traceability, mill certifications, and compliance documentation.
  - Result: reliable availability, verified quality, wholesale pricing without wholesale MOQs.
- Wide accordion-style material cards, each with title, body text, and chevron.
- Visible material categories:
  - Aluminum
  - Stainless steel
  - Mild steel
  - Brass
  - Copper
  - Alloy steel
  - Tool steel
  - Titanium
  - Inconel/Incoloy

Important material content to carry over:

- Aluminum: strength-to-weight, corrosion resistance, machinability; 6061, 7075, 2024; ASTM/AMS/project-specific requirements.
- Stainless steel: oil & gas, energy, food processing, industrial equipment; 303/304/316; ASTM/ASME compliance.
- Mild steel: strength, weldability, cost efficiency; structural/industrial/general fabrication; frames/supports/heavy equipment.
- Brass: machinability, corrosion resistance, electrical conductivity; fittings/valves/instrumentation/precision components.
- Copper: electrical/thermal conductivity; heat exchangers, bus bars, high-conductivity components.
- Alloy steel: strength/toughness/fatigue resistance; shafts/gears/fasteners/high-load components.
- Tool steel: hardness/wear resistance/dimensional stability; dies/molds/cutting tools/forming equipment.
- Titanium: high strength, low density, corrosion resistance; aerospace/energy/marine/high-performance industrial.
- Inconel/Incoloy: extreme temperature/pressure/corrosion; oil & gas, energy, aerospace, chemical processing.

Visible/likely behavior:

- Material cards are likely clickable/expandable accordions.

Local carryover:

- Build as `/materials`.
- Store materials as typed local data first; later convert to database-backed catalog if users manage it.
- Reuse the same material data in RFQ dropdowns.

Screenshot captured:

- `/Users/willsclaw/.hermes/profiles/adam/cache/screenshots/browser_screenshot_769997fc01db43c0aaf60e10cad4b857.png`

### 12. `thank_you_page`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/thank_you_page`

Visible content:

- Only `Built on Bubble` appears.

Local carryover:

- Build later as post-submit confirmation if needed.
- Current local flow can redirect to queue/detail page or show inline success.

### 13. `materialspage_-_copy`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/materialspage_-_copy`

Title: `Available Materials`

Visible purpose:

- Older/incomplete material page variant.

Visible content:

- Heading: `Materials`.
- Same intro copy as material catalog.
- Only a few material cards/rows visible:
  - Aluminum
  - Stainless steel
  - Stainless steel repeated
- The `Aluminum` card appears to contain stainless-steel copy, indicating this page is likely a broken copy/experiment.

Local carryover:

- Do not emulate this directly.
- Use `materialscatalog_page` as canonical material reference.

### 14. `reset_pw`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/reset_pw`

Visible purpose:

- Password reset page.

Visible content:

- Heading: `Reset your password`
- Fields:
  - `New password`
  - `Confirm new password`
- Button: `Confirm`

Local carryover:

- Auth can be deferred until core app flows are ready.
- When auth is added, this maps to the auth provider's password reset flow rather than custom Bubble UI.

### 15. `my_orders`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/my_orders`

Visible purpose:

- Buyer/order tracking page.

Visible content:

- Shared sidebar.
- Main heading: `MY ORDERS`
- Subtitle: `Track the status of your purchases`
- No visible order list/cards/table in the preview.

Local carryover:

- Build as `/orders` later.
- First local version can show order status cards/table once quote acceptance exists.
- For now, a placeholder route can preserve navigation continuity.

### 16. `404`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/404`

Visible content:

- `Oops! 404 error`
- Bubble boilerplate explanation.

Local carryover:

- Replace with a polished local `not-found.tsx` eventually.

### 17. `my_quotes_`

Preview URL: `https://nexus-77465.bubbleapps.io/version-test/my_quotes_`

Visible purpose:

- Buyer quote/RFQ tracking page.

Visible content:

- Shared sidebar.
- Main heading: `My Quotes`
- Subtitle: `Track the status of your submitted RFQs`
- No visible quote list/table/cards in the preview.

Local carryover:

- Build as `/quotes` or map existing `/operator/requests` depending on role separation.
- For buyer portal, `/quotes` should show the buyer's submitted RFQs and quote statuses.
- For internal operator work, keep `/operator/requests` as the quote/RFQ queue.

---

## Reusable elements inferred from rendered pages

From page behavior and prior editor page list, useful reusable elements to implement locally are:

- `AppShell` / sidebar navigation.
- `DashboardMetricCard`.
- `ActivityList` / inbox rows.
- `QuoteStatusList` / transaction rows.
- `CadUploadDropzone`.
- `CustomerDetailsFormSection`.
- `MaterialAccordionCard`.
- `CapabilityAccordionCard`.
- RFQ dropdown components/data for:
  - materials
  - tolerance
  - surface finish
  - quality documentation

## Local build order recommended from audit

### Phase 1: emulate visible Bubble IA and resources

1. Make the app shell route links real:
   - `/`
   - `/analytics`
   - `/projects`
   - `/quotes`
   - `/orders`
   - `/materials`
   - `/capabilities`
   - `/requests/new`
2. Build `/materials` from `materialscatalog_page` using typed local data and accordion cards.
3. Build `/capabilities` from `fabrication_capabilities`, filling the blank Bubble accordions with useful capability categories.
4. Update `/requests/new` to more closely emulate Bubble's upload-first RFQ flow while replacing placeholder/debug text with clean copy.
5. Add `/quotes` and `/orders` placeholders with the Bubble headings/subtitles, then enrich with realistic RFQ/order rows.

### Phase 2: make it operational rather than just visual

1. Connect `/requests/new` submissions to the existing request model/persistence.
2. Show submitted RFQs in `/quotes` for buyer view and `/operator/requests` for operator view.
3. Add quote/order status lifecycle.
4. Reuse material/capability catalog data in RFQ form dropdowns.
5. Add auth/team/account only after the core RFQ path is useful.

## Key translation decisions

- `materialscatalog_page` is canonical; `materialspage_-_copy` is not.
- `test_page_dashboard` has useful personalization/account details, but `index` is the canonical main route.
- `request_quote` is the highest-value Bubble page, but it is visibly unfinished; local should emulate the flow, not the debug copy.
- `analytics`, `project_management`, `my_quotes_`, and `my_orders` mostly provide navigation/heading intent, not full content.
- Empty/tutorial/boilerplate pages should not slow down core local build.
