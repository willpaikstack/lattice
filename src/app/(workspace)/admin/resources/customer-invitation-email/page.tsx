import { buildCustomerInvitationEmail } from "@/lib/customer-invitation-email";

export const dynamic = "force-dynamic";

export default function CustomerInvitationEmailPreviewPage() {
  const email = buildCustomerInvitationEmail({
    companyName: "Acme Machining",
    loginUrl: "https://latticeos.co/login",
    recipientEmail: "carmen@acme.example",
    recipientName: "Carmen Pascuito",
    temporaryPassword: "Lattice-example-password",
  });

  return (
    <div className="mx-auto max-w-4xl py-2">
      <header className="mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Admin resources</p>
        <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Customer invitation email</h1>
        <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">A safe preview using sample credentials. Customer invitations are not sent from this screen.</p>
      </header>

      <iframe className="h-[980px] w-full bg-[#f4f4f2]" sandbox="" srcDoc={email.html} title="Customer invitation email preview" />
    </div>
  );
}
