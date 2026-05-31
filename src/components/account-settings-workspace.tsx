"use client";

import { useMemo, useState } from "react";
import { ProfilePictureEditor } from "@/components/profile-picture-editor";

type ActiveTab = "account" | "team";
type EditableField = "name" | "phone" | "email" | "password" | "shipping" | "billingAddress" | "billing" | null;
type TeamMember = {
  email: string;
  name: string;
  role: "Admin" | "Buyer" | "Reviewer";
  status: "Active" | "Invited" | "Suspended";
};
type PaymentCard = {
  brand: string;
  expires: string;
  holder: string;
  id: string;
  last4: string;
};

const initialTeamMembers: TeamMember[] = [
  { email: "william.paik@amogy.co", name: "William Paik", role: "Admin", status: "Active" },
  { email: "procurement@amogy.co", name: "Procurement Team", role: "Buyer", status: "Active" },
  { email: "quality@amogy.co", name: "Quality Team", role: "Reviewer", status: "Invited" },
];

const initialCards: PaymentCard[] = [
  { brand: "Visa", expires: "08/2028", holder: "William Paik", id: "card-7329", last4: "7329" },
  { brand: "Visa", expires: "11/2027", holder: "Amogy Card", id: "card-9682", last4: "9682" },
];

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
    <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" onClick={onClick} type="button">
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
      {error ? <p className="mb-3 text-[13px] font-semibold text-[#b42318]">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={save} type="button">
          Save changes
        </button>
        <button className="rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" onClick={cancel} type="button">
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

export function AccountSettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("account");
  const [editing, setEditing] = useState<EditableField>(null);
  const [notice, setNotice] = useState("Account settings changes are stored for this demo session.");
  const [error, setError] = useState("");
  const [name, setName] = useState("William Paik");
  const [phone, setPhone] = useState("+1 (310) 617-4533");
  const [email, setEmail] = useState("william.paik@amogy.co");
  const [passwordChangedAt, setPasswordChangedAt] = useState("May 12, 2026");
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [companyName] = useState("Amogy");
  const [shipping, setShipping] = useState("Brooklyn Advanced Manufacturing\n19 Morris Ave, Brooklyn, NY 11205, United States");
  const [billingAddress, setBillingAddress] = useState("Amogy Accounts Payable\n500 7th Ave, New York, NY 10018, United States");
  const [billing, setBilling] = useState("procurement@amogy.co\nRoute invoices to AP after PO match.");
  const [cards, setCards] = useState(initialCards);
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [draftValue, setDraftValue] = useState("");
  const [passwordDraft, setPasswordDraft] = useState({ confirm: "", next: "" });
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardDraft, setCardDraft] = useState({ expires: "", holder: "", last4: "" });
  const [memberDraft, setMemberDraft] = useState<TeamMember>({ email: "", name: "", role: "Buyer", status: "Invited" });
  const [managedMemberEmail, setManagedMemberEmail] = useState<string | null>(null);

  const managedMember = useMemo(() => teamMembers.find((member) => member.email === managedMemberEmail) ?? null, [managedMemberEmail, teamMembers]);

  function beginEdit(field: Exclude<EditableField, null>, value: string) {
    setEditing(field);
    setDraftValue(field === "phone" ? getPhoneDigits(value) : value);
    setError("");
    setNotice("Make a change, then save or cancel.");
    if (field === "password") {
      setPasswordDraft({ confirm: "", next: "" });
    }
  }

  function finishEdit(message: string) {
    setEditing(null);
    setDraftValue("");
    setError("");
    setNotice(message);
  }

  function saveEdit(field: Exclude<EditableField, null>) {
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
      setPasswordChangedAt("May 29, 2026");
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
      finishEdit("Account setting updated for this demo session.");
      return;
    }

    if (field === "name") setName(trimmed);
    if (field === "email") setEmail(trimmed);
    if (field === "shipping") setShipping(trimmed);
    if (field === "billingAddress") setBillingAddress(trimmed);
    if (field === "billing") setBilling(trimmed);
    finishEdit("Account setting updated for this demo session.");
  }

  function addCard() {
    if (!/^\d{4}$/.test(cardDraft.last4.trim())) {
      setError("Card ending must be exactly 4 digits.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/20\d{2}$/.test(cardDraft.expires.trim())) {
      setError("Use an expiration date like 09/2028.");
      return;
    }
    if (!cardDraft.holder.trim()) {
      setError("Add the card holder name.");
      return;
    }
    const last4 = cardDraft.last4.trim();
    setCards((current) => [
      ...current,
      { brand: "Visa", expires: cardDraft.expires.trim(), holder: cardDraft.holder.trim(), id: `card-${last4}`, last4 },
    ]);
    setCardDraft({ expires: "", holder: "", last4: "" });
    setIsAddingCard(false);
    finishEdit("Payment method added for this demo session.");
  }

  function cancelAddCard() {
    setCardDraft({ expires: "", holder: "", last4: "" });
    setError("");
    setIsAddingCard(false);
    setNotice("Card add canceled.");
  }

  function removeCard(card: PaymentCard) {
    setCards((current) => current.filter((item) => item.id !== card.id));
    setNotice(`Card ending in ${card.last4} was removed for this demo session.`);
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
    setTeamMembers((current) => [...current, { ...memberDraft, email: memberDraft.email.trim(), name: memberDraft.name.trim() }]);
    setMemberDraft({ email: "", name: "", role: "Buyer", status: "Invited" });
    setError("");
    setNotice("Team member invited for this demo session.");
  }

  function updateManagedMember(next: TeamMember) {
    setTeamMembers((current) => current.map((member) => (member.email === next.email ? next : member)));
    setManagedMemberEmail(null);
    setNotice(`${next.name} was updated for this demo session.`);
  }

  const isAccountTab = activeTab === "account";

  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <div className="border-b border-[#d8dde4]">
        <div aria-label="Account settings sections" className="flex gap-8" role="tablist">
          <button
            aria-selected={isAccountTab}
            className={`border-b-2 px-1 py-4 text-[14px] font-semibold ${isAccountTab ? "border-[#00a889] text-[#008f72]" : "border-transparent text-[#303846]"}`}
            onClick={() => setActiveTab("account")}
            role="tab"
            type="button"
          >
            Account details
          </button>
          <button
            aria-selected={!isAccountTab}
            className={`border-b-2 px-1 py-4 text-[14px] font-semibold ${!isAccountTab ? "border-[#00a889] text-[#008f72]" : "border-transparent text-[#303846]"}`}
            onClick={() => setActiveTab("team")}
            role="tab"
            type="button"
          >
            Team account members
          </button>
        </div>
      </div>

      <div className="rounded-md border border-[#f2bf42] bg-[#fff8e6] px-5 py-4" role="status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#253040]">{notice}</p>
            <p className="mt-1 text-[13px] text-[#5f6673]">
              {mfaEnabled ? "Multi-factor authentication is active for sensitive quote, order, and payment actions." : "MFA is paused. Re-enable it before payment or account permission changes."}
            </p>
          </div>
          <button className="w-fit rounded-sm bg-[#ffc62b] px-4 py-2 text-[13px] font-semibold text-[#182231]" onClick={() => setMfaEnabled((current) => !current)} type="button">
            {mfaEnabled ? "Pause MFA" : "Enable MFA"}
          </button>
        </div>
      </div>

      {isAccountTab ? (
        <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
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
              <EditableRow action={<FieldButton onClick={() => setNotice("Company account names are managed by Lattice support until organization admin is connected.")}>View account</FieldButton>} label="Account name">
                <p>{companyName}</p>
                <p className="text-[#737b86]">Joined on May 26, 2026</p>
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
                    aria-expanded={isAddingCard}
                    aria-label="Add credit card"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d7dce2] bg-white text-[#253040] transition hover:border-[#9aa4b2] hover:bg-[#f8fafc]"
                    onClick={() => {
                      setIsAddingCard((current) => !current);
                      setError("");
                    }}
                    title="Add credit card"
                    type="button"
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
              {cards.map((card) => (
                <PaymentMethod card={card} key={card.id} removeCard={removeCard} />
              ))}
              {cards.length === 0 ? <p className="px-6 py-5 text-[14px] font-medium text-[#737b86]">No cards are available for checkout.</p> : null}
              {isAddingCard ? (
                <div className="border-t border-[#e5e8ec] px-6 py-5">
                  <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr_auto] lg:items-end">
                    <TextField label="Card holder" name="card-holder" onChange={(holder) => setCardDraft((current) => ({ ...current, holder }))} value={cardDraft.holder} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TextField label="Ending digits" name="card-last4" onChange={(last4) => setCardDraft((current) => ({ ...current, last4 }))} value={cardDraft.last4} />
                      <TextField label="Expires" name="card-expires" onChange={(expires) => setCardDraft((current) => ({ ...current, expires }))} value={cardDraft.expires} />
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button className="h-fit rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white" onClick={addCard} type="button">
                        Add card
                      </button>
                      <button className="h-fit rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" onClick={cancelAddCard} type="button">
                        Cancel
                      </button>
                    </div>
                  </div>
                  {error ? <p className="mt-3 text-[13px] font-semibold text-[#b42318]">{error}</p> : null}
                  <p className="mt-4 max-w-xl text-[13px] leading-5 text-[#737b86]">
                    Card payments are encrypted and tokenized by the payment processor. Lattice does not store raw credit card information.
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
              <EditableRow action={<FieldButton onClick={() => beginEdit("shipping", shipping)}>Edit shipping</FieldButton>} label="Saved shipping address">
                {editing === "shipping" ? (
                  <EditTextArea cancel={() => finishEdit("Shipping edit canceled.")} error={error} field="shipping" label="Shipping address" multiline saveEdit={saveEdit} setDraftValue={setDraftValue} value={draftValue} />
                ) : (
                  <MultilineValue value={shipping} />
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginEdit("billingAddress", billingAddress)}>Edit billing address</FieldButton>} label="Billing address">
                {editing === "billingAddress" ? (
                  <EditTextArea cancel={() => finishEdit("Billing address edit canceled.")} error={error} field="billingAddress" label="Billing address" multiline saveEdit={saveEdit} setDraftValue={setDraftValue} value={draftValue} />
                ) : (
                  <MultilineValue value={billingAddress} />
                )}
              </EditableRow>
              <EditableRow action={<FieldButton onClick={() => beginEdit("billing", billing)}>Edit billing</FieldButton>} label="Billing contact">
                {editing === "billing" ? (
                  <EditTextArea cancel={() => finishEdit("Billing edit canceled.")} error={error} field="billing" label="Billing contact" multiline saveEdit={saveEdit} setDraftValue={setDraftValue} value={draftValue} />
                ) : (
                  <MultilineValue value={billing} />
                )}
              </EditableRow>
            </Card>
          </div>
        </div>
      ) : (
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
            {error ? <p className="text-[13px] font-semibold text-[#b42318] lg:col-span-5">{error}</p> : null}
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

function MultilineValue({ value }: { value: string }) {
  const [first, ...rest] = value.split("\n");

  return (
    <>
      <p>{first}</p>
      {rest.map((line) => (
        <p className="text-[#737b86]" key={line}>
          {line}
        </p>
      ))}
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

function PaymentMethod({ card, removeCard }: { card: PaymentCard; removeCard: (card: PaymentCard) => void }) {
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
      <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" onClick={() => removeCard(card)} type="button">
        Remove card {card.last4}
      </button>
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
