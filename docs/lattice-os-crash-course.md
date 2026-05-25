# Lattice OS Crash Course / Cheat Sheet

Audience: William, as product/operator/founder learning enough web-app literacy to confidently guide Lattice OS without needing to become a full-time software engineer.

This is not a coding textbook. It is the minimum operating vocabulary and mental model needed to follow, review, and make good decisions while we build Lattice OS.

---

## 0. The 30-second summary

Lattice OS is a web application.

A web application is made of:

1. **Screens** — pages the user sees in the browser.
2. **Components** — reusable pieces of those screens, like forms, cards, tables, buttons.
3. **Backend/API routes** — hidden endpoints that receive requests from the browser and perform work.
4. **Business logic** — rules like “a draft cannot appear in the operator queue” or “a request needs at least one line item.”
5. **Database** — durable storage for companies, requests, files, quotes, suppliers, POs, etc.
6. **Configuration/deployment** — settings and scripts that let the app run locally or on a server/AWS.

In this project:

- **Next.js** runs the web app.
- **React** builds the user interface.
- **TypeScript** is the programming language.
- **Tailwind CSS** styles the interface.
- **Prisma** talks to the database.
- **PostgreSQL** stores the data.
- **Vitest** runs automated tests.

### What each tool does, in plain English

Think of Lattice OS like a manufacturing operation:

- **PostgreSQL** is the filing cabinet / system of record.
- **Prisma** is the clerk who knows how to file and retrieve records safely.
- **TypeScript** is the shared operating language used to write the instructions.
- **React** is the workbench where the visible screens are assembled.
- **Tailwind CSS** is the visual labeling/layout system that makes the screens readable and consistent.
- **Next.js** is the building that contains the whole operation: public pages, internal pages, backend routes, and server behavior.
- **Vitest** is the inspection station that checks whether the rules still work after we make changes.

A slightly deeper explanation:

#### Next.js — the web app framework

**What it is:** Next.js is the main framework that organizes and runs the web application.

It decides things like:

- what URL routes exist, such as `/requests/new` or `/operator/requests`
- which page appears at each route
- which backend API routes exist, such as `/api/requests`
- how the app is built for production
- how browser-facing code and server-side code fit together

**In Lattice OS:** Next.js is why a folder like this can become a real page:

```text
src/app/requests/new/page.tsx
```

That file maps to this URL:

```text
/requests/new
```

**How it differs from React:** React builds the pieces of the interface. Next.js decides where those pieces live, how users reach them through URLs, and how the app runs as a complete website/application.

#### React — the user interface builder

**What it is:** React is the tool used to build the visible interface: forms, buttons, cards, tables, dashboards, status badges, and page sections.

React lets us split a screen into reusable pieces called **components**.

Example components in a procurement app might be:

- `RequestForm`
- `OperatorQueue`
- `StatusBadge`
- `LineItemTable`
- `SupplierCard`

**In Lattice OS:** React controls what the buyer and operator see and interact with. When a buyer types into a form, clicks submit, or sees validation errors, that visible experience is built with React.

**How it differs from Next.js:** React is mostly concerned with the screen itself. Next.js is concerned with the whole app structure: routes, pages, API endpoints, server behavior, and production build.

#### TypeScript — the programming language

**What it is:** TypeScript is the language we write most of the app in. It is JavaScript with an added safety layer called **types**.

A type says what shape data is supposed to have.

For example, a request might be expected to have:

```text
title: text
companyName: text
status: submitted / in review / ready for supplier RFQ
lineItems: list of parts or services
```

TypeScript helps catch mistakes before the app runs. If one part of the app expects a request title, but another part sends a number or leaves the title out, TypeScript can often warn us early.

**In Lattice OS:** TypeScript helps keep the procurement workflow precise. Requests, statuses, companies, line items, and notes all need consistent structure.

**How it differs from React/Next.js:** React and Next.js are tools/frameworks. TypeScript is the language used to write instructions for those tools.

