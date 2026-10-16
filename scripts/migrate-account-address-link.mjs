import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
if (!process.argv[2]) throw new Error("Provide the target environment file explicitly.");
dotenv.config({ path: process.argv[2], override: true, quiet: true });
if (!process.env.DATABASE_URL) throw new Error("The target has no DATABASE_URL.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const statements = fs.readFileSync(new URL("./account-settings-address-link-2026-10-15.sql", import.meta.url), "utf8").split(";").map((sql) => sql.trim()).filter(Boolean);
  await db.$transaction(statements.map((sql) => db.$executeRawUnsafe(sql)));
  console.log("Billing/shipping link preference schema applied; existing addresses unchanged.");
} finally { await db.$disconnect(); }
