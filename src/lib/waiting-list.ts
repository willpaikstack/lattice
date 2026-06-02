import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPrismaClient } from "./prisma";

export type WaitingListEntryInput = {
  name: string;
  email: string;
  company: string;
  procurementNeeds: string;
};

export type WaitingListEntry = WaitingListEntryInput & {
  id: string;
  joinedAt: string;
};

export type WaitingListRequestResult =
  | {
      status: "created";
      entry: WaitingListEntry;
    }
  | {
      status: "already-requested";
      entry: WaitingListEntry;
    }
  | {
      status: "domain-already-requested";
      requestedEntry: WaitingListEntry;
      existingEntry: WaitingListEntry;
    };

export type WaitingListRequestConflict =
  | {
      status: "already-requested";
      entry: WaitingListEntry;
    }
  | {
      status: "domain-already-requested";
      existingEntry: WaitingListEntry;
    }
  | null;

const storePath = path.join(process.cwd(), ".data", "waiting-list.json");

type StoredWaitingListEntry = {
  id: string;
  name: string;
  email: string;
  company: string;
  procurementNeeds: string;
  joinedAt: Date | string;
};

async function prisma() {
  return (await getPrismaClient()) as {
    waitingListEntry: {
      create: (args: unknown) => Promise<StoredWaitingListEntry>;
      findMany: (args: unknown) => Promise<StoredWaitingListEntry[]>;
    };
  };
}

function clean(value: string) {
  return value.trim();
}

function emailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function buildEntry(input: WaitingListEntryInput): WaitingListEntry {
  const entry: WaitingListEntry = {
    id: randomUUID(),
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    company: clean(input.company),
    procurementNeeds: clean(input.procurementNeeds),
    joinedAt: new Date().toISOString(),
  };

  if (!entry.name || !entry.email || !entry.company || !entry.procurementNeeds) {
    throw new Error("Waiting list requests require a name, email, company, and procurement needs.");
  }

  return entry;
}

function mapStoredEntry(entry: StoredWaitingListEntry): WaitingListEntry {
  return {
    ...entry,
    joinedAt: entry.joinedAt instanceof Date ? entry.joinedAt.toISOString() : entry.joinedAt,
  };
}

async function readEntriesFromDisk(): Promise<WaitingListEntry[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WaitingListEntry[]) : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeEntriesToDisk(entries: WaitingListEntry[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
}

export async function listWaitingListEntries() {
  try {
    const client = await prisma();
    const entries = await client.waitingListEntry.findMany({
      orderBy: {
        joinedAt: "desc",
      },
    });

    return entries.map(mapStoredEntry);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using local waiting-list data.", error);
      const entries = await readEntriesFromDisk();
      return entries.sort((left, right) => new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime());
    }

    throw error;
  }
}

export async function createWaitingListEntry(input: WaitingListEntryInput) {
  const entry = buildEntry(input);

  try {
    const client = await prisma();
    const storedEntry = await client.waitingListEntry.create({
      data: entry,
    });

    return mapStoredEntry(storedEntry);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; saving waiting-list entry locally.", error);
      const entries = await readEntriesFromDisk();
      await writeEntriesToDisk([entry, ...entries.filter((candidate) => candidate.email !== entry.email)]);
      return entry;
    }

    throw error;
  }
}

export function findWaitingListRequestConflict(requestedEntry: WaitingListEntry, entries: WaitingListEntry[]): WaitingListRequestConflict {
  const existingEmailEntry = entries.find((entry) => entry.email === requestedEntry.email);

  if (existingEmailEntry) {
    return {
      status: "already-requested",
      entry: existingEmailEntry,
    };
  }

  const requestedDomain = emailDomain(requestedEntry.email);
  const existingDomainEntry = requestedDomain
    ? entries.find((entry) => emailDomain(entry.email) === requestedDomain)
    : undefined;

  if (existingDomainEntry) {
    return {
      status: "domain-already-requested",
      existingEntry: existingDomainEntry,
    };
  }

  return null;
}

export async function requestWaitingListAccess(input: WaitingListEntryInput): Promise<WaitingListRequestResult> {
  const requestedEntry = buildEntry(input);
  const entries = await listWaitingListEntries();
  const conflict = findWaitingListRequestConflict(requestedEntry, entries);

  if (conflict?.status === "already-requested") {
    return {
      status: "already-requested",
      entry: conflict.entry,
    };
  }

  if (conflict?.status === "domain-already-requested") {
    return {
      status: "domain-already-requested",
      requestedEntry,
      existingEntry: conflict.existingEntry,
    };
  }

  const entry = await createWaitingListEntry(input);

  return {
    status: "created",
    entry,
  };
}
