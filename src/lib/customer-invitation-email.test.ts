import { describe, expect, it } from "vitest";

import { buildCustomerInvitationEmail } from "./customer-invitation-email";

describe("customer invitation email", () => {
  const email = buildCustomerInvitationEmail({
    companyName: "Acme Machining",
    loginUrl: "https://latticeos.co/login",
    recipientEmail: "carmen@acme.example",
    recipientName: "Carmen Pascuito",
    temporaryPassword: "Lattice-example-password",
  });

  it("uses the approved invitation subject and concise product introduction", () => {
    expect(email.subject).toBe("You’re invited to Lattice");
    expect(email.html).toContain("Welcome to Lattice, Carmen.");
    expect(email.html).toContain("Lattice helps your shop take on overflow and out-of-capability jobs.");
    expect(email.html).toContain("qualified global CNC machining and fabrication partners");
    expect(email.html).toContain("Qualified manufacturing capacity</td>");
    expect(email.html).not.toContain("◆");
    expect(email.html).toContain("LATTICE</td>");
    expect(email.html).toContain("The Lattice Team");
    expect(email.html).not.toContain("William Paik");
    expect(email.html).not.toContain("<br><span style=\"color:#6a6a64;font-weight:400;\">Lattice OS</span>");
    expect(email.html).toContain("Get started with Lattice");
    expect(email.html).toContain('href="https://latticeos.co/login"');
    expect(email.html).toContain("We’re excited to have you on board.");
    expect(email.html).toContain("background:#232a30");
    expect(email.html).not.toContain("#216fea");
    expect(email.html).not.toContain("What happens next");
    expect(email.html).toContain('A one-page &quot;How Lattice works&quot; guide is attached to this email.');
    expect(email.html).not.toContain("reply to this email for help");
  });

  it("includes sign-in credentials without the removed onboarding copy", () => {
    expect(email.to).toBe("carmen@acme.example");
    expect(email.html).toContain("carmen@acme.example");
    expect(email.html).toContain("Lattice-example-password");
    expect(email.text).toContain("Sign-in email:\ncarmen@acme.example");
    expect(email.text).toContain("Temporary password:\nLattice-example-password");
    expect(email.text).toContain("Get started with Lattice:\nhttps://latticeos.co/login");
    expect(email.text).toContain('A one-page "How Lattice works" guide is attached to this email.');
    expect(email.text).toContain("We’re excited to have you on board.\n\nThe Lattice Team");
    expect(email.text).not.toContain("William Paik");
    expect(email.text).not.toContain("Next steps");
    expect(email.text).not.toContain("https://latticeos.co/login");
    expect(email.text).not.toContain("https://latticeos.co/how-it-works");
  });

  it("escapes dynamic values before placing them in HTML", () => {
    const escaped = buildCustomerInvitationEmail({
      companyName: "North < West",
      loginUrl: "https://latticeos.co/login?source=<invite>",
      recipientEmail: "buyer@example.com",
      recipientName: "Pat <script>",
      temporaryPassword: "pass<word",
    });

    expect(escaped.html).toContain("Pat");
    expect(escaped.html).not.toContain("<script>");
    expect(escaped.html).toContain("North &lt; West");
    expect(escaped.html).toContain("pass&lt;word");
  });
});
