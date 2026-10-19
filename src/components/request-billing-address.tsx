import Link from "next/link";
import type { LatticeRequest } from "@/lib/request-model";

/** A read-only record snapshot, shared by quote, checkout and order detail. */
export function RequestBillingAddress({ request, showConfigurationPrompts = false }: { request: LatticeRequest; showConfigurationPrompts?: boolean }) {
  if (!request.billingSnapshot && !showConfigurationPrompts) return null;
  const snapshot = request.billingSnapshot ?? { address: { address1: "", address2: "", city: "", company: request.buyerCompany, name: request.requesterName, state: "", zipCode: "" }, contact: { email: request.requesterEmail, invoiceRoutingNotes: "" } };
  const addressLines = [snapshot.address.name || request.requesterName, snapshot.address.company || request.buyerCompany, snapshot.address.address1, snapshot.address.address2, [snapshot.address.city, [snapshot.address.state, snapshot.address.zipCode].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean);
  const billingAddressComplete = Boolean(snapshot.address.name && (snapshot.address.company || request.buyerCompany) && snapshot.address.address1 && snapshot.address.city && snapshot.address.state && snapshot.address.zipCode);
  const billingContactConfigured = Boolean(snapshot.contact.email && (billingAddressComplete || snapshot.contact.email !== request.requesterEmail));
  const missingBillingAddress = showConfigurationPrompts && !billingAddressComplete;
  const configurationMessage = missingBillingAddress
    ? "Billing address has not been added to your account. You can add it during checkout or in account settings"
    : null;
  return (
    <div className="border-t border-[#eeeeee] px-6 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Billing address</p>
      <address className="mt-3 text-[13px] not-italic leading-5 text-[#5f6670]">
        {configurationMessage ? <span className="block text-[#7a5b18]">{configurationMessage} <Link className="font-semibold underline underline-offset-2" href="/account/settings?focus=billing-address#billing-address">here</Link></span> : null}
        {!missingBillingAddress ? addressLines.map((line, index) => <span className="block" key={index}>{line}</span>) : null}
        {billingContactConfigured ? <span className="block">{snapshot.contact.email || request.requesterEmail}</span> : null}
        {snapshot.address.phone ? <span className="block">{snapshot.address.phone}</span> : null}
      </address>
      {snapshot.contact.invoiceRoutingNotes ? <p className="mt-2 whitespace-pre-wrap text-[12px] text-[#5f6670]">{snapshot.contact.invoiceRoutingNotes}</p> : null}
    </div>
  );
}
