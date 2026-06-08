import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { OverseasVendor } from "./admin-vendors";

export type VendorDatabaseRow = {
  id: string;
  leadTime: string;
  parts: string;
  response: string;
  selected: string;
  sent: string;
  value: string;
};

export type OverseasVendorEditableFields = Pick<
  OverseasVendor,
  | "capabilities"
  | "certifications"
  | "city"
  | "communicationWindow"
  | "country"
  | "defectRate"
  | "fabCapabilities"
  | "materials"
  | "name"
  | "nonFabOfferings"
  | "notes"
  | "onboardingStatus"
  | "onTimeDeliveryRate"
  | "paymentTerms"
  | "phoneNumber"
  | "primaryCapability"
  | "primaryContact"
  | "primaryEmail"
  | "qmsStandard"
  | "qualitySystem"
  | "region"
  | "relationshipOwner"
  | "shippingLane"
  | "vendorDocs"
  | "vendorType"
  | "website"
  | "wechatId"
>;

export type OverseasVendorDetailOverrides = {
  orderRows?: VendorDatabaseRow[];
  rfqRows?: VendorDatabaseRow[];
};

export type OverseasVendorSaveInput = {
  detail?: OverseasVendorDetailOverrides;
  fields: OverseasVendorEditableFields;
};

type StoredVendorOverride = {
  detail?: OverseasVendorDetailOverrides;
  fields: Partial<OverseasVendorEditableFields>;
  updatedAt: string;
};

type StoredVendorOverrides = {
  vendors: Record<string, StoredVendorOverride>;
};

const storePath = path.join(process.cwd(), ".data", "admin-vendor-overrides.json");
const onboardingStatuses: OverseasVendor["onboardingStatus"][] = ["Onboarded", "Pilot active", "Docs pending", "Needs intake"];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanList(value: unknown) {
  return Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
}

function cleanDatabaseRows(value: unknown): VendorDatabaseRow[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.map((row) => {
    const candidate = row && typeof row === "object" ? (row as Record<string, unknown>) : {};

    return {
      id: clean(candidate.id),
      leadTime: clean(candidate.leadTime),
      parts: clean(candidate.parts),
      response: clean(candidate.response),
      selected: clean(candidate.selected),
      sent: clean(candidate.sent),
      value: clean(candidate.value),
    };
  });
}

function cleanOnboardingStatus(value: unknown): OverseasVendor["onboardingStatus"] {
  return onboardingStatuses.includes(value as OverseasVendor["onboardingStatus"]) ? (value as OverseasVendor["onboardingStatus"]) : "Needs intake";
}

export function pickEditableVendorFields(vendor: OverseasVendor): OverseasVendorEditableFields {
  return {
    capabilities: vendor.capabilities,
    certifications: vendor.certifications,
    city: vendor.city,
    communicationWindow: vendor.communicationWindow,
    country: vendor.country,
    defectRate: vendor.defectRate,
    fabCapabilities: vendor.fabCapabilities,
    materials: vendor.materials,
    name: vendor.name,
    nonFabOfferings: vendor.nonFabOfferings,
    notes: vendor.notes,
    onboardingStatus: vendor.onboardingStatus,
    onTimeDeliveryRate: vendor.onTimeDeliveryRate,
    paymentTerms: vendor.paymentTerms,
    phoneNumber: vendor.phoneNumber,
    primaryCapability: vendor.primaryCapability,
    primaryContact: vendor.primaryContact,
    primaryEmail: vendor.primaryEmail,
    qmsStandard: vendor.qmsStandard,
    qualitySystem: vendor.qualitySystem,
    region: vendor.region,
    relationshipOwner: vendor.relationshipOwner,
    shippingLane: vendor.shippingLane,
    vendorDocs: vendor.vendorDocs,
    vendorType: vendor.vendorType,
    website: vendor.website,
    wechatId: vendor.wechatId,
  };
}

export function normalizeVendorSaveInput(input: unknown): OverseasVendorSaveInput {
  const candidate = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const rawFields = candidate.fields && typeof candidate.fields === "object" ? (candidate.fields as Record<string, unknown>) : {};
  const rawDetail = candidate.detail && typeof candidate.detail === "object" ? (candidate.detail as Record<string, unknown>) : {};

  return {
    detail: {
      orderRows: cleanDatabaseRows(rawDetail.orderRows),
      rfqRows: cleanDatabaseRows(rawDetail.rfqRows),
    },
    fields: {
      capabilities: cleanList(rawFields.capabilities),
      certifications: cleanList(rawFields.certifications),
      city: clean(rawFields.city),
      communicationWindow: clean(rawFields.communicationWindow),
      country: clean(rawFields.country),
      defectRate: clean(rawFields.defectRate),
      fabCapabilities: cleanList(rawFields.fabCapabilities),
      materials: cleanList(rawFields.materials),
      name: clean(rawFields.name),
      nonFabOfferings: cleanList(rawFields.nonFabOfferings),
      notes: clean(rawFields.notes),
      onboardingStatus: cleanOnboardingStatus(rawFields.onboardingStatus),
      onTimeDeliveryRate: clean(rawFields.onTimeDeliveryRate),
      paymentTerms: clean(rawFields.paymentTerms),
      phoneNumber: clean(rawFields.phoneNumber),
      primaryCapability: clean(rawFields.primaryCapability),
      primaryContact: clean(rawFields.primaryContact),
      primaryEmail: clean(rawFields.primaryEmail),
      qmsStandard: clean(rawFields.qmsStandard),
      qualitySystem: clean(rawFields.qualitySystem),
      region: clean(rawFields.region),
      relationshipOwner: clean(rawFields.relationshipOwner),
      shippingLane: clean(rawFields.shippingLane),
      vendorDocs: cleanList(rawFields.vendorDocs),
      vendorType: cleanList(rawFields.vendorType),
      website: clean(rawFields.website),
      wechatId: clean(rawFields.wechatId),
    },
  };
}

async function readOverridesFromDisk(): Promise<StoredVendorOverrides> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredVendorOverrides>;
    return {
      vendors: parsed.vendors && typeof parsed.vendors === "object" ? parsed.vendors : {},
    };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { vendors: {} };
    }

    if (error instanceof SyntaxError && process.env.NODE_ENV === "development") {
      console.warn("Local vendor override data is not valid JSON; ignoring it.", error);
      return { vendors: {} };
    }

    throw error;
  }
}

async function writeOverridesToDisk(overrides: StoredVendorOverrides) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(overrides, null, 2)}\n`, "utf8");
}

export async function applyOverseasVendorOverrides(vendors: OverseasVendor[]) {
  const overrides = await readOverridesFromDisk();

  return vendors.map((vendor) => ({
    ...vendor,
    ...(overrides.vendors[vendor.id]?.fields ?? {}),
  }));
}

export async function getOverseasVendorDetailOverrides(vendorId: string) {
  const overrides = await readOverridesFromDisk();
  return overrides.vendors[vendorId]?.detail ?? {};
}

export async function saveOverseasVendorOverride(vendorId: string, input: OverseasVendorSaveInput) {
  if (!input.fields.name) {
    throw new Error("Vendor name is required.");
  }

  const overrides = await readOverridesFromDisk();
  const previous = overrides.vendors[vendorId];

  overrides.vendors[vendorId] = {
    detail: {
      ...(previous?.detail ?? {}),
      ...(input.detail ?? {}),
    },
    fields: input.fields,
    updatedAt: new Date().toISOString(),
  };

  await writeOverridesToDisk(overrides);
  return overrides.vendors[vendorId];
}