#### Tailwind CSS — the styling system

**What it is:** Tailwind CSS controls how the interface looks: spacing, colors, borders, font sizes, layout, shadows, and responsive behavior.

CSS means “Cascading Style Sheets.” It is the styling layer of the web.

Tailwind gives us small reusable style labels directly in the code. For example, a button might have styling instructions that mean:

```text
blue background
white text
rounded corners
medium padding
slightly darker blue on hover
```

**In Lattice OS:** Tailwind is what makes the operator queue readable, the cards visually separated, the forms spaced properly, and status labels feel consistent.

**How it differs from React:** React decides *what* appears on the screen. Tailwind decides *how it looks*.

#### PostgreSQL — the database

**What it is:** PostgreSQL, often called Postgres, is the durable database. It stores the actual business records.

Examples of data Lattice OS needs to store:

- companies
- buyer requests
- line items
- uploaded files
- suppliers
- supplier quotes
- internal notes
- purchase orders
- status history

“Durable” means the data should still exist after the browser closes, the server restarts, or a new operator logs in.

**In Lattice OS:** Postgres is the source of truth. If a buyer submits a request, the request should live in Postgres, not only in someone’s browser.

**How it differs from Prisma:** Postgres is the actual storage system. Prisma is the tool the app uses to talk to that storage system.

#### Prisma — the database translator

**What it is:** Prisma is a database toolkit. It helps the TypeScript app read from and write to PostgreSQL without manually writing raw database commands for every operation.

Instead of making the app speak directly in database language, Prisma gives us a safer TypeScript-friendly way to say things like:

```text
create a request
find all submitted requests
update this request status
attach this note to this request
```

Prisma also has a schema file:

```text
prisma/schema.prisma
```

That file describes the database structure: what tables exist, what fields they have, and how records relate to each other.

**In Lattice OS:** Prisma is what lets the `/api/requests` route save a buyer request into Postgres and later load it into the operator queue.

**How it differs from PostgreSQL:** PostgreSQL stores the data. Prisma is the app-side tool that talks to PostgreSQL in a structured way.

#### Vitest — the automated test runner

**What it is:** Vitest runs automated tests. Tests are small checks that confirm the app’s rules still work.

Examples of rules we can test:

- a request cannot be submitted without required fields
- a submitted request appears in the operator queue
- a draft request does not appear in the operator queue
- statuses move in allowed order
- line item totals or quote comparisons are calculated correctly

**In Lattice OS:** Vitest helps us avoid breaking important procurement behavior as we add features. It is especially useful for business logic: status transitions, validation rules, filtering, sorting, and workflow rules.

**How it differs from the others:** Vitest is not part of the product experience itself. Buyers and suppliers do not use Vitest. It is a quality-control tool for us while building.

### How they fit together in one request flow

When a buyer submits a request in Lattice OS, the stack works like this:

```text
Buyer opens /requests/new
  ↓
Next.js serves the page for that URL
  ↓
React renders the request form
  ↓
Tailwind CSS makes the form readable and styled
  ↓
The form code, written in TypeScript, sends the request to /api/requests
  ↓
Next.js handles that backend API route
  ↓
Prisma validates the database operation and sends it to Postgres
  ↓
PostgreSQL stores the request permanently
  ↓
The operator queue loads submitted requests back from Postgres through Prisma
  ↓
React displays the request in the operator queue
  ↓
Vitest tests the important rules so future changes do not break the flow
```

### The simplest difference between them

```text
Next.js      = app structure, routes, pages, backend endpoints
React        = visible interface components
TypeScript   = programming language and safety checks
Tailwind CSS = visual styling
Prisma       = app-to-database translator
PostgreSQL   = durable data storage
Vitest       = automated quality checks
```

---

## 1. The Lattice OS project folder

Project root:

```text
/Users/willsclaw/lattice-os
```

When you open the project in VS Code or Finder, this is the main folder.

