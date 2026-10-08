export type CustomerInvitationEmail = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

export type CustomerInvitationEmailInput = {
  companyName: string;
  loginUrl: string;
  recipientEmail: string;
  recipientName: string;
  temporaryPassword?: string;
};

const subject = "You’re invited to Lattice";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

/**
 * Builds the approved first-cohort invitation. It is intentionally a pure
 * composition function: sending, audit records, and password generation are
 * added separately so a password cannot be persisted accidentally here.
 */
export function buildCustomerInvitationEmail(input: CustomerInvitationEmailInput): CustomerInvitationEmail {
  const recipient = firstName(input.recipientName);
  const safeRecipient = escapeHtml(recipient);
  const safeEmail = escapeHtml(input.recipientEmail);
  const hasTemporaryPassword = Boolean(input.temporaryPassword);
  const safePassword = escapeHtml(input.temporaryPassword ?? "");
  const safeLoginUrl = escapeHtml(input.loginUrl);
  const safeBannerUrl = escapeHtml(new URL("/email/lattice-invitation-banner.png", input.loginUrl).toString());
  const introduction = "Lattice helps your shop take on overflow and out-of-capability jobs. We coordinate qualified global CNC machining and fabrication partners, giving you access to additional production capacity without adding machines, staff, or floor space.";
  const safeIntroduction = escapeHtml(introduction);
  const credentialRows = hasTemporaryPassword
    ? `<tr>
                    <td style="padding:16px 20px 8px;border-top:1px solid #e4e4df;color:#6a6a64;font-size:11px;font-weight:700;letter-spacing:1.1px;line-height:16px;text-transform:uppercase;">Temporary password</td>
                  </tr>
                  <tr>
                    <td style="padding:0 20px 18px;color:#171717;font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:700;line-height:21px;word-break:break-word;">${safePassword}</td>
                  </tr>`
    : "";
  return {
    to: input.recipientEmail,
    subject,
    text: [
      `Welcome to Lattice, ${recipient}.`,
      "",
      introduction,
      "",
      "Sign-in email:",
      input.recipientEmail,
      "",
      ...(hasTemporaryPassword ? [
        "Temporary password:",
        input.temporaryPassword!,
        "",
      ] : []),
      "Get started with Lattice:",
      input.loginUrl,
      "",
      'A one-page "How Lattice works" guide is attached to this email.',
      "",
      "We’re excited to have you on board.",
      "",
      "The Lattice Team",
    ].join("\n"),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f2;color:#171717;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      You’re invited to Lattice.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f2;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;">
            <tr>
              <td style="background:#ffffff;border:1px solid #deded9;border-radius:12px;padding:40px 36px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 36px;">
                  <tr>
                    <td style="color:#171717;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;letter-spacing:1.5px;line-height:26px;">LATTICE</td>
                    <td align="right" style="padding-left:12px;color:#526075;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;">Qualified manufacturing capacity</td>
                  </tr>
                </table>
                <p style="margin:0 0 12px;color:#6a6a64;font-size:12px;font-weight:700;letter-spacing:1.4px;line-height:18px;text-transform:uppercase;">You’re invited</p>
                <h1 style="margin:0;color:#171717;font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:34px;">Welcome to Lattice, ${safeRecipient}.</h1>
                <p style="margin:16px 0 0;color:#4d586a;font-size:15px;line-height:24px;">${safeIntroduction}</p>
                <img src="${safeBannerUrl}" alt="Illustration of a modern manufacturing campus" width="600" style="display:block;width:100%;max-width:600px;height:auto;margin:24px 0 24px;border:0;border-radius:8px;" />
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#f7f7f5;border:1px solid #e4e4df;border-radius:8px;">
                  <tr>
                    <td style="padding:18px 20px 8px;color:#6a6a64;font-size:11px;font-weight:700;letter-spacing:1.1px;line-height:16px;text-transform:uppercase;">Sign-in email</td>
                  </tr>
                  <tr>
                    <td style="padding:0 20px 18px;color:#171717;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:21px;word-break:break-word;">${safeEmail}</td>
                  </tr>
                  ${credentialRows}
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:26px;">
                  <tr>
                    <td align="center" style="background:#232a30;border:1px solid #171a1d;border-radius:8px;box-shadow:0 2px 0 #d9d6cf;">
                      <a href="${safeLoginUrl}" style="display:block;padding:16px 22px;color:#ffffff;font-size:16px;font-weight:700;line-height:22px;text-align:center;text-decoration:none;">Get started with Lattice &rarr;</a>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:22px;">
                  <tr>
                    <td style="border-top:1px solid #e4e4df;font-size:1px;line-height:1px;">&nbsp;</td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;color:#4d586a;font-size:14px;line-height:22px;">A one-page &quot;How Lattice works&quot; guide is attached to this email.</p>
                <p style="margin:24px 0 0;color:#4d586a;font-size:14px;line-height:22px;">We’re excited to have you on board.<br>The Lattice Team</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 12px 0;color:#777770;font-size:12px;line-height:18px;">Lattice OS &middot; support@latticeos.co</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  };
}
