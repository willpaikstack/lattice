import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import { createPasswordCredentials } from "./auth-crypto";
import { getPrismaClient } from "./prisma";
import { findWorkspaceUser } from "./workspace-user";

const resetDurationMs = 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function prisma() {
  return (await getPrismaClient()) as PrismaClient;
}

export async function createPasswordReset(email: string) {
  const user = await findWorkspaceUser(email);
  if (!user) return null;

  const token = randomBytes(32).toString("base64url");
  const client = await prisma();
  await client.passwordResetToken.deleteMany({ where: { userId: user.id, consumedAt: null } });
  await client.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + resetDurationMs) } });
  return { email: user.email, name: user.name, token };
}

export async function consumePasswordReset(token: string, password: string) {
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
  const client = await prisma();
  const record = await client.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.consumedAt || record.expiresAt <= new Date()) throw new Error("This reset link is invalid or has expired.");

  const credentials = createPasswordCredentials(password);
  await client.$transaction([
    client.user.update({ where: { id: record.userId }, data: { ...credentials, mustChangePassword: false, passwordChangedAt: new Date(), temporaryPasswordExpiresAt: null } }),
    client.passwordResetToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    client.passwordResetToken.deleteMany({ where: { userId: record.userId, consumedAt: null, NOT: { id: record.id } } }),
    client.authAuditEvent.create({ data: { userId: record.userId, action: "PASSWORD_RESET_COMPLETED" } }),
  ]);
}
