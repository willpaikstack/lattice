"use client";

import { useId, useState } from "react";
import type { AccountAddress } from "@/lib/account-settings-shared";
import { checkoutAddressFields, completeCheckoutAddress } from "@/lib/checkout-addresses";
import { AccountAddressFields } from "./account-address-fields";

type AddressDefaults = { shipping: AccountAddress; billing: AccountAddress; billingSameAsShipping: boolean; canSave: boolean };
export type CheckoutAddressDefaults = AddressDefaults;

function AddressSummary({ address }: { address: AccountAddress }) {
  return <address className="mt-3 text-sm not-italic leading-6 text-slate-600">{[address.name, address.company, address.address1, address.address2, `${address.city}, ${address.state} ${address.zipCode}`, address.phone].filter(Boolean).map((line, index) => <span className="block" key={index}>{line}</span>)}</address>;
}

function AddressChoice({ title, saved, value, setValue, prefix }: { title: string; saved?: AccountAddress; value: AccountAddress; setValue: (value: AccountAddress) => void; prefix: "shipTo" | "billTo" }) {
  const id = useId();
  const hasSaved = Boolean(saved && completeCheckoutAddress(saved));
  const [mode, setMode] = useState(hasSaved ? "saved" : "different");
  const [custom, setCustom] = useState(value);
  return <fieldset className="space-y-4"><legend className="mb-3 text-base font-semibold">{title}</legend>
    {hasSaved ? <div className="space-y-3 rounded-md border border-slate-200 p-4">
      <label className="flex items-center gap-2 text-sm"><input checked={mode === "saved"} name={id} onChange={() => { setCustom(value); setMode("saved"); setValue({ ...saved! }); }} type="radio" />Use saved {title.toLowerCase()}</label>
      {mode === "saved" ? <AddressSummary address={value} /> : null}
      <label className="flex items-center gap-2 text-sm"><input checked={mode === "different"} name={id} onChange={() => { setMode("different"); setValue(custom); }} type="radio" />Use a different {title.toLowerCase()} for this order</label>
    </div> : null}
    {mode === "different" ? <AccountAddressFields hideSuggestionsHelp nameLabel={prefix === "shipTo" ? "Delivery Attn:" : "Full name"} value={value} setValue={next => { setCustom(next); setValue(next); }} /> : null}
  </fieldset>;
}

export function CheckoutAddresses({ initialShipping, initialBilling, defaults }: { initialShipping: AccountAddress; initialBilling: AccountAddress; defaults?: AddressDefaults }) {
  const savedShipping = defaults && completeCheckoutAddress(defaults.shipping) ? defaults.shipping : undefined;
  const savedBilling = defaults && completeCheckoutAddress(defaults.billing) ? defaults.billing : undefined;
  const [shipping, setShipping] = useState(savedShipping ?? initialShipping);
  const [billing, setBilling] = useState(savedBilling ?? initialBilling);
  const [sameAsShipping, setSameAsShipping] = useState(defaults?.billingSameAsShipping ?? !completeCheckoutAddress(initialBilling));
  const effectiveBilling = sameAsShipping ? shipping : billing;
  return <div className="space-y-6">
    <p className="text-sm text-slate-600">Confirm both addresses before continuing to payment. Changes apply to this order unless you choose to save them to your account.</p>
    <AddressChoice title="Shipping address" prefix="shipTo" saved={savedShipping} value={shipping} setValue={setShipping} />
    <div className="border-t border-slate-200 pt-5"><label className="flex items-center gap-2 text-sm"><input checked={sameAsShipping} onChange={event => setSameAsShipping(event.target.checked)} type="checkbox" />Billing address is the same as shipping</label></div>
    {sameAsShipping ? <div><h3 className="text-base font-semibold">Billing address</h3><AddressSummary address={effectiveBilling} /></div> : null}
    <div hidden={sameAsShipping}><AddressChoice title="Billing address" prefix="billTo" saved={savedBilling} value={billing} setValue={setBilling} /></div>
    {([['shipTo', shipping], ['billTo', effectiveBilling]] as const).flatMap(([prefix, address]) => checkoutAddressFields.map(key => <input key={`${prefix}-${key}`} type="hidden" name={`${prefix}${key[0].toUpperCase()}${key.slice(1)}`} value={address[key] ?? ""} />))}
    <input type="hidden" name="billingSameAsShipping" value={sameAsShipping ? "on" : "off"} />
    {defaults?.canSave ? <label className="flex items-start gap-2 rounded-md bg-slate-50 p-4 text-sm"><input className="mt-1" name="saveAddressDefaults" type="checkbox" /><span>Save these addresses as my account defaults<span className="mt-1 block text-xs text-slate-600">Updates your company’s shared shipping and billing addresses when you continue to payment.</span></span></label> : null}
  </div>;
}
