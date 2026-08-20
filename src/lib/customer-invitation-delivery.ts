import "server-only";

import { CustomerInvitationStatus, type PrismaClient } from "@prisma/client";

import { buildCustomerInvitationEmail } from "./customer-invitation-email";
import { getPrismaClient } from "./prisma";

export type CustomerInvitationFailureCategory =
  | "email-not-configured"
  | "invalid-recipient"
  | "provider-rejected"
  | "provider-unavailable";

export type CustomerInvitationDelivery =
  | { invitationId: string; status: "sent" }
  | { failureCategory: CustomerInvitationFailureCategory; invitationId: string; status: "failed" };

type InvitationRecipient = {
  companyId: string;
  companyName: string;
  email: string;
  expiresAt: Date;
  name: string;
  temporaryPassword: string;
  userId: string;
};

async function prisma() {
  return (await getPrismaClient()) as PrismaClient;
}

function senderEmail() {
  return process.env.WAITLIST_EMAIL_FROM || "Lattice OS <support@latticeos.co>";
}

function loginUrl() {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/login`;
}

function failureCategoryForStatus(status: number): CustomerInvitationFailureCategory {
  if (status === 400 || status === 422) return "invalid-recipient";
  if (status >= 500) return "provider-unavailable";
  return "provider-rejected";
}

async function markFailed(client: PrismaClient, invitationId: string, failureCategory: CustomerInvitationFailureCategory) {
  await client.customerInvitation.update({
    where: { id: invitationId },
    data: {
      failureCategory,
      failedAt: new Date(),
      status: CustomerInvitationStatus.FAILED,
    },
  });
}

async function revokeOpenInvitations(client: PrismaClient, userId: string) {
  await client.customerInvitation.updateMany({
    where: {
      revokedAt: null,
      status: { in: [CustomerInvitationStatus.CREATED, CustomerInvitationStatus.SENT, CustomerInvitationStatus.FAILED] },
      userId,
    },
    data: { revokedAt: new Date(), status: CustomerInvitationStatus.REVOKED },
  });
}

/**
 * Delivers a first-cohort invitation without ever persisting its temporary
 * password or rendered content. A delivery record is created before network
 * I/O so a provider failure remains visible and recoverable to Lattice Admins.
 */
export async function deliverCustomerInvitation(recipient: InvitationRecipient): Promise<CustomerInvitationDelivery> {
  const client = await prisma();
  await revokeOpenInvitations(client, recipient.userId);

  const invitation = await client.customerInvitation.create({
    data: {
      companyId: recipient.companyId,
      expiresAt: recipient.expiresAt,
      recipientEmail: recipient.email,
      userId: recipient.userId,
    },
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await markFailed(client, invitation.id, "email-not-configured");
    return { failureCategory: "email-not-configured", invitationId: invitation.id, status: "failed" };
  }

  const email = buildCustomerInvitationEmail({
    companyName: recipient.companyName,
    loginUrl: loginUrl(),
    recipientEmail: recipient.email,
    recipientName: recipient.name,
    temporaryPassword: recipient.temporaryPassword,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: senderEmail(),
        html: email.html,
        replyTo: senderEmail(),
        subject: email.subject,
        text: email.text,
        to: email.to,
      }),
    });

    if (!response.ok) {
      const failureCategory = failureCategoryForStatus(response.status);
      await markFailed(client, invitation.id, failureCategory);
      return { failureCategory, invitationId: invitation.id, status: "failed" };
    }

    const payload = await response.json().catch(() => null) as { id?: unknown } | null;
    const providerMessageId = typeof payload?.id === "string" ? payload.id : null;
    await client.customerInvitation.update({
      where: { id: invitation.id },
      data: { providerMessageId, sentAt: new Date(), status: CustomerInvitationStatus.SENT },
    });
    return { invitationId: invitation.id, status: "sent" };
  } catch {
    await markFailed(client, invitation.id, "provider-unavailable");
    return { failureCategory: "provider-unavailable", invitationId: invitation.id, status: "failed" };
  }
}
