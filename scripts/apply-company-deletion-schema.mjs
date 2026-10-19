import { readFileSync } from "node:fs";
import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("Supply DATABASE_URL using the intended environment file.");
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const counts = 'SELECT (SELECT count(*) FROM "Company") AS companies, (SELECT count(*) FROM "User") AS users, (SELECT count(*) FROM "Request") AS requests';
  const before = (await db.query(counts)).rows[0];
  await db.query(readFileSync(new URL("./company-deletion-schema-2026-10-16.sql", import.meta.url), "utf8"));
  const after = (await db.query(counts)).rows[0];
  if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Record counts changed during schema application; inspect concurrent writes.");
  console.log("Company-deletion snapshot column is ready. Existing record counts unchanged:", after);
} finally {
  await db.end();
}
