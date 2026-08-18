import { spawnSync } from "node:child_process";

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

console.log("Applying the Prisma schema before the one-time Clerk user migration.");
run("npx", ["prisma", "db", "push"]);

console.log("Migrating existing Lattice users to Clerk Production.");
run(process.execPath, ["scripts/migrate-clerk-users.mjs", "--use-current-env", "--confirm"]);