Important top-level files/folders:

```text
lattice-os/
  src/                 Main app code
  prisma/              Database schema
  public/              Static assets like icons/images
  docs/                Human-facing explanation docs like this one
  package.json         Project commands and dependency list
  README.md            Short project summary and run instructions
  .env.example         Example configuration variables
  docker-compose.yml   Local Postgres/MinIO service definitions
  Dockerfile           Container/deployment setup
```

Folders you usually ignore:

```text
node_modules/          Installed third-party packages. Do not edit.
.next/                 Generated Next.js build output. Do not edit.
.git/                  Git internals. Do not edit manually.
```

---

## 2. How to read the folder structure

The most important folder is:

```text
src/
```

Inside it:

```text
src/
  app/          Pages, URL routes, API endpoints
  components/   Reusable UI pieces
  lib/          Business logic, database logic, helper functions
```

### Rule of thumb

- If it is a **screen URL**, look in `src/app/`.
- If it is a **visual piece of UI**, look in `src/components/`.
- If it is **rules, data transformations, or database access**, look in `src/lib/`.
- If it is **database structure**, look in `prisma/schema.prisma`.

---

## 3. The current Lattice OS app flow

Current working slice:

```text
Buyer creates request
  ↓
Request form submits to API
  ↓
API validates/builds request
  ↓
Prisma saves request to Postgres
  ↓
Operator queue loads submitted requests
  ↓
Operator sees request in queue
```

Current visible pages:

```text
/                         Command center/home
/requests/new             Buyer request creation form
/operator/requests        Internal operator queue
```

Current backend/API route:

```text
/api/requests             Saves and loads requests
```

---

## 4. Core terms you need to know

### Browser

The app window the user interacts with, usually Chrome/Safari.

Example: a buyer opens `/requests/new` in the browser.

### Frontend

The part of the app the user sees and clicks.

Examples:

- forms
- buttons
- tables
- dashboards
- navigation

In Lattice OS, frontend code mostly lives in:

```text
src/app/
src/components/
```

### Backend

The hidden server-side part of the app. It receives data, applies rules, talks to the database, and returns results.

In Lattice OS, backend code mostly lives in:

```text
src/app/api/
src/lib/request-repository.ts
src/lib/prisma.ts
```

### API

An API is a structured way for the frontend to ask the backend to do something.

Example:

- Frontend says: “Create this request.”
- API receives: buyer company, part name, quantity, file reference.
- Backend saves it.
- API returns: created request.

Current Lattice API route:

```text
src/app/api/requests/route.ts
```

### Database

The durable storage system.

For Lattice OS, this is PostgreSQL.

Plain English: if we restart the app, data should still be there because it is in the database.

### Schema

The database blueprint.

In Lattice OS:

```text
prisma/schema.prisma
```

This defines tables/models like:

- Company
- User
- Request
- RequestLineItem
- UploadedFile
- StatusEvent

### Model

A data object type.

Example: `Request` is a model. It has fields like:

- title
- process
- dueDate
- status
- requesterName
- lineItems
- files

### Component

A reusable UI block.

Example:

```text
src/components/request-form.tsx
```

is a component that renders the buyer request form.

### Route

A URL path in the app.

Example:

```text
/operator/requests
```

is a route. In Next.js, routes are created by folders/files inside `src/app/`.

### Server

The running process that serves the app to the browser.

When we run:

```bash
npm run dev
```

we start a local development server, usually at:

```text
http://localhost:3000
```

### Localhost

Your own computer pretending to be a web server.

`http://localhost:3000` means “open the app running on this machine.”

---

## 5. Technology cheat sheet

### Next.js

What it is: the web app framework.

Why we use it: it lets us build frontend pages and backend API routes in one codebase.

Where you see it:

```text
src/app/page.tsx
src/app/requests/new/page.tsx
src/app/api/requests/route.ts
```

Mental model:

> Next.js decides what page or API endpoint responds to each URL.

