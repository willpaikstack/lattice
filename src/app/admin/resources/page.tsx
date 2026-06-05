import { FileSpreadsheet, FileText } from "lucide-react";

import { domesticInvoiceSheets, supplierPoSheets } from "@/lib/admin-document-templates";
import { isTemplateInputCell, type SheetModel } from "@/lib/quote-xlsx";
import { ResourceCard } from "./resource-card";

type Resource = {
  description: string;
  fileName: string;
  href: string;
  id: string;
  label: string;
  meta: string;
  preview:
    | {
        kind: "workbook";
        sheets: SheetModel[];
      }
    | {
        kind: "pdf";
        href: string;
      };
};

const resources: Resource[] = [
  {
    description:
      "Single-tab customer quote workbook for manual PDF export. The quote, manufacturing assumptions, and General Terms and Conditions of Sale run continuously on one sheet.",
    fileName: "lattice-os-customer-quote-template.xlsx",
    href: "/admin/resources/customer-quote-template",
    id: "DOC-001",
    label: "Customer quote Excel template",
    meta: "XLSX - 1 sheet - 38 KB",
    preview: {
      kind: "workbook",
      sheets: [
        {
          columnWidths: [6, 24, 3, 14, 14, 12, 8, 12, 14],
          name: "Quote",
          rows: [
            ["Lattice OS", "", "", "", "", "", "QUOTE"],
            ["Lattice OS", "", "", "", "", "", "Quote No.", "", "LQ-[####]"],
            ["169 Madison Ave, #17525", "", "", "", "", "", "Quote Date", "", "[YYYY-MM-DD]"],
            ["New York, NY 10016", "", "", "", "", "", "Valid Until", "", "[YYYY-MM-DD]"],
            ["mfg@latticeos.co"],
            [],
            ["PREPARED FOR", "", "", "SHIP TO", "", "", "QUOTE DETAILS"],
            ["[Customer company]", "", "", "[Ship-to company]", "", "", "Production speed: [lead time]"],
            ["[Customer contact / email]", "", "", "[Ship-to address]", "", "", "Shipping: [method / terms]"],
            [],
            ["SUMMARY OF ORDER", "", "", "", "", "", "ORDER TOTAL $0.00"],
            [],
            ["#", "Part details", "", "", "", "Production Region", "Qty", "Unit price", "Subtotal"],
            [1, "[Part name / file package]\nProcess: [Process]\nMaterial: [Material]\nFinish: [Finish]", "", "", "", "[Production region]", 1, "$0.00", "$0.00"],
            [],
            [
              "Notes:",
              "[1] Order by 3 PM PST on [tomorrow's date] to ship your parts by [ship date]. Parts ship together at the slowest production speed in your quote.\n[2] Customs clearance information is required for shipments across country borders.",
            ],
            ["", "", "", "", "", "Sales Tax", "", "", "8.25% of part production subtotal"],
            [],
            ["MANUFACTURING ASSUMPTIONS AND ACCEPTANCE"],
            ["1. 100% Payment in Advance; production begins only after payment is received and final design release is complete."],
            ["2. Customer-supplied CAD, drawings, quantities, materials, finish requirements, and inspection requirements are assumed complete and current."],
            [],
            ["GENERAL TERMS AND CONDITIONS OF SALE"],
            ["General Terms and Conditions of Sale"],
            ["Version 1.5.10 - Jun 26, 2024"],
            ["These general terms and conditions of sale apply to any purchase of goods and services by a customer from Nexus Manufacturing Technologies, Inc."],
            ["1. General"],
            ["1.1. Lattice Quotes. Lattice provides a Quote for Buyer’s Goods based on a 3D CAD model submitted by Buyer to Seller."],
          ],
        },
      ],
    },
  },
  {
    description:
      "Editable supplier PO template for releasing accepted work to Chinese machine shops, including line items, supplier pricing, logistics, quality docs, and release checks.",
    fileName: "lattice-supplier-purchase-order-template.xlsx",
    href: "/admin/resources/supplier-purchase-order-template",
    id: "DOC-002",
    label: "Supplier purchase order template",
    meta: "XLSX - 2 sheets",
    preview: {
      kind: "workbook",
      sheets: supplierPoSheets,
    },
  },
  {
    description:
      "Editable customer invoice template for billing domestic machine shops or customers after PO acceptance, shipment milestones, or agreed billing triggers.",
    fileName: "lattice-domestic-invoice-template.xlsx",
    href: "/admin/resources/domestic-invoice-template",
    id: "DOC-003",
    label: "Domestic invoice template",
    meta: "XLSX - 3 sheets",
    preview: {
      kind: "workbook",
      sheets: domesticInvoiceSheets,
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

function cellDisplayValue(value: SheetModel["rows"][number][number]) {
  if (value === null || value === "") {
    return "";
  }

  return String(value);
}

function WorkbookPreview({ mode = "inline", sheets }: { mode?: "inline" | "popup"; sheets: SheetModel[] }) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[#eeeeee] bg-[#fbfbfb]">
      <div className="flex items-center gap-2 border-b border-[#eeeeee] bg-[#fff7f7] px-3 py-2 text-[12px] font-semibold text-[#767676]">
        <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
        <span>{sheets.length} sheet{sheets.length === 1 ? "" : "s"}</span>
        <span className="rounded-md border border-[#ffd1d4] bg-[#fff3cf] px-2 py-0.5 text-[11px] text-[#767676]">Yellow cells accept operator input</span>
      </div>
      <div className={mode === "popup" ? "min-h-0 flex-1 overflow-auto" : "max-h-[520px] overflow-auto"}>
        <div className="space-y-4 p-3">
          {sheets.map((sheet) => {
            const columnCount = Math.max(1, ...sheet.rows.map((row) => row.length));

            return (
              <details className="group rounded-md border border-[#e6e6e6] bg-white" key={sheet.name} open>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[#eeeeee] px-3 py-2 text-[13px] font-semibold text-[#202020]">
                  <span>{sheet.name}</span>
                  <span className="text-[11px] font-medium text-[#8a8f98]">{sheet.rows.length} rows</span>
                </summary>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-[12px]">
                    {sheet.columnWidths ? (
                      <colgroup>
                        {sheet.columnWidths.map((width, columnIndex) => (
                          <col key={`${sheet.name}-col-${columnIndex}`} style={{ minWidth: `${width * 8}px`, width: `${width * 8}px` }} />
                        ))}
                      </colgroup>
                    ) : null}
                    <tbody>
                      {sheet.rows.map((row, rowIndex) => {
                        const isSpacer = row.length === 0 || row.every((value) => value === null || value === "");

                        if (isSpacer) {
                          return (
                            <tr key={`${sheet.name}-${rowIndex}`}>
                              <td className="h-3 bg-[#fafafa]" colSpan={columnCount} />
                            </tr>
                          );
                        }

                        return (
                          <tr key={`${sheet.name}-${rowIndex}`} className={rowIndex === 0 ? "bg-[#fff7f7]" : undefined}>
                            {Array.from({ length: columnCount }, (_, columnIndex) => {
                              const value = row[columnIndex] ?? "";
                              const isInput = isTemplateInputCell(sheet.name, rowIndex, columnIndex);
                              const isTitle = rowIndex === 0;
                              const displayValue = cellDisplayValue(value);

                              return (
                                <td
                                  className={`max-w-[260px] whitespace-pre-line border border-[#eeeeee] px-2 py-1.5 align-top leading-5 ${
                                    isInput
                                      ? "bg-[#fff3a3] text-[#34250f]"
                                      : isTitle
                                        ? "bg-[#fff7f7] font-semibold text-[#171717]"
                                        : "bg-white text-[#4b525b]"
                                  }`}
                                  key={`${sheet.name}-${rowIndex}-${columnIndex}`}
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
  if (resource.preview.kind === "pdf") {
    return <PdfPreview href={resource.preview.href} label={resource.label} mode={mode} />;
  }

  return <WorkbookPreview mode={mode} sheets={resource.preview.sheets} />;
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
    </div>
  );
}
