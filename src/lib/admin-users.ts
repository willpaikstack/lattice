import "server-only";

import type { PrismaClient } from "@prisma/client";
import type { PlatformUser } from "./admin-users-shared";
import { getPrismaClient } from "./prisma";
import { requireActionRole } from "./route-authorization";

/** All provisioned platform accounts, regardless of role or company membership. */
export async function listPlatformUsers(): Promise<PlatformUser[]> {
  await requireActionRole(["admin"]);
  const client = await getPrismaClient() as PrismaClient;
  const users = await client.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true, name: true, email: true, role: true,
      company: { select: { id: true, name: true } },
      clerkUserId: true, mustChangePassword: true,
      temporaryPasswordExpiresAt: true, createdAt: true,
    },
  });
  const now = Date.now();
  return users.map((user) => ({
    id: user.id, name: user.name, email: user.email, role: user.role,
    company: user.company, createdAt: user.createdAt.toISOString(),
    signInSetup: !user.clerkUserId ? "Not connected"
      : user.mustChangePassword ? user.temporaryPasswordExpiresAt && user.temporaryPasswordExpiresAt.getTime() <= now ? "Setup expired" : "Setup required"
      : "Connected",
  }));
}