---

### React

What it is: the UI system.

Why we use it: it lets us build interactive screens out of components.

Where you see it:

```text
src/components/request-form.tsx
src/components/operator-queue.tsx
```

Mental model:

> React components are reusable UI blocks.

---

### TypeScript

What it is: JavaScript with types.

Why we use it: it helps catch mistakes before the app runs.

Example concept:

If a request status must be one of:

```text
DRAFT
SUBMITTED
NEEDS_INFO
READY_FOR_SUPPLIER_RFQ
```

TypeScript helps prevent accidental invalid statuses like:

```text
READY
DONE
SENTT
```

Mental model:

> TypeScript is guardrails for code.

---

### Tailwind CSS

What it is: styling system.

Why we use it: fast visual styling directly in the component code.

You will see strings like:

```text
rounded-xl border bg-white/5 px-4 py-3 text-white
```

These are visual style instructions.

Mental model:

> Tailwind controls how things look.

Do not worry about memorizing it. Treat it as visual formatting.

---

### Prisma

What it is: database toolkit.

Why we use it: lets TypeScript code read/write PostgreSQL without writing raw SQL all the time.

Where you see it:

```text
prisma/schema.prisma
src/lib/prisma.ts
src/lib/request-repository.ts
```

Mental model:

> Prisma is the bridge between app code and the database.

---

### PostgreSQL / Postgres

What it is: the database.

Why we use it: reliable, standard, production-grade storage.

Mental model:

> Postgres is where real Lattice business data lives.

---

### npm

What it is: Node.js package/command manager.

Why we use it: runs project commands and installs dependencies.

Important commands:

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run db:push
```

Mental model:

> npm is the project command console.

---

### Git

What it is: version control.

Why we use it: tracks code changes over time.

Important concepts:

- **diff** — what changed
- **commit** — saved checkpoint
- **branch** — separate line of work
- **repo** — project under version control

Mental model:

> Git is the project’s time machine and change ledger.

---

## 6. File-by-file map for Lattice OS

### `README.md`

Short human-readable project summary.

Read this first when you return to the project.

---

### `package.json`

Project command/dependency file.

Important section:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint",
  "test": "vitest run",
  "prisma:generate": "prisma generate",
  "db:push": "prisma db push"
}
```

Plain English:

- `npm run dev` starts the app
- `npm test` runs tests
- `npm run build` checks production build
- `npm run db:push` syncs the database structure

---

### `src/app/page.tsx`

Home page / command center.

URL:

```text
/
```

---

### `src/app/requests/new/page.tsx`

Buyer request creation page.

URL:

```text
/requests/new
```

Usually this file will be short because it renders a component from `src/components/`.

---

### `src/components/request-form.tsx`

The buyer request form.

If we change fields on the request creation form, this is a key file.

Examples of changes that belong here:

- rename “File reference” to “CAD/drawing reference”
- add a “target price” field
- add a “priority” dropdown
- improve form layout

---

### `src/app/operator/requests/page.tsx`

Operator queue page.

URL:

```text
/operator/requests
```

This page asks the backend for submitted requests and renders the queue.

---

### `src/components/operator-queue.tsx`

The visible queue list.

Examples of changes that belong here:

- show priority badge
- show assigned owner
- show request age
- add missing info indicator
- change card/table layout

---

### `src/app/api/requests/route.ts`

API endpoint for requests.

This is hidden from normal users but used by the app.

Current behavior:

- `POST` creates a submitted request
- `GET` lists operator-visible requests

Examples of changes that belong here:

- reject invalid request data
- add authentication checks
- return more detailed error messages

---

### `src/lib/request-model.ts`

Core request definitions and rules.

This is one of the most important files.

It defines concepts like:

- request statuses
- line item shape
- uploaded file shape
- operator review shape
- how to build a draft request
- how to submit a draft request

Examples of changes that belong here:

- add a new status
- require material before submission
- require at least one file before submission
- define what an operator review contains

