import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { defaultAccountSettings, type AccountAddress, type AccountSettingsSnapshot, type PaymentCard } from "./account-settings-shared";
import { getPrismaClient } from "./prisma";
import type { RequestContactSnapshot } from "./request-model";
import { getStripeClient, isStripeConfigured, stripePaymentMethodCardSnapshot } from "./stripe";

type StoredAccountDefaults = {
  billingAddress1: string;
  billingAddress2: string;
  billingCity: string;
  billingCompany: string;
  billingEmail: string;
  billingInvoiceRoutingNotes: string;
  billingName: string;
  billingState: string;
  billingZipCode: string;
  companyName?: string;
  email: string;
  id: string;
  mfaEnabled: boolean;
  name: string;
  passwordChangedAt: string;
  phone: string;
  stripeCustomerId?: string;
  shippingAddress1: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingCompany: string;
  shippingName: string;
  shippingState: string;
  shippingZipCode: string;
};

const accountDefaultsId = "workspace";
const localStorePath = path.join(process.cwd(), ".data", "account-settings.json");

function text(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function normalizeAddress(address: AccountAddress): AccountAddress {
  return {
    address1: text(address.address1),
    address2: text(address.address2),
    city: text(address.city),
    company: text(address.company),
    name: text(address.name),
    state: text(address.state),
    zipCode: text(address.zipCode),
  };
}

export function normalizeAccountSettings(settings: AccountSettingsSnapshot): AccountSettingsSnapshot {
  return {
    billing: {
      email: text(settings.billing.email),
      invoiceRoutingNotes: text(settings.billing.invoiceRoutingNotes),
    },
    billingAddress: normalizeAddress(settings.billingAddress),
    cards: settings.cards,
    companyName: text(settings.companyName) || defaultAccountSettings().companyName,
    email: text(settings.email),
    mfaEnabled: Boolean(settings.mfaEnabled),
    name: text(settings.name),
    passwordChangedAt: text(settings.passwordChangedAt),
    phone: text(settings.phone),
    shipping: normalizeAddress(settings.shipping),
    stripeCustomerId: text(settings.stripeCustomerId),
    teamMembers: settings.teamMembers,
  };
}

function fromStoredAccountDefaults(stored: StoredAccountDefaults): AccountSettingsSnapshot {
  const defaults = defaultAccountSettings();

  return normalizeAccountSettings({
    ...defaults,
    billing: {
      email: stored.billingEmail,
      invoiceRoutingNotes: stored.billingInvoiceRoutingNotes,
    },
    billingAddress: {
      address1: stored.billingAddress1,
      address2: stored.billingAddress2,
      city: stored.billingCity,
      company: stored.billingCompany,
      name: stored.billingName,
      state: stored.billingState,
      zipCode: stored.billingZipCode,
    },
    email: stored.email,
    companyName: stored.companyName || defaults.companyName,
    mfaEnabled: stored.mfaEnabled,
    name: stored.name,
    passwordChangedAt: stored.passwordChangedAt,
    phone: stored.phone,
    stripeCustomerId: stored.stripeCustomerId ?? "",
    shipping: {
      address1: stored.shippingAddress1,
      address2: stored.shippingAddress2,
      city: stored.shippingCity,
      company: stored.shippingCompany,
      name: stored.shippingName,
      state: stored.shippingState,
      zipCode: stored.shippingZipCode,
    },
  });
}

function toStoredAccountDefaults(settings: AccountSettingsSnapshot) {
  const normalized = normalizeAccountSettings(settings);

  return {
    billingAddress1: normalized.billingAddress.address1,
    billingAddress2: normalized.billingAddress.address2,
    billingCity: normalized.billingAddress.city,
    billingCompany: normalized.billingAddress.company,
    billingEmail: normalized.billing.email,
    billingInvoiceRoutingNotes: normalized.billing.invoiceRoutingNotes,
    billingName: normalized.billingAddress.name,
    billingState: normalized.billingAddress.state,
    billingZipCode: normalized.billingAddress.zipCode,
    companyName: normalized.companyName,
    email: normalized.email,
    id: accountDefaultsId,
    mfaEnabled: normalized.mfaEnabled,
    name: normalized.name,
    passwordChangedAt: normalized.passwordChangedAt,
    phone: normalized.phone,
    stripeCustomerId: normalized.stripeCustomerId,
    shippingAddress1: normalized.shipping.address1,
    shippingAddress2: normalized.shipping.address2,
    shippingCity: normalized.shipping.city,
    shippingCompany: normalized.shipping.company,
    shippingName: normalized.shipping.name,
    shippingState: normalized.shipping.state,
    shippingZipCode: normalized.shipping.zipCode,
  };
}

async function readLocalAccountSettings() {
  try {
    const raw = await readFile(localStorePath, "utf8");
    return normalizeAccountSettings({ ...defaultAccountSettings(), ...JSON.parse(raw) } as AccountSettingsSnapshot);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return defaultAccountSettings();
    }
    if (error instanceof SyntaxError) {
      return defaultAccountSettings();
    }
    throw error;
  }
}

