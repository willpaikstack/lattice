import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
  const entries = await readEntriesFromDisk();
  return entries.sort((left, right) => new Date(right.joinedAt).getTime() - new Date(left.joinedAt).getTime());
}

export async function createWaitingListEntry(input: WaitingListEntryInput) {
  const entry = buildEntry(input);

  const entries = await readEntriesFromDisk();
  await writeEntriesToDisk([entry, ...entries.filter((candidate) => candidate.email !== entry.email)]);

  return entry;
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
  const entries = await readEntriesFromDisk();
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

  await writeEntriesToDisk([requestedEntry, ...entries]);

  return {
    status: "created",
    entry: requestedEntry,
  };
}