---

### `src/lib/request-queue.ts`

Rules for what appears in the operator queue.

Examples:

- show only submitted requests
- hide drafts
- sort newest first

---

### `src/lib/request-persistence.ts`

Translator between app objects and database objects.

Plain English:

> This file converts Lattice request data into the format Prisma/Postgres expects, and converts database records back into the app’s request format.

---

### `src/lib/request-repository.ts`

Database operations for requests.

Examples:

- create submitted request
- list operator requests
- later: update operator review
- later: mark ready for supplier RFQ

---

### `src/lib/prisma.ts`

Prisma database client setup.

You usually do not change this often.

---

### `prisma/schema.prisma`

Database schema.

If we add major data concepts, this file changes.

Examples:

- Supplier
- SupplierRFQ
- SupplierQuote
- PurchaseOrder
- UploadedFile storage metadata
- User roles
- Company workspaces

---

### Test files

Examples:

```text
src/lib/request-model.test.ts
src/lib/request-queue.test.ts
src/lib/request-persistence.test.ts
```

These are automated checks.

Plain English:

> Tests are executable acceptance criteria for important logic.

If a test fails, something changed in a way that may be unsafe.

---

## 7. How a request moves through the app

Current flow by file:

```text
1. User opens /requests/new
   src/app/requests/new/page.tsx

2. Page renders request form
   src/components/request-form.tsx

3. User submits form
   src/components/request-form.tsx

4. Form sends POST to /api/requests
   src/app/api/requests/route.ts

5. API calls repository
   src/lib/request-repository.ts

6. Repository builds database payload
   src/lib/request-persistence.ts

7. Prisma writes to Postgres
   src/lib/prisma.ts
   prisma/schema.prisma

8. Operator opens /operator/requests
   src/app/operator/requests/page.tsx

9. Page loads requests from repository
   src/lib/request-repository.ts

10. Queue displays requests
   src/components/operator-queue.tsx
```

If you remember only one thing, remember this flow.

---

## 8. How to review new features without being technical

When we add a feature, review it in five layers.

### 1. User outcome

Ask:

- What can the user do now?
- Which user is this for: buyer, operator, supplier, admin?
- What changed in the workflow?

Example:

> Operators can now mark a request as missing information and add a note.

---

### 2. Screen impact

Ask:

- Which URL changed?
- What page should I open?
- What button/form/table changed?

Example:

```text
/operator/requests/[id]
```

---

### 3. Data impact

Ask:

- What new data is stored?
- Is it durable in Postgres?
- Which table/model owns it?

Example:

> Missing-info notes are stored on Request.internalNotes.

---

### 4. State/status impact

Ask:

- What statuses can this object have?
- What transitions are allowed?
- What should happen next in the workflow?

Example:

```text
SUBMITTED → NEEDS_INFO
SUBMITTED → READY_FOR_SUPPLIER_RFQ
```

---

### 5. Verification

Ask:

- What tests passed?
- Was the actual page opened in a browser?
- Was the database checked if persistence matters?

Minimum acceptable verification for serious workflow changes:

```bash
npm test
npm run lint
npm run build
```

And browser verification of the exact changed route.

---

## 9. Common commands cheat sheet

Run these from the project root:

```text
/Users/willsclaw/lattice-os
```

### Install packages

```bash
npm install
```

Use when dependencies are missing or after pulling changes.

---

### Start local app

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

### Run tests

```bash
npm test
```

Use after business logic changes.

---

### Check code style

```bash
npm run lint
```

Use before committing or after edits.

---

### Check production build

```bash
npm run build
```

Use before saying a feature is production-build-safe.

---

### Regenerate Prisma client

```bash
npm run prisma:generate
```

Use after changing:

```text
prisma/schema.prisma
```

---

### Push schema to local database

```bash
npm run db:push
```

Use after database schema changes when developing locally.

---

## 10. What “done” means for a feature

