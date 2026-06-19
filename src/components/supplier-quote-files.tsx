"use client";

import { Download, Eye, FileText, FileUp, Paperclip, Trash2, Upload, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

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

function filePreviewHref(file: LatticeRequest["supplierQuoteFiles"][number]) {
  const href = fileDownloadHref(file);

  return href ? `${href}&preview=1` : null;
}

function isPdfFile(file: LatticeRequest["supplierQuoteFiles"][number]) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function SupplierQuotePdfViewer({
  file,
  onClose,
}: {
  file: LatticeRequest["supplierQuoteFiles"][number];
  onClose: () => void;
}) {
  const downloadHref = fileDownloadHref(file);
  const previewHref = filePreviewHref(file);

  if (!previewHref) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-[#1f2937]/55 px-4 py-6" onClick={onClose} role="presentation">
      <div
        aria-label={`Supplier quote PDF viewer for ${file.name}`}
        aria-modal="true"
        className="mx-auto flex h-full max-h-[920px] max-w-[1120px] flex-col overflow-hidden rounded-md bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#eeeeee] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#767676]">Supplier quote PDF</p>
            <h2 className="mt-1 truncate text-[18px] font-semibold text-[#171717]">{file.name}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {downloadHref ? (
              <a
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-[#30343a] transition hover:bg-[#f8f8f8]"
                download={file.name}
                href={downloadHref}
              >
                <Download aria-hidden="true" className="h-3.5 w-3.5" />
                Download
              </a>
            ) : null}
            <button
              aria-label="Close supplier quote PDF viewer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#30343a] transition hover:bg-[#f8f8f8]"
              onClick={onClose}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
        <iframe className="min-h-0 flex-1 bg-[#f8f8f8]" src={previewHref} title={`Preview ${file.name}`} />
      </div>
    </div>
  );
}

function SupplierQuoteFileName({
  file,
  href,
  onPreview,
}: {
  file: LatticeRequest["supplierQuoteFiles"][number];
  href: string | null;
  onPreview: (file: LatticeRequest["supplierQuoteFiles"][number]) => void;
}) {
  if (href && isPdfFile(file)) {
    return (
      <button
        className="flex min-w-0 items-center gap-2 text-left text-[13px] font-semibold text-[#202020] transition hover:text-[#FF5A5F]"
        onClick={() => onPreview(file)}
        title={`View ${file.name}`}
        type="button"
      >
        <FileText aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7b8088]" />
        <span className="truncate">{file.name}</span>
      </button>
    );
  }

  return <p className="truncate text-[13px] font-semibold text-[#202020]">{file.name}</p>;
}

export function SupplierQuoteFiles({
  children,
  readOnly = false,
  removeHref,
  request,
  returnTo,
  stepNumber = 2,
  uploadHref,
  variant = "default",
}: {
  children?: ReactNode;
  readOnly?: boolean;
  removeHref?: string;
  request: LatticeRequest;
  returnTo: string;
  stepNumber?: number;
  uploadHref?: string;
  variant?: "admin" | "default";
}) {
  const searchParams = useSearchParams();
  const [previewFile, setPreviewFile] = useState<LatticeRequest["supplierQuoteFiles"][number] | null>(null);
  const files = request.supplierQuoteFiles ?? [];
  const uploadError = searchParams?.get("supplierQuoteError");
  const accentClass = variant === "admin" ? "border-[#ffd1d4] bg-[#fff7f7] text-[#FF5A5F]" : "border-[#dce7f5] bg-[#f4f8fd] text-[#315a94]";
  const buttonClass = variant === "admin" ? "bg-[#FF5A5F] hover:bg-[#e5484d]" : "bg-[#171717] hover:bg-[#2b2b2b]";

  if (variant === "admin") {
    return (
      <section className="border-t border-[#eeeeee] py-6">
        {previewFile ? <SupplierQuotePdfViewer file={previewFile} onClose={() => setPreviewFile(null)} /> : null}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff1f2] text-[13px] font-semibold text-[#FF5A5F]">
                {stepNumber}
              </span>
              <div>
                <h3 className="text-[16px] font-semibold text-[#171717]">{readOnly ? "Supplier quote" : "Attach supplier quote"}</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#6f737a]">
                  {readOnly ? "Quote file received from the overseas shop." : "Upload the quote received from the overseas shop."}
                </p>
              </div>
            </div>
          </div>
          {files.length ? (
            <div className="grid min-w-0 flex-1 gap-3 lg:max-w-[680px]">
              {files.map((file) => {
                const href = fileDownloadHref(file);

                return (
                  <div className="flex min-w-0 items-center gap-4 rounded-md border border-[#e2e8f0] bg-white px-4 py-3 shadow-sm" key={file.id}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[#1d4ed8]">
                      <Paperclip aria-hidden="true" className="h-7 w-7" strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[18px] font-semibold leading-6 text-[#19398a]">{file.name}</p>
                      <p className="mt-1 text-[12px] font-medium text-[#8a9bb6]">
                        {formatFileSize(file.sizeBytes)} - {formatDateTime(file.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {href ? (
                        <a
                          aria-label={`Download supplier quote ${file.name}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#f1f5ff] text-[#1455d9] transition hover:bg-[#e4edff]"
                          download={file.name}
                          href={href}
                        >
                          <Download aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
                        </a>
                      ) : (
                        <span className="text-[12px] font-medium text-[#9a5a2f]">Reference only</span>
                      )}
                      {href && isPdfFile(file) ? (
                        <button
                          aria-label={`Preview supplier quote ${file.name}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#f1f5ff] text-[#1455d9] transition hover:bg-[#e4edff]"
                          onClick={() => setPreviewFile(file)}
                          type="button"
                        >
                          <Eye aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
                        </button>
                      ) : null}
                      {removeHref && !readOnly ? (
                        <form action={removeHref} method="post">
                          <input name="requestId" type="hidden" value={request.id} />
                          <input name="fileId" type="hidden" value={file.id} />
                          <input name="returnTo" type="hidden" value={returnTo} />
                          <button
                            aria-label={`Remove supplier quote ${file.name}`}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#fff1f2] text-[#dc2626] transition hover:bg-[#ffe3e5]"
                            type="submit"
                          >
                            <Trash2 aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        {readOnly && files.length === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-[#d7d7d7] bg-[#fafafa] p-4 text-[13px] leading-6 text-[#6f737a]">No supplier quote file is attached.</p>
        ) : null}

        {uploadHref && !readOnly ? (
          <form
            action={uploadHref}
            className="mt-4"
            encType="multipart/form-data"
            method="post"
          >
            <input name="requestId" type="hidden" value={request.id} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <label className="flex min-h-[92px] cursor-pointer flex-col gap-3 rounded-md border-2 border-dashed border-[#b9d7ff] bg-white px-4 py-4 text-left transition hover:border-[#8bbdff] hover:bg-[#f4f8ff] sm:flex-row sm:items-center sm:gap-5 sm:px-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#1d4ed8]">
                <Upload aria-hidden="true" className="h-7 w-7" strokeWidth={2.4} />
              </span>
              <span className="min-w-0">
                <span className="block text-[22px] font-semibold leading-7 text-[#0f172a]">Upload supplier quote</span>
                <span className="mt-1 block text-[15px] font-semibold leading-5 text-[#8a9bb6]">PDF, spreadsheet, image, or document from the shop</span>
              </span>
              <input
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,image/png,image/jpeg"
                aria-describedby={uploadError === "missing" ? `supplier-quote-error-${request.id}` : undefined}
                aria-label="Upload supplier quote file"
                className="sr-only"
                name="supplierQuoteFile"
                onChange={(event) => {
                  if (event.currentTarget.files?.length) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                required
                type="file"
              />
            </label>
            {uploadError === "missing" ? (
              <p className="mt-2 text-[12px] font-medium text-[#b42318]" id={`supplier-quote-error-${request.id}`}>
                Choose a supplier quote file before uploading.
              </p>
            ) : null}
          </form>
        ) : null}
        {children ? <div className="mt-5 border-t border-[#eeeeee] pt-5">{children}</div> : null}
      </section>
    );
  }

  return (
    <section className="rounded-md border border-[#e7e7e7] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {previewFile ? <SupplierQuotePdfViewer file={previewFile} onClose={() => setPreviewFile(null)} /> : null}
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
                  <SupplierQuoteFileName file={file} href={href} onPreview={setPreviewFile} />
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
