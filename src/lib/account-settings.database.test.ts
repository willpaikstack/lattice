// @vitest-environment node
// Opt-in only: LATTICE_ACCOUNT_SETTINGS_DB_AUDIT=true node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/account-settings.database.test.ts
import { readFileSync } from "node:fs";
import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getPrismaClient: vi.fn(), getCurrentSession: vi.fn() }));
vi.mock("./prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));
vi.mock("./session", () => ({ getCurrentSession: mocks.getCurrentSession }));
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: "audit-clerk" }), currentUser: async () => ({ hasImage: false }) }));
import { getAccountSettings, contactSnapshotFromAccountSettings, saveAccountSettings } from "./account-settings";
import { billingSnapshotFromAccountSettings, requestBillToLines } from "./request-billing";
import { buildSubmittedRequestCreateInput, mapStoredRequest, storedRequestInclude, type StoredRequest } from "./request-persistence";

const include = { ...storedRequestInclude, lineItems: { orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] }, files: { orderBy: [{ createdAt: "asc" as const }, { id: "asc" as const }] } } satisfies Prisma.RequestInclude;
const mapRow = (value: unknown) => mapStoredRequest(value as StoredRequest);

describe.skipIf(process.env.LATTICE_ACCOUNT_SETTINGS_DB_AUDIT !== "true")("real PostgreSQL settings audit (rolled back)", () => {
  it("persists edits, propagates across company members, isolates other companies, and preserves old RFQ snapshots", async () => {
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
    const rollback = new Error("AUDIT_ROLLBACK");
    let assertionsCompleted = false;
    const createdCompanyIds: string[] = [];
    try {
      await db.$transaction(async (tx) => {
        const company = await tx.company.create({ data: { name: "Synthetic settings audit", shippingName: "Receiving", shippingCompany: "Synthetic audit", shippingAddress1: "Old shipping", shippingCity: "New York", shippingState: "NY", shippingZipCode: "10001", billingName: "AP", billingCompany: "Synthetic audit", billingAddress1: "Old billing", billingCity: "New York", billingState: "NY", billingZipCode: "10001", billingEmail: "old-ap@example.invalid" } });
        const other = await tx.company.create({ data: { name: "Synthetic isolated company", shippingAddress1: "Other address" } });
        createdCompanyIds.push(company.id, other.id);
        mocks.getPrismaClient.mockResolvedValue(tx);
        const session = { user: { id: `qa-settings-${company.id}`, name: "Synthetic buyer", email: "buyer@example.invalid", companyId: company.id, companyName: company.name, role: "customer", customerRole: "admin" } };
        mocks.getCurrentSession.mockImplementation(async () => session);
        const before = await getAccountSettings();
        const requestData = (settings: typeof before) => buildSubmittedRequestCreateInput({ title: "Synthetic persistence audit", requesterName: settings.name, buyerCompany: settings.companyName, contact: contactSnapshotFromAccountSettings(settings), billingSnapshot: billingSnapshotFromAccountSettings(settings), lineItems: [{ partName: "Synthetic part", material: "Aluminum", quantity: 1 }], files: [{ name: "synthetic.step", sizeBytes: 1, type: "model/step" }] }, { buyerCompanyId: company.id });
        const old = await tx.request.create({ data: requestData(before), include });
        const oldSnapshot = mapRow(old);
        const legacy = await tx.request.create({ data: { ...requestData(before), billingSnapshot: Prisma.DbNull } });
        const billingBackfill = readFileSync(new URL("../../scripts/account-settings-schema-2026-10-15.sql", import.meta.url), "utf8").split(";")[1].trim() + " AND r.id = $1";
        expect(await tx.$executeRawUnsafe(billingBackfill, legacy.id)).toBe(1);
        expect(requestBillToLines(mapRow(await tx.request.findUniqueOrThrow({ where: { id: legacy.id }, include })))).toContain("Old billing");
        const shipping = { ...before.shipping, address1: "Updated shipping" };
        await saveAccountSettings({ ...before, shipping }, "shipping");
        await saveAccountSettings({ ...before, billingAddress: { ...before.billingAddress, address1: "Updated billing" } }, "billingAddress");
        await saveAccountSettings({ ...before, billing: { email: "updated-ap@example.invalid", invoiceRoutingNotes: "Reference the PO" } }, "billing");
        await saveAccountSettings({ ...before, phone: "555-0102" }, "phone");
        const after = await getAccountSettings();
        expect(await tx.$executeRawUnsafe(billingBackfill, legacy.id)).toBe(0);
        expect(requestBillToLines(mapRow(await tx.request.findUniqueOrThrow({ where: { id: legacy.id }, include })))).toContain("Old billing");
        expect(after.shipping.address1).toBe("Updated shipping");
        expect(after.billingAddress.address1).toBe("Updated billing");
        expect(after.billing.email).toBe("updated-ap@example.invalid");
        expect(after.phone).toBe("555-0102");
        const unchanged = mapRow(await tx.request.findUniqueOrThrow({ where: { id: old.id }, include }));
        expect(unchanged).toEqual(oldSnapshot);
        const created = mapRow(await tx.request.create({ data: requestData(after), include }));
        expect(created.shipToAddress1).toBe("Updated shipping");
        expect(requestBillToLines(created)).toContain("Updated billing");
        expect(requestBillToLines(created)).toContain("updated-ap@example.invalid");
        expect(unchanged.shipToAddress1).toBe("Old shipping");
        expect(requestBillToLines(unchanged)).toContain("Old billing");
        session.user.id += "-member"; session.user.customerRole = "member";
        const member = await getAccountSettings();
        expect(member.shipping).toEqual(after.shipping);
        expect(member.billingAddress).toEqual(after.billingAddress);
        expect(member.billing).toEqual(after.billing);
        expect(member.phone).toBe("");
        expect((await tx.company.findUniqueOrThrow({ where: { id: other.id } })).shippingAddress1).toBe("Other address");
        await expect(saveAccountSettings({ ...member, shipping: { ...shipping, address1: "Forbidden" }, canManageCompanyDefaults: true }, "shipping")).rejects.toThrow("Only a Customer Admin");
        assertionsCompleted = true;
        throw rollback;
      }, { timeout: 30000 });
    } catch (error) { if (error !== rollback) throw error; }
    finally {
      try { expect(await db.company.count({ where: { id: { in: createdCompanyIds } } })).toBe(0); }
      finally { await db.$disconnect(); }
    }
    expect(assertionsCompleted).toBe(true);
  }, 40000);
});
