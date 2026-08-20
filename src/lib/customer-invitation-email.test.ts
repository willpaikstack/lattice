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

  it("uses the approved subject, CTA, and support signature", () => {
    expect(email.subject).toBe("Your Lattice OS account is ready");
    expect(email.html).toContain(">Log in to Lattice<");
    expect(email.html).toContain("Your Acme Machining account is ready");
    expect(email.html).toContain('href="https://latticeos.co/how-it-works"');
    expect(email.html).toContain("See how Lattice works");
    expect(email.html).toContain("William Paik");
    expect(email.html).toMatch(/reply to this email for help\./i);
  });

  it("includes the required credentials and onboarding steps in HTML and text", () => {
    expect(email.to).toBe("carmen@acme.example");
    expect(email.html).toContain("carmen@acme.example");
    expect(email.html).toContain("Lattice-example-password");
    expect(email.html).toContain("This temporary password expires in 72 hours.");
    expect(email.text).toContain("Confirm your shipping and billing details");
    expect(email.text).toContain("https://latticeos.co/login");
    expect(email.text).toContain("https://latticeos.co/how-it-works");
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
