import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { LatticeRequest } from "./request-model";
import { buildCustomerQuoteXlsx, customerQuoteXlsxFileName } from "./quote-xlsx";

const execFileAsync = promisify(execFile);

function configuredSofficePath() {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    process.env.SOFFICE_PATH,
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    "/Applications/OpenOffice.app/Contents/MacOS/soffice",
    "/usr/local/bin/soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/bin/soffice",
  ].filter(Boolean) as string[];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

export async function convertCustomerQuoteTemplateToPdf(request: LatticeRequest) {
  const sofficePath = configuredSofficePath();

  if (!sofficePath) {
    return null;
  }

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-quote-"));
  const xlsxPath = path.join(tempDirectory, customerQuoteXlsxFileName(request));
  const pdfPath = xlsxPath.replace(/\.xlsx$/i, ".pdf");

  try {
    fs.writeFileSync(xlsxPath, buildCustomerQuoteXlsx(request));
    await execFileAsync(sofficePath, ["--headless", "--convert-to", "pdf", "--outdir", tempDirectory, xlsxPath], { timeout: 30_000 });

    if (!fs.existsSync(pdfPath)) {
      throw new Error("LibreOffice did not produce a quote PDF.");
    }

    return new Uint8Array(fs.readFileSync(pdfPath));
  } finally {
    fs.rmSync(tempDirectory, { force: true, recursive: true });
  }
}
