import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPrismaClient } from "./prisma";

export type MaterialInquiryStatus = "NEW" | "REVIEWING" | "RESOLVED";

export type MaterialInquiryInput = {
  company: string;
  intendedUse: string;
  materialName: string;
  notes?: string;
  quantity?: string;
  requesterEmail: string;
  requesterName: string;
  specification?: string;
  stockForm?: string;
};

export type MaterialInquiry = MaterialInquiryInput & {
  createdAt: string;
  id: string;
  notes: string;
  operatorNotes: string;
  quantity: string;
  specification: string;
  status: MaterialInquiryStatus;
  stockForm: string;
  updatedAt: string;
};

type StoredMaterialInquiry = Omit<MaterialInquiry, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

const storePath = path.join(process.cwd(), ".data", "material-inquiries.json");
const materialInquiryStatuses = new Set<MaterialInquiryStatus>(["NEW", "REVIEWING", "RESOLVED"]);

async function prisma() {
  return (await getPrismaClient()) as {
    materialInquiry: {
      create: (args: unknown) => Promise<StoredMaterialInquiry>;
      findMany: (args: unknown) => Promise<StoredMaterialInquiry[]>;
      update: (args: unknown) => Promise<StoredMaterialInquiry>;
    };
  };
}

function clean(value: string | undefined) {
  return String(value ?? "").trim();
}

function mapStoredInquiry(inquiry: StoredMaterialInquiry): MaterialInquiry {
  return {
    ...inquiry,
    createdAt: inquiry.createdAt instanceof Date ? inquiry.createdAt.toISOString() : inquiry.createdAt,
    updatedAt: inquiry.updatedAt instanceof Date ? inquiry.updatedAt.toISOString() : inquiry.updatedAt,
  };
}

export function buildMaterialInquiry(input: MaterialInquiryInput): MaterialInquiry {
  const now = new Date().toISOString();
  const inquiry: MaterialInquiry = {
    company: clean(input.company),
    createdAt: now,
    id: randomUUID(),
    intendedUse: clean(input.intendedUse),
    materialName: clean(input.materialName),
    notes: clean(input.notes),
    operatorNotes: "",
    quantity: clean(input.quantity),
    requesterEmail: clean(input.requesterEmail).toLowerCase(),
    requesterName: clean(input.requesterName),
    specification: clean(input.specification),
    status: "NEW",
    stockForm: clean(input.stockForm),
    updatedAt: now,
  };

  if (!inquiry.materialName || !inquiry.company || !inquiry.intendedUse || !inquiry.requesterEmail || !inquiry.requesterName) {
    throw new Error("Material inquiries require a material, company, intended use, and requester contact.");
  }

  return inquiry;
}

export function isMaterialInquiryStatus(value: string): value is MaterialInquiryStatus {
  return materialInquiryStatuses.has(value as MaterialInquiryStatus);
}

async function readInquiriesFromDisk(): Promise<MaterialInquiry[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MaterialInquiry[]) : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeInquiriesToDisk(inquiries: MaterialInquiry[]) {
  const sorted = [...inquiries].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
}

export async function createMaterialInquiry(input: MaterialInquiryInput) {
  const inquiry = buildMaterialInquiry(input);

  try {
    const client = await prisma();
    const stored = await client.materialInquiry.create({ data: inquiry });
    return mapStoredInquiry(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; saving material inquiry locally.", error);
      const inquiries = await readInquiriesFromDisk();
      await writeInquiriesToDisk([inquiry, ...inquiries]);
      return inquiry;
    }

    throw error;
  }
}

export async function listMaterialInquiries() {
  try {
    const client = await prisma();
    const inquiries = await client.materialInquiry.findMany({ orderBy: { createdAt: "desc" } });
    return inquiries.map(mapStoredInquiry);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using local material inquiry data.", error);
      return (await readInquiriesFromDisk()).sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    }

    throw error;
  }
}

export async function updateMaterialInquiry(id: string, status: MaterialInquiryStatus, operatorNotes: string) {
  const inquiryId = clean(id);
  const notes = clean(operatorNotes);

  if (!inquiryId || !isMaterialInquiryStatus(status)) {
    throw new Error("A valid material inquiry and status are required.");
  }

  try {
    const client = await prisma();
    const stored = await client.materialInquiry.update({
      data: { operatorNotes: notes, status },
      where: { id: inquiryId },
    });
    return mapStoredInquiry(stored);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; updating material inquiry locally.", error);
      const inquiries = await readInquiriesFromDisk();
      const existing = inquiries.find((inquiry) => inquiry.id === inquiryId);
      if (!existing) {
        throw new Error("Material inquiry not found.");
      }

      const updated: MaterialInquiry = { ...existing, operatorNotes: notes, status, updatedAt: new Date().toISOString() };
      await writeInquiriesToDisk([updated, ...inquiries.filter((inquiry) => inquiry.id !== inquiryId)]);
      return updated;
    }

    throw error;
  }
}
