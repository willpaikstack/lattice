import { describe, expect, it } from "vitest";

import { buildDomesticInvoiceTemplateXlsx, buildSupplierPurchaseOrderTemplateXlsx } from "./admin-document-templates";

function workbookText(workbook: Buffer) {
  return workbook.toString("utf8");
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

  it("builds the domestic invoice workbook", () => {
    const workbook = buildDomesticInvoiceTemplateXlsx();
    const text = workbookText(workbook);

    expect(workbook.length).toBeGreaterThan(1000);
    expect(text).toContain("Invoice");
    expect(text).toContain("Domestic machine shop");
    expect(text).toContain("Amount due");
  });
});
