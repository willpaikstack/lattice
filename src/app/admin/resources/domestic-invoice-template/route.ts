import { buildDomesticInvoiceTemplatePdf } from "@/lib/invoice-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const pdf = await buildDomesticInvoiceTemplatePdf();
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="nexus-domestic-invoice-template.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
