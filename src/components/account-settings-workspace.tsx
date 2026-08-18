"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProfilePictureEditor } from "@/components/profile-picture-editor";
import {
  accountSettingsStorageKey,
  defaultAccountSettings,
  initialBillingContact,
  initialShippingAddress,
  type AccountAddress as Address,
  type AccountSettingsSnapshot,
  type BillingContact,
  type PaymentCard,
  type TeamMember,
} from "@/lib/account-settings-shared";

type ActiveTab = "account" | "team";
type EditableField = "name" | "phone" | "email" | "password" | "companyName" | "shipping" | "billingAddress" | "billing" | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStoredAccountSettings() {
  if (typeof window === "undefined" || !window.localStorage?.getItem) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(accountSettingsStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredAccountSettings(settings: AccountSettingsSnapshot) {
  if (typeof window === "undefined" || !window.localStorage?.setItem) {
    return;
  }

  try {
    window.localStorage.setItem(accountSettingsStorageKey, JSON.stringify(settings));
  } catch {
    // Account edits should still work in-memory when browser storage is unavailable.
  }
}

function storedString(settings: Record<string, unknown>, key: string) {
  const value = settings[key];
  return typeof value === "string" ? value : null;
}

function storedAddress(value: unknown, fallback: Address) {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    address1: storedString(value, "address1") ?? fallback.address1,
    address2: storedString(value, "address2") ?? fallback.address2,
    city: storedString(value, "city") ?? fallback.city,
    company: storedString(value, "company") ?? fallback.company,
    name: storedString(value, "name") ?? fallback.name,
    state: storedString(value, "state") ?? fallback.state,
    zipCode: storedString(value, "zipCode") ?? fallback.zipCode,
  };
}

function storedBillingContact(value: unknown, fallback: BillingContact) {
  if (typeof value === "string") {
    const [email = fallback.email, ...notes] = value.split("\n");
    return {
      email: email.trim() || fallback.email,
      invoiceRoutingNotes: notes.join("\n").trim() || fallback.invoiceRoutingNotes,
    };
  }

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    email: storedString(value, "email") ?? fallback.email,
    invoiceRoutingNotes: storedString(value, "invoiceRoutingNotes") ?? fallback.invoiceRoutingNotes,
  };
}

function getStoredAccountSettings(serverInitialSettings?: AccountSettingsSnapshot): AccountSettingsSnapshot | null {
  const defaults = serverInitialSettings ?? defaultAccountSettings();
  const stored = readStoredAccountSettings();
  if (!isRecord(stored)) {
    return null;
  }

  const storedCards = stored.cards;
  const storedTeamMembers = stored.teamMembers;

  return {
    billing: storedBillingContact(stored.billing, defaults.billing),
    billingAddress: storedAddress(stored.billingAddress, defaults.billingAddress),
    cards: Array.isArray(storedCards) ? (storedCards as PaymentCard[]) : defaults.cards,
    companyName: storedString(stored, "companyName") ?? defaults.companyName,
    email: storedString(stored, "email") ?? defaults.email,
    mfaEnabled: typeof stored.mfaEnabled === "boolean" ? stored.mfaEnabled : defaults.mfaEnabled,
    name: storedString(stored, "name") ?? defaults.name,
    passwordChangedAt: storedString(stored, "passwordChangedAt") ?? defaults.passwordChangedAt,
    phone: storedString(stored, "phone") ?? defaults.phone,
    shipping: storedAddress(stored.shipping, defaults.shipping),
    stripeCustomerId: storedString(stored, "stripeCustomerId") ?? defaults.stripeCustomerId,
    teamMembers: Array.isArray(storedTeamMembers) ? (storedTeamMembers as TeamMember[]) : defaults.teamMembers,
  };
}

function getPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function formatUsPhoneNumber(value: string) {
  const digits = getPhoneDigits(value);
  const nationalNumber = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (nationalNumber.length !== 10 || (digits.length === 11 && !digits.startsWith("1"))) {
    return null;
  }

  return `+1 (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-md border border-[#d7dce2] bg-white">{children}</section>;
}

function CardTitle({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#dfe3e8] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-[18px] font-semibold tracking-tight text-[#253040]">{title}</h2>
        {detail ? <p className="mt-1 text-[13px] leading-5 text-[#737b86]">{detail}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function FieldButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008f72]" onClick={onClick} type="button">
      {children}
    </button>
  );
}

function StatusLine({ children, tone = "success" }: { children: React.ReactNode; tone?: "success" | "warning" | "neutral" }) {
  const toneClass = {
    neutral: "text-[#737b86]",
    success: "text-[#008f72]",
    warning: "text-[#b45309]",
  }[tone];

  return (
    <p className={`mt-1 text-[12px] font-medium ${toneClass}`}>
      <span aria-hidden="true">{tone === "success" ? "OK " : tone === "warning" ? "! " : ""}</span>
      {children}
    </p>
  );
}

function TextField({
  label,
  name,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  name: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-[13px] font-semibold text-[#303846]">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-[#cfd5dd] bg-white px-3 py-2 text-[14px] font-medium text-[#182231] outline-none transition focus:border-[#00a889] focus:ring-2 focus:ring-[#00a889]/15"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: TValue) => void;
  options: TValue[];
  value: TValue;
}) {
  return (
    <label className="block text-[13px] font-semibold text-[#303846]">
      {label}
      <select
        className="mt-2 w-full rounded-md border border-[#cfd5dd] bg-white px-3 py-2 text-[14px] font-medium text-[#182231] outline-none transition focus:border-[#00a889] focus:ring-2 focus:ring-[#00a889]/15"
        onChange={(event) => onChange(event.target.value as TValue)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SaveCancel({
  cancel,
  error,
  save,
}: {
  cancel: () => void;
  error?: string;
  save: () => void;
}) {
  return (
    <div>
      {error ? <p aria-atomic="true" className="mb-3 text-[13px] font-semibold text-[#b42318]" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008f72]" onClick={save} type="button">
          Save changes
        </button>
        <button className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008f72]" onClick={cancel} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}

function CardBrand({ brand }: { brand: string }) {
  return (
    <span className="inline-flex h-5 min-w-9 items-center justify-center rounded-sm bg-[#2457a6] px-1.5 text-[10px] font-bold uppercase text-white">
      {brand}
    </span>
  );
}

export function AccountSettingsWorkspace({
  createCardSetupAction,
  detachCardAction,
  initialSettings: serverInitialSettings,
  saveSettingsAction,
}: {
  createCardSetupAction?: () => void | Promise<void>;
  detachCardAction?: (formData: FormData) => void | Promise<void>;
  initialSettings?: AccountSettingsSnapshot;
  saveSettingsAction?: (settings: AccountSettingsSnapshot) => Promise<void>;
}) {
  const searchParams = useSearchParams();
  const [initialSettings] = useState(() => serverInitialSettings ?? defaultAccountSettings());
  const [initialEditTarget] = useState<EditableField>(() => (searchParams.get("edit") === "shipping" ? "shipping" : null));
  const [activeTab, setActiveTab] = useState<ActiveTab>("account");
  const [editing, setEditing] = useState<EditableField>(initialEditTarget);
  const [notice, setNotice] = useState(
    searchParams.get("payment_method") === "added"
      ? "Payment method added in Stripe."
      : searchParams.get("payment_method") === "canceled"
        ? "Stripe card setup was canceled."
        : initialEditTarget === "shipping"
      ? "Make a change, then save or cancel."
      : "Account settings changes are stored for this demo session.",
  );
  const [error, setError] = useState("");
  const [name, setName] = useState(initialSettings.name);
  const [phone, setPhone] = useState(initialSettings.phone);
  const [email, setEmail] = useState(initialSettings.email);
  const [passwordChangedAt, setPasswordChangedAt] = useState(initialSettings.passwordChangedAt);
  const [mfaEnabled, setMfaEnabled] = useState(initialSettings.mfaEnabled);
  const [companyName, setCompanyName] = useState(initialSettings.companyName);
  const [shipping, setShipping] = useState<Address>(initialSettings.shipping);
  const [billingAddress, setBillingAddress] = useState<Address>(initialSettings.billingAddress);
  const [billing, setBilling] = useState<BillingContact>(initialSettings.billing);
  const [cards] = useState(initialSettings.cards);
  const [teamMembers, setTeamMembers] = useState(initialSettings.teamMembers);
  const [draftValue, setDraftValue] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({ confirm: "", next: "" });
  const [memberDraft, setMemberDraft] = useState<TeamMember>({ email: "", name: "", role: "Buyer", status: "Invited" });
  const [managedMemberEmail, setManagedMemberEmail] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<Address>(() =>
    initialEditTarget === "shipping" ? initialSettings.shipping : initialShippingAddress,
  );
  const [billingDraft, setBillingDraft] = useState<BillingContact>(initialBillingContact);

  const managedMember = useMemo(() => teamMembers.find((member) => member.email === managedMemberEmail) ?? null, [managedMemberEmail, teamMembers]);

  useEffect(() => {
    const storedSettings = getStoredAccountSettings(serverInitialSettings);
    if (!storedSettings) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setName(storedSettings.name);
      setPhone(storedSettings.phone);
      setEmail(storedSettings.email);
      setPasswordChangedAt(storedSettings.passwordChangedAt);
      setMfaEnabled(storedSettings.mfaEnabled);
      setCompanyName(storedSettings.companyName);
      setShipping(storedSettings.shipping);
      setBillingAddress(storedSettings.billingAddress);
      setBilling(storedSettings.billing);
      setTeamMembers(storedSettings.teamMembers);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [serverInitialSettings]);

  function persistSettings(overrides: Partial<AccountSettingsSnapshot>) {
    const nextSettings = {
      billing,
      billingAddress,
      cards,
      companyName,
      email,
      mfaEnabled,
      name,
      passwordChangedAt,
      phone,
      shipping,
      stripeCustomerId: initialSettings.stripeCustomerId,
      teamMembers,
      ...overrides,
    };

    writeStoredAccountSettings(nextSettings);
    void saveSettingsAction?.(nextSettings);
  }

  function beginEdit(field: Exclude<EditableField, null>, value: string) {
    setEditing(field);
    setDraftValue(field === "phone" ? getPhoneDigits(value) : value);
    setError("");
    setNotice("Make a change, then save or cancel.");
    if (field === "password") {
      setPasswordDraft({ confirm: "", next: "" });
    }
  }

  function beginAddressEdit(field: "shipping" | "billingAddress", value: Address) {
    setEditing(field);
    setAddressDraft(value);
    setDraftValue("");
    setError("");
    setNotice("Make a change, then save or cancel.");
  }

  function beginBillingEdit(value: BillingContact) {
    setEditing("billing");
    setBillingDraft(value);
    setDraftValue("");
    setError("");
    setNotice("Make a change, then save or cancel.");
  }

  function finishEdit(message: string) {
    setEditing(null);
    setDraftValue("");
    setError("");
    setNotice(message);
  }

  function saveEdit(field: Exclude<EditableField, null>) {
    if (field === "shipping" || field === "billingAddress") {
      const nextAddress = {
        address1: addressDraft.address1.trim(),
        address2: addressDraft.address2.trim(),
        city: addressDraft.city.trim(),
        company: addressDraft.company.trim(),
        name: addressDraft.name.trim(),
        state: addressDraft.state.trim(),
        zipCode: addressDraft.zipCode.trim(),
      };

      if (!nextAddress.name || !nextAddress.company || !nextAddress.address1 || !nextAddress.city || !nextAddress.state || !nextAddress.zipCode) {
        setError("Name, company, address 1, city, state, and zip code are required.");
        return;
      }

      if (field === "shipping") setShipping(nextAddress);
      if (field === "billingAddress") setBillingAddress(nextAddress);
      persistSettings(field === "shipping" ? { shipping: nextAddress } : { billingAddress: nextAddress });
      finishEdit("Account setting updated for this demo session.");
      return;
    }

    if (field === "billing") {
      const nextBilling = {
        email: billingDraft.email.trim(),
        invoiceRoutingNotes: billingDraft.invoiceRoutingNotes.trim(),
      };

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextBilling.email)) {
        setError("Enter a valid billing email address.");
        return;
      }

      setBilling(nextBilling);
      persistSettings({ billing: nextBilling });
      finishEdit("Account setting updated for this demo session.");
      return;
    }

    const trimmed = draftValue.trim();
    if (field !== "password" && !trimmed) {
      setError("This field cannot be blank.");
      return;
    }

    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    if (field === "password") {
      if (passwordDraft.next.length < 12) {
        setError("Use at least 12 characters for the new password.");
        return;
      }
      if (passwordDraft.next !== passwordDraft.confirm) {
        setError("The password confirmation does not match.");
        return;
      }
      const nextChangedAt = "May 29, 2026";
      setPasswordChangedAt(nextChangedAt);
      persistSettings({ passwordChangedAt: nextChangedAt });
      finishEdit("Password updated for this demo session.");
      return;
    }

    if (field === "phone") {
      const formattedPhone = formatUsPhoneNumber(trimmed);
      if (!formattedPhone) {
        setError("Enter a 10-digit US phone number.");
        return;
      }
      setPhone(formattedPhone);
      persistSettings({ phone: formattedPhone });
      finishEdit("Account setting updated for this demo session.");
      return;
    }

    if (field === "name") {
      setName(trimmed);
      persistSettings({ name: trimmed });
    }
    if (field === "companyName") {
      setCompanyName(trimmed);
      persistSettings({ companyName: trimmed });
    }
    if (field === "email") {
      setEmail(trimmed);
      persistSettings({ email: trimmed });
    }
    finishEdit("Account setting updated for this demo session.");
  }

  function addTeamMember() {
    if (!memberDraft.name.trim()) {
      setError("Add a member name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberDraft.email.trim())) {
      setError("Enter a valid team member email.");
      return;
    }
    if (teamMembers.some((member) => member.email.toLowerCase() === memberDraft.email.trim().toLowerCase())) {
      setError("That email is already on the team account.");
      return;
    }
    const nextTeamMembers = [...teamMembers, { ...memberDraft, email: memberDraft.email.trim(), name: memberDraft.name.trim() }];
    setTeamMembers(nextTeamMembers);
    persistSettings({ teamMembers: nextTeamMembers });
    setMemberDraft({ email: "", name: "", role: "Buyer", status: "Invited" });
    setError("");
    setNotice("Team member invited for this demo session.");
  }

  function updateManagedMember(next: TeamMember) {
    const nextTeamMembers = teamMembers.map((member) => (member.email === next.email ? next : member));
    setTeamMembers(nextTeamMembers);
    persistSettings({ teamMembers: nextTeamMembers });
    setManagedMemberEmail(null);
    setNotice(`${next.name} was updated for this demo session.`);
  }

  const isAccountTab = activeTab === "account";

  function selectTab(tab: ActiveTab) {
    setActiveTab(tab);
  }

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const nextTab = event.key === 'ArrowLeft' || event.key === 'Home' ? 'account' : 'team';
    selectTab(nextTab);
    window.requestAnimationFrame(() => document.getElementById(`account-settings-tab-${nextTab}`)?.focus());
  }

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <header>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#182231]">Account settings</h1>
        <p className="mt-1 text-[14px] leading-6 text-[#5f6673]">Manage your profile, company defaults, payment methods, and team access.</p>
      </header>
      <div className="border-b border-[#d8dde4]">
        <div aria-label="Account settings sections" className="flex gap-8" role="tablist">
          <button
            aria-controls="account-settings-panel-account"
            aria-selected={isAccountTab}
            className={`border-b-2 px-1 py-4 text-[14px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008f72] ${isAccountTab ? "border-[#00a889] text-[#008f72]" : "border-transparent text-[#303846]"}`}
            id="account-settings-tab-account"
            onClick={() => selectTab("account")}
            onKeyDown={handleTabKeyDown}
            role="tab"
            tabIndex={isAccountTab ? 0 : -1}
            type="button"
          >
            Account details
          </button>
          <button
            aria-controls="account-settings-panel-team"
            aria-selected={!isAccountTab}
            className={`border-b-2 px-1 py-4 text-[14px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008f72] ${!isAccountTab ? "border-[#00a889] text-[#008f72]" : "border-transparent text-[#303846]"}`}
            id="account-settings-tab-team"
            onClick={() => selectTab("team")}
            onKeyDown={handleTabKeyDown}
            role="tab"
            tabIndex={!isAccountTab ? 0 : -1}
            type="button"
          >
            Team account members
          </button>
        </div>
      </div>

      <div aria-atomic="true" aria-live="polite" className="rounded-md border border-[#f2bf42] bg-[#fff8e6] px-5 py-4" role="status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#253040]">{notice}</p>
            <p className="mt-1 text-[13px] text-[#5f6673]">
              {mfaEnabled ? "Multi-factor authentication is active for sensitive quote, order, and payment actions." : "MFA is paused. Re-enable it before payment or account permission changes."}
            </p>
          </div>
          <button
            className="w-fit rounded-sm bg-[#ffc62b] px-4 py-2 text-[13px] font-semibold text-[#182231] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008f72]"
            onClick={() => {
              const nextMfaEnabled = !mfaEnabled;
              setMfaEnabled(nextMfaEnabled);
              persistSettings({ mfaEnabled: nextMfaEnabled });
            }}
            type="button"
          >
            {mfaEnabled ? "Pause MFA" : "Enable MFA"}
          </button>
        </div>
      </div>

      {isAccountTab ? (
        <div aria-labelledby="account-settings-tab-account" className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]" id="account-settings-panel-account" role="tabpanel">
          <aside className="space-y-5">
            <ProfilePictureEditor />
            <Card>
              <CardTitle detail="Current workspace access and commercial permissions." title="Account Summary" />
              <div className="space-y-4 p-6">
                <Summary label="Role" value="Administrator" />
                <Summary label="Account" value={`${companyName} Team Account`} />
                <Summary label="Default currency" value="USD" />
              </div>
            </Card>
          </aside>

          <div className="space-y-5">
            <Card>
              <CardTitle detail="Basic contact details shown on RFQs, quotes, and order communication." title="Personal Information" />
              <EditableRow action={<FieldButton onClick={() => beginEdit("name", name)}>Edit name</FieldButton>} label="Name">
                {editing === "name" ? (
                  <EditTextArea cancel={() => finishEdit("Name edit canceled.")} error={error} field="name" label="Name" saveEdit={saveEdit} setDraftValue={setDraftValue} value={draftValue} />
                ) : (
                  <>
                    <p>{name}</p>
                    <p className="text-[#737b86]">Account created on Nov 29, 2022</p>
                  </>
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginEdit("phone", phone)}>Edit phone</FieldButton>} label="Phone number">
                {editing === "phone" ? (
                  <EditTextArea cancel={() => finishEdit("Phone edit canceled.")} error={error} field="phone" label="Phone number" saveEdit={saveEdit} setDraftValue={setDraftValue} value={draftValue} />
                ) : (
                  <p>{phone}</p>
                )}
              </EditableRow>
            </Card>

            <Card>
              <CardTitle detail="Security, login, company account, and payment permissions." title="Account Settings" />
              <EditableRow action={<FieldButton onClick={() => beginEdit("email", email)}>Manage email</FieldButton>} label="Email address">
                {editing === "email" ? (
                  <EditTextArea cancel={() => finishEdit("Email edit canceled.")} error={error} field="email" label="Email address" saveEdit={saveEdit} setDraftValue={setDraftValue} type="email" value={draftValue} />
                ) : (
                  <>
                    <p>{email}</p>
                    <StatusLine>Verified on November 29, 2022</StatusLine>
                  </>
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginEdit("password", "")}>Edit password</FieldButton>} label="Password">
                {editing === "password" ? (
                  <div className="space-y-4">
                    <TextField label="New password" name="new-password" onChange={(next) => setPasswordDraft((current) => ({ ...current, next }))} type="password" value={passwordDraft.next} />
                    <TextField label="Confirm password" name="confirm-password" onChange={(confirm) => setPasswordDraft((current) => ({ ...current, confirm }))} type="password" value={passwordDraft.confirm} />
                    <SaveCancel cancel={() => finishEdit("Password change canceled.")} error={error} save={() => saveEdit("password")} />
                  </div>
                ) : (
                  <>
                    <p>************</p>
                    <StatusLine tone="neutral">Last changed on {passwordChangedAt}</StatusLine>
                  </>
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginEdit("companyName", companyName)}>Edit company</FieldButton>} label="Buyer company">
                {editing === "companyName" ? (
                  <EditTextArea cancel={() => finishEdit("Company edit canceled.")} error={error} field="companyName" label="Buyer company" saveEdit={saveEdit} setDraftValue={setDraftValue} value={draftValue} />
                ) : (
                  <>
                    <p>{companyName}</p>
                    <p className="text-[#737b86]">Used as the default company name on new RFQs.</p>
                  </>
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => setNotice("Financial permissions are enabled for card checkout and tax-exempt purchasing.")}>Review permissions</FieldButton>} label="Financial permissions">
                <Permission detail={`Credit card checkout enabled under ${companyName} on April 20, 2023`} title="Pay by credit card" />
                <Permission detail={`Enabled under ${companyName} on April 24, 2023`} title="Tax-exempt reseller" />
              </EditableRow>
            </Card>

            <Card>
              <CardTitle
                action={
                  <button
                    aria-label="Add credit card"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d7dce2] bg-white text-[#253040] transition hover:border-[#9aa4b2] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!createCardSetupAction}
                    form="stripe-setup-form"
                    title="Add credit card"
                    type="submit"
                  >
                    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                      <rect fill="none" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="6" />
                      <path d="M3 10h18M16 17v-4M14 15h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                    </svg>
                  </button>
                }
                detail="Manage the cards available for quote checkout and order payment."
                title="Payment Methods"
              />
              <div className="grid grid-cols-[0.26fr_1fr_0.45fr_auto] gap-3 border-b border-[#e5e8ec] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782] max-md:hidden">
                <span>Cards</span>
                <span>Account ending</span>
                <span>Holder</span>
                <span>Action</span>
              </div>
              {createCardSetupAction ? <form action={createCardSetupAction} id="stripe-setup-form" /> : null}
              {cards.map((card) => (
                <PaymentMethod card={card} detachCardAction={detachCardAction} key={card.id} />
              ))}
              {cards.length === 0 ? (
                <div className="px-6 py-5">
                  <p className="text-[14px] font-medium text-[#737b86]">No Stripe cards are available for checkout.</p>
                  <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#737b86]">
                    Add a card through Stripe Checkout. Card payments are encrypted and tokenized by Stripe; Lattice does not store raw credit card information.
                  </p>
                </div>
              ) : null}
            </Card>

            <Card>
              <CardTitle detail="Purchase order checkout will support approved terms, PO numbers, and account-level spending controls." title="Purchase Orders" />
              <div className="p-6">
                <div className="rounded-md border border-dashed border-[#cfd5dd] bg-[#f8fafc] p-5 opacity-75">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[14px] font-semibold text-[#303846]">PO payments are coming soon</p>
                      <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#737b86]">
                        Approved buyers will be able to pay with purchase orders, manage credit terms, and apply company PO requirements at checkout.
                      </p>
                    </div>
                    <button className="w-fit cursor-not-allowed rounded-md border border-[#d7d7d7] bg-[#eef1f5] px-4 py-2 text-sm font-semibold text-[#8a929d]" disabled type="button">
                      Coming soon
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardTitle detail="Defaults used at checkout and when supplier-ready packages are created." title="Manufacturing Account Defaults" />
              <EditableRow action={<FieldButton onClick={() => beginAddressEdit("shipping", shipping)}>Edit shipping</FieldButton>} label="Saved shipping address">
                {editing === "shipping" ? (
                  <AddressEditor
                    address={addressDraft}
                    cancel={() => finishEdit("Shipping edit canceled.")}
                    error={error}
                    save={() => saveEdit("shipping")}
                    setAddress={setAddressDraft}
                  />
                ) : (
                  <AddressValue address={shipping} />
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginAddressEdit("billingAddress", billingAddress)}>Edit billing address</FieldButton>} label="Billing address">
                {editing === "billingAddress" ? (
                  <AddressEditor
                    address={addressDraft}
                    cancel={() => finishEdit("Billing address edit canceled.")}
                    error={error}
                    save={() => saveEdit("billingAddress")}
                    setAddress={setAddressDraft}
                  />
                ) : (
                  <AddressValue address={billingAddress} />
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginBillingEdit(billing)}>Edit billing</FieldButton>} label="Billing contact">
                {editing === "billing" ? (
                  <BillingContactEditor
                    billing={billingDraft}
                    cancel={() => finishEdit("Billing edit canceled.")}
                    error={error}
                    save={() => saveEdit("billing")}
                    setBilling={setBillingDraft}
                  />
                ) : (
                  <BillingContactValue billing={billing} />
                )}
              </EditableRow>
            </Card>
          </div>
        </div>
      ) : (
        <div aria-labelledby="account-settings-tab-team" id="account-settings-panel-team" role="tabpanel">
        <Card>
          <CardTitle
            action={
              <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={addTeamMember} type="button">
                Invite member
              </button>
            }
            detail="People who can collaborate on quotes, orders, and purchase approvals."
            title="Team Account Members"
          />
          <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-5 lg:grid-cols-[1fr_1fr_0.5fr_0.5fr_auto] lg:items-end">
            <TextField label="Name" name="member-name" onChange={(nameValue) => setMemberDraft((current) => ({ ...current, name: nameValue }))} value={memberDraft.name} />
            <TextField label="Email" name="member-email" onChange={(emailValue) => setMemberDraft((current) => ({ ...current, email: emailValue }))} type="email" value={memberDraft.email} />
            <SelectField<TeamMember["role"]> label="Invite role" onChange={(role) => setMemberDraft((current) => ({ ...current, role }))} options={["Buyer", "Reviewer", "Admin"]} value={memberDraft.role} />
            <SelectField<TeamMember["status"]> label="Invite status" onChange={(status) => setMemberDraft((current) => ({ ...current, status }))} options={["Invited", "Active", "Suspended"]} value={memberDraft.status} />
            <button className="h-fit rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" onClick={addTeamMember} type="button">
              Add
            </button>
            {error ? <p aria-atomic="true" className="text-[13px] font-semibold text-[#b42318] lg:col-span-5" role="alert">{error}</p> : null}
          </div>
          {teamMembers.map((member) => (
            <TeamMemberRow
              key={member.email}
              managedMember={managedMember}
              member={member}
              setManagedMemberEmail={setManagedMemberEmail}
              updateManagedMember={updateManagedMember}
            />
          ))}
        </Card>
        </div>
      )}

      <p className="text-[13px] leading-6 text-[#5f6673]">
        To deactivate your account or leave your company&apos;s team account, contact Lattice support. Durable account persistence will connect to the selected authentication and billing providers.
      </p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">{label}</p>
      <p className="mt-1 text-[14px] font-semibold text-[#182231]">{value}</p>
    </div>
  );
}

function EditableRow({ action, children, label }: { action: React.ReactNode; children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-5 last:border-b-0 md:grid-cols-[0.26fr_1fr_auto] md:items-start">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">{label}</p>
      <div className="min-w-0 text-[14px] leading-6 text-[#182231]">{children}</div>
      {action}
    </div>
  );
}

function EditTextArea({
  cancel,
  error,
  field,
  label,
  multiline = false,
  saveEdit,
  setDraftValue,
  type = "text",
  value,
}: {
  cancel: () => void;
  error: string;
  field: Exclude<EditableField, null>;
  label: string;
  multiline?: boolean;
  saveEdit: (field: Exclude<EditableField, null>) => void;
  setDraftValue: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-[13px] font-semibold text-[#303846]">
        {label}
        {multiline ? (
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-[#cfd5dd] bg-white px-3 py-2 text-[14px] font-medium text-[#182231] outline-none transition focus:border-[#00a889] focus:ring-2 focus:ring-[#00a889]/15"
            onChange={(event) => setDraftValue(event.target.value)}
            value={value}
          />
        ) : (
          <input
            className="mt-2 w-full rounded-md border border-[#cfd5dd] bg-white px-3 py-2 text-[14px] font-medium text-[#182231] outline-none transition focus:border-[#00a889] focus:ring-2 focus:ring-[#00a889]/15"
            inputMode={field === "phone" ? "numeric" : undefined}
            onChange={(event) => setDraftValue(field === "phone" ? getPhoneDigits(event.target.value) : event.target.value)}
            pattern={field === "phone" ? "[0-9]*" : undefined}
            type={type}
            value={value}
          />
        )}
      </label>
      <SaveCancel cancel={cancel} error={error} save={() => saveEdit(field)} />
    </div>
  );
}

function AddressEditor({
  address,
  cancel,
  error,
  save,
  setAddress,
}: {
  address: Address;
  cancel: () => void;
  error: string;
  save: () => void;
  setAddress: React.Dispatch<React.SetStateAction<Address>>;
}) {
  function updateAddress(field: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField label="Name" name="address-name" onChange={(name) => updateAddress("name", name)} value={address.name} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Company" name="company" onChange={(company) => updateAddress("company", company)} value={address.company} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Address 1" name="address-1" onChange={(address1) => updateAddress("address1", address1)} value={address.address1} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Address 2" name="address-2" onChange={(address2) => updateAddress("address2", address2)} value={address.address2} />
        </div>
        <TextField label="City" name="city" onChange={(city) => updateAddress("city", city)} value={address.city} />
        <TextField label="State" name="state" onChange={(state) => updateAddress("state", state)} value={address.state} />
        <TextField label="Zip code" name="zip-code" onChange={(zipCode) => updateAddress("zipCode", zipCode)} value={address.zipCode} />
      </div>
      <SaveCancel cancel={cancel} error={error} save={save} />
    </div>
  );
}

function AddressValue({ address }: { address: Address }) {
  const cityStateZip = [address.city, [address.state, address.zipCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <>
      <p>{address.name}</p>
      <p>{address.company}</p>
      <p>{address.address1}</p>
      {address.address2 ? <p className="text-[#737b86]">{address.address2}</p> : null}
      <p className="text-[#737b86]">{cityStateZip}</p>
    </>
  );
}

function BillingContactEditor({
  billing,
  cancel,
  error,
  save,
  setBilling,
}: {
  billing: BillingContact;
  cancel: () => void;
  error: string;
  save: () => void;
  setBilling: React.Dispatch<React.SetStateAction<BillingContact>>;
}) {
  function updateBilling(field: keyof BillingContact, value: string) {
    setBilling((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <TextField label="Billing email" name="billing-email" onChange={(email) => updateBilling("email", email)} type="email" value={billing.email} />
        <label className="block text-[13px] font-semibold text-[#303846]">
          Invoice routing notes
          <textarea
            className="mt-2 min-h-24 w-full rounded-md border border-[#cfd5dd] bg-white px-3 py-2 text-[14px] font-medium text-[#182231] outline-none transition focus:border-[#00a889] focus:ring-2 focus:ring-[#00a889]/15"
            onChange={(event) => updateBilling("invoiceRoutingNotes", event.target.value)}
            value={billing.invoiceRoutingNotes}
          />
        </label>
      </div>
      <SaveCancel cancel={cancel} error={error} save={save} />
    </div>
  );
}

function BillingContactValue({ billing }: { billing: BillingContact }) {
  return (
    <>
      <p>{billing.email}</p>
      {billing.invoiceRoutingNotes ? <p className="text-[#737b86]">{billing.invoiceRoutingNotes}</p> : null}
    </>
  );
}

function Permission({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="font-semibold text-[#182231]">{title}</p>
      <StatusLine>{detail}</StatusLine>
    </div>
  );
}

function PaymentMethod({ card, detachCardAction }: { card: PaymentCard; detachCardAction?: (formData: FormData) => void | Promise<void> }) {
  return (
    <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-4 last:border-b-0 md:grid-cols-[0.26fr_1fr_0.45fr_auto] md:items-center">
      <div className="flex items-center gap-2">
        <CardBrand brand={card.brand} />
        <span className="text-[13px] font-semibold capitalize text-[#303846]">{card.brand}</span>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#182231]">Card ending in **** {card.last4}</p>
        <p className="mt-1 text-[13px] text-[#737b86]">Expires {card.expires}</p>
      </div>
      <p className="text-[13px] font-medium text-[#303846]">{card.holder}</p>
      {detachCardAction ? (
        <form action={detachCardAction}>
          <input name="paymentMethodId" type="hidden" value={card.id} />
          <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" type="submit">
            Remove card {card.last4}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function TeamMemberRow({
  managedMember,
  member,
  setManagedMemberEmail,
  updateManagedMember,
}: {
  managedMember: TeamMember | null;
  member: TeamMember;
  setManagedMemberEmail: (email: string | null) => void;
  updateManagedMember: (member: TeamMember) => void;
}) {
  const [draft, setDraft] = useState(member);
  const isManaging = managedMember?.email === member.email;

  if (isManaging) {
    return (
      <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-4 last:border-b-0 md:grid-cols-[1fr_0.45fr_0.36fr_auto] md:items-end">
        <div>
          <p className="text-[14px] font-semibold text-[#182231]">{member.name}</p>
          <p className="mt-1 text-[13px] text-[#737b86]">{member.email}</p>
        </div>
        <SelectField<TeamMember["role"]> label={`${member.name} role`} onChange={(role) => setDraft((current) => ({ ...current, role }))} options={["Admin", "Buyer", "Reviewer"]} value={draft.role} />
        <SelectField<TeamMember["status"]> label={`${member.name} status`} onChange={(status) => setDraft((current) => ({ ...current, status }))} options={["Active", "Invited", "Suspended"]} value={draft.status} />
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-[#171717] px-3 py-2 text-sm font-semibold text-white" onClick={() => updateManagedMember(draft)} type="button">
            Save
          </button>
          <button className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-sm font-semibold text-[#262626]" onClick={() => setManagedMemberEmail(null)} type="button">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-4 last:border-b-0 md:grid-cols-[1fr_0.45fr_0.36fr_auto] md:items-center">
      <div>
        <p className="text-[14px] font-semibold text-[#182231]">{member.name}</p>
        <p className="mt-1 text-[13px] text-[#737b86]">{member.email}</p>
      </div>
      <p className="text-[13px] font-medium text-[#303846]">{member.role}</p>
      <span className="w-fit rounded-full border border-[#dfe3e8] bg-[#f8fafc] px-2.5 py-1 text-[12px] font-semibold text-[#4f5864]">{member.status}</span>
      <button
        className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]"
        onClick={() => {
          setDraft(member);
          setManagedMemberEmail(member.email);
        }}
        type="button"
      >
        Manage {member.name}
      </button>
    </div>
  );
}
