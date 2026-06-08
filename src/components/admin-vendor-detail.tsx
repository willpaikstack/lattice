"use client";

import { ChevronRight, Database, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { OverseasVendor } from "@/lib/admin-vendors";
import type { OverseasVendorDetailOverrides, OverseasVendorEditableFields, VendorDatabaseRow } from "@/lib/admin-vendor-overrides";

type DatabaseView = "rfqs" | "orders";
type VendorDetailView = "history" | "content";
type DatabaseRow = VendorDatabaseRow;
type EditableVendorRecord = OverseasVendor;
type VendorDraft = {
  certifications: string;
  city: string;
  communicationWindow: string;
  defectRate: string;
  fabCapabilities: string;
  materials: string;
  name: string;
  nonFabOfferings: string;
  notes: string;
  onboardingStatus: OverseasVendor["onboardingStatus"];
  onTimeDeliveryRate: string;
  paymentTerms: string;
  phoneNumber: string;
  primaryContact: string;
  primaryEmail: string;
  qmsStandard: string;
  region: string;
  shippingLane: string;
  vendorDocs: string;
  vendorType: string;
  website: string;
  wechatId: string;
};

const onboardingStatuses: OverseasVendor["onboardingStatus"][] = ["Onboarded", "Pilot active", "Docs pending", "Needs intake"];

const rfqHistory = [
  {
    id: "RFQ-2026-0441",
    leadTime: "14 days",
    parts: "6",
    response: "Quoted",
    selected: "",
    sent: "May 28, 2026",
    value: "$4,820",
  },
  {
    id: "RFQ-2026-0389",
    leadTime: "18 days",
    parts: "3",
    response: "Quoted",
    selected: "",
    sent: "Apr 12, 2026",
    value: "$2,110",
  },
  {
    id: "RFQ-2026-0312",
    leadTime: "12 days",
    parts: "9",
    response: "Quoted",
    selected: "",
    sent: "Mar 3, 2026",
    value: "$7,650",
  },
];

const activeOrders = [
  {
    id: "PO-2026-0108",
    leadTime: "16 days",
    parts: "4",
    response: "In production",
    selected: "Yes",
    sent: "Jun 2, 2026",
    value: "$3,940",
  },
  {
    id: "PO-2026-0062",
    leadTime: "Shipped",
    parts: "11",
    response: "Complete",
    selected: "Yes",
    sent: "May 10, 2026",
    value: "$8,275",
  },
];

function listToText(values: string[]) {
  return values.join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function draftForVendor(vendor: EditableVendorRecord): VendorDraft {
  return {
    certifications: listToText(vendor.certifications),
    city: vendor.city,
    communicationWindow: vendor.communicationWindow,
    defectRate: vendor.defectRate,
    fabCapabilities: listToText(vendor.fabCapabilities),
    materials: listToText(vendor.materials),
    name: vendor.name,
    nonFabOfferings: listToText(vendor.nonFabOfferings),
    notes: vendor.notes,
    onboardingStatus: vendor.onboardingStatus,
    onTimeDeliveryRate: vendor.onTimeDeliveryRate,
    paymentTerms: vendor.paymentTerms,
    phoneNumber: vendor.phoneNumber,
    primaryContact: vendor.primaryContact,
    primaryEmail: vendor.primaryEmail,
    qmsStandard: vendor.qmsStandard,
    region: vendor.region,
    shippingLane: vendor.shippingLane,
    vendorDocs: listToText(vendor.vendorDocs),
    vendorType: listToText(vendor.vendorType),
    website: vendor.website,
    wechatId: vendor.wechatId,
  };
}

function applyDraft(vendor: EditableVendorRecord, draft: VendorDraft): EditableVendorRecord {
  return {
    ...vendor,
    certifications: textToList(draft.certifications),
    city: draft.city.trim(),
    communicationWindow: draft.communicationWindow.trim(),
    defectRate: draft.defectRate.trim(),
    fabCapabilities: textToList(draft.fabCapabilities),
    materials: textToList(draft.materials),
    name: draft.name.trim(),
    nonFabOfferings: textToList(draft.nonFabOfferings),
    notes: draft.notes.trim(),
    onboardingStatus: draft.onboardingStatus,
    onTimeDeliveryRate: draft.onTimeDeliveryRate.trim(),
    paymentTerms: draft.paymentTerms.trim(),
    phoneNumber: draft.phoneNumber.trim(),
    primaryContact: draft.primaryContact.trim(),
    primaryEmail: draft.primaryEmail.trim(),
    qmsStandard: draft.qmsStandard.trim(),
    region: draft.region.trim(),
    shippingLane: draft.shippingLane.trim(),
    vendorDocs: textToList(draft.vendorDocs),
    vendorType: textToList(draft.vendorType),
    website: draft.website.trim(),
    wechatId: draft.wechatId.trim(),
  };
}

function pickEditableVendorFields(vendor: EditableVendorRecord): OverseasVendorEditableFields {
  return {
    capabilities: vendor.capabilities,
    certifications: vendor.certifications,
    city: vendor.city,
    communicationWindow: vendor.communicationWindow,
    country: vendor.country,
    defectRate: vendor.defectRate,
    fabCapabilities: vendor.fabCapabilities,
    materials: vendor.materials,
    name: vendor.name,
    nonFabOfferings: vendor.nonFabOfferings,
    notes: vendor.notes,
    onboardingStatus: vendor.onboardingStatus,
    onTimeDeliveryRate: vendor.onTimeDeliveryRate,
    paymentTerms: vendor.paymentTerms,
    phoneNumber: vendor.phoneNumber,
    primaryCapability: vendor.primaryCapability,
    primaryContact: vendor.primaryContact,
    primaryEmail: vendor.primaryEmail,
    qmsStandard: vendor.qmsStandard,
    qualitySystem: vendor.qualitySystem,
    region: vendor.region,
    relationshipOwner: vendor.relationshipOwner,
    shippingLane: vendor.shippingLane,
    vendorDocs: vendor.vendorDocs,
    vendorType: vendor.vendorType,
    website: vendor.website,
    wechatId: vendor.wechatId,
  };
}

function onboardingStatusClass(status: OverseasVendor["onboardingStatus"]) {
  switch (status) {
    case "Onboarded":
      return "bg-[#e6f8f5] text-[#008a7d]";
    case "Pilot active":
      return "bg-[#fff1f2] text-[#b2393d]";
    case "Docs pending":
      return "bg-[#fff7ed] text-[#b45309]";
    case "Needs intake":
      return "bg-[#f4f5f7] text-[#59616c]";
  }
}

function StatusPill({ status }: { status: OverseasVendor["onboardingStatus"] }) {
  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold leading-4 ${onboardingStatusClass(status)}`}>{status}</span>;
}

function TopProperty({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium leading-4 text-[#767676]">{label}</p>
      <div className="mt-0.5 min-w-0 text-[11px] font-semibold leading-4 text-[#484848]">{value}</div>
    </div>
  );
}

function inputClass(extra = "") {
  return `w-full rounded border border-[#dddddd] bg-white px-2 py-1 text-[12px] font-medium text-[#484848] outline-none transition focus:border-[#FF5A5F] ${extra}`;
}

function EditInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return <input className={inputClass()} onChange={(event) => onChange(event.target.value)} value={value} />;
}

function EditTextArea({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return <textarea className={inputClass("min-h-16 resize-y")} onChange={(event) => onChange(event.target.value)} value={value} />;
}

function EditablePropertyRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2 border-b border-[#f0f1f3] py-2.5 last:border-b-0 sm:grid-cols-[160px_1fr]">
      <p className="text-[11px] font-medium leading-4 text-[#767676]">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ViewTab({
  children,
  icon,
  isActive,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isActive}
      className={`flex min-h-9 items-center gap-1.5 border-b px-1.5 text-left text-[11px] font-medium leading-4 transition ${
        isActive ? "border-[#484848] text-[#202020]" : "border-transparent text-[#767676] hover:text-[#484848]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="shrink-0 text-[#9a9fa8]">{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function parseCurrency(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTransactionTotal(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function TransactionSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#eeeeee] bg-white px-3 py-2">
      <p className="text-[10px] font-medium leading-4 text-[#767676]">{label}</p>
      <p className="mt-1 text-[15px] font-semibold leading-5 text-[#202020]">{value}</p>
    </div>
  );
}

function DetailSection({ children, forceOpen = false, title }: { children: React.ReactNode; forceOpen?: boolean; title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const isExpanded = forceOpen || isOpen;

  return (
    <div>
      <button
        className="flex min-h-10 w-full items-center gap-2 rounded px-1 text-left text-[12px] font-semibold text-[#484848] transition hover:bg-[#f7f8fa]"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <ChevronRight aria-hidden="true" className={`h-3.5 w-3.5 text-[#9a9fa8] transition ${isExpanded ? "rotate-90" : ""}`} strokeWidth={2} />
        <span>{title}</span>
      </button>
      {isExpanded ? <div className="ml-6 border-l border-[#eeeeee] pl-4">{children}</div> : null}
    </div>
  );
}

function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "teal" | "orange" }) {
  const toneClass =
    tone === "teal"
      ? "bg-[#e6f8f5] text-[#008a7d]"
      : tone === "orange"
        ? "bg-[#fff7ed] text-[#b45309]"
        : "bg-[#f4f5f7] text-[#59616c]";

  return <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium leading-4 ${toneClass}`}>{children}</span>;
}

function PropertyRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-2 border-b border-[#f0f1f3] py-2.5 last:border-b-0 sm:grid-cols-[160px_1fr]">
      <p className="text-[11px] font-medium leading-4 text-[#767676]">{label}</p>
      <div className="min-w-0 text-[12px] font-medium leading-5 text-[#484848]">{value || <span className="text-[#9a9fa8]">Empty</span>}</div>
    </div>
  );
}

function TagList({ items, tone }: { items: string[]; tone?: "neutral" | "teal" | "orange" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Chip key={item} tone={tone}>
          {item}
        </Chip>
      ))}
    </div>
  );
}

function DatabaseTabs({ activeView, onChange }: { activeView: DatabaseView; onChange: (view: DatabaseView) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        className={`rounded px-2.5 py-1.5 text-[12px] font-semibold transition ${activeView === "rfqs" ? "bg-[#f4f5f7] text-[#484848]" : "text-[#767676] hover:bg-[#f7f8fa]"}`}
        onClick={() => onChange("rfqs")}
        type="button"
      >
        RFQ & Quote History
      </button>
      <button
        className={`rounded px-2.5 py-1.5 text-[12px] font-semibold transition ${activeView === "orders" ? "bg-[#f4f5f7] text-[#484848]" : "text-[#767676] hover:bg-[#f7f8fa]"}`}
        onClick={() => onChange("orders")}
        type="button"
      >
        Active Orders
      </button>
    </div>
  );
}

function DatabaseTable({
  isEditing,
  onAddRow,
  onUpdateRow,
  rows,
}: {
  isEditing: boolean;
  onAddRow: () => void;
  onUpdateRow: (index: number, field: keyof DatabaseRow, value: string) => void;
  rows: DatabaseRow[];
}) {
  const cellInputClass = "w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] font-medium text-[#484848] outline-none transition focus:border-[#FF5A5F] focus:bg-white";

  return (
    <div className="overflow-hidden rounded-md border border-[#eeeeee] bg-white">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="border-b border-[#eeeeee] text-[10px] font-medium text-[#767676]">
            <th className="w-[22%] px-3 py-3">RFQ ID</th>
            <th className="w-[17%] px-3 py-3">Sent</th>
            <th className="w-[10%] px-3 py-3">Parts</th>
            <th className="w-[18%] px-3 py-3">Response</th>
            <th className="w-[15%] px-3 py-3">Lead Time</th>
            <th className="w-[13%] px-3 py-3">Value</th>
            <th className="w-[12%] px-3 py-3">Selected</th>
          </tr>
        </thead>
        <tbody className="text-[11px] font-medium text-[#484848]">
          {rows.map((row, index) => (
            <tr className="border-b border-[#f0f1f3] last:border-b-0" key={`${row.id}-${index}`}>
              <td className="break-words px-3 py-3 font-semibold text-[#202020]">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "id", event.target.value)} value={row.id} /> : row.id}
              </td>
              <td className="px-3 py-3 text-[#59616c]">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "sent", event.target.value)} value={row.sent} /> : row.sent}
              </td>
              <td className="px-3 py-3">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "parts", event.target.value)} value={row.parts} /> : row.parts}
              </td>
              <td className="px-3 py-3">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "response", event.target.value)} value={row.response} /> : <span className="text-[#008a7d]">{row.response}</span>}
              </td>
              <td className="px-3 py-3 text-[#59616c]">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "leadTime", event.target.value)} value={row.leadTime} /> : row.leadTime}
              </td>
              <td className="px-3 py-3 font-semibold">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "value", event.target.value)} value={row.value} /> : row.value}
              </td>
              <td className="px-3 py-3 text-[#59616c]">
                {isEditing ? <input className={cellInputClass} onChange={(event) => onUpdateRow(index, "selected", event.target.value)} value={row.selected} /> : row.selected}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="flex min-h-8 w-full items-center justify-center gap-1 border-t border-[#eeeeee] text-[11px] font-medium text-[#9a9fa8] transition hover:bg-[#f7f8fa] hover:text-[#767676]"
        disabled={!isEditing}
        onClick={onAddRow}
        type="button"
      >
        <Plus aria-hidden="true" className="h-3 w-3" strokeWidth={2} />
        New Record
      </button>
    </div>
  );
}

function TransactionHistoryTable({ orderRows, rfqRows }: { orderRows: DatabaseRow[]; rfqRows: DatabaseRow[] }) {
  const transactions = [
    ...orderRows.map((row) => ({ ...row, type: "Purchase order" })),
    ...rfqRows.map((row) => ({ ...row, type: "RFQ / quote" })),
  ];

  return (
    <div className="overflow-hidden rounded-md border border-[#eeeeee] bg-white">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="border-b border-[#eeeeee] text-[10px] font-medium text-[#767676]">
            <th className="w-[16%] px-3 py-3">Date</th>
            <th className="w-[17%] px-3 py-3">Type</th>
            <th className="w-[20%] px-3 py-3">Transaction</th>
            <th className="w-[10%] px-3 py-3">Parts</th>
            <th className="w-[17%] px-3 py-3">Status</th>
            <th className="w-[12%] px-3 py-3">Lead</th>
            <th className="w-[12%] px-3 py-3">Value</th>
          </tr>
        </thead>
        <tbody className="text-[11px] font-medium text-[#484848]">
          {transactions.map((transaction, index) => (
            <tr className="border-b border-[#f0f1f3] last:border-b-0" key={`${transaction.type}-${transaction.id}-${index}`}>
              <td className="px-3 py-3 text-[#59616c]">{transaction.sent || "Pending"}</td>
              <td className="px-3 py-3">
                <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold leading-4 ${transaction.type === "Purchase order" ? "bg-[#e6f8f5] text-[#008a7d]" : "bg-[#f4f5f7] text-[#59616c]"}`}>
                  {transaction.type}
                </span>
              </td>
              <td className="break-words px-3 py-3 font-semibold text-[#202020]">{transaction.id}</td>
              <td className="px-3 py-3">{transaction.parts || "-"}</td>
              <td className="px-3 py-3 text-[#008a7d]">{transaction.response || "Pending"}</td>
              <td className="px-3 py-3 text-[#59616c]">{transaction.leadTime || "-"}</td>
              <td className="px-3 py-3 font-semibold">{transaction.value || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PurchaseHistoryPanel({
  activeView,
  isEditing,
  onAddRow,
  onChangeView,
  onUpdateRow,
  orderRows,
  rows,
  rfqRows,
}: {
  activeView: DatabaseView;
  isEditing: boolean;
  onAddRow: () => void;
  onChangeView: (view: DatabaseView) => void;
  onUpdateRow: (index: number, field: keyof DatabaseRow, value: string) => void;
  orderRows: DatabaseRow[];
  rows: DatabaseRow[];
  rfqRows: DatabaseRow[];
}) {
  const quotedTotal = rfqRows.reduce((total, row) => total + parseCurrency(row.value), 0);
  const orderedTotal = orderRows.reduce((total, row) => total + parseCurrency(row.value), 0);

  return (
    <section className="space-y-4 border-t border-[#eeeeee] pt-7">
      <div className="grid gap-3 sm:grid-cols-4">
        <TransactionSummaryCard label="RFQs sent" value={String(rfqRows.length)} />
        <TransactionSummaryCard label="POs placed" value={String(orderRows.length)} />
        <TransactionSummaryCard label="Quoted value" value={formatTransactionTotal(quotedTotal)} />
        <TransactionSummaryCard label="Ordered value" value={formatTransactionTotal(orderedTotal)} />
      </div>
      <TransactionHistoryTable orderRows={orderRows} rfqRows={rfqRows} />
      <div className="space-y-3">
        <DatabaseTabs activeView={activeView} onChange={onChangeView} />
        <DatabaseTable isEditing={isEditing} onAddRow={onAddRow} onUpdateRow={onUpdateRow} rows={rows} />
      </div>
    </section>
  );
}

export function AdminVendorDetail({ detailOverrides = {}, vendor }: { detailOverrides?: OverseasVendorDetailOverrides; vendor: OverseasVendor }) {
  const router = useRouter();
  const [activeDetailView, setActiveDetailView] = useState<VendorDetailView>("content");
  const [activeView, setActiveView] = useState<DatabaseView>("rfqs");
  const [record, setRecord] = useState<EditableVendorRecord>(vendor);
  const [draft, setDraft] = useState<VendorDraft>(() => draftForVendor(vendor));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [rfqRows, setRfqRows] = useState<DatabaseRow[]>(() => detailOverrides.rfqRows ?? rfqHistory);
  const [orderRows, setOrderRows] = useState<DatabaseRow[]>(() => detailOverrides.orderRows ?? activeOrders);
  const rows = activeView === "rfqs" ? rfqRows : orderRows;

  function updateDraft<K extends keyof VendorDraft>(field: K, value: VendorDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function beginEdit() {
    setDraft(draftForVendor(record));
    setSaveError("");
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraft(draftForVendor(record));
    setSaveError("");
    setIsEditing(false);
  }

  async function saveEdit() {
    const nextRecord = applyDraft(record, draft);

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch(`/api/admin/vendors/${encodeURIComponent(record.id)}`, {
        body: JSON.stringify({
          detail: {
            orderRows,
            rfqRows,
          },
          fields: pickEditableVendorFields(nextRecord),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { error?: string; vendor?: OverseasVendor };

      if (!response.ok || !payload.vendor) {
        throw new Error(payload.error ?? "Unable to save vendor.");
      }

      setRecord(payload.vendor);
      setDraft(draftForVendor(payload.vendor));
      setIsEditing(false);
      router.refresh();
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Unable to save vendor.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateTableRow(index: number, field: keyof DatabaseRow, value: string) {
    const updateRows = (current: DatabaseRow[]) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row));

    if (activeView === "rfqs") {
      setRfqRows(updateRows);
      return;
    }

    setOrderRows(updateRows);
  }

  function addTableRow() {
    const nextRow: DatabaseRow = {
      id: activeView === "rfqs" ? "RFQ-2026-0000" : "PO-2026-0000",
      leadTime: "",
      parts: "",
      response: "",
      selected: "",
      sent: "",
      value: "",
    };

    if (activeView === "rfqs") {
      setRfqRows((current) => [...current, nextRow]);
      return;
    }

    setOrderRows((current) => [...current, nextRow]);
  }

  return (
    <div className="max-w-[760px] space-y-7 pb-10">
      <div className="flex items-center justify-between gap-3">
        <Link className="inline-flex text-[12px] font-medium text-[#767676] transition hover:text-[#FF5A5F]" href="/admin/vendors">
          Overseas Vendors
        </Link>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button className="rounded border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#59616c] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSaving} onClick={cancelEdit} type="button">
              Cancel
            </button>
            <button className="rounded bg-[#FF5A5F] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#e4484e] disabled:cursor-not-allowed disabled:opacity-70" disabled={isSaving} onClick={saveEdit} type="button">
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button className="rounded border border-[#dddddd] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#484848] transition hover:bg-[#f7f8fa]" onClick={beginEdit} type="button">
            Edit vendor
          </button>
        )}
      </div>
      {saveError ? <p className="rounded border border-[#ffd1d4] bg-[#fff1f2] px-3 py-2 text-[12px] font-semibold text-[#b2393d]">{saveError}</p> : null}

      <section>
        {isEditing ? (
          <input
            className="w-full max-w-[560px] rounded border border-[#dddddd] bg-white px-2 py-1 text-[36px] font-semibold leading-[1.12] tracking-tight text-[#202020] outline-none transition focus:border-[#FF5A5F]"
            onChange={(event) => updateDraft("name", event.target.value)}
            value={draft.name}
          />
        ) : (
          <h1 className="max-w-[560px] text-[36px] font-semibold leading-[1.12] tracking-tight text-[#202020]">{record.name}</h1>
        )}
        <div className="mt-6 grid grid-cols-4 gap-5 border-b border-[#eeeeee] pb-5">
          <TopProperty label="Vendor ID" value={record.vendorCode} />
          <TopProperty
            label="Vendors Website"
            value={isEditing ? <EditInput onChange={(value) => updateDraft("website", value)} value={draft.website} /> : record.website ? record.website.replace(/^https?:\/\//, "") : "Empty"}
          />
          <TopProperty
            label="Onboarding Status"
            value={
              isEditing ? (
                <select className={inputClass()} onChange={(event) => updateDraft("onboardingStatus", event.target.value as OverseasVendor["onboardingStatus"])} value={draft.onboardingStatus}>
                  {onboardingStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <StatusPill status={record.onboardingStatus} />
              )
            }
          />
          <TopProperty
            label="Primary Email for Contact"
            value={isEditing ? <EditInput onChange={(value) => updateDraft("primaryEmail", value)} value={draft.primaryEmail} /> : <span className="block truncate">{record.primaryEmail}</span>}
          />
        </div>
      </section>

      <div className="flex gap-3 border-b border-[#eeeeee]">
        <ViewTab icon={<Database aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />} isActive={activeDetailView === "history"} onClick={() => setActiveDetailView("history")}>
          Purchase History Database
        </ViewTab>
        <ViewTab icon={<FileText aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} />} isActive={activeDetailView === "content"} onClick={() => setActiveDetailView("content")}>
          Content
        </ViewTab>
      </div>

      {activeDetailView === "content" ? (
        <div className="space-y-1">
          <DetailSection forceOpen={isEditing} title="Contact Info">
            {isEditing ? (
              <>
                <EditablePropertyRow label="Phone #">
                  <EditInput onChange={(value) => updateDraft("phoneNumber", value)} value={draft.phoneNumber} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Who is the main POC?">
                  <EditInput onChange={(value) => updateDraft("primaryContact", value)} value={draft.primaryContact} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Contact Email">
                  <EditInput onChange={(value) => updateDraft("primaryEmail", value)} value={draft.primaryEmail} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Location (City)">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <EditInput onChange={(value) => updateDraft("city", value)} value={draft.city} />
                    <EditInput onChange={(value) => updateDraft("region", value)} value={draft.region} />
                  </div>
                </EditablePropertyRow>
                <EditablePropertyRow label="Operating Hours">
                  <EditInput onChange={(value) => updateDraft("communicationWindow", value)} value={draft.communicationWindow} />
                </EditablePropertyRow>
                <EditablePropertyRow label="WeChat ID">
                  <EditInput onChange={(value) => updateDraft("wechatId", value)} value={draft.wechatId} />
                </EditablePropertyRow>
              </>
            ) : (
              <>
                <PropertyRow label="Phone #" value={record.phoneNumber} />
                <PropertyRow label="Who is the main POC?" value={record.primaryContact} />
                <PropertyRow label="Contact Email" value={record.primaryEmail} />
                <PropertyRow label="Location (City)" value={`${record.city}, ${record.region}`} />
                <PropertyRow label="Operating Hours" value={record.communicationWindow} />
                <PropertyRow label="WeChat ID" value={record.wechatId} />
              </>
            )}
          </DetailSection>
          <DetailSection forceOpen={isEditing} title="Capabilities & Offerings">
            {isEditing ? (
              <>
                <EditablePropertyRow label="Vendor Provided Docs">
                  <EditTextArea onChange={(value) => updateDraft("vendorDocs", value)} value={draft.vendorDocs} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Certifications">
                  <EditTextArea onChange={(value) => updateDraft("certifications", value)} value={draft.certifications} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Vendor Type">
                  <EditTextArea onChange={(value) => updateDraft("vendorType", value)} value={draft.vendorType} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Non-Fab Offerings">
                  <EditTextArea onChange={(value) => updateDraft("nonFabOfferings", value)} value={draft.nonFabOfferings} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Fab Capabilities">
                  <EditTextArea onChange={(value) => updateDraft("fabCapabilities", value)} value={draft.fabCapabilities} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Materials Handled">
                  <EditTextArea onChange={(value) => updateDraft("materials", value)} value={draft.materials} />
                </EditablePropertyRow>
              </>
            ) : (
              <>
                <PropertyRow label="Vendor Provided Docs" value={<TagList items={record.vendorDocs} />} />
                <PropertyRow label="Certifications" value={<TagList items={record.certifications} tone="teal" />} />
                <PropertyRow label="Vendor Type" value={<TagList items={record.vendorType} tone="orange" />} />
                <PropertyRow label="Non-Fab Offerings" value={<TagList items={record.nonFabOfferings} tone="orange" />} />
                <PropertyRow label="Fab Capabilities" value={<TagList items={record.fabCapabilities} />} />
                <PropertyRow label="Materials Handled" value={<TagList items={record.materials} />} />
              </>
            )}
          </DetailSection>
          <DetailSection forceOpen={isEditing} title="Operations & Quality">
            {isEditing ? (
              <>
                <EditablePropertyRow label="Payment Terms">
                  <EditInput onChange={(value) => updateDraft("paymentTerms", value)} value={draft.paymentTerms} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Shipping Lane">
                  <EditInput onChange={(value) => updateDraft("shippingLane", value)} value={draft.shippingLane} />
                </EditablePropertyRow>
                <EditablePropertyRow label="QMS Standard">
                  <EditInput onChange={(value) => updateDraft("qmsStandard", value)} value={draft.qmsStandard} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Defect Rate">
                  <EditInput onChange={(value) => updateDraft("defectRate", value)} value={draft.defectRate} />
                </EditablePropertyRow>
                <EditablePropertyRow label="On-time Delivery">
                  <EditInput onChange={(value) => updateDraft("onTimeDeliveryRate", value)} value={draft.onTimeDeliveryRate} />
                </EditablePropertyRow>
                <EditablePropertyRow label="Notes">
                  <EditTextArea onChange={(value) => updateDraft("notes", value)} value={draft.notes} />
                </EditablePropertyRow>
              </>
            ) : (
              <>
                <PropertyRow label="Payment Terms" value={record.paymentTerms} />
                <PropertyRow label="Shipping Lane" value={record.shippingLane} />
                <PropertyRow label="QMS Standard" value={record.qmsStandard} />
                <PropertyRow label="Defect Rate" value={record.defectRate} />
                <PropertyRow label="On-time Delivery" value={record.onTimeDeliveryRate} />
                <PropertyRow label="Notes" value={record.notes} />
              </>
            )}
          </DetailSection>
        </div>
      ) : null}

      {activeDetailView === "history" ? (
        <PurchaseHistoryPanel activeView={activeView} isEditing={isEditing} onAddRow={addTableRow} onChangeView={setActiveView} onUpdateRow={updateTableRow} orderRows={orderRows} rows={rows} rfqRows={rfqRows} />
      ) : null}

    </div>
  );
}
