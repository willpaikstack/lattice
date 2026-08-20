import Link from "next/link";
import { FileText } from "lucide-react";

import { ResourceCard } from "./resource-card";

type Resource = {
  description: string;
  fileName: string;
  href: string;
  id: string;
  label: string;
  meta: string;
  preview:
    {
      kind: "pdf";
      href: string;
    };
};

const resources: Resource[] = [
  {
    description:
      "Supplier-facing purchase order PDF template for releasing accepted work to Chinese machine shops, including line items, supplier pricing, logistics, quality docs, and release checks.",
    fileName: "nexus-supplier-purchase-order-template.pdf",
    href: "/admin/resources/supplier-purchase-order-template",
    id: "DOC-002",
    label: "Supplier purchase order PDF template",
    meta: "PDF - generated from purchase order renderer",
    preview: {
      href: "/admin/resources/supplier-purchase-order-template?preview=1",
      kind: "pdf",
    },
  },
  {
    description:
      "Customer-facing invoice PDF template for billing domestic machine shops or customers after PO acceptance, shipment milestones, or agreed billing triggers.",
    fileName: "nexus-domestic-invoice-template.pdf",
    href: "/admin/resources/domestic-invoice-template",
    id: "DOC-003",
    label: "Domestic invoice PDF template",
    meta: "PDF - generated from invoice renderer",
    preview: {
      href: "/admin/resources/domestic-invoice-template?preview=1",
      kind: "pdf",
    },
  },
  {
    description: "Frozen Rev 1 generated customer quote PDF template used by the admin quote workflow, with the current Hubs-inspired typography, line-item table, assumptions, and terms.",
    fileName: "lattice-os-customer-quote-template-rev-1.pdf",
    href: "/admin/resources/quote-template",
    id: "DOC-004",
    label: "Customer quote PDF template - Rev 1",
    meta: "PDF - Rev 1 - generated from quote renderer",
    preview: {
      href: "/admin/resources/quote-template?preview=1",
      kind: "pdf",
    },
  },
];

function PdfPreview({ href, label, mode = "inline" }: { href: string; label: string; mode?: "inline" | "popup" }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[#eeeeee] bg-[#fbfbfb]">
      <div className="flex items-center gap-2 border-b border-[#eeeeee] bg-[#fff7f7] px-3 py-2 text-[12px] font-semibold text-[#767676]">
        <FileText aria-hidden="true" className="h-4 w-4" />
        <span>PDF preview</span>
      </div>
      <iframe className={mode === "popup" ? "min-h-0 w-full flex-1 bg-white" : "h-[520px] w-full bg-white"} src={href} title={`${label} preview`} />
    </div>
  );
}

function ResourcePreview({ mode = "inline", resource }: { mode?: "inline" | "popup"; resource: Resource }) {
  return <PdfPreview href={resource.preview.href} label={resource.label} mode={mode} />;
}

export default function AdminResourcesPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#ffd1d4] bg-[#fff7f7] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Admin resources</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Resources</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Keep internal templates and reference files close to the RFQ workflow so operators can download the same materials when reviewing quote output.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-[#ffd1d4] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#767676]">Templates</p>
            <h2 className="mt-2 text-[22px] font-semibold text-[#171717]">Document templates</h2>
          </div>
          <span className="rounded-md border border-[#ffd1d4] bg-[#fff7f7] px-3 py-2 text-[12px] font-semibold text-[#767676]">{resources.length} files</span>
        </div>

        <div className="mt-5 divide-y divide-[#eeeeee] overflow-hidden rounded-md border border-[#eeeeee]">
          {resources.map((resource) => (
            <ResourceCard
              description={resource.description}
              fileName={resource.fileName}
              href={resource.href}
              id={resource.id}
              key={resource.href}
              label={resource.label}
              meta={resource.meta}
              popupPreview={<ResourcePreview mode="popup" resource={resource} />}
            >
              <ResourcePreview resource={resource} />
            </ResourceCard>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-[#e6e6e6] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Account communications</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[22px] font-semibold text-[#171717]">Customer invitation email</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#5f6673]">Review the branded first-cohort invitation with safe sample credentials before invitation delivery is connected to customer provisioning.</p>
          </div>
          <Link className="inline-flex w-fit items-center rounded-md bg-[#171717] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f3237] focus:outline-none focus:ring-2 focus:ring-[#171717] focus:ring-offset-2" href="/admin/resources/customer-invitation-email">Preview email</Link>
        </div>
      </section>
    </div>
  );
}
