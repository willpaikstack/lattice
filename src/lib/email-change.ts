import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { getPrismaClient } from "./prisma";

const verificationDurationMs = 24 * 60 * 60 * 1000;
const outboxPath = path.join(process.cwd(), ".data", "email-change-outbox.json");

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function senderEmail() {
  return process.env.WAITLIST_EMAIL_FROM || "Lattice <hello@latticeos.co>";
}

async function prisma() {
  return (await getPrismaClient()) as PrismaClient;
}

type OutboxEmail = { subject: string; text: string; to: string };

async function writeOutbox(email: OutboxEmail) {
  let existing: Array<OutboxEmail & { createdAt: string }> = [];
  try {
    const raw = await readFile(outboxPath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) existing = parsed;
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) throw error;
  }

  await mkdir(path.dirname(outboxPath), { recursive: true });
  await writeFile(outboxPath, `${JSON.stringify([{ ...email, createdAt: new Date().toISOString() }, ...existing], null, 2)}\n`, "utf8");
}

async function deliver(email: OutboxEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await writeOutbox(email);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({ from: senderEmail(), subject: email.subject, text: email.text, to: email.to }),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new Error(`Resend email request failed with status ${response.status}`);
}

export async function beginEmailChange(userId: string, requestedEmail: string) {
  const email = normalizedEmail(requestedEmail);
  if (!email.includes("@")) throw new Error("Enter a valid email address.");

  const client = await prisma();
  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Customer user not found.");
  if (user.email === email) throw new Error("This user already has that email address.");

  const existing = await client.user.findFirst({ where: { OR: [{ email }, { pendingEmail: email }] } });
  if (existing) throw new Error("That email address is already in use or awaiting verification.");

  const token = randomBytes(32).toString("base64url");
  await client.$transaction([
    client.emailVerificationToken.deleteMany({ where: { userId, consumedAt: null } }),
    client.user.update({ where: { id: userId }, data: { pendingEmail: email } }),
    client.emailVerificationToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + verificationDurationMs) } }),
    client.authAuditEvent.create({ data: { userId, action: "EMAIL_CHANGE_REQUESTED" } }),
  ]);

  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  await deliver({
    to: email,
    subject: "Confirm your new Lattice OS email address",
    text: [
      `Hi ${user.name},`,
      "",
      "A Lattice administrator requested that this email become the sign-in address for your account.",
      "",
      `Confirm the new email: ${baseUrl.replace(/\/$/, "")}/verify-email-change?token=${encodeURIComponent(token)}`,
      "",
      "This link expires in 24 hours and can be used once. Your current email remains active until you confirm this change.",
      "",
      "If you were not expecting this change, do not use the link and contact Lattice support.",
      "",
      "Lattice",
    ].join("\n"),
  });

  return { email, user };
}

export async function confirmEmailChange(token: string) {
  const client = await prisma();
  const record = await client.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.consumedAt || record.expiresAt <= new Date() || !record.user.pendingEmail) {
    throw new Error("This email verification link is invalid or has expired.");
  }

  const nextEmail = record.user.pendingEmail;
  const existing = await client.user.findFirst({ where: { email: nextEmail, NOT: { id: record.userId } } });
  if (existing) throw new Error("That email address is already in use.");

  const oldEmail = record.user.email;
  await client.$transaction([
    client.user.update({ where: { id: record.userId }, data: { email: nextEmail, pendingEmail: null } }),
    client.emailVerificationToken.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    client.emailVerificationToken.deleteMany({ where: { userId: record.userId, consumedAt: null, NOT: { id: record.id } } }),
    client.authAuditEvent.create({ data: { userId: record.userId, action: "EMAIL_CHANGE_VERIFIED" } }),
  ]);

  try {
    await deliver({
      to: oldEmail,
      subject: "Your Lattice OS email address was changed",
      text: [
        `Hi ${record.user.name},`,
        "",
        `Your Lattice OS sign-in email was changed from ${oldEmail} to ${nextEmail}.`,
        "",
        "If you did not expect this change, contact Lattice support immediately.",
        "",
        "Lattice",
      ].join("\n"),
    });
  } catch {
    // The verified change is durable even if a post-change notification cannot be delivered.
  }

  return { email: nextEmail };
}
