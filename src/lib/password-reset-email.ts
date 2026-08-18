import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createPasswordReset } from "./password-reset";

type PasswordResetEmail = {
  subject: string;
  text: string;
  to: string;
};

type PasswordResetOutboxRecord = PasswordResetEmail & {
  createdAt: string;
  delivery: "local-outbox" | "resend-failed";
  error?: string;
  id: string;
};

const outboxPath = path.join(process.cwd(), ".data", "password-reset-outbox.json");

function senderEmail() {
  return process.env.WAITLIST_EMAIL_FROM || "Lattice <hello@latticeos.com>";
}

function buildPasswordResetEmail(to: string, name: string, token: string): PasswordResetEmail {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const link = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Lattice OS password reset request",
    text: [
      `Hi ${name},`,
      "",
      "We received a password reset request for your Lattice OS account.",
      "",
      `Choose a new password: ${link}`,
      "",
      "This link expires in one hour and can be used once.",
      "",
      "If you did not request this, you can ignore this message.",
      "",
      "Lattice",
    ].join("\n"),
  };
}

async function readOutbox(): Promise<PasswordResetOutboxRecord[]> {
  try {
    const raw = await readFile(outboxPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PasswordResetOutboxRecord[]) : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeOutbox(record: PasswordResetOutboxRecord) {
  const records = await readOutbox();
  await mkdir(path.dirname(outboxPath), { recursive: true });
  await writeFile(outboxPath, `${JSON.stringify([record, ...records], null, 2)}\n`, "utf8");
}

async function sendWithResend(email: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: senderEmail(),
      subject: email.subject,
      text: email.text,
      to: email.to,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Resend email request failed with status ${response.status}`);
  }

  return true;
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const reset = await createPasswordReset(normalizedEmail);
  if (!reset) return { delivered: false, delivery: "not-applicable" as const };
  const resetEmail = buildPasswordResetEmail(reset.email, reset.name, reset.token);
  const id = `password-reset-${Date.now()}`;

  try {
    const delivered = await sendWithResend(resetEmail);
    if (delivered) {
      return { delivered: true, delivery: "resend" as const };
    }
  } catch (error) {
    await writeOutbox({
      ...resetEmail,
      createdAt: new Date().toISOString(),
      delivery: "resend-failed",
      error: error instanceof Error ? error.message : "Unknown email delivery error",
      id,
    });
    return { delivered: false, delivery: "resend-failed" as const };
  }

  await writeOutbox({
    ...resetEmail,
    createdAt: new Date().toISOString(),
    delivery: "local-outbox",
    id,
  });

  return { delivered: false, delivery: "local-outbox" as const };
}
