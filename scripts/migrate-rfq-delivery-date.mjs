import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Usage: node scripts/migrate-rfq-delivery-date.mjs /absolute/path/to/environment-file
// Credentials remain in the named ignored environment file and are never logged.
if (!process.argv[2]) throw new Error("Provide the target environment file explicitly.");
dotenv.config({ path: process.argv[2], override: true, quiet: true });
if (!process.env.DATABASE_URL) throw new Error("The target has no DATABASE_URL.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const count = await db.$executeRawUnsafe(fs.readFileSync(new URL("./rfq-delivery-date-schema-2026-10-15.sql", import.meta.url), "utf8"));
  console.log(`Delivery-date schema migration complete: ${count} part records updated.`);
} finally { await db.$disconnect(); }
