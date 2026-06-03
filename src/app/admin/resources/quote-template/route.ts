import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const templatePath = path.join(process.cwd(), "resources", "admin", "quote-pdf-template.pdf");
  const file = await readFile(templatePath);
  const body = new ArrayBuffer(file.byteLength);
  new Uint8Array(body).set(file);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="quote-pdf-template.pdf"',
      "Content-Type": "application/pdf",
    },
  });
}
