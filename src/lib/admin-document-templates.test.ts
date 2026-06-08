import { describe, expect, it } from "vitest";

import { buildDomesticInvoiceTemplatePdf } from "./invoice-pdf";
import { buildDomesticInvoiceTemplateXlsx, buildSupplierPurchaseOrderTemplateXlsx } from "./admin-document-templates";
import { buildSupplierPurchaseOrderTemplatePdf } from "./purchase-order-pdf";

function workbookText(workbook: Buffer) {
  return workbook.toString("utf8");
}

function pdfPageCount(pdf: Uint8Array) {
  return (Buffer.from(pdf).toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
}

describe("admin document templates", () => {
  it("builds the supplier purchase order workbook", () => {
    const workbook = buildSupplierPurchaseOrderTemplateXlsx();
    const text = workbookText(workbook);

    expect(workbook.length).toBeGreaterThan(1000);
    expect(text).toContain("Supplier PO");
    expect(text).toContain("Chinese machine shop");
    expect(text).toContain("Release checklist");
  });

  it("builds the supplier purchase order PDF", async () => {
    const pdf = await buildSupplierPurchaseOrderTemplatePdf();

    expect(pdf.length).toBeGreaterThan(1000);
    expect(Buffer.from(pdf).subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdfPageCount(pdf)).toBe(2);
  });

  it("builds the domestic invoice PDF", async () => {
    const pdf = await buildDomesticInvoiceTemplatePdf();

    expect(pdf.length).toBeGreaterThan(1000);
    expect(Buffer.from(pdf).subarray(0, 5).toString("utf8")).toBe("%PDF-");
  });

  it("includes quote and shipping terms fields in the domestic invoice workbook", () => {
    const workbook = buildDomesticInvoiceTemplateXlsx();
    const text = workbookText(workbook);

    expect(text).toContain("Quote Number");
    expect(text).toContain("Q-[######]");
    expect(text).toContain("Shipping Terms");
    expect(text).toContain("DDP Customer Address");
  });
});
