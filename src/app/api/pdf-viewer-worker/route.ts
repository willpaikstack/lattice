import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/** The packaged PDF.js worker is public code; drawing bytes use the authorized file route. */
export async function GET() {
  const worker = await readFile(path.join(process.cwd(), "node_modules/pdfjs-dist/build/pdf.worker.min.mjs"));
  return new Response(worker, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
