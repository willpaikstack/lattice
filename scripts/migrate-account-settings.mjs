import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Explicit target only. Never print credentials or customer data.
if (!process.argv[2]) throw new Error("Provide the target environment file explicitly.");
dotenv.config({ path: process.argv[2], override: true, quiet: true });
if (!process.env.DATABASE_URL) throw new Error("The target has no DATABASE_URL.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const statements = fs.readFileSync(new URL("./account-settings-schema-2026-10-15.sql", import.meta.url), "utf8").split(";").map((sql) => sql.trim()).filter(Boolean);
  const results = await db.$transaction(statements.map((sql) => db.$executeRawUnsafe(sql)));
  console.log(`Account settings migration complete; ${results.at(-1)} existing billing snapshots preserved.`);
} finally { await db.$disconnect(); }
