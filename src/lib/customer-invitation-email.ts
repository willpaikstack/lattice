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
  temporaryPassword: string;
};

const subject = "Your Lattice OS account is ready";

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
  const safeCompany = escapeHtml(input.companyName);
  const safeRecipient = escapeHtml(recipient);
  const safeEmail = escapeHtml(input.recipientEmail);
  const safePassword = escapeHtml(input.temporaryPassword);
  const safeLoginUrl = escapeHtml(input.loginUrl);

  return {
    to: input.recipientEmail,
    subject,
    text: [
      `Welcome to Lattice, ${recipient}.`,
      "",
      `Welcome to Lattice OS. Your ${input.companyName} account is ready—sign in below to create your personal password and get your workspace set up.`,
      "",
      `Log in to Lattice: ${input.loginUrl}`,
      "",
      "New to Lattice? See how Lattice works:",
      "https://latticeos.co/how-it-works",
      "",
      "Sign-in email:",
      input.recipientEmail,
      "",
      "Temporary password:",
      input.temporaryPassword,
      "",
      "Next steps:",
      "1. Log in using the email and temporary password above.",
      "2. Create your personal password when prompted.",
      "3. Confirm your shipping and billing details, then submit your first RFQ when you have a package ready.",
      "",
      "Your temporary password expires in 72 hours.",
      "",
      "If you would like a hand getting started, reply to this email for help.",
      "",
      "William Paik",
      "Lattice OS",
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
      Your Lattice OS account is ready. Sign in and create your personal password.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f4f2;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;">
            <tr>
              <td style="padding:0 0 20px 4px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                  <tr>
                    <td width="34" height="34" align="center" valign="middle" style="width:34px;height:34px;background:#171717;border-radius:7px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;line-height:34px;">◆</td>
                    <td style="padding-left:10px;color:#171717;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;letter-spacing:1.5px;line-height:20px;">LATTICE</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #deded9;border-radius:12px;padding:40px 36px;">
                <p style="margin:0 0 12px;color:#6a6a64;font-size:12px;font-weight:700;letter-spacing:1.4px;line-height:18px;text-transform:uppercase;">Account access</p>
                <h1 style="margin:0;color:#171717;font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:34px;">Welcome to Lattice, ${safeRecipient}.</h1>
                <p style="margin:16px 0 0;color:#575750;font-size:16px;line-height:25px;">Welcome to Lattice OS. Your ${safeCompany} account is ready&mdash;sign in below to create your personal password and get your workspace set up.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin:28px 0 30px;">
                  <tr>
                    <td align="center" style="background:#171717;border-radius:7px;">
                      <a href="${safeLoginUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">Log in to Lattice</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:-16px 0 30px;color:#6a6a64;font-size:13px;line-height:20px;">New to Lattice? <a href="https://latticeos.co/how-it-works" style="color:#171717;font-weight:700;text-decoration:underline;text-underline-offset:3px;">See how Lattice works</a></p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;background:#f7f7f5;border:1px solid #e4e4df;border-radius:8px;">
                  <tr>
                    <td style="padding:18px 20px 8px;color:#6a6a64;font-size:11px;font-weight:700;letter-spacing:1.1px;line-height:16px;text-transform:uppercase;">Sign-in email</td>
                  </tr>
                  <tr>
                    <td style="padding:0 20px 18px;color:#171717;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:21px;word-break:break-word;">${safeEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px 8px;border-top:1px solid #e4e4df;color:#6a6a64;font-size:11px;font-weight:700;letter-spacing:1.1px;line-height:16px;text-transform:uppercase;">Temporary password</td>
                  </tr>
                  <tr>
                    <td style="padding:0 20px 18px;color:#171717;font-family:'Courier New',Courier,monospace;font-size:14px;font-weight:700;line-height:21px;word-break:break-word;">${safePassword}</td>
                  </tr>
                </table>
                <p style="margin:14px 0 0;color:#6a6a64;font-size:13px;line-height:20px;">This temporary password expires in 72 hours. You will create your own secure password immediately after signing in.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:30px;">
                  <tr>
                    <td style="padding:0 0 12px;color:#171717;font-size:16px;font-weight:700;line-height:22px;">What happens next</td>
                  </tr>
                  <tr>
                    <td style="padding:0;color:#575750;font-size:14px;line-height:23px;">
                      <ol style="margin:0;padding-left:20px;">
                        <li style="padding-left:3px;margin-bottom:5px;">Log in using the email and temporary password above.</li>
                        <li style="padding-left:3px;margin-bottom:5px;">Create your personal password when prompted.</li>
                        <li style="padding-left:3px;">Confirm your shipping and billing details, then submit your first RFQ.</li>
                      </ol>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse;margin-top:30px;">
                  <tr>
                    <td style="padding-top:24px;border-top:1px solid #e4e4df;color:#575750;font-size:14px;line-height:22px;">If you would like a hand getting started, reply to this email for help.</td>
                  </tr>
                  <tr>
                    <td style="padding-top:16px;color:#171717;font-size:14px;font-weight:700;line-height:21px;">William Paik<br><span style="color:#6a6a64;font-weight:400;">Lattice OS</span></td>
                  </tr>
                </table>
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
