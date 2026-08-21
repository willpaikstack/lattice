"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ClerkPasswordEditor } from "@/components/clerk-password-editor";
import { ProfilePictureEditor } from "@/components/profile-picture-editor";
import {
  defaultAccountSettings,
  type AccountAddress,
  type AccountSettingsSnapshot,
  type BillingContact,
  type EmailVerificationStatus,
} from "@/lib/account-settings-shared";

type Editable = "name" | "phone" | "company" | "shipping" | "billingAddress" | "billing" | null;

const completeAddress = (address: AccountAddress) => Boolean(
  address.name && address.company && address.address1 && address.city && address.state && address.zipCode,
);

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-md border border-[#d7dce2] bg-white">{children}</section>;
}

function CardTitle({ title, detail }: { title: string; detail?: string }) {
  return <div className="border-b border-[#dfe3e8] px-6 py-5"><h2 className="text-[18px] font-semibold tracking-tight text-[#253040]">{title}</h2>{detail ? <p className="mt-1 text-[13px] leading-5 text-[#737b86]">{detail}</p> : null}</div>;
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" onClick={onClick} type="button">{children}</button>;
}

function Row({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div className="grid gap-3 border-t border-[#e5e8ec] px-6 py-5 first:border-t-0 sm:grid-cols-[92px_1fr_auto]"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#6f7782]">{label}</p><div className="min-w-0 text-[14px] leading-6 text-[#253040]">{children}</div>{action ? <div>{action}</div> : null}</div>;
}

function Notice({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <p className={`rounded-md border px-4 py-3 text-[13px] font-medium ${error ? "border-red-200 bg-red-50 text-red-700" : "border-[#bee5da] bg-[#f3fcf8] text-[#146657]"}`}>{children}</p>;
}

function verification(status: EmailVerificationStatus, date: string) {
  if (status === "verified" && date) return `Verified on ${date}`;
  if (status === "verified") return "Email verified.";
  if (status === "not-verified") return "Email is not verified.";
  return "Verification status is temporarily unavailable.";
}

function Input({ label, value, setValue, type = "text" }: { label: string; value: string; setValue: (value: string) => void; type?: string }) {
  return <label className="block text-[13px] font-semibold text-[#303846]">{label}<input className="mt-2 w-full rounded-md border border-[#cfd5dd] px-3 py-2 text-[14px]" onChange={(event) => setValue(event.target.value)} type={type} value={value} /></label>;
}

function SaveCancel({ save, cancel, error, cancelLabel = "Cancel" }: { save: () => void; cancel?: () => void; error: string; cancelLabel?: string }) {
  return <div className="space-y-3">{error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}<div className="flex gap-2"><button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={save} type="button">Save changes</button>{cancel ? <button className="rounded-md border px-4 py-2 text-sm font-semibold" onClick={cancel} type="button">{cancelLabel}</button> : null}</div></div>;
}

function AddressEditor({ value, setValue, save, cancel, error, cancelLabel }: { value: AccountAddress; setValue: (next: AccountAddress) => void; save: () => void; cancel?: () => void; error: string; cancelLabel?: string }) {
  const set = (key: keyof AccountAddress) => (next: string) => setValue({ ...value, [key]: next });
  return <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Input label="Name" value={value.name} setValue={set("name")} /><Input label="Company" value={value.company} setValue={set("company")} /></div><Input label="Address line 1" value={value.address1} setValue={set("address1")} /><Input label="Address line 2" value={value.address2} setValue={set("address2")} /><div className="grid gap-3 sm:grid-cols-3"><Input label="City" value={value.city} setValue={set("city")} /><Input label="State" value={value.state} setValue={set("state")} /><Input label="ZIP code" value={value.zipCode} setValue={set("zipCode")} /></div><SaveCancel save={save} cancel={cancel} cancelLabel={cancelLabel} error={error} /></div>;
}

function AddressValue({ value }: { value: AccountAddress }) {
  return completeAddress(value) ? <address className="not-italic">{value.name}<br />{value.company}<br />{value.address1}{value.address2 ? <><br />{value.address2}</> : null}<br />{value.city}, {value.state} {value.zipCode}</address> : <p className="text-[#737b86]">Not configured.</p>;
}

function AddressOnboardingDialog({
  field,
  value,
  setValue,
  save,
  skip,
  error,
}: {
  field: "shipping" | "billingAddress";
  value: AccountAddress;
  setValue: (next: AccountAddress) => void;
  save: () => void;
  skip: () => void;
  error: string;
}) {
  const isShipping = field === "shipping";
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8 sm:flex sm:items-center sm:justify-center" role="presentation"><section aria-describedby="address-onboarding-description" aria-labelledby="address-onboarding-title" aria-modal="true" className="mx-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl sm:p-8" role="dialog"><div className="flex items-start justify-between gap-6"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#3b5bdb]">Account setup</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#182231]" id="address-onboarding-title">{isShipping ? "Where should we ship your parts?" : "What’s your billing address?"}</h1><p className="mt-2 text-sm leading-6 text-[#5f6673]" id="address-onboarding-description">{isShipping ? "Add the shared company shipping address used for RFQs, quotes, and orders." : "Review the billing address. It starts with your shipping address so you only need to change what differs."}</p></div><p className="shrink-0 rounded-full bg-[#edf2ff] px-3 py-1 text-xs font-semibold text-[#3b5bdb]">{isShipping ? "1 of 2" : "2 of 2"}</p></div><div className="mt-6"><AddressEditor error={error} save={save} setValue={setValue} value={value} /></div><button className="mt-5 text-xs font-medium text-[#667085] underline hover:text-[#253040]" onClick={skip} type="button">Skip for now — you can add these addresses later in Account settings</button></section></div>;
}

export function AccountSettingsWorkspace({
  initialSettings: provided,
  saveSettingsAction = async (settings) => settings,
  deferInitialAddressOnboardingAction,
  updateRequestShippingAddressAction,
  updateDisplayNameAction,
}: {
  initialSettings?: AccountSettingsSnapshot;
  saveSettingsAction?: (settings: AccountSettingsSnapshot) => Promise<AccountSettingsSnapshot>;
  deferInitialAddressOnboardingAction?: () => Promise<void>;
  updateRequestShippingAddressAction?: (requestId: string, address: AccountAddress) => Promise<void>;
  updateDisplayNameAction?: (name: string) => Promise<{ name: string }>;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [settings, setSettings] = useState(() => provided ?? defaultAccountSettings());
  const onboarding = search.get("onboarding") === "addresses";
  const requestId = search.get("request");
  const [editing, setEditing] = useState<Editable>(() => onboarding || search.get("edit") === "shipping" ? "shipping" : null);
  const [draft, setDraft] = useState("");
  const [addressDraft, setAddressDraft] = useState<AccountAddress>(settings.shipping);
  const [billingDraft, setBillingDraft] = useState<BillingContact>(settings.billing);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [skipping, setSkipping] = useState(false);
  const canManage = Boolean(settings.canManageCompany);
  const canSetup = canManage || Boolean(settings.canCompleteInitialAddressOnboarding);
  const initials = settings.name.split(/\s+/).filter(Boolean).map((name) => name[0]).join("").slice(0, 2).toUpperCase() || "A";
  const showOnboardingDialog = onboarding && canSetup && (editing === "shipping" || editing === "billingAddress");

  const start = (field: Editable, value = "") => {
    setEditing(field);
    setDraft(value);
    setError("");
    setMessage("");
    if (field === "shipping") setAddressDraft(settings.shipping);
    if (field === "billingAddress") setAddressDraft(settings.billingAddress);
    if (field === "billing") setBillingDraft(settings.billing);
  };
  const cancel = () => { setEditing(null); setError(""); };
  async function persist(next: AccountSettingsSnapshot) { const saved = await saveSettingsAction(next); setSettings(saved); return saved; }
  async function skipOnboarding() {
    if (!deferInitialAddressOnboardingAction) return router.replace("/dashboard");
    setSkipping(true);
    setError("");
    try {
      await deferInitialAddressOnboardingAction();
      router.replace("/dashboard");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to defer address setup. Please try again.");
      setSkipping(false);
    }
  }
  async function saveText(field: "name" | "phone" | "company") {
    const value = draft.trim();
    if (!value) return setError("This field cannot be blank.");
    try {
      if (field === "name" && updateDisplayNameAction) {
        const updated = await updateDisplayNameAction(value);
        await persist({ ...settings, name: updated.name });
      } else await persist({ ...settings, [field === "company" ? "companyName" : field]: value });
      setEditing(null);
      setMessage("Saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save this change."); }
  }
  async function saveAddress(field: "shipping" | "billingAddress") {
    const next = Object.fromEntries(Object.entries(addressDraft).map(([key, value]) => [key, value.trim()])) as AccountAddress;
    if (!completeAddress(next)) return setError("Name, company, address, city, state, and ZIP code are required.");
    try {
      if (field === "shipping" && requestId && updateRequestShippingAddressAction) {
        await updateRequestShippingAddressAction(requestId, next);
        setSettings({ ...settings, shipping: next });
        router.replace(`/quotes/${encodeURIComponent(requestId)}`);
        return;
      }
      const saved = await persist({ ...settings, [field]: next });
      if (onboarding && field === "shipping") {
        setAddressDraft(saved.billingAddress);
        setEditing("billingAddress");
        setMessage("Shipping address saved. Add a billing address to finish setup.");
        return;
      }
      setEditing(null);
      setMessage(onboarding ? "Addresses saved. Taking you to your workspace." : "Company address saved.");
      if (onboarding) router.replace("/dashboard");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save this address."); }
  }
  async function saveBilling() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDraft.email)) return setError("Enter a valid billing email address.");
    try { await persist({ ...settings, billing: billingDraft }); setEditing(null); setMessage("Billing contact saved."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save billing contact."); }
  }

  return <><div aria-hidden={showOnboardingDialog} className="mx-auto max-w-[1040px] space-y-5"><header><h1 className="text-[28px] font-semibold tracking-tight text-[#182231]">Account settings</h1><p className="mt-1 text-[14px] leading-6 text-[#5f6673]">Manage your profile and operational company defaults.</p></header>{message ? <Notice>{message}</Notice> : null}<div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]"><aside className="space-y-5"><ProfilePictureEditor initials={initials} initialImageUrl={settings.profileImageUrl} initialPreset={settings.avatarPreset} /><Card><CardTitle title="Account Summary" detail="Current workspace access." /><div className="space-y-4 p-6"><div><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#6f7782]">Role</p><p className="mt-1 font-semibold">{settings.roleLabel || "Customer Member"}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#6f7782]">Account</p><p className="mt-1 font-semibold">{settings.companyName || "No company assigned"}</p></div><div><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#6f7782]">Currency</p><p className="mt-1 font-semibold">USD</p></div></div></Card></aside><div className="space-y-5"><Card><CardTitle title="Personal Information" detail="Contact details shown on RFQs, quotes, and order communication." /><Row label="Name" action={<Button onClick={() => start("name", settings.name)}>Edit name</Button>}>{editing === "name" ? <div className="space-y-3"><Input label="Name" value={draft} setValue={setDraft} /><SaveCancel save={() => saveText("name")} cancel={cancel} error={error} /></div> : <><p>{settings.name}</p><p className="text-[#737b86]">{settings.accountCreatedAt ? `Account created on ${settings.accountCreatedAt}` : "Account creation date unavailable."}</p></>}</Row><Row label="Phone" action={<Button onClick={() => start("phone", settings.phone)}>Edit phone</Button>}>{editing === "phone" ? <div className="space-y-3"><Input label="Phone number" value={draft} setValue={setDraft} type="tel" /><SaveCancel save={() => saveText("phone")} cancel={cancel} error={error} /></div> : <p>{settings.phone || "Not provided."}</p>}</Row></Card><Card><CardTitle title="Account Security" detail="Sign-in details are sourced from Clerk." /><Row label="Email"><p>{settings.email}</p><p className="mt-1 text-[12px] font-medium text-[#008f72]">{verification(settings.emailVerificationStatus, settings.emailVerifiedAt)}</p><p className="mt-2 text-[12px] text-[#737b86]">To change your sign-in email, contact <a className="font-semibold text-[#3b5bdb]" href="mailto:support@latticeos.co?subject=Email%20address%20change%20request">Lattice support</a>.</p></Row><Row label="Password"><ClerkPasswordEditor /></Row><Row label="Buyer company" action={canManage ? <Button onClick={() => start("company", settings.companyName)}>Edit company</Button> : undefined}>{editing === "company" ? <div className="space-y-3"><Input label="Buyer company" value={draft} setValue={setDraft} /><SaveCancel save={() => saveText("company")} cancel={cancel} error={error} /></div> : <><p>{settings.companyName || "Not configured."}</p><p className="text-[#737b86]">Company details are managed by Lattice Admin.</p></>}</Row><Row label="Payments"><p className="font-semibold">Card payments available at checkout</p><p className="text-[#737b86]">Payment cards are company-wide; saved-card management will be enabled after the company vault migration.</p></Row></Card><Card><CardTitle title="Manufacturing Account Defaults" detail="Shared company shipping and billing defaults." />{!canSetup ? <p className="px-6 py-5 text-[13px] leading-5 text-[#737b86]">Lattice Admin manages company defaults. You can update shipping for an individual quote from that quote’s shipping panel.</p> : null}<Row label="Shipping" action={canSetup || requestId ? <Button onClick={() => start("shipping")}>Edit shipping</Button> : undefined}>{editing === "shipping" && !showOnboardingDialog ? <AddressEditor value={addressDraft} setValue={setAddressDraft} save={() => saveAddress("shipping")} cancel={cancel} error={error} /> : <AddressValue value={settings.shipping} />}</Row><Row label="Billing address" action={canSetup ? <Button onClick={() => start("billingAddress")}>Edit billing address</Button> : undefined}>{editing === "billingAddress" && !showOnboardingDialog ? <AddressEditor value={addressDraft} setValue={setAddressDraft} save={() => saveAddress("billingAddress")} cancel={cancel} error={error} /> : <AddressValue value={settings.billingAddress} />}</Row><Row label="Billing contact" action={canSetup ? <Button onClick={() => start("billing")}>Edit billing</Button> : undefined}>{editing === "billing" ? <div className="space-y-3"><Input label="Billing email" value={billingDraft.email} setValue={(email) => setBillingDraft({ ...billingDraft, email })} type="email" /><label className="block text-[13px] font-semibold">Invoice notes<textarea className="mt-2 w-full rounded-md border p-3" onChange={(event) => setBillingDraft({ ...billingDraft, invoiceRoutingNotes: event.target.value })} value={billingDraft.invoiceRoutingNotes} /></label><SaveCancel save={saveBilling} cancel={cancel} error={error} /></div> : <>{settings.billing.email ? <p>{settings.billing.email}</p> : <p className="text-[#737b86]">Not configured.</p>}{settings.billing.invoiceRoutingNotes ? <p className="mt-1 text-[#737b86]">{settings.billing.invoiceRoutingNotes}</p> : null}</>}</Row></Card><Card><CardTitle title="Team access" detail="Company users are managed by Lattice Admin." /><p className="px-6 py-5 text-[13px] leading-5 text-[#737b86]">For access changes, contact Lattice support. Customer-admin team management is planned for a future release.</p></Card></div></div></div>{showOnboardingDialog ? <AddressOnboardingDialog error={error} field={editing} save={() => saveAddress(editing)} setValue={setAddressDraft} skip={skipOnboarding} value={addressDraft} /> : null}{skipping ? <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45"><p className="rounded-md bg-white px-4 py-3 text-sm font-medium shadow">Skipping address setup…</p></div> : null}</>;
}
