import "server-only";
import { createHash } from "node:crypto";
import { readPrivateStorageRecord, writePrivateStorageRecord } from "./local-file-storage";
import { getCurrentSession } from "./session";
import { customerCompanyForStorageKey } from "./request-access-policy";

type PreviewSession = NonNullable<Awaited<ReturnType<typeof getCurrentSession>>>;

function ownerScope(session: PreviewSession) {
  if (session.user.role === "admin") return `admin:${session.user.id}`;
  if (session.user.role === "customer" && session.user.companyId) return `company:${session.user.companyId}`;
  throw new Error("A customer company is required before creating CAD previews.");
}

function recordKey(kind: "cad-previews" | "cad-sources", value: string) {
  return `internal/${kind}/${createHash("sha256").update(value).digest("hex")}.json`;
}

/** Only server-created translation results establish model ownership. */
export async function registerCadPreview(urn: string, sourceStorageKey?: string) {
  const session = await getCurrentSession();
  if (!session) throw new Error("Authentication required.");
  const sourceCompany = session.user.role === "admin" && sourceStorageKey && !sourceStorageKey.startsWith("rfq-drafts/")
    ? await customerCompanyForStorageKey(sourceStorageKey) : null;
  const record = { urn, ownerScope: sourceCompany ? `company:${sourceCompany}` : ownerScope(session), ...(sourceStorageKey ? { sourceStorageKey } : {}) };
  await writePrivateStorageRecord(recordKey("cad-previews", urn), record);
  if (sourceStorageKey) await writePrivateStorageRecord(recordKey("cad-sources", sourceStorageKey), record);
}

function ownsRecord(session: PreviewSession, record: Record<string, unknown>) {
  return session.user.role === "admin" || (session.user.role === "customer" && session.user.companyId && record.ownerScope === ownerScope(session));
}

export async function canCurrentSessionAccessCadPreview(urn: string) {
  if (!urn || urn.length > 4096) return false;
  const session = await getCurrentSession();
  if (!session || !["admin", "customer"].includes(session.user.role)) return false;
  const record = await readPrivateStorageRecord(recordKey("cad-previews", urn));
  return Boolean(record && record.urn === urn && ownsRecord(session, record));
}

/** Reopening an original file can reuse its server-created secure preview. */
export async function registeredCadPreviewForSource(sourceStorageKey: string) {
  const session = await getCurrentSession();
  if (!session) return null;
  const record = await readPrivateStorageRecord(recordKey("cad-sources", sourceStorageKey));
  if (!record || record.sourceStorageKey !== sourceStorageKey || typeof record.urn !== "string" || !ownsRecord(session, record)) return null;
  return await canCurrentSessionAccessCadPreview(record.urn) ? record.urn : null;
}
