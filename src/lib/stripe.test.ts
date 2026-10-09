import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), settings: vi.fn(), registrations: vi.fn() }));
vi.mock("stripe", () => ({ default: class { accounts = { retrieve: mocks.account }; tax = { settings: { retrieve: mocks.settings }, registrations: { list: mocks.registrations } }; } }));
import { assertStripeMerchantReady, getStripeMerchantReadiness } from "./stripe";
describe("Stripe merchant readiness", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_SECRET_KEY", "test-placeholder");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "test-placeholder");
    vi.stubEnv("STRIPE_MERCHANT_ACCOUNT_ID", "acct_nexus");
    mocks.account.mockResolvedValue({ id: "acct_nexus", charges_enabled: true });
    mocks.settings.mockResolvedValue({ status: "active" });
    mocks.registrations.mockResolvedValue({ data: [{ country: "US", country_options: { us: { state: "NY", type: "state_sales_tax" } } }] });
  });
  it("verifies the credentials' account and active New York registration", async () => {
    expect(await getStripeMerchantReadiness()).toMatchObject({ accountMatches: true, newYorkRegistered: true, ready: true });
    expect(mocks.account).toHaveBeenCalledWith(null);
  });
  it("blocks a different merchant account", async () => {
    mocks.account.mockResolvedValue({ id: "acct_other", charges_enabled: true });
    await expect(assertStripeMerchantReady()).rejects.toThrow("being configured");
  });
  it("blocks missing registration or webhook credentials", async () => {
    mocks.registrations.mockResolvedValue({ data: [] });
    await expect(assertStripeMerchantReady()).rejects.toThrow("being configured");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    expect(await getStripeMerchantReadiness()).toMatchObject({ ready: false, webhookSecretConfigured: false });
  });
  afterEach(() => vi.unstubAllEnvs());
});
