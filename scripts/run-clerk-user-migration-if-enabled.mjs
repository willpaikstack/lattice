import { spawnSync } from "node:child_process";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const enabled = process.env.LATTICE_RUN_CLERK_USER_MIGRATION === "true";

if (!enabled) {
  console.log("Skipping one-time Clerk user migration.");
  process.exit(0);
}

if (process.env.VERCEL !== "1") {
  console.error("Refusing to run the one-time Clerk migration outside Vercel Production.");
  process.exit(1);
}

if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_live_")) {
  console.error("Refusing to run the one-time Clerk migration without a Clerk Production secret key.");
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: process.cwd(), env: process.env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function duplicateGroupCount(table, column) {
  const existence = await prisma.$queryRawUnsafe(
    `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${table}' AND column_name = '${column}') AS "exists"`,
  );
  if (!existence[0]?.exists) return 0;

  const rows = await prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS "count" FROM (SELECT "${column}" FROM "${table}" WHERE "${column}" IS NOT NULL GROUP BY "${column}" HAVING COUNT(*) > 1) AS duplicates`,
  );
  return Number(rows[0]?.count ?? 0);
}

try {
  // Prisma labels the additive unique constraints as potential data loss. Check
  // the exact affected columns before explicitly accepting that schema change.
  const duplicateGroups = await Promise.all([
    duplicateGroupCount("Company", "customerId"),
    duplicateGroupCount("User", "clerkUserId"),
    duplicateGroupCount("User", "pendingEmail"),
  ]);

  if (duplicateGroups.some((count) => count > 0)) {
    console.error("Refusing the migration because existing duplicate identity values require manual resolution.");
    process.exit(1);
  }
} finally {
  await prisma.$disconnect();
}

console.log("Production duplicate checks passed. Applying the Prisma schema before the one-time Clerk user migration.");
run("npx", ["prisma", "db", "push", "--accept-data-loss"]);

console.log("Migrating existing Lattice users to Clerk Production.");
run(process.execPath, ["scripts/migrate-clerk-users.mjs", "--use-current-env", "--confirm"]);
