import { ProfilePictureEditor } from "@/components/profile-picture-editor";

function Card({ children }: { children: React.ReactNode }) {
  return <section className="rounded-md border border-[#d7dce2] bg-white">{children}</section>;
}

function CardTitle({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="border-b border-[#dfe3e8] px-6 py-5">
      <h2 className="text-[18px] font-semibold tracking-tight text-[#253040]">{title}</h2>
      {detail ? <p className="mt-1 text-[13px] leading-5 text-[#737b86]">{detail}</p> : null}
    </div>
  );
}

function SettingsRow({ label, children, action = "Edit" }: { label: string; children: React.ReactNode; action?: string }) {
  return (
    <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-5 last:border-b-0 md:grid-cols-[0.26fr_1fr_auto] md:items-start">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">{label}</p>
      <div className="min-w-0 text-[14px] leading-6 text-[#182231]">{children}</div>
      <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" type="button">
        {action}
      </button>
    </div>
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

function Permission({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="font-semibold text-[#182231]">{title}</p>
      <StatusLine>{detail}</StatusLine>
    </div>
  );
}

function TeamMember({ name, email, role, status }: { name: string; email: string; role: string; status: string }) {
  return (
    <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-4 last:border-b-0 md:grid-cols-[1fr_0.45fr_0.36fr_auto] md:items-center">
      <div>
        <p className="text-[14px] font-semibold text-[#182231]">{name}</p>
        <p className="mt-1 text-[13px] text-[#737b86]">{email}</p>
      </div>
      <p className="text-[13px] font-medium text-[#303846]">{role}</p>
      <span className="w-fit rounded-full border border-[#dfe3e8] bg-[#f8fafc] px-2.5 py-1 text-[12px] font-semibold text-[#4f5864]">{status}</span>
      <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" type="button">
        Manage
      </button>
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

function PaymentMethod({ brand, last4, holder, expires }: { brand: string; last4: string; holder: string; expires: string }) {
  return (
    <div className="grid gap-3 border-b border-[#e5e8ec] px-6 py-4 last:border-b-0 md:grid-cols-[0.26fr_1fr_0.45fr_auto] md:items-center">
      <div className="flex items-center gap-2">
        <CardBrand brand={brand} />
        <span className="text-[13px] font-semibold capitalize text-[#303846]">{brand}</span>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#182231]">Card ending in **** {last4}</p>
        <p className="mt-1 text-[13px] text-[#737b86]">Expires {expires}</p>
      </div>
      <p className="text-[13px] font-medium text-[#303846]">{holder}</p>
      <button className="w-fit text-[13px] font-semibold text-[#3b5bdb] hover:text-[#263c97]" type="button">
        Remove card
      </button>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <div className="mx-auto max-w-[1040px] space-y-5">
      <div className="border-b border-[#d8dde4]">
        <div className="flex gap-8">
          <button className="border-b-2 border-[#00a889] px-1 py-4 text-[14px] font-semibold text-[#008f72]" type="button">
            Account details
          </button>
          <button className="px-1 py-4 text-[14px] font-semibold text-[#303846]" type="button">
            Team account members
          </button>
        </div>
      </div>

      <div className="rounded-md border border-[#f2bf42] bg-[#fff8e6] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#253040]">Your email is verified.</p>
            <p className="mt-1 text-[13px] text-[#5f6673]">Multi-factor authentication is active for sensitive quote, order, and payment actions.</p>
          </div>
          <button className="w-fit rounded-sm bg-[#ffc62b] px-4 py-2 text-[13px] font-semibold text-[#182231]" type="button">
            Manage MFA
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="space-y-5">
          <ProfilePictureEditor />

          <Card>
            <CardTitle detail="Current workspace access and commercial permissions." title="Account Summary" />
            <div className="space-y-4 p-6">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Role</p>
                <p className="mt-1 text-[14px] font-semibold text-[#182231]">Administrator</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Account</p>
                <p className="mt-1 text-[14px] font-semibold text-[#182231]">Amogy Team Account</p>
              </div>
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782]">Default currency</p>
                <p className="mt-1 text-[14px] font-semibold text-[#182231]">USD</p>
              </div>
            </div>
          </Card>
        </aside>

        <div className="space-y-5">
          <Card>
            <CardTitle detail="Basic contact details shown on RFQs, quotes, and order communication." title="Personal Information" />
            <SettingsRow label="Name">
              <p>William Paik</p>
              <p className="text-[#737b86]">Account created on Nov 29, 2022</p>
            </SettingsRow>
            <SettingsRow label="Phone number">
              <p>+1 (310) 617-4533</p>
            </SettingsRow>
          </Card>

          <Card>
            <CardTitle detail="Security, login, company account, and payment permissions." title="Account Settings" />
            <SettingsRow action="Manage" label="Email address">
              <p>william.paik@amogy.co</p>
              <StatusLine>Verified on November 29, 2022</StatusLine>
            </SettingsRow>
            <SettingsRow label="Password">
              <p>************</p>
              <StatusLine tone="neutral">Last changed on May 12, 2026</StatusLine>
            </SettingsRow>
            <SettingsRow action="View" label="Account name">
              <p>Amogy</p>
              <p className="text-[#737b86]">Joined on May 26, 2026</p>
            </SettingsRow>
            <SettingsRow action="Review" label="Financial permissions">
              <Permission detail="Credit card checkout enabled under Amogy on April 20, 2023" title="Pay by credit card" />
              <Permission detail="Enabled under Amogy on April 24, 2023" title="Tax-exempt reseller" />
            </SettingsRow>
          </Card>

          <Card>
            <CardTitle detail="Manage the cards available for quote checkout and order payment." title="Payment Methods" />
            <div className="grid grid-cols-[0.26fr_1fr_0.45fr_auto] gap-3 border-b border-[#e5e8ec] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6f7782] max-md:hidden">
              <span>Cards</span>
              <span>Account ending</span>
              <span>Holder</span>
              <span>Action</span>
            </div>
            <PaymentMethod brand="Visa" expires="08/2028" holder="William Paik" last4="7329" />
            <PaymentMethod brand="Visa" expires="11/2027" holder="Amogy Card" last4="9682" />
            <div className="border-t border-[#e5e8ec] px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-[13px] leading-5 text-[#737b86]">
                  Card payments are encrypted and tokenized by the payment processor. Lattice does not store raw credit card information.
                </p>
                <button className="w-fit rounded-md border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-semibold text-[#262626]" type="button">
                  Add new card
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle detail="Purchase order checkout will support approved terms, PO numbers, and account-level spending controls." title="Purchase Orders" />
            <div className="p-6">
              <div className="rounded-md border border-dashed border-[#cfd5dd] bg-[#f8fafc] p-5 opacity-75">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[14px] font-semibold text-[#303846]">PO payments are coming soon</p>
                    <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#737b86]">
                      This will let approved buyers pay with purchase orders, manage credit terms, and apply company PO requirements at checkout.
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
            <SettingsRow label="Saved shipping address">
              <p>Brooklyn Advanced Manufacturing</p>
              <p className="text-[#737b86]">19 Morris Ave, Brooklyn, NY 11205, United States</p>
            </SettingsRow>
            <SettingsRow label="Billing contact">
              <p>procurement@amogy.co</p>
              <p className="text-[#737b86]">Route invoices to AP after PO match.</p>
            </SettingsRow>
            <SettingsRow label="Default RFQ requirements">
              <p>Inspection report, material certification, certificate of conformance</p>
              <p className="text-[#737b86]">Applied to new production and repeat-order requests.</p>
            </SettingsRow>
          </Card>

          <Card>
            <CardTitle detail="People who can collaborate on quotes, orders, and purchase approvals." title="Team Account Members" />
            <TeamMember email="william.paik@amogy.co" name="William Paik" role="Admin" status="Active" />
            <TeamMember email="procurement@amogy.co" name="Procurement Team" role="Buyer" status="Active" />
            <TeamMember email="quality@amogy.co" name="Quality Team" role="Reviewer" status="Invited" />
          </Card>
        </div>
      </div>

      <p className="text-[13px] leading-6 text-[#5f6673]">
        To deactivate your account or leave your company&apos;s team account, contact Lattice support.
      </p>
    </div>
  );
}
