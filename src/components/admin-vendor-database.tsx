"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { OverseasVendor } from "@/lib/admin-vendors";

function formatCurrency(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" fill="none" viewBox="0 0 20 20">
      <path d="m14 14 3 3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function PropertyPill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-md border border-[#ead8c8] bg-[#fffaf6] px-2 py-1 text-[12px] font-medium text-[#5f4a3c]">{children}</span>;
}

function VendorDetailModal({ onClose, vendor }: { onClose: () => void; vendor: OverseasVendor }) {
  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#2d1f18]/45 px-4 py-6 lg:py-10" role="dialog">
      <div className="w-full max-w-[980px] overflow-hidden rounded-md border border-[#efc29a] bg-white shadow-[0_24px_80px_rgba(58,40,29,0.25)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#f0d1b7] bg-[#fff6ee] p-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a5a38]">{vendor.country}</span>
            </div>
            <h2 className="mt-3 text-[28px] font-semibold tracking-tight text-[#3a281d]">{vendor.name}</h2>
            <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#5f4a3c]">{vendor.notes}</p>
          </div>
          <button
            aria-label="Close vendor record"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e6b98f] bg-white text-[22px] leading-none text-[#4f3424] transition hover:bg-[#fff1e4]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Owner", vendor.relationshipOwner],
              ["Contact", vendor.primaryContact],
              ["Region", vendor.region],
              ["City", vendor.city],
              ["Avg quote", formatCurrency(vendor.averageQuoteCents)],
              ["Avg lead time", vendor.averageLeadTimeDays ? `${vendor.averageLeadTimeDays} days` : "Pending"],
            ].map(([label, value]) => (
              <div className="rounded-md border border-[#f0d1b7] bg-[#fffaf6] p-3" key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a5a38]">{label}</p>
                <p className="mt-1 text-[14px] font-semibold text-[#3a281d]">{value}</p>
              </div>
            ))}
          </div>

          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a5a38]">Properties</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <PropertyPill>{vendor.primaryCapability}</PropertyPill>
              <PropertyPill>{vendor.qualitySystem}</PropertyPill>
              <PropertyPill>{vendor.communicationWindow}</PropertyPill>
              <PropertyPill>{vendor.shippingLane}</PropertyPill>
              <PropertyPill>{vendor.paymentTerms}</PropertyPill>
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a5a38]">Capabilities</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {vendor.capabilities.map((capability) => (
                <PropertyPill key={capability}>{capability}</PropertyPill>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#8a5a38]">Recent records</h3>
            {vendor.recentRfqs.length > 0 ? (
              <div className="mt-3 divide-y divide-[#f0d1b7] overflow-hidden rounded-md border border-[#f0d1b7]">
                {vendor.recentRfqs.map((record) => (
                  <Link className="block bg-[#fffaf6] p-3 transition hover:bg-[#fff1e4]" href={record.href} key={`${record.id}-${record.status}`}>
                    <p className="text-[14px] font-semibold text-[#3a281d]">{record.title}</p>
                    <p className="mt-1 text-[12px] text-[#80614d]">
                      {record.customer} - {record.status === "ORDER" ? "Supplier order" : record.status.toLowerCase().replaceAll("_", " ")}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-[#efc29a] bg-[#fffaf6] p-4 text-[14px] leading-6 text-[#80614d]">
                No RFQ records are connected yet. Keep this vendor visible for capability planning and future supplier record migration.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export function AdminVendorDatabase({ vendors }: { vendors: OverseasVendor[] }) {
  const [query, setQuery] = useState("");
  const [openVendor, setOpenVendor] = useState<OverseasVendor | null>(null);

  useEffect(() => {
    if (!openVendor) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenVendor(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openVendor]);

  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const searchable = [
        vendor.name,
        vendor.country,
        vendor.city,
        vendor.region,
        vendor.relationshipOwner,
        vendor.primaryContact,
        vendor.primaryCapability,
        vendor.qualitySystem,
        ...vendor.capabilities,
        ...vendor.materials,
        ...vendor.certifications,
      ]
        .join(" ")
        .toLowerCase();

      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [query, vendors]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <section className="rounded-md border border-[#efb987] bg-[#FFD3AC] p-5">
        <div>
          <div>
            <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-[#3a281d]">Overseas vendors</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5c3d28]">
              A working supplier directory for overseas shops, contacts, capabilities, quality notes, RFQ history, and order coverage.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-md border border-[#efc29a] bg-white">
          <div className="border-b border-[#f0d1b7] p-4">
            <div>
              <label className="relative block xl:w-[360px]">
                <span className="sr-only">Search overseas vendors</span>
                <SearchIcon />
                <input
                  className="h-10 w-full rounded-md border border-[#dddddd] bg-[#fbfbfb] pl-9 pr-3 text-[14px] text-[#202020] outline-none transition placeholder:text-[#9a9fa8] focus:border-[#9b9b9b] focus:bg-white"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search vendor, country, capability..."
                  type="search"
                  value={query}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-[1.15fr_1.15fr_0.5fr_0.5fr] gap-4 border-b border-[#f0d1b7] bg-[#fff6ee] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a5a38] max-xl:hidden">
            <span>Vendor</span>
            <span>Capabilities</span>
            <span>Quotes</span>
            <span>Lead time</span>
          </div>

          <div className="divide-y divide-[#f0d1b7]">
            {filteredVendors.map((vendor) => (
                <button
                  className="grid w-full gap-4 bg-white px-4 py-4 text-left transition hover:bg-[#fffaf6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4f3424] xl:grid-cols-[1.15fr_1.15fr_0.5fr_0.5fr] xl:items-center"
                  key={vendor.id}
                  onClick={() => setOpenVendor(vendor)}
                  type="button"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#202020]">{vendor.name}</p>
                    <p className="mt-1 text-[13px] text-[#69707a]">
                      {vendor.city}, {vendor.country} - owner {vendor.relationshipOwner}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Capabilities</p>
                    <p className="mt-1 text-[14px] font-medium text-[#30343a] xl:mt-0">{vendor.primaryCapability}</p>
                    <p className="mt-1 truncate text-[12px] text-[#8a8f98]">{vendor.capabilities.slice(0, 3).join(", ")}</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Quotes</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{vendor.receivedQuoteCount}/{vendor.quoteCount}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{vendor.selectedOrderCount} selected</p>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] xl:hidden">Lead time</p>
                    <p className="mt-1 text-[14px] font-semibold text-[#202020] xl:mt-0">{vendor.averageLeadTimeDays ? `${vendor.averageLeadTimeDays} days` : "Pending"}</p>
                    <p className="mt-1 text-[12px] text-[#8a8f98]">{formatCurrency(vendor.averageQuoteCents)}</p>
                  </div>

                </button>
            ))}

            {filteredVendors.length === 0 ? (
              <div className="p-8 text-center">
                <h2 className="text-[18px] font-semibold text-[#202020]">No vendors match this view.</h2>
                <p className="mt-2 text-[14px] text-[#6f737a]">Clear the search or choose another database view.</p>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-[#f0d1b7] bg-[#fff6ee] px-4 py-3 text-[12px] text-[#80614d]">
            <span>
              Showing {filteredVendors.length} of {vendors.length} vendors
            </span>
            <span>Rows open vendor records</span>
          </div>
        </div>
      </section>

      {openVendor ? <VendorDetailModal onClose={() => setOpenVendor(null)} vendor={openVendor} /> : null}
    </div>
  );
}
