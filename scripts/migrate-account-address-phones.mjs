import fs from "node:fs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
if (!process.argv[2]) throw new Error("Provide the target environment file explicitly.");
dotenv.config({ path: process.argv[2], override: true, quiet: true });
if (!process.env.DATABASE_URL) throw new Error("The target has no DATABASE_URL.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const statements = fs.readFileSync(new URL("./account-address-phones-2026-10-16.sql", import.meta.url), "utf8").split(";").map((sql) => sql.trim()).filter(Boolean);
  await db.$transaction(statements.map((sql) => db.$executeRawUnsafe(sql)));
  console.log("Address contact phone schema applied; existing address/request values unchanged.");
} finally { await db.$disconnect(); }
