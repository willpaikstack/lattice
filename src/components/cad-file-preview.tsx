import type { UploadedFile } from "@/lib/request-model";

function fileExtension(name: string) {
  const extension = name.split(".").pop();
  return extension && extension !== name ? extension.toUpperCase() : "CAD";
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CadFilePreview({ file, compact = false }: { file: UploadedFile; compact?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${compact ? "w-full max-w-44" : ""}`}>
      <div className={`relative bg-slate-50 ${compact ? "h-24" : "h-40"}`}>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.14)_1px,transparent_1px)] bg-[size:16px_16px]" />
        <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox="0 0 180 120">
          <path d="M44 76 86 52l50 19-42 24-50-19Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
          <path d="M86 52v-24l50 19v24" fill="#cbd5e1" stroke="#475569" strokeLinejoin="round" strokeWidth="2" />
          <path d="M44 76V52l42-24v24" fill="#f8fafc" stroke="#475569" strokeLinejoin="round" strokeWidth="2" />
          <path d="m56 60 30 11 30-17" fill="none" stroke="#2563eb" strokeLinecap="round" strokeWidth="2.5" />
          <circle cx="92" cy="69" fill="#ffffff" r="8" stroke="#475569" strokeWidth="2" />
        </svg>
        <span className="absolute right-3 top-3 rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
          {fileExtension(file.name)}
        </span>
      </div>
      <div className="min-w-0 p-3">
        <p className="truncate text-sm font-semibold text-slate-950">{file.name}</p>
        <p className="mt-1 truncate text-xs text-slate-500">
          {file.type || "CAD file"} - {formatFileSize(file.sizeBytes)}
        </p>
      </div>
    </div>
  );
}