For Lattice OS, a feature is not done just because code exists.

A feature is done when:

1. The intended user workflow works on the actual page.
2. Data persists correctly if persistence matters.
3. Tests pass.
4. Lint passes.
5. Build passes.
6. The changed route has been manually/browser verified.
7. The next state of the workflow is clear.

For example, “operator review detail flow” would be done only when:

- operator can open a specific request
- see full details
- assign owner
- add notes
- mark missing info or ready for supplier RFQ
- changes persist in Postgres
- queue reflects updated state
- tests/build pass

---

## 11. Product vocabulary vs code vocabulary

Mapping the business to code:

```text
Buyer request            Request model/table
Part                     RequestLineItem model/table
CAD/drawing/file         UploadedFile model/table
Status history           StatusEvent model/table
Customer/company         Company model/table
Internal review          Operator review fields on Request
Operator queue           /operator/requests route + request-queue logic
Supplier outreach        Future SupplierRFQ model/route
Supplier quote           Future SupplierQuote model/route
Purchase order           Future PurchaseOrder model/route
```

This mapping matters because every product feature eventually becomes:

- a page/component
- some business rules
- some database fields/tables
- tests

---

## 12. How to ask for changes effectively

Good request format:

```text
User: operator
Page: /operator/requests
Goal: help operators identify incomplete RFQs faster
Change: add a priority/missing-info badge to each request card
Data needed: missingInfoCount or completeness status
Acceptance: submitted request with missing info shows red badge; complete request shows green badge
```

Even simpler:

```text
On the operator queue, I want to see which requests are missing info before supplier outreach.
```

Then I can translate that into code changes.

---

## 13. What not to worry about yet

You do not need to deeply understand yet:

- React rendering internals
- Next.js caching details
- TypeScript generics
- Prisma adapter internals
- bundlers/build systems
- deployment infrastructure details
- CSS utility syntax

You only need enough to understand:

- where a change belongs
- what user workflow it affects
- what data it touches
- how we know it works

---

## 14. The roadmap from here, technically

The likely next build sequence:

### Slice 1 — Done/current

Buyer request creation → Postgres → operator queue.

### Slice 2 — Next

Operator request detail/review page.

Likely files:

```text
src/app/operator/requests/[id]/page.tsx
src/components/operator-request-detail.tsx
src/lib/request-repository.ts
src/lib/request-model.ts
```

### Slice 3

Operator marks request ready for supplier RFQ.

Likely changes:

- status transition rules
- review fields
- status events
- update API route

### Slice 4

Supplier RFQ tracking.

Likely new database models:

```text
Supplier
SupplierRFQ
SupplierRFQRecipient
```

### Slice 5

Supplier quote comparison.

Likely new database models:

```text
SupplierQuote
QuoteLineItem
```

### Slice 6

Customer quote package / decision matrix.

### Slice 7

Purchase order and post-award tracking.

---

## 15. The one-page cheat sheet

### Where things live

```text
Screens/routes:        src/app/
UI blocks:             src/components/
Business rules:        src/lib/
Database schema:       prisma/schema.prisma
Project commands:      package.json
Project summary:       README.md
Environment examples:  .env.example
```

### Key current URLs

```text
/                         Home
/requests/new             Buyer request form
/operator/requests        Operator queue
/api/requests             Backend request API
```

### Key commands

```bash
npm run dev      # start app
npm test         # run tests
npm run lint     # check code style
npm run build    # production build check
npm run db:push  # sync database schema
```

### Key question for any feature

```text
Who is the user?
What page do they use?
What action do they take?
What data changes?
What status changes?
How do we verify it worked?
```

### Your role as product owner/operator

You do not need to write code. Your highest-value role is to define:

- the workflow
- the statuses
- the required fields
- the handoff between buyer/operator/supplier/customer
- what counts as complete vs incomplete
- what operators need to see to make decisions
- what evidence proves the feature works

My role is to translate that into code, tests, and verified running behavior.
