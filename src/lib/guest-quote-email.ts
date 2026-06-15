import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { LatticeRequest } from "./request-model";

type GuestQuoteEmail = {
  subject: string;
  text: string;
  to: string;
};

type EmailOutboxRecord = GuestQuoteEmail & {
  createdAt: string;
  delivery: "local-outbox" | "resend-failed";
  error?: string;
  id: string;
};

const outboxPath = path.join(process.cwd(), ".data", "email-outbox.json");

function senderEmail() {
  return process.env.WAITLIST_EMAIL_FROM || "Lattice <hello@latticeos.com>";
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

function firstNameFor(request: Pick<LatticeRequest, "requesterName">) {
  return request.requesterName.trim().split(/\s+/)[0] || "there";
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

    console.warn("Could not write guest quote email outbox record.", error);
  }
}

async function sendWithResend(email: GuestQuoteEmail) {
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
      subject: email.subject,
      text: email.text,
      to: email.to,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email request failed with status ${response.status}`);
  }

  return true;
}

async function sendGuestQuoteEmail(id: string, email: GuestQuoteEmail) {
  try {
    const delivered = await sendWithResend(email);
    if (delivered) {
      return { delivered: true, delivery: "resend" as const };
    }
  } catch (error) {
    await writeOutboxIfAvailable({
      ...email,
      createdAt: new Date().toISOString(),
      delivery: "resend-failed",
      error: error instanceof Error ? error.message : "Unknown email delivery error",
      id,
    });
    return { delivered: false, delivery: "resend-failed" as const };
  }

  await writeOutboxIfAvailable({
    ...email,
    createdAt: new Date().toISOString(),
    delivery: "local-outbox",
    id,
  });

  return { delivered: false, delivery: "local-outbox" as const };
}

export function buildGuestQuoteAcknowledgementEmail(request: LatticeRequest): GuestQuoteEmail {
  return {
    subject: "We received your Lattice quote request",
    text: [
      `Hi ${firstNameFor(request)},`,
      "",
      `We received your simple quote request for ${request.title}. The Lattice team will review the CAD package and reply with a quote link when pricing is ready.`,
      "",
      "You do not need to create an account for this request. If we need more manufacturing details, we will reply to this email.",
      "",
      "Lattice",
    ].join("\n"),
    to: request.requesterEmail,
  };
}

export function buildGuestQuoteReadyEmail(request: LatticeRequest, guestHref: string): GuestQuoteEmail {
  const absoluteHref = `${appBaseUrl()}${guestHref}`;
  const quoteNumber = request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;

  return {
    subject: `${quoteNumber} is ready for review`,
    text: [
      `Hi ${firstNameFor(request)},`,
      "",
      `Your Lattice quote for ${request.title} is ready.`,
      "",
      `Review and pay by credit card here: ${absoluteHref}`,
      "",
      "This private link only opens this quote. No account is required.",
      "",
      "Lattice",
    ].join("\n"),
    to: request.requesterEmail,
  };
}

export async function sendGuestQuoteAcknowledgementEmail(request: LatticeRequest) {
  return sendGuestQuoteEmail(`guest-quote-ack-${request.id}`, buildGuestQuoteAcknowledgementEmail(request));
}

export async function sendGuestQuoteReadyEmail(request: LatticeRequest, guestHref: string) {
  return sendGuestQuoteEmail(`guest-quote-ready-${request.id}-${request.customerQuotes.at(-1)?.versionNumber ?? 1}`, buildGuestQuoteReadyEmail(request, guestHref));
}
