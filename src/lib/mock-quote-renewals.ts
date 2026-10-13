import "server-only";
import type { CustomerSupportRequest } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { isMockDataMode } from "./data-mode";
import type { LatticeRequest } from "./request-model";

type MockRenewal = CustomerSupportRequest & { quoteVersionId: string };
const storePath = path.join(process.cwd(), ".data", "mock", "quote-renewals.json");

export function isMockQuoteRenewal(request: LatticeRequest) {
  return isMockDataMode() && (request.id.startsWith("demo_") || request.id.startsWith("fixture_"));
}

export async function listMockQuoteRenewals(): Promise<MockRenewal[]> {
  if (!isMockDataMode()) return [];
  try {
    const rows = JSON.parse(await readFile(storePath, "utf8")) as MockRenewal[];
    return rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) }));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export async function createMockQuoteRenewal(request: LatticeRequest, user: { id: string; email: string }, notes: string) {
  if (!isMockQuoteRenewal(request)) throw new Error("Mock renewals require an isolated demo quote.");
  const quote = request.customerQuotes.at(-1)!;
  const rows = await listMockQuoteRenewals();
  const existing = rows.find((row) => row.requestId === request.id && row.quoteVersionId === quote.id && row.status === "OPEN");
  if (existing) return existing;
  const now = new Date();
  const ticket: MockRenewal = {
    id: `mock_renewal_${randomUUID()}`, requestId: request.id, quoteVersionId: quote.id,
    companyId: request.buyerCompanyId || `admin:${user.id}`, userId: user.id, email: user.email,
    issueType: "QUOTE_RENEWAL", status: "OPEN", urgency: "normal", followUp: "workspace", emailDelivery: "NOT_REQUESTED",
    message: `[LOCAL DEMO ONLY] Please renew ${quote.quoteNumber}, version ${quote.versionNumber}, for ${request.title}. Confirm updated pricing and lead time.${notes ? `\n\nCustomer notes: ${notes}` : ""}`,
    createdAt: now, updatedAt: now,
  };
  await mkdir(path.dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify([...rows, ticket], null, 2));
  await rename(temporaryPath, storePath);
  return ticket;
}
