import { buildDomesticInvoiceTemplateXlsx } from "@/lib/admin-document-templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const workbook = buildDomesticInvoiceTemplateXlsx();
  const body = new ArrayBuffer(workbook.byteLength);
  new Uint8Array(body).set(workbook);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="lattice-domestic-invoice-template.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
