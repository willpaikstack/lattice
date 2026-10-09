import { NextResponse } from "next/server";
import type { Prisma, PrismaClient } from "@prisma/client";
import { getPrismaClient } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
export const dynamic = "force-dynamic";
async function context() {
  const session = await getCurrentSession();
  if (session?.user.role !== "customer" && session?.user.role !== "admin") return null;
  const ownerScope = session.user.role === "customer" ? session.user.companyId : `admin:${session.user.id}`;
  return ownerScope ? { ownerScope, client: await getPrismaClient() as PrismaClient } : null;
}
export async function GET() {
  const ctx = await context(); if (!ctx) return NextResponse.json({ error: "Customer membership required." }, { status: 403 });
  const drafts = await ctx.client.customerRequestDraft.findMany({ where: { ownerScope: ctx.ownerScope }, orderBy: { editedAt: "desc" }, take: 100 });
  const deleted = drafts.filter((draft) => draft.contents && typeof draft.contents === "object" && !Array.isArray(draft.contents) && draft.contents.deleted === true);
  return NextResponse.json({ drafts: drafts.filter((draft) => !deleted.includes(draft)).map((draft) => draft.contents), deletedIds: deleted.map((draft) => draft.id.slice(ctx.ownerScope.length + 1)) });
}
export async function POST(request: Request) {
  const ctx = await context(); if (!ctx) return NextResponse.json({ error: "Customer membership required." }, { status: 403 });
  const raw = await request.text(); if (raw.length > 2_000_000) return NextResponse.json({ error: "Draft package is too large." }, { status: 413 });
  let drafts: unknown; try { drafts = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid draft package." }, { status: 400 }); }
  if (!Array.isArray(drafts) || drafts.length > 100) return NextResponse.json({ error: "Invalid draft package." }, { status: 400 });
  for (const draft of drafts) {
    if (!draft || typeof draft.id !== "string" || !/^local_draft_[a-z0-9_]+$/.test(draft.id) || !draft.request || draft.request.status !== "DRAFT" || typeof draft.updatedAt !== "string" || Number.isNaN(Date.parse(draft.updatedAt))) return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  }
  // Composite storage identity prevents a guessed browser id from overwriting another company's draft.
  for (const draft of drafts) {
    const id = `${ctx.ownerScope}:${draft.id}`;
    const existing = await ctx.client.customerRequestDraft.findUnique({ where: { id } });
    const editedAt = new Date(draft.updatedAt);
    if (existing?.contents && typeof existing.contents === "object" && !Array.isArray(existing.contents) && existing.contents.deleted === true) continue;
    await ctx.client.customerRequestDraft.createMany({ data: [{ id, ownerScope: ctx.ownerScope, contents: draft as Prisma.InputJsonValue, editedAt }], skipDuplicates: true });
    await ctx.client.customerRequestDraft.updateMany({ where: { id, ownerScope: ctx.ownerScope, editedAt: { lte: editedAt }, contents: { path: ["request", "status"], equals: "DRAFT" } }, data: { contents: draft as Prisma.InputJsonValue, editedAt } });
  }
  return NextResponse.json({ saved: true });
}
export async function DELETE(request: Request) {
  const ctx = await context(); if (!ctx) return NextResponse.json({ error: "Customer membership required." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "Draft id required." }, { status: 400 });
  if (!/^local_draft_[a-z0-9_]+$/.test(id)) return NextResponse.json({ error: "Invalid draft id." }, { status: 400 });
  const editedAt = new Date();
  const contents = { id, deleted: true, updatedAt: editedAt.toISOString() };
  await ctx.client.customerRequestDraft.upsert({ where: { id: `${ctx.ownerScope}:${id}` }, create: { id: `${ctx.ownerScope}:${id}`, ownerScope: ctx.ownerScope, editedAt, contents }, update: { editedAt, contents } });
  return NextResponse.json({ deleted: true });
}
