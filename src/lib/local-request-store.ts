import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LatticeRequest } from "./request-model";
import { sortRequestsNewestFirst } from "./request-queue";

const storePath = path.join(process.cwd(), ".data", "requests.json");

async function readRequestsFromDisk(): Promise<LatticeRequest[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const normalized = raw.replace(/^\uFEFF/, "").trim();
    if (!normalized) {
      return [];
    }

    const parsed = JSON.parse(normalized);
    return Array.isArray(parsed) ? (parsed as LatticeRequest[]) : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    if (error instanceof SyntaxError && process.env.NODE_ENV === "development") {
      console.warn("Local request fallback data is not valid JSON; ignoring it.", error);
      return [];
    }

    throw error;
  }
}

async function writeRequestsToDisk(requests: LatticeRequest[]) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(sortRequestsNewestFirst(requests), null, 2)}\n`, "utf8");
}

export async function listLocalRequests() {
  return sortRequestsNewestFirst(await readRequestsFromDisk());
}

export async function getLocalRequestById(id: string) {
  return (await readRequestsFromDisk()).find((request) => request.id === id) ?? null;
}

export async function saveLocalRequest(request: LatticeRequest) {
  const requests = await readRequestsFromDisk();
  await writeRequestsToDisk([request, ...requests.filter((candidate) => candidate.id !== request.id)]);
  return request;
}

export async function deleteLocalRequest(id: string) {
  const requests = await readRequestsFromDisk();
  const remainingRequests = requests.filter((request) => request.id !== id);
  await writeRequestsToDisk(remainingRequests);
  return requests.length !== remainingRequests.length;
}
