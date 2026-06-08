"use client";

import { Download, FileUp, Paperclip } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { LatticeRequest } from "@/lib/request-model";

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Uploaded";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function fileDownloadHref(file: LatticeRequest["supplierQuoteFiles"][number]) {
  return file.storageKey
    ? `/api/local-files/${file.storageKey}?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`
    : null;
}

export function SupplierQuoteFiles({
  request,
  returnTo,
  uploadHref,
  variant = "default",
}: {
  request: LatticeRequest;
  returnTo: string;
  uploadHref?: string;
  variant?: "admin" | "default";
}) {
  const searchParams = useSearchParams();
  const files = request.supplierQuoteFiles ?? [];
  const uploadError = searchParams?.get("supplierQuoteError");
  const accentClass = variant === "admin" ? "border-[#ffd1d4] bg-[#fff7f7] text-[#FF5A5F]" : "border-[#dce7f5] bg-[#f4f8fd] text-[#315a94]";
  const buttonClass = variant === "admin" ? "bg-[#FF5A5F] hover:bg-[#e5484d]" : "bg-[#171717] hover:bg-[#2b2b2b]";

  return (
    <section className="rounded-md border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-md border ${accentClass}`}>
              <Paperclip aria-hidden="true" className="h-4 w-4" />
            </span>
            <h2 className="text-[16px] font-semibold text-[#202020]">Chinese shop quote</h2>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[#6f737a]">Attach the supplier quote received from the overseas machine shop for internal pricing traceability.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {files.length ? (
          files.map((file) => {
            const href = fileDownloadHref(file);

            return (
              <div className="flex flex-col gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3 sm:flex-row sm:items-center sm:justify-between" key={file.id}>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#202020]">{file.name}</p>
                  <p className="mt-1 text-[11px] text-[#7b8088]">{file.type || "Supplier quote"} - {formatFileSize(file.sizeBytes)} - {formatDateTime(file.uploadedAt)}</p>
                </div>
                {href ? (
                  <a className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-[#30343a] transition hover:bg-[#f8f8f8]" download={file.name} href={href}>
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    Download
                  </a>
                ) : (
                  <span className="text-[12px] font-medium text-[#9a5a2f]">Reference only</span>
                )}
              </div>
            );
          })
        ) : (
          <p className="rounded-md border border-dashed border-[#d7d7d7] bg-[#fafafa] p-4 text-[13px] leading-6 text-[#6f737a]">No Chinese shop quote has been attached yet.</p>
        )}
      </div>

      {uploadHref ? (
        <form
          action={uploadHref}
          className="mt-4 grid gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3 sm:grid-cols-[1fr_auto] sm:items-center"
          encType={uploadHref ? "multipart/form-data" : undefined}
          method={uploadHref ? "post" : undefined}
        >
          <input name="requestId" type="hidden" value={request.id} />
          <input name="returnTo" type="hidden" value={returnTo} />
          <label className="grid gap-1 text-[12px] font-semibold text-[#30343a]">
            Upload supplier quote file
            <input
              accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,image/png,image/jpeg"
              aria-describedby={uploadError === "missing" ? `supplier-quote-error-${request.id}` : undefined}
              className="min-h-10 w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-[13px] text-[#202020] file:mr-3 file:rounded-md file:border-0 file:bg-[#f1f5f9] file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-[#30343a]"
              name="supplierQuoteFile"
              required
              type="file"
            />
            {uploadError === "missing" ? (
              <span className="text-[12px] font-medium text-[#b42318]" id={`supplier-quote-error-${request.id}`}>
                Choose a supplier quote file before uploading.
              </span>
            ) : null}
          </label>
          <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-[13px] font-semibold text-white transition ${buttonClass}`} type="submit">
            <FileUp aria-hidden="true" className="h-4 w-4" />
            Upload quote
          </button>
        </form>
      ) : null}
    </section>
  );
}
