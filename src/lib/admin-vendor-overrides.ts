import { getPrismaClient } from "./prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

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

async function database() { return await getPrismaClient() as PrismaClient; }

export async function applyOverseasVendorOverrides(vendors: OverseasVendor[]) {
  const rows = await (await database()).adminVendorOverride.findMany({where:{id:{in:vendors.map(v=>v.id)}}});
  const overrides = new Map(rows.map(row => [row.id, row.fields as Partial<OverseasVendorEditableFields>]));
  return vendors.map(vendor => ({...vendor, ...(overrides.get(vendor.id) ?? {})}));
}

export async function getOverseasVendorDetailOverrides(vendorId: string) {
  const row = await (await database()).adminVendorOverride.findUnique({where:{id:vendorId}});
  return (row?.detail ?? {}) as OverseasVendorDetailOverrides;
}

export async function saveOverseasVendorOverride(vendorId: string, input: OverseasVendorSaveInput) {
  if (!input.fields.name) throw new Error("Vendor name is required.");
  const client = await database();
  const previous = await client.adminVendorOverride.findUnique({where:{id:vendorId}});
  const detail = {...(previous?.detail as OverseasVendorDetailOverrides ?? {}), ...Object.fromEntries(Object.entries(input.detail ?? {}).filter(([,value])=>value!==undefined))};
  const data = {fields:input.fields as Prisma.InputJsonValue, detail:detail as Prisma.InputJsonValue};
  return client.adminVendorOverride.upsert({where:{id:vendorId},create:{id:vendorId,...data},update:data});
}
