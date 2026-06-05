"use client";

import { useState, type ReactNode } from "react";
import { Download, Eye, EyeOff, FileText, Maximize2, X } from "lucide-react";

type ResourceCardProps = {
  children: ReactNode;
  description: string;
  fileName: string;
  href: string;
  id: string;
  label: string;
  meta: string;
  popupPreview?: ReactNode;
};

export function ResourceCard({ children, description, fileName, href, id, label, meta, popupPreview }: ResourceCardProps) {
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const previewControlLabel = isPreviewVisible ? "Hide preview" : "Show preview";

  return (
    <article className="grid gap-4 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#ffd1d4] bg-[#fff7f7] text-[#767676]">
            <FileText aria-hidden="true" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-[#ffd1d4] bg-[#fff7f7] px-2 py-1 text-[11px] font-semibold text-[#767676]">{id}</span>
              <h3 className="text-[15px] font-semibold text-[#171717]">{label}</h3>
            </div>
            <p className="mt-1 text-[13px] leading-5 text-[#5f6673]">{description}</p>
            <p className="mt-2 text-[12px] font-medium text-[#7b8088]">{meta}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            aria-expanded={isPreviewVisible}
            aria-label={`${previewControlLabel} for ${label}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d7dbe0] bg-white px-4 text-sm font-semibold text-[#484848] transition hover:border-[#FF5A5F] hover:text-[#FF5A5F]"
            onClick={() => setIsPreviewVisible((visible) => !visible)}
            title={previewControlLabel}
            type="button"
          >
            {isPreviewVisible ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
            {previewControlLabel}
          </button>
          <button
            aria-haspopup="dialog"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#d7dbe0] bg-white px-4 text-sm font-semibold text-[#484848] transition hover:border-[#FF5A5F] hover:text-[#FF5A5F]"
            onClick={() => setIsPopupOpen(true)}
            title="Open preview"
            type="button"
          >
            <Maximize2 aria-hidden="true" className="h-4 w-4" />
            Open preview
          </button>
          <a
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#FF5A5F] px-4 text-sm font-semibold text-white transition hover:bg-[#484848]"
            download={fileName}
            href={href}
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download
          </a>
        </div>
      </div>
      {isPreviewVisible ? children : null}
      {isPopupOpen ? (
        <div className="fixed inset-0 z-50 bg-[#171717]/55 p-4 sm:p-6" role="presentation">
          <div
            aria-label={`${label} preview`}
            aria-modal="true"
            className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-md border border-[#d7dbe0] bg-white shadow-2xl"
            role="dialog"
          >
            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[#eeeeee] bg-[#fff7f7] px-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#767676]">{id}</p>
                <h2 className="truncate text-[16px] font-semibold text-[#171717]">{label}</h2>
              </div>
              <button
                aria-label={`Close ${label} preview`}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#d7dbe0] bg-white text-[#484848] transition hover:border-[#FF5A5F] hover:text-[#FF5A5F]"
                onClick={() => setIsPopupOpen(false)}
                title="Close preview"
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden bg-[#f6f7f8] p-3">{popupPreview ?? children}</div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
