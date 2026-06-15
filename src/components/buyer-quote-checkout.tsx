"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, CreditCard, FileText, Landmark, MapPin, ShieldCheck, Truck, Upload, X } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";

import type { AccountAddress, PaymentCard } from "@/lib/account-settings-shared";
import { quotedLineForRequestItem, type LatticeRequest, type RequestLineItem } from "@/lib/request-model";
import { StripeElementsPayment } from "./stripe-elements-payment";

type StripeElementsCheckoutSession = {
  clientSecret: string;
  publishableKey: string;
  sessionId: string;
};

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
  const customerLine = quotedLineForRequestItem(request.customerQuotes.at(-1)?.lineItems, item);

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

function trimText(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
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
  accountsPayableEmail,
  cards,
  finalizeStripeCardPaymentAction,
  paymentNotice,
  placeOrderAction,
  request,
  receivingPhone,
  shippingAddress,
  stripeElementsSession,
  updateStripeElementsSessionAction,
}: {
  accountsPayableEmail?: string;
  cards?: PaymentCard[];
  finalizeStripeCardPaymentAction?: (paymentIntentId: string, formData: FormData) => Promise<{ redirectTo: string }>;
  paymentNotice?: string;
  placeOrderAction: (formData: FormData) => void | Promise<void>;
  receivingPhone?: string;
  request: LatticeRequest;
  shippingAddress?: AccountAddress;
  stripeElementsSession?: StripeElementsCheckoutSession | null;
  updateStripeElementsSessionAction?: (checkoutSessionId: string, formData: FormData) => Promise<void>;
}) {
  const availableCards = useMemo(() => cards ?? [], [cards]);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "purchase-order">("card");
  const [poFileSummary, setPoFileSummary] = useState("");
  const [cardPaymentError, setCardPaymentError] = useState("");
  const [cardPaymentReady, setCardPaymentReady] = useState(false);
  const [cardPaymentSubmitting, setCardPaymentSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const poFileInputRef = useRef<HTMLInputElement | null>(null);
  const quoteId = quoteReference(request);
  const subtotalCents = request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents;
  const shippingCents = request.quote.shippingCostCents;
  const taxCents = subtotalCents === null ? null : 0;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (taxCents ?? 0);
  const latestQuote = request.customerQuotes.at(-1);
  const deliveryCompany = trimText(shippingAddress?.company) || request.shipToCompany || request.buyerCompany;
  const deliveryContact = trimText(shippingAddress?.name) || request.shipToName || request.requesterName;
  const deliveryAddress1 = trimText(shippingAddress?.address1) || request.shipToAddress1;
  const deliveryAddress2 = trimText(shippingAddress?.address2) || request.shipToAddress2;
  const deliveryCity = trimText(shippingAddress?.city) || request.shipToCity;
  const deliveryState = trimText(shippingAddress?.state) || request.shipToState;
  const deliveryZipCode = trimText(shippingAddress?.zipCode) || request.shipToZipCode;
  const defaultReceivingPhone = trimText(receivingPhone) || request.shipToPhone || request.requesterPhone;
  const noticeCopy =
    paymentNotice === "canceled"
      ? "Stripe payment was canceled. No order was placed, and you can restart card checkout when ready."
      : paymentNotice === "pending"
        ? "Stripe received the checkout return, but the order is still finalizing. Please try again in a moment."
        : paymentNotice === "missing-session"
          ? "Stripe did not return a checkout session. Please restart card checkout."
          : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (paymentMethod !== "card") {
      return;
    }

    event.preventDefault();
    setCardPaymentError("");

    if (!termsAccepted) {
      setCardPaymentError("Accept the quote terms before placing the order.");
      return;
    }

    if (!formRef.current || !window.latticeConfirmStripeElementsPayment) {
      setCardPaymentError("Secure card fields are still loading. Try again in a moment.");
      return;
    }

    await window.latticeConfirmStripeElementsPayment(formRef.current);
  }

  return (
    <form action={placeOrderAction} onSubmit={handleSubmit} ref={formRef}>
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
          {noticeCopy ? <p className="mt-4 rounded-md border border-[#f1d8a5] bg-[#fff7e8] px-4 py-3 text-[13px] font-medium text-[#8a5b08]">{noticeCopy}</p> : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-12">
          <main className="space-y-5 xl:col-span-8">
            <CheckoutSection icon={<MapPin aria-hidden="true" className="h-4 w-4" />} kicker="Step 1" title="Delivery address">
              <div className="rounded-md border border-[#dfe8f7] bg-[#f7fbff] p-4">
                <label className="inline-flex items-center gap-3">
                  <input className="accent-[#171717]" defaultChecked name="deliveryAddress" type="radio" value="primary" />
                  <span className="text-[14px] font-semibold text-[#202020]">Use this delivery address</span>
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <FieldLabel>Company</FieldLabel>
                    <TextInput defaultValue={deliveryCompany} name="shipToCompany" />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Address line 1</FieldLabel>
                    <TextInput defaultValue={deliveryAddress1} name="shipToAddress1" />
                  </div>
                  <div className="md:col-span-2">
                    <FieldLabel>Address line 2</FieldLabel>
                    <TextInput defaultValue={deliveryAddress2} name="shipToAddress2" placeholder="Suite, building, dock, or floor" />
                  </div>
                  <div>
                    <FieldLabel>City</FieldLabel>
                    <TextInput defaultValue={deliveryCity} name="shipToCity" />
                  </div>
                  <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3">
                    <div>
                      <FieldLabel>State</FieldLabel>
                      <TextInput defaultValue={deliveryState} name="shipToState" />
                    </div>
                    <div>
                      <FieldLabel>ZIP</FieldLabel>
                      <TextInput defaultValue={deliveryZipCode} name="shipToZipCode" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Receiving contact</FieldLabel>
                  <TextInput defaultValue={deliveryContact} name="shipToName" />
                </div>
                <div>
                  <FieldLabel>Receiving phone</FieldLabel>
                  <TextInput defaultValue={defaultReceivingPhone} name="shipToPhone" placeholder="Phone number" type="tel" />
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
              <input name="paymentMethod" type="hidden" value={paymentMethod} />
              <div className="grid gap-3 md:grid-cols-2">
                <label className={`rounded-md border p-4 transition ${paymentMethod === "card" ? "border-[#171717] bg-[#f8fafc]" : "border-[#e7e7e7] bg-white"}`}>
                  <span className="flex items-start gap-3">
                    <input
                      className="mt-1 accent-[#171717]"
                      checked={paymentMethod === "card"}
                      name="checkoutPaymentChoice"
                      onChange={() => setPaymentMethod("card")}
                      type="radio"
                      value="card"
                    />
                    <span>
                      <span className="flex items-center gap-2 text-[14px] font-semibold text-[#202020]">
                        <CreditCard aria-hidden="true" className="h-4 w-4 text-[#6f737a]" />
                        Pay securely with Stripe
                      </span>
                      <span className="mt-1 block text-[13px] leading-5 text-[#5f6670]">Enter payment details inline through Stripe before this quote becomes an order.</span>
                    </span>
                  </span>
                </label>
                <label className={`rounded-md border p-4 transition ${paymentMethod === "purchase-order" ? "border-[#171717] bg-[#f8fafc]" : "border-[#e7e7e7] bg-white"}`}>
                  <span className="flex items-start gap-3">
                    <input
                      className="mt-1 accent-[#171717]"
                      checked={paymentMethod === "purchase-order"}
                      name="checkoutPaymentChoice"
                      onChange={() => setPaymentMethod("purchase-order")}
                      type="radio"
                      value="purchase-order"
                    />
                    <span>
                      <span className="flex items-center gap-2 text-[14px] font-semibold text-[#202020]">
                        <FileText aria-hidden="true" className="h-4 w-4 text-[#6f737a]" />
                        Purchase order
                      </span>
                      <span className="mt-1 block text-[13px] leading-5 text-[#5f6670]">Upload the customer PO for invoice matching and order review.</span>
                    </span>
                  </span>
                </label>
              </div>

              {paymentMethod === "card" ? (
                <div className="mt-4 rounded-md border border-[#e7e7e7] bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <FieldLabel>Secure Stripe payment</FieldLabel>
                      <p className="mt-2 text-[13px] leading-5 text-[#5f6670]">All transactions are encrypted and processed by Stripe.</p>
                    </div>
                    <div aria-label="Supported card networks" className="flex items-center gap-1.5">
                      {["Visa", "MC", "Amex"].map((brand) => (
                        <span className="inline-flex h-7 min-w-11 items-center justify-center rounded-sm border border-[#dce1e8] bg-[#f8fafc] px-2 text-[11px] font-bold uppercase text-[#263341]" key={brand}>
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <StripeElementsPayment
                      enabled={paymentMethod === "card"}
                      finalizeStripeCardPaymentAction={finalizeStripeCardPaymentAction}
                      onError={setCardPaymentError}
                      onReadyChange={setCardPaymentReady}
                      onSubmittingChange={setCardPaymentSubmitting}
                      requestId={request.id}
                      session={stripeElementsSession ?? null}
                      updateStripeElementsSessionAction={updateStripeElementsSessionAction}
                    />
                    <p className="rounded-md border border-[#dfe8f7] bg-[#f7fbff] p-3 text-[13px] font-medium text-[#35536d]">
                      {availableCards.length > 0
                        ? "Saved Stripe cards may appear inside the secure card field."
                        : "No saved Stripe cards are on file. Enter card details above to pay this quote."}
                    </p>
                    {cardPaymentError ? <p className="rounded-md border border-[#f1d8a5] bg-[#fff7e8] p-3 text-[13px] font-medium text-[#8a5b08]">{cardPaymentError}</p> : null}
                  </div>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>PO number</FieldLabel>
                    <TextInput name="poNumber" placeholder="PO-1047" />
                  </div>
                  <div>
                    <FieldLabel>Accounts payable email</FieldLabel>
                    <TextInput defaultValue={accountsPayableEmail} name="apEmail" placeholder="ap@company.com" type="email" />
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-[12px] font-semibold text-[#4b525c]">Purchase order file</span>
                    <label htmlFor="poFile" className={`mt-2 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-5 text-center transition hover:border-[#9aa4b2] hover:bg-white ${
                      poFileSummary ? "border-[#b7ead8] bg-[#ecfbf4]" : "border-[#cfd5dd] bg-[#f8fafc]"
                    }`}>
                      {poFileSummary ? <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-[#126448]" /> : <Upload aria-hidden="true" className="h-5 w-5 text-[#7b8088]" />}
                      <span className="mt-2 text-[13px] font-semibold text-[#30343a]">{poFileSummary ? "PO document selected" : "Upload PO document"}</span>
                      <span className={`mt-1 text-[12px] ${poFileSummary ? "text-[#126448]" : "text-[#7b8088]"}`}>
                        {poFileSummary || "PDF, image, Word, or spreadsheet files are accepted."}
                      </span>
                    </label>
                    <input
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,image/*,application/pdf"
                      aria-label="Purchase order file"
                      className="sr-only"
                      id="poFile"
                      name="poFile"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (!file) {
                          return;
                        }
                        setPoFileSummary(`${file.name} (${formatFileSize(file.size)})`);
                      }}
                      ref={poFileInputRef}
                      type="file"
                    />
                    {poFileSummary ? (
                      <button
                        className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-md border border-[#d6d9de] bg-white px-3 text-[12px] font-semibold text-[#4b525c] transition hover:border-[#aeb5bf] hover:text-[#202020]"
                        onClick={() => {
                          setPoFileSummary("");
                          if (poFileInputRef.current) {
                            poFileInputRef.current.value = "";
                          }
                        }}
                        type="button"
                      >
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                        Remove PO file
                      </button>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <FieldLabel>Tax status</FieldLabel>
                <select className="mt-2 h-10 w-full rounded-md border border-[#dedede] bg-white px-3 text-[13px] text-[#202020] outline-none focus:border-[#9b9b9b]" defaultValue="taxable" name="taxStatus">
                  <option value="taxable">Taxable order</option>
                  <option value="exempt">Tax exempt certificate on file</option>
                  <option value="needs-certificate">Tax exempt, certificate needed</option>
                </select>
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
                    <dt className="text-[#6f737a]">
                      Shipping {request.quote.shippingMethod ? `(${request.quote.shippingMethod})` : ""}
                    </dt>
                    <dd className="font-semibold text-[#202020]">{formatPrice(shippingCents)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#6f737a]">Tax</dt>
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
                  <p className="mt-1 text-[12px] leading-5 text-[#7b8088]">Accepted quote total using saved production, shipping, and tax terms.</p>
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
                  <input
                    checked={termsAccepted}
                    className="mt-1 accent-[#171717]"
                    name="termsAccepted"
                    onChange={(event) => setTermsAccepted(event.currentTarget.checked)}
                    required
                    type="checkbox"
                  />
                  <span>I accept the quote basis, production lead time, Lattice purchasing terms, and understand the order will be reviewed before supplier release.</span>
                </label>

                <button
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#171717] px-4 text-[14px] font-semibold text-white transition hover:bg-[#2b2b2b] disabled:cursor-not-allowed disabled:bg-[#cfd4dc] disabled:text-[#667085]"
                  disabled={!termsAccepted || totalCents === null || (paymentMethod === "card" && (!cardPaymentReady || cardPaymentSubmitting))}
                  type="submit"
                >
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                  {paymentMethod === "card" ? (cardPaymentSubmitting ? "Processing payment..." : "Pay with Stripe") : "Place order"}
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
