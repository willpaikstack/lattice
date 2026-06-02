import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { WaitingListEntry } from "./waiting-list";

export type WaitingListThankYouEmail = {
  to: string;
  subject: string;
  text: string;
};

type EmailOutboxRecord = WaitingListThankYouEmail & {
  id: string;
  createdAt: string;
  delivery: "local-outbox" | "resend-failed";
  error?: string;
};

const outboxPath = path.join(process.cwd(), ".data", "email-outbox.json");

function senderEmail() {
  return process.env.WAITLIST_EMAIL_FROM || "Lattice <hello@latticeos.com>";
}

function appName() {
  return process.env.WAITLIST_EMAIL_APP_NAME || "Lattice";
}

export function buildWaitingListThankYouEmail(entry: WaitingListEntry): WaitingListThankYouEmail {
  const firstName = entry.name.trim().split(/\s+/)[0] || "there";

  return {
    to: entry.email,
    subject: "Thanks for joining the Lattice waiting list",
    text: [
      `Hi ${firstName},`,
      "",
      `Thanks for joining the ${appName()} waiting list. We received your request for ${entry.company} and will review it as we open access for more manufacturing procurement teams.`,
      "",
      "We will reach out when there is a good fit for your RFQ, supplier follow-up, or production order workflow.",
      "",
      "Lattice",
    ].join("\n"),
  };
}

export function buildWaitingListAlreadyRepresentedEmail(requestedEntry: WaitingListEntry, existingEntry: WaitingListEntry): WaitingListThankYouEmail {
  const firstName = requestedEntry.name.trim().split(/\s+/)[0] || "there";

  return {
    to: requestedEntry.email,
    subject: "Your company is already on the Lattice waiting list",
    text: [
      `Hi ${firstName},`,
      "",
      `Thanks for your interest in ${appName()}. Someone from your company is already on the waiting list, so your team is represented.`,
      "",
      `Current waitlist contact: ${existingEntry.name} (${existingEntry.email})`,
      "",
      "If that contact is not the right person for manufacturing procurement, reply to this email and we can update the account notes.",
      "",
      "Lattice",
    ].join("\n"),
  };
}

async function readOutbox(): Promise<EmailOutboxRecord[]> {
  try {
    const raw = await readFile(outboxPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as EmailOutboxRecord[]) : [];
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function writeOutbox(record: EmailOutboxRecord) {
  const records = await readOutbox();
  await mkdir(path.dirname(outboxPath), { recursive: true });
  await writeFile(outboxPath, `${JSON.stringify([record, ...records], null, 2)}\n`, "utf8");
}

async function writeOutboxIfAvailable(record: EmailOutboxRecord) {
  try {
    await writeOutbox(record);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      throw error;
    }

    console.warn("Could not write waiting-list email outbox record.", error);
  }
}

async function sendWithResend(email: WaitingListThankYouEmail) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: senderEmail(),
      to: email.to,
      subject: email.subject,
      text: email.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email request failed with status ${response.status}`);
  }

  return true;
}

export async function sendWaitingListThankYouEmail(entry: WaitingListEntry) {
  return sendWaitingListEmail(entry.id, buildWaitingListThankYouEmail(entry));
}

export async function sendWaitingListAlreadyRepresentedEmail(requestedEntry: WaitingListEntry, existingEntry: WaitingListEntry) {
  return sendWaitingListEmail(requestedEntry.id, buildWaitingListAlreadyRepresentedEmail(requestedEntry, existingEntry));
}

async function sendWaitingListEmail(id: string, email: WaitingListThankYouEmail) {

  try {
    const delivered = await sendWithResend(email);
    if (delivered) {
      return { delivered: true, delivery: "resend" as const };
    }
  } catch (error) {
    await writeOutboxIfAvailable({
      ...email,
      id,
      createdAt: new Date().toISOString(),
      delivery: "resend-failed",
      error: error instanceof Error ? error.message : "Unknown email delivery error",
    });
    return { delivered: false, delivery: "resend-failed" as const };
  }

  await writeOutboxIfAvailable({
    ...email,
    id,
    createdAt: new Date().toISOString(),
    delivery: "local-outbox",
  });

  return { delivered: false, delivery: "local-outbox" as const };
}
