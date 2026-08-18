import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function valueFor(flag) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage:\n  npm run migrate:clerk-users -- --env-file .env.production.local --dry-run\n  npm run migrate:clerk-users -- --env-file .env.production.local --confirm\n\nThe production schema must be applied first with:\n  npx dotenv-cli -e .env.production.local -- prisma db push`);
  process.exit(1);
}

const envFile = valueFor("--env-file");
const shouldConfirm = process.argv.includes("--confirm");
const isDryRun = process.argv.includes("--dry-run") || !shouldConfirm;

if (!envFile) usage("--env-file is required so Production credentials are never read from the development environment.");

const loaded = dotenv.config({ path: envFile, override: true });
if (loaded.error) usage(`Could not read ${envFile}.`);

const databaseUrl = process.env.DATABASE_URL;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!databaseUrl?.startsWith("postgres")) usage("DATABASE_URL must point to a PostgreSQL database.");
if (!clerkSecretKey?.startsWith("sk_live_")) usage("CLERK_SECRET_KEY must be a Clerk Production secret key (sk_live_…).");

function clerkName(name) {
  const [firstName = "Lattice", ...lastNameParts] = name.trim().split(/\s+/);
  return { first_name: firstName, last_name: lastNameParts.join(" ") || undefined };
}

async function clerkRequest(path, options = {}) {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.ok) return response.status === 204 ? null : response.json();

  const body = await response.text();
  throw new Error(`Clerk ${options.method ?? "GET"} ${path} failed (${response.status}): ${body.slice(0, 300)}`);
}

async function findClerkUserByEmail(email) {
  const payload = await clerkRequest(`/users?email_address=${encodeURIComponent(email)}&limit=1`);
  const users = Array.isArray(payload) ? payload : payload.data ?? [];
  return users[0] ?? null;
}

async function createClerkUser(user) {
  const { first_name, last_name } = clerkName(user.name);
  return clerkRequest("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [user.email],
      external_id: user.id,
      first_name,
      ...(last_name ? { last_name } : {}),
      // Existing password hashes cannot be transferred. Users can sign in with
      // a matching Google account or use Clerk's password-recovery flow.
      skip_password_requirement: true,
      skip_legal_checks: true,
    }),
  });
}

async function setClerkExternalId(clerkUserId, externalId) {
  return clerkRequest(`/users/${encodeURIComponent(clerkUserId)}`, {
    method: "PATCH",
    body: JSON.stringify({ external_id: externalId }),
  });
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

try {
  const users = await prisma.user.findMany({
    select: { clerkUserId: true, email: true, id: true, name: true, role: true },
    orderBy: { email: "asc" },
  });

  const summary = { created: 0, linked: 0, skipped: 0 };
  console.log(`${isDryRun ? "Dry run: would migrate" : "Migrating"} ${users.length} Lattice user(s).`);

  for (const user of users) {
    if (user.clerkUserId) {
      summary.skipped += 1;
      console.log(`Skip ${user.email}: already linked.`);
      continue;
    }

    const existing = await findClerkUserByEmail(user.email);
    if (existing?.external_id && existing.external_id !== user.id) {
      throw new Error(`Clerk user for ${user.email} is already linked to a different Lattice user.`);
    }

    if (isDryRun) {
      console.log(`${existing ? "Link" : "Create"} ${user.email} (${user.role}).`);
      continue;
    }

    const clerkUser = existing ?? (await createClerkUser(user));
    if (!clerkUser.external_id) await setClerkExternalId(clerkUser.id, user.id);
    await prisma.user.update({ where: { id: user.id }, data: { clerkUserId: clerkUser.id } });
    summary[existing ? "linked" : "created"] += 1;
    console.log(`${existing ? "Linked" : "Created"} ${user.email}.`);
  }

  console.log(`Complete. Created: ${summary.created}; linked: ${summary.linked}; skipped: ${summary.skipped}.`);
  if (!isDryRun) {
    console.log("Users can sign in with a matching Google account or use Clerk's password-recovery flow to set a password.");
  }
} finally {
  await prisma.$disconnect();
}
