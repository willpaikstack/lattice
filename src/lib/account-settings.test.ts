import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultAccountSettings } from "./account-settings-shared";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), currentUser: vi.fn(), getCurrentSession: vi.fn(), getPrismaClient: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth, currentUser: mocks.currentUser }));
vi.mock("./session", () => ({ getCurrentSession: mocks.getCurrentSession }));
vi.mock("./prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));
import { getAccountSettings, saveAccountSettings } from "./account-settings";

const address = (street: string) => ({ name: "Receiving", company: "Company A", address1: street, address2: "", city: "New York", state: "NY", zipCode: "10001" });
function company(id: string) {
  return { id, name: `Company ${id}`, addressOnboardingDeferredAt: null, billingSameAsShipping: false, shippingPhone: "", billingPhone: "",
    shippingName: "Receiving", shippingCompany: "Company A", shippingAddress1: "Old shipping", shippingAddress2: "", shippingCity: "New York", shippingState: "NY", shippingZipCode: "10001",
    billingName: "Accounts payable", billingCompany: "Company A", billingAddress1: "Old billing", billingAddress2: "", billingCity: "New York", billingState: "NY", billingZipCode: "10001", billingEmail: "ap@company.example", billingInvoiceRoutingNotes: "Old notes" };
}
let companyA: ReturnType<typeof company>;
let companyB: ReturnType<typeof company>;
let session: { user: { id: string; name: string; email: string; companyId: string; companyName: string; role: string; customerRole: string; supportAdmin?: object } };
let storedDefaults: Record<string, unknown> | null;
let db: { $transaction: ReturnType<typeof vi.fn>; $queryRaw: ReturnType<typeof vi.fn>; company: { findUniqueOrThrow: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }; accountDefaults: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> } };

beforeEach(() => {
  companyA = company("A"); companyB = company("B"); storedDefaults = null;
  session = { user: { id: "member-a", name: "Buyer A", email: "buyer@company.example", companyId: "A", companyName: companyA.name, role: "customer", customerRole: "admin" } };
  mocks.auth.mockResolvedValue({ userId: "clerk-a" });
  mocks.currentUser.mockResolvedValue({ hasImage: false, imageUrl: "https://clerk.example/default.png", unsafeMetadata: { latticeAvatarPreset: { colorId: "slate", presetId: "gear" } } });
  mocks.getCurrentSession.mockImplementation(async () => session);
  db = {
    $transaction: vi.fn(async (operation: (tx: typeof db) => Promise<unknown>) => operation(db)),
    $queryRaw: vi.fn().mockResolvedValue([{ id: "A" }]),
    company: { findUniqueOrThrow: vi.fn(async ({ where }) => where.id === "A" ? companyA : companyB), findUnique: vi.fn(async ({ where }) => where.id === "A" ? companyA : companyB), update: vi.fn(async ({ where, data }) => { const row = where.id === "A" ? companyA : companyB; Object.assign(row, data); return row; }) },
    accountDefaults: { findUnique: vi.fn(async () => storedDefaults), upsert: vi.fn(async ({ create, update }) => { storedDefaults = storedDefaults ? { ...storedDefaults, ...update } : create; return storedDefaults; }) },
  };
  mocks.getPrismaClient.mockResolvedValue(db);
});

