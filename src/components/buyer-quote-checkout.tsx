import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, FileText, Landmark, MapPin, ShieldCheck, Truck } from "lucide-react";
import type { ReactNode } from "react";

import type { LatticeRequest, RequestLineItem } from "@/lib/request-model";

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function quoteReference(request: LatticeRequest) {
  return request.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${request.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function lineTotalCents(request: LatticeRequest, item: RequestLineItem) {
  const customerLine = request.customerQuotes.at(-1)?.lineItems.find((line) => line.description === item.partName || line.id === item.id);

  if (customerLine) {
    return Math.round(customerLine.unitPrice * customerLine.quantity * 100);
  }

  if (request.lineItems.length === 1) {
    return request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  }

  return null;
}

function deliveryDate(request: LatticeRequest) {
  const leadTimeDays = request.quote.leadTimeDays ?? 18;
  const date = new Date();
  date.setDate(date.getDate() + leadTimeDays + 5);

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-[12px] font-semibold text-[#4b525c]">{children}</label>;
}

function TextInput({ defaultValue, name, placeholder, type = "text" }: { defaultValue?: string; name: string; placeholder?: string; type?: string }) {
  return (
    <input
      className="mt-2 h-10 w-full rounded-md border border-[#dedede] bg-white px-3 text-[13px] text-[#202020] outline-none transition placeholder:text-[#a0a6af] focus:border-[#9b9b9b]"
      defaultValue={defaultValue}
      name={name}
      placeholder={placeholder}
      type={type}
    />
  );
}

function CheckoutSection({
  children,
  icon,
  kicker,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <section className="rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-3 border-b border-[#eeeeee] px-6 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e8e8e8] bg-[#fafafa] text-[#6f737a]">{icon}</span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">{kicker}</p>
          <h2 className="mt-1 text-[16px] font-semibold text-[#202020]">{title}</h2>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

export function BuyerQuoteCheckout({
  placeOrderAction,
  request,
}: {
  placeOrderAction: () => void | Promise<void>;
  request: LatticeRequest;
}) {
  const quoteId = quoteReference(request);
  const subtotalCents = request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  const shippingCents = subtotalCents === null ? null : 3500;
  const taxCents = subtotalCents === null ? null : Math.round(subtotalCents * 0.08875);
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (taxCents ?? 0);
  const latestQuote = request.customerQuotes.at(-1);

  return (
    <form action={placeOrderAction}>
      <div className="mx-auto w-full max-w-[1480px] px-2 pb-12">
        <div className="mb-7">
          <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6f737a] transition hover:text-[#171717]" href={`/quotes/${request.id}`}>
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
            Back to quote
          </Link>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#7a7f87]">Quote checkout</p>
              <h1 className="mt-2 text-[32px] font-semibold leading-tight tracking-normal text-[#171717]">Checkout for {quoteId}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#6f737a]">
                Confirm delivery, import responsibility, payment details, and purchasing terms before converting this quote into an order.
              </p>
            </div>
            <p className="text-[13px] text-[#7b8088]">{request.title}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <main className="space-y-5 xl:col-span-8">
            <CheckoutSection icon={<MapPin aria-hidden="true" className="h-4 w-4" />} kicker="Step 1" title="Delivery address">
              <div className="rounded-md border border-[#dfe8f7] bg-[#f7fbff] p-4">
                <label className="flex items-start gap-3">
                  <input className="mt-1 accent-[#171717]" defaultChecked name="deliveryAddress" type="radio" value="primary" />
                  <span>
                    <span className="block text-[14px] font-semibold text-[#202020]">{request.buyerCompany}</span>
                    <span className="mt-1 block text-[13px] leading-5 text-[#5f6670]">123 Main Street, Brooklyn, NY 11201<br />Attn: {request.requesterName}</span>
                  </span>
                </label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Receiving contact</FieldLabel>
                  <TextInput defaultValue={request.requesterName} name="receivingContact" />
                </div>
                <div>
                  <FieldLabel>Receiving phone</FieldLabel>
                  <TextInput name="receivingPhone" placeholder="Phone number" type="tel" />
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection icon={<Truck aria-hidden="true" className="h-4 w-4" />} kicker="Step 2" title="Shipping and import method">
              <div className="grid gap-3">
                <label className="rounded-md border border-[#dfe8f7] bg-[#f7fbff] p-4">
                  <span className="flex items-start gap-3">
                    <input className="mt-1 accent-[#171717]" defaultChecked name="shippingMethod" type="radio" value="lattice-managed" />
                    <span>
                      <span className="block text-[14px] font-semibold text-[#202020]">Lattice managed landed delivery</span>
                      <span className="mt-1 block text-[13px] leading-5 text-[#5f6670]">Lattice coordinates supplier shipment, import clearance, duties, and delivery to your receiving address.</span>
                    </span>
                  </span>
                </label>
                <label className="rounded-md border border-[#e7e7e7] bg-white p-4">
                  <span className="flex items-start gap-3">
                    <input className="mt-1 accent-[#171717]" name="shippingMethod" type="radio" value="buyer-account" />
                    <span>
                      <span className="block text-[14px] font-semibold text-[#202020]">Use company shipping account</span>
                      <span className="mt-1 block text-[13px] leading-5 text-[#5f6670]">Provide account details after order placement. Duties and carrier charges may be billed separately.</span>
                    </span>
                  </span>
                </label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Required delivery date</FieldLabel>
                  <TextInput name="requiredDeliveryDate" type="date" />
                </div>
                <div>
                  <FieldLabel>Special shipping instructions</FieldLabel>
                  <TextInput name="shippingInstructions" placeholder="Dock hours, package labels, carrier notes" />
                </div>
              </div>
            </CheckoutSection>

            <CheckoutSection icon={<ShieldCheck aria-hidden="true" className="h-4 w-4" />} kicker="Step 3" title="Customs and compliance">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>End use</FieldLabel>
                  <select className="mt-2 h-10 w-full rounded-md border border-[#dedede] bg-white px-3 text-[13px] text-[#202020] outline-none focus:border-[#9b9b9b]" defaultValue="prototype" name="endUse">
                    <option value="prototype">Prototype / validation build</option>
                    <option value="production">Commercial production</option>
                    <option value="maintenance">Maintenance / replacement part</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Export control status</FieldLabel>
                  <select className="mt-2 h-10 w-full rounded-md border border-[#dedede] bg-white px-3 text-[13px] text-[#202020] outline-none focus:border-[#9b9b9b]" defaultValue="not-controlled" name="exportControlStatus">
                    <option value="not-controlled">Not ITAR/EAR controlled</option>
                    <option value="needs-review">Needs Lattice review</option>
                  </select>
                </div>
              </div>
              <label className="mt-5 flex items-start gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 text-[13px] leading-5 text-[#4f5660]">
                <input className="mt-1 accent-[#171717]" name="complianceCertification" required type="checkbox" />
                <span>I certify that the uploaded technical data and ordered parts are not weapons, controlled defense articles, or otherwise restricted beyond the information provided here.</span>
              </label>
            </CheckoutSection>

            <CheckoutSection icon={<Landmark aria-hidden="true" className="h-4 w-4" />} kicker="Step 4" title="Payment and purchasing">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Payment method</FieldLabel>
                  <select className="mt-2 h-10 w-full rounded-md border border-[#dedede] bg-white px-3 text-[13px] text-[#202020] outline-none focus:border-[#9b9b9b]" defaultValue="purchase-order" name="paymentMethod">
                    <option value="purchase-order">Purchase order / invoice terms</option>
                    <option value="card">Card payment after order review</option>
                    <option value="wire">Wire transfer</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>PO number</FieldLabel>
                  <TextInput name="poNumber" placeholder="PO-1047" />
                </div>
                <div>
                  <FieldLabel>Accounts payable email</FieldLabel>
                  <TextInput name="apEmail" placeholder="ap@company.com" type="email" />
                </div>
                <div>
                  <FieldLabel>Tax status</FieldLabel>
                  <select className="mt-2 h-10 w-full rounded-md border border-[#dedede] bg-white px-3 text-[13px] text-[#202020] outline-none focus:border-[#9b9b9b]" defaultValue="taxable" name="taxStatus">
                    <option value="taxable">Taxable order</option>
                    <option value="exempt">Tax exempt certificate on file</option>
                    <option value="needs-certificate">Tax exempt, certificate needed</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <FieldLabel>Buyer notes</FieldLabel>
                <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#dedede] bg-white px-3 py-2 text-[13px] text-[#202020] outline-none transition placeholder:text-[#a0a6af] focus:border-[#9b9b9b]" name="buyerNotes" placeholder="Internal order references, quality requirements, receiving instructions, or purchasing notes." />
              </div>
            </CheckoutSection>
          </main>

          <aside className="space-y-5 xl:col-span-4">
            <section className="rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:sticky xl:top-6">
              <div className="border-b border-[#eeeeee] px-6 py-5">
                <h2 className="text-[16px] font-semibold text-[#202020]">Order summary</h2>
                <p className="mt-1 text-[12px] text-[#7b8088]">{quoteId}</p>
              </div>
              <div className="space-y-4 px-6 py-5">
                {request.lineItems.map((item) => (
                  <div className="flex gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={item.id}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-[#8a8f98]">
                      <FileText aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[#202020]">{item.partName}</p>
                      <p className="mt-1 text-[12px] text-[#7b8088]">Qty {item.quantity} - {request.process}</p>
                    </div>
                    <p className="text-[13px] font-semibold text-[#202020]">{formatPrice(lineTotalCents(request, item))}</p>
                  </div>
                ))}

                <dl className="space-y-3 border-t border-[#eeeeee] pt-4 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6f737a]">Subtotal</dt>
                    <dd className="font-semibold text-[#202020]">{formatPrice(subtotalCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6f737a]">Managed shipping</dt>
                    <dd className="font-semibold text-[#202020]">{formatPrice(shippingCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6f737a]">Estimated tax</dt>
                    <dd className="font-semibold text-[#202020]">{formatPrice(taxCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6f737a]">Duties / tariffs</dt>
                    <dd className="font-semibold text-[#202020]">Included</dd>
                  </div>
                </dl>

                <div className="border-t border-[#eeeeee] pt-4">
                  <div className="flex justify-between gap-4">
                    <p className="text-[14px] font-semibold text-[#202020]">Total</p>
                    <p className="text-[22px] font-semibold text-[#171717]">{formatPrice(totalCents)}</p>
                  </div>
                  <p className="mt-1 text-[12px] leading-5 text-[#7b8088]">Landed estimate including shipping, tax, duties, and import handling where applicable.</p>
                </div>

                <div className="rounded-md bg-[#fbfaf7] p-4">
                  <div className="flex items-center gap-2 text-[13px] font-semibold text-[#202020]">
                    <CalendarDays aria-hidden="true" className="h-4 w-4 text-[#7b8088]" />
                    Estimated delivery
                  </div>
                  <p className="mt-2 text-[20px] font-semibold text-[#171717]">{deliveryDate(request)}</p>
                  <p className="mt-1 text-[12px] text-[#7b8088]">{latestQuote?.leadTime || `${request.quote.leadTimeDays ?? 18} business days`} after order release.</p>
                </div>

                <label className="flex items-start gap-3 text-[12px] leading-5 text-[#4f5660]">
                  <input className="mt-1 accent-[#171717]" name="termsAccepted" required type="checkbox" />
                  <span>I accept the quote basis, production lead time, Lattice purchasing terms, and understand the order will be reviewed before supplier release.</span>
                </label>

                <button className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b]" type="submit">
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  Place order
                </button>
                <Link className="flex min-h-10 w-full items-center justify-center rounded-md border border-[#dedede] bg-white px-4 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={`/quotes/${request.id}`}>
                  Back to quote
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </form>
  );
}
