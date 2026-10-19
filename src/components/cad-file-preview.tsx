"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

import { cadDemoFormat } from "@/lib/cad-demo";
import type { UploadedFile } from "@/lib/request-model";
import { localCadThumbnailUrl } from "@/lib/local-cad-thumbnail";

const ThumbnailGenerator = dynamic(() => import("./local-cad-thumbnail-generator"), { ssr: false });

function fileExtension(name: string) {
  const extension = name.split(".").pop();
  return extension && extension !== name ? extension.toUpperCase() : "CAD";
}

function hashText(value: string) {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 997, 17);
}

export function CadRenderThumbnail({
  className = "h-16 w-16",
  file,
  label,
}: {
  className?: string;
  file?: Pick<UploadedFile, "cadPreviewUrn" | "name" | "type" | "storageKey">;
  label: string;
}) {
  const seed = hashText(`${file?.name ?? ""}:${label}`);
  const extension = file ? fileExtension(file.name) : "CAD";
  const accent = seed % 3 === 0 ? "#2563eb" : seed % 3 === 1 ? "#0f9d68" : "#7c3aed";
  const notchX = 56 + (seed % 8);
  const bossX = 94 + (seed % 10);
  const localSource = file?.storageKey && cadDemoFormat(file.name) ? file.storageKey : null;
  const thumbnailHref = localSource ? localCadThumbnailUrl(localSource) : file?.cadPreviewUrn && !cadDemoFormat(file.name)
    ? `/api/cad-previews/thumbnail?urn=${encodeURIComponent(file.cadPreviewUrn)}&size=320`
    : null;
  const [failedThumbnailHref, setFailedThumbnailHref] = useState<string | null>(null);
  const [attemptedThumbnailHref, setAttemptedThumbnailHref] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const imageHref = thumbnailHref ? `${thumbnailHref}&v=${revision}` : null;
  const thumbnailFailed = imageHref !== null && failedThumbnailHref === imageHref;

  return (
    <div
      aria-label={`CAD render snapshot for ${label}`}
      className={`relative shrink-0 overflow-hidden rounded-md border border-[#e1e5ea] bg-[#f8fafc] text-[#64748b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)] ${className}`}
      role="img"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(100,116,139,0.12)_1px,transparent_1px),linear-gradient(0deg,rgba(100,116,139,0.12)_1px,transparent_1px)] bg-[size:12px_12px]" />
      {imageHref && !thumbnailFailed ? (
        <Image
          alt=""
          className="absolute inset-0 h-full w-full object-contain p-1.5"
          fill
          onError={() => setFailedThumbnailHref(imageHref)}
          sizes="72px"
          src={imageHref}
          unoptimized
        />
      ) : (
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 160 160">
          <defs>
            <linearGradient id={`cad-top-${seed}`} x1="20" x2="140" y1="28" y2="112" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f8fafc" />
              <stop offset="1" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id={`cad-side-${seed}`} x1="56" x2="124" y1="78" y2="142" gradientUnits="userSpaceOnUse">
              <stop stopColor="#cbd5e1" />
              <stop offset="1" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <path d={`M32 92 82 58l50 22-50 34-50-22Z`} fill={`url(#cad-top-${seed})`} stroke="#64748b" strokeLinejoin="round" strokeWidth="3" />
          <path d="M82 114v24l50-34V80l-50 34Z" fill={`url(#cad-side-${seed})`} stroke="#64748b" strokeLinejoin="round" strokeWidth="3" />
          <path d="M32 92v24l50 22v-24L32 92Z" fill="#e2e8f0" stroke="#64748b" strokeLinejoin="round" strokeWidth="3" />
          <path d={`M${notchX} 86 82 74l30 13-27 18-28-13Z`} fill="#f8fafc" stroke={accent} strokeLinejoin="round" strokeWidth="3" />
          <ellipse cx={bossX} cy="91" fill="#ffffff" rx="13" ry="8" stroke="#475569" strokeWidth="3" />
          <path d="M43 104 77 119M96 118l26-18" fill="none" stroke={accent} strokeLinecap="round" strokeWidth="3" />
        </svg>
      )}
      <span className="absolute right-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold leading-none text-[#64748b] shadow-sm">
        {extension}
      </span>
      {file ? <span className="sr-only">{file.name}</span> : null}
      {localSource && thumbnailFailed && attemptedThumbnailHref !== thumbnailHref ? <ThumbnailGenerator key={localSource} name={file!.name} storageKey={localSource}
        onComplete={saved => { setAttemptedThumbnailHref(thumbnailHref); if (saved) setRevision(value => value + 1); }} /> : null}
    </div>
  );
}
