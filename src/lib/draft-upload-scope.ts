import { createHash } from "node:crypto";

type DraftSession = { user: { role: string; id: string; companyId: string | null } };
export function draftUploadFolder(session: DraftSession) {
  const owner = session.user.role === "customer" ? session.user.companyId : `admin:${session.user.id}`;
  if (!owner) throw new Error("A customer company is required before uploading files.");
  return `rfq-drafts/${createHash("sha256").update(owner).digest("hex")}`;
}
export function ownsDraftUpload(session: DraftSession, key: string) {
  if (!session.user.companyId && session.user.role === "customer") return false;
  return key.startsWith(`${draftUploadFolder(session)}/`) && !key.split("/").some((part) => part === "." || part === "..");
}