async function writeLocalAccountSettings(settings: AccountSettingsSnapshot) {
  await mkdir(path.dirname(localStorePath), { recursive: true });
  await writeFile(localStorePath, `${JSON.stringify(normalizeAccountSettings(settings), null, 2)}\n`, "utf8");
}

async function prisma() {
  return (await getPrismaClient()) as {
    accountDefaults: {
      findUnique: (args: unknown) => Promise<StoredAccountDefaults | null>;
      upsert: (args: unknown) => Promise<StoredAccountDefaults>;
    };
  };
}

export async function getAccountSettings() {
  try {
    const client = await prisma();
    const stored = await client.accountDefaults.findUnique({ where: { id: accountDefaultsId } });

    return stored ? fromStoredAccountDefaults(stored) : await readLocalAccountSettings();
  } catch {
    return readLocalAccountSettings();
  }
}

export async function saveAccountSettings(settings: AccountSettingsSnapshot) {
  const normalized = normalizeAccountSettings(settings);
  const stored = toStoredAccountDefaults(normalized);

  try {
    const client = await prisma();
    await client.accountDefaults.upsert({
      create: stored,
      update: stored,
      where: { id: accountDefaultsId },
    });
  } catch {
    await writeLocalAccountSettings(normalized);
  }

  return normalized;
}

export async function ensureStripeCustomerForAccount() {
  const settings = await getAccountSettings();

  if (settings.stripeCustomerId) {
    return { customerId: settings.stripeCustomerId, settings };
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: settings.email || undefined,
    name: settings.companyName || settings.name || undefined,
    metadata: {
      accountDefaultsId,
      companyName: settings.companyName,
    },
  });
  const nextSettings = await saveAccountSettings({ ...settings, stripeCustomerId: customer.id });

  return { customerId: customer.id, settings: nextSettings };
}

export async function listStripePaymentCards(): Promise<PaymentCard[]> {
  if (!isStripeConfigured()) {
    return [];
  }

  const { customerId } = await ensureStripeCustomerForAccount();
  const stripe = getStripeClient();
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data
    .map(stripePaymentMethodCardSnapshot)
    .filter((card): card is PaymentCard => Boolean(card));
}

export function contactSnapshotFromAccountSettings(settings: AccountSettingsSnapshot): RequestContactSnapshot {
  return {
    requesterEmail: settings.email,
    requesterPhone: settings.phone,
    shipToAddress1: settings.shipping.address1,
    shipToAddress2: settings.shipping.address2,
    shipToCity: settings.shipping.city,
    shipToCompany: settings.shipping.company,
    shipToName: settings.shipping.name || settings.name,
    shipToPhone: settings.phone,
    shipToState: settings.shipping.state,
    shipToZipCode: settings.shipping.zipCode,
  };
}
