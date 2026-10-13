import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { purgeLegacyRfqValues } from '../src/lib/purge-legacy-rfq-values.ts';
const vars = dotenv.parse(await fs.readFile('.env.local'));
const connection = new URL(vars.DATABASE_URL);
// Exact endpoint from the local development configuration inspected for this task.
if (connection.hostname !== 'ep-wild-meadow-aytj335s-pooler.c-5.us-east-2.aws.neon.tech') throw new Error('Development endpoint mismatch; refusing cleanup.');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: vars.DATABASE_URL }) });
const report = { requests: 0, parts: 0, sharedDrafts: 0, localFiles: [] };
try {
  await db.$transaction(async tx => {
    report.requests = (await tx.request.updateMany({ data: { requesterName: '', dueDate: null, process: '' } })).count;
    const parts = await tx.requestLineItem.findMany({ select: { id: true, notes: true } });
    for (const part of parts) await tx.requestLineItem.update({ where: { id: part.id }, data: { partName: '', notes: part.notes.split(/\r?\n/).filter(line => !/^\s*Customer PO#:/i.test(line)).join('\n') } });
    report.parts = parts.length;
    const drafts = await tx.customerRequestDraft.findMany({ select: { id: true, contents: true } });
    for (const draft of drafts) {
      const cleaned = purgeLegacyRfqValues(draft.contents);
      if (JSON.stringify(cleaned) !== JSON.stringify(draft.contents)) {
        await tx.customerRequestDraft.update({ where: { id: draft.id }, data: { contents: cleaned } });
        report.sharedDrafts++;
      }
    }
  }, { timeout: 30000 });
  const remaining = await db.customerRequestDraft.findMany({ select: { contents: true } });
  if (remaining.some(draft => JSON.stringify(purgeLegacyRfqValues(draft.contents)) !== JSON.stringify(draft.contents))) throw new Error('Shared draft cleanup did not settle.');
} finally { await db.$disconnect(); }
for (const file of ['.data/requests.json', '.data/mock/requests.json']) {
  let raw;
  try { raw = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
  const data = JSON.parse(raw);
  const cleaned = purgeLegacyRfqValues(data);
  const staging = `${file}.purging`;
  await fs.writeFile(staging, JSON.stringify(cleaned, null, 2));
  await fs.rename(staging, file);
  report.localFiles.push({ file, records: Array.isArray(data) ? data.length : Object.keys(data).length });
}
console.log(JSON.stringify(report));
