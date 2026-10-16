import { requestBillToLines } from "@/lib/request-billing";
import type { LatticeRequest } from "@/lib/request-model";

/** A read-only record snapshot, shared by quote, checkout and order detail. */
export function RequestBillingAddress({ request }: { request: LatticeRequest }) {
  if (!request.billingSnapshot) return null;
  return (
    <div className="border-t border-[#eeeeee] px-6 py-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Billing address &amp; contact</p>
      <address className="mt-3 text-[13px] not-italic leading-5 text-[#5f6670]">
        {requestBillToLines(request).map((line, index) => <span className="block" key={index}>{line}</span>)}
      </address>
      {request.billingSnapshot.contact.invoiceRoutingNotes ? <p className="mt-2 whitespace-pre-wrap text-[12px] text-[#5f6670]">{request.billingSnapshot.contact.invoiceRoutingNotes}</p> : null}
    </div>
  );
}