describe("authenticated account settings persistence", () => {
  it("saves shared defaults for the session company and makes them visible to another member", async () => {
    const before = await getAccountSettings();
    const saved = await saveAccountSettings({ ...before, shipping: address("New shipping"), billingAddress: address("Forged stale billing") }, "shipping");
    expect(saved.shipping.address1).toBe("New shipping");
    expect(companyA.billingAddress1).toBe("Old billing");
    expect(companyB.shippingAddress1).toBe("Old shipping");
    expect(Object.keys(db.company.update.mock.calls[0][0].data)).toEqual(expect.arrayContaining(["shippingAddress1", "shippingName"]));
    expect(db.company.update.mock.calls[0][0].data).not.toHaveProperty("billingAddress1");
    session.user.id = "another-member"; session.user.customerRole = "member";
    expect((await getAccountSettings()).shipping.address1).toBe("New shipping");
  });

  it("does not let a stale phone save overwrite newer shared billing or shipping", async () => {
    const stale = await getAccountSettings();
    await saveAccountSettings({ ...stale, billing: { email: "new-ap@company.example", invoiceRoutingNotes: "New routing" } }, "billing");
    const saved = await saveAccountSettings({ ...stale, phone: "+1 (212) 555-0102", mfaEnabled: true }, "phone");
    expect(saved.phone).toBe("+1 (212) 555-0102");
    expect(saved.billing.email).toBe("new-ap@company.example");
    expect(db.accountDefaults.upsert.mock.calls[0][0].where).toEqual({ id: "user:member-a" });
    expect(db.accountDefaults.upsert.mock.calls[0][0].update).toEqual({ phone: "+1 (212) 555-0102" });
    expect(db.company.update).toHaveBeenCalledTimes(1);
  });

  it("allows Customer Admin billing-address changes after onboarding but keeps company renaming with Lattice Admin", async () => {
    const settings = await getAccountSettings();
    expect(settings.canManageCompanyDefaults).toBe(true);
    expect(settings.canManageCompany).toBe(false);
    const saved = await saveAccountSettings({ ...settings, billingAddress: address("New billing") }, "billingAddress");
    expect(saved.billingAddress.address1).toBe("New billing");
    expect(saved.billing.email).toBe("ap@company.example");
    await expect(saveAccountSettings({ ...settings, companyName: "Renamed" }, "companyName")).rejects.toThrow("Only a Lattice Admin");
  });

  it("updates linked billing from the authoritative shipping edit while preserving AP contact", async () => {
    companyA.billingSameAsShipping = true;
    const settings = await getAccountSettings();
    const saved = await saveAccountSettings({ ...settings, shipping: address("Linked shipping"), billingAddress: address("Stale billing") }, "shipping");
    expect(saved.shipping.address1).toBe("Linked shipping");
    expect(saved.billingAddress.address1).toBe("Linked shipping");
    expect(saved.billing.email).toBe("ap@company.example");
    expect(db.$transaction).toHaveBeenCalledOnce();
    expect(db.$queryRaw).toHaveBeenCalledOnce();
    expect(companyB.shippingAddress1).toBe("Old shipping");
  });

  it("enforces member permissions from the session despite forged client permission flags", async () => {
    session.user.customerRole = "member";
    const settings = await getAccountSettings();
    await expect(saveAccountSettings({ ...settings, canManageCompany: true, canManageCompanyDefaults: true, shipping: address("New") }, "shipping")).rejects.toThrow("Only a Customer Admin");
    await expect(saveAccountSettings({ ...settings, phone: "(212) 555-0104" }, "phone")).resolves.toHaveProperty("phone", "(212) 555-0104");
    expect(db.company.update).not.toHaveBeenCalled();
  });

  it("rejects malformed address/contact writes and surfaces database failures", async () => {
    const settings = await getAccountSettings();
    await expect(saveAccountSettings({ ...settings, shipping: { ...address("New"), city: "" } }, "shipping")).rejects.toThrow("required");
    await expect(saveAccountSettings({ ...settings, billing: { email: "invalid", invoiceRoutingNotes: "" } }, "billing")).rejects.toThrow("valid billing email");
    db.company.update.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(saveAccountSettings({ ...settings, shipping: address("New") }, "shipping")).rejects.toThrow("Database unavailable");
    expect(companyA.shippingAddress1).toBe("Old shipping");
  });

  it("does not confuse Clerk's default image with a customer photo or allow personal changes in support view", async () => {
    const settings = await getAccountSettings();
    expect(settings.profileImageUrl).toBe("");
    expect(settings.avatarPreset?.presetId).toBe("gear");
    session.user.supportAdmin = { id: "operator" };
    const supported = await getAccountSettings();
    expect(supported.avatarPreset).toBeNull();
    expect(supported.canEditPersonalProfile).toBe(false);
    await expect(saveAccountSettings({ ...supported, phone: "555" }, "phone")).rejects.toThrow("support session");
  });

  it("requires authentication before accessing any database record", async () => {
    mocks.auth.mockResolvedValue({ userId: null }); mocks.currentUser.mockResolvedValue(null); mocks.getCurrentSession.mockResolvedValue(null);
    await expect(saveAccountSettings(defaultAccountSettings(), "phone")).rejects.toThrow("Authentication required");
    expect(db.accountDefaults.upsert).not.toHaveBeenCalled();
  });
});
