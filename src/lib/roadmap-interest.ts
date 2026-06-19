import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getPrismaClient } from "./prisma";

export type RoadmapInterest = {
  createdAt: string;
  id: string;
  isInterested: boolean;
  roadmapItemId: string;
  updatedAt: string;
  userEmail: string;
  userName: string;
};

export type RoadmapInterestSummary = {
  interestedCount: number;
  roadmapItemId: string;
};

type StoredRoadmapInterest = Omit<RoadmapInterest, "createdAt" | "updatedAt"> & {
  createdAt: Date | string;
  updatedAt: Date | string;
};

type RoadmapInterestInput = {
  isInterested: boolean;
  roadmapItemId: string;
  userEmail: string;
  userName?: string;
};

const storePath = path.join(process.cwd(), ".data", "roadmap-interests.json");

async function prisma() {
  return (await getPrismaClient()) as {
    roadmapInterest: {
      findMany: (args: unknown) => Promise<StoredRoadmapInterest[]>;
      upsert: (args: unknown) => Promise<StoredRoadmapInterest>;
    };
  };
}

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

function cleanText(value: string | undefined) {
  return String(value ?? "").trim();
}

function mapStoredInterest(interest: StoredRoadmapInterest): RoadmapInterest {
  return {
    ...interest,
    createdAt: interest.createdAt instanceof Date ? interest.createdAt.toISOString() : interest.createdAt,
    updatedAt: interest.updatedAt instanceof Date ? interest.updatedAt.toISOString() : interest.updatedAt,
  };
}

async function readInterestsFromDisk(): Promise<RoadmapInterest[]> {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RoadmapInterest[]) : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeInterestsToDisk(interests: RoadmapInterest[]) {
  const sortedInterests = [...interests].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(sortedInterests, null, 2)}\n`, "utf8");
}

function summarizeInterests(interests: RoadmapInterest[]): RoadmapInterestSummary[] {
  const counts = new Map<string, number>();

  for (const interest of interests) {
    if (!interest.isInterested) {
      continue;
    }

    counts.set(interest.roadmapItemId, (counts.get(interest.roadmapItemId) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([roadmapItemId, interestedCount]) => ({
    interestedCount,
    roadmapItemId,
  }));
}

export async function listRoadmapInterestsForUser(userEmail: string) {
  const email = cleanEmail(userEmail);

  if (!email) {
    return [];
  }

  try {
    const client = await prisma();
    const interests = await client.roadmapInterest.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      where: {
        userEmail: email,
      },
    });

    return interests.map(mapStoredInterest);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using local roadmap-interest data.", error);
      const interests = await readInterestsFromDisk();
      return interests.filter((interest) => cleanEmail(interest.userEmail) === email);
    }

    throw error;
  }
}

export async function listRoadmapInterestSummaries() {
  try {
    const client = await prisma();
    const interests = await client.roadmapInterest.findMany({
      where: {
        isInterested: true,
      },
    });

    return summarizeInterests(interests.map(mapStoredInterest));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; using local roadmap-interest summaries.", error);
      return summarizeInterests(await readInterestsFromDisk());
    }

    throw error;
  }
}

export async function setRoadmapInterest(input: RoadmapInterestInput) {
  const roadmapItemId = cleanText(input.roadmapItemId);
  const userEmail = cleanEmail(input.userEmail);
  const userName = cleanText(input.userName);

  if (!roadmapItemId || !userEmail) {
    throw new Error("Roadmap interest requires a roadmap item and user email.");
  }

  try {
    const client = await prisma();
    const storedInterest = await client.roadmapInterest.upsert({
      create: {
        isInterested: input.isInterested,
        roadmapItemId,
        userEmail,
        userName,
      },
      update: {
        isInterested: input.isInterested,
        userName,
      },
      where: {
        roadmapItemId_userEmail: {
          roadmapItemId,
          userEmail,
        },
      },
    });

    return mapStoredInterest(storedInterest);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Prisma is unavailable; saving roadmap interest locally.", error);
      const interests = await readInterestsFromDisk();
      const existingInterest = interests.find((interest) => interest.roadmapItemId === roadmapItemId && cleanEmail(interest.userEmail) === userEmail);
      const now = new Date().toISOString();
      const nextInterest: RoadmapInterest = {
        createdAt: existingInterest?.createdAt ?? now,
        id: existingInterest?.id ?? randomUUID(),
        isInterested: input.isInterested,
        roadmapItemId,
        updatedAt: now,
        userEmail,
        userName,
      };

      await writeInterestsToDisk([
        nextInterest,
        ...interests.filter((interest) => !(interest.roadmapItemId === roadmapItemId && cleanEmail(interest.userEmail) === userEmail)),
      ]);

      return nextInterest;
    }

    throw error;
  }
}
