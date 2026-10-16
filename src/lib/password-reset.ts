import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { auth } from "@clerk/nextjs/server";
import { signedInRecoveryEmail } from "./password-reset-identity";
import { clerkClient } from "@clerk/nextjs/server";

import { PrismaClient } from "@prisma/client";

import { createPasswordCredentials } from "./auth-crypto";
import { getPrismaClient } from "./prisma";
import { findWorkspaceUser } from "./workspace-user";

export class PasswordResetError extends Error {
  constructor(readonly code: "invalid" | "password-policy" | "service") {
    super(code === "invalid" ? "This reset link is invalid or has expired." : code === "password-policy" ? "Choose a different password that meets the sign-in requirements." : "Password recovery is temporarily unavailable. Please try again or contact Lattice support.");
  }
}

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
  if (password.length < 8) throw new PasswordResetError("password-policy");
  const client = await prisma();
  const record = await client.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.consumedAt || record.expiresAt <= new Date()) throw new PasswordResetError("invalid");

  const { userId: signedInUserId } = await auth();
  if (signedInUserId) {
    await signedInRecoveryEmail();
    const owner = await client.user.findUnique({ where: { id: record.userId }, select: { clerkUserId: true } });
    if (owner?.clerkUserId !== signedInUserId) throw new PasswordResetError("invalid");
  }
  const credentials = createPasswordCredentials(password);
  await client.$transaction(async (tx) => {
    // Claim the one-time token atomically. A concurrent reset must never be
    // able to choose a second password with the same link.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { consumedAt: new Date() },
    });
    if (claimed.count !== 1) throw new PasswordResetError("invalid");
    const user = await tx.user.findUniqueOrThrow({ where: { id: record.userId } });
    if (!user.clerkUserId) throw new PasswordResetError("service");
    try {
      await (await clerkClient()).users.updateUser(user.clerkUserId, { password, signOutOfOtherSessions: true });
    } catch (error) {
      const errors = error && typeof error === "object" && "errors" in error && Array.isArray(error.errors) ? error.errors as Array<{ code?: string }> : [];
      throw new PasswordResetError(errors.some((item) => item.code?.startsWith("form_password_")) ? "password-policy" : "service");
    }
    await tx.user.update({ where: { id: record.userId }, data: { ...credentials, mustChangePassword: false, passwordChangedAt: new Date(), temporaryPasswordExpiresAt: null } });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, consumedAt: null, NOT: { id: record.id } } });
    await tx.authAuditEvent.create({ data: { userId: record.userId, action: "PASSWORD_RESET_COMPLETED" } });
  }, { timeout: 20000 });
}
