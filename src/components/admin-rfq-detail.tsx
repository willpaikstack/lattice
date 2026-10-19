"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Download, FileText, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LatticeRequest, UploadedFile } from "@/lib/request-model";
import { groupAdminRfqFiles, rfqFileHref, rfqFileKind } from "@/lib/admin-rfq-package";
import { processLabel, readTargetDeliveryDate } from "@/lib/rfq-manufacturing";
import type { CadUploadPreviewState } from "./cad-upload-preview";
import { cadDemoFormat } from "@/lib/cad-demo";
import { SavedLocalCadPreview } from "./saved-local-cad-preview";
import { refreshCadPreviewState } from "@/lib/cad-preview-status";

const PdfViewer = dynamic(() => import("./drawing-pdf-preview").then(module => module.DrawingPdfPreview), { ssr: false, loading: () => <p>Loading drawing…</p> });
const ModelViewer = dynamic(() => import("./autodesk-model-viewer").then(module => module.AutodeskModelViewer), { ssr: false, loading: () => <p>Loading CAD viewer…</p> });
import styles from "./admin-rfq-detail.module.css";

const statuses: Record<LatticeRequest["status"], string> = {
  DRAFT: "Draft", SUBMITTED: "Submitted", NEEDS_INFO: "Needs information", READY_FOR_SUPPLIER_RFQ: "Supplier ready",
  QUOTED: "Customer quote issued", PURCHASED: "Purchased", CLOSED: "Closed",
};
function timestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
function Field({ label, value }: { label: string; value?: string | number | null }) {
  return <div><dt>{label}</dt><dd>{value === 0 ? "0" : value || "Not specified"}</dd></div>;
}
function FileLink({ file }: { file: UploadedFile }) {
  const href = rfqFileHref(file);
  return href ? <a href={href} download={file.name}><Download size={14} aria-hidden="true" />{file.name}</a> : <span>{file.name} · File unavailable</span>;
}
function SavedCadPreview({ file, request }: { file: UploadedFile; request: LatticeRequest }) {
  const [retrying, setRetrying] = useState(false);
  const [state, setState] = useState<CadUploadPreviewState>(() => file.cadPreviewUrn
    ? { status: "processing", urn: file.cadPreviewUrn, fileName: file.name, progress: "Checking saved model" }
    : { status: "reference_only", fileName: file.name, message: "No translated preview was saved with this CAD file. Download the original for review." });
  const urn = state.status === "processing" ? state.urn : null;
  const restrictionStatus = request.intakeDeclaration?.restrictionStatus;
  const restrictionPolicyVersion = request.intakeDeclaration?.policyVersion;
  async function retry() {
    if (retrying || !file.storageKey) return;
    setRetrying(true);
    try {
      const response = await fetch("/api/cad-previews", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey: file.storageKey, restrictionStatus, restrictionPolicyVersion, reuseExisting: state.status === "reference_only" }) });
      const payload = await response.json();
      if (!response.ok || !payload.preview?.urn) throw new Error(payload.error || payload.preview?.message || "Unable to prepare the CAD preview. Try again later.");
      setState({ status: "processing", fileName: file.name, urn: payload.preview.urn, progress: "Preparing CAD preview" });
    } catch (caught) {
      setState({ status: "failed", fileName: file.name, message: caught instanceof Error ? caught.message : "Unable to prepare CAD preview." });
    } finally { setRetrying(false); }
  }
  useEffect(() => {
    if (!urn) return;
    let active = true;
    let checking = false;
    async function check() {
      if (checking) return;
      checking = true;
      try {
        const next = await refreshCadPreviewState({ status: "processing", urn: urn!, fileName: file.name, progress: "Checking saved model" }, { storageKey: file.storageKey ?? "", restrictionStatus, restrictionPolicyVersion });
        if (active) setState(next);
      } finally { checking = false; }
    }
    void check();
    const interval = window.setInterval(() => { void check(); }, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [urn, file.name, file.storageKey, restrictionStatus, restrictionPolicyVersion]);
  if (state.status === "ready") return <ModelViewer urn={state.urn} />;
  return <div className={styles.noPreview} role="status"><FileText size={28} aria-hidden="true" /><p>{state.status === "processing" ? "Checking the saved CAD preview… The original file is available to download below." : "message" in state ? state.message : "Loading CAD preview…"}</p>
    {state.status !== "processing" && file.storageKey ? <button type="button" disabled={retrying || restrictionStatus !== "unrestricted"} onClick={() => void retry()}>{retrying ? "Preparing preview…" : "Retry CAD preview"}</button> : null}
  </div>;
}
function SavedFilePreview({ file, request }: { file: UploadedFile; request: LatticeRequest }) {
  const href = rfqFileHref(file, true);
  if (rfqFileKind(file) === "cad") return cadDemoFormat(file.name) ? <SavedLocalCadPreview file={file} /> : <SavedCadPreview file={file} request={request} />;
  if (href && /\.pdf$/i.test(file.name)) return <PdfViewer url={href} name={file.name} />;
  if (href && /\.(png|jpg|jpeg|webp)$/i.test(file.name)) {
    // The authorized local-file endpoint supplies the stored drawing bytes.
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={styles.drawingImage} src={href} alt={`Drawing: ${file.name}`} />;
  }
  return <div className={styles.noPreview}><FileText size={28} aria-hidden="true" /><p>Download this file to review it in its native application.</p></div>;
}

export function AdminRfqDetail({ request }: { request: LatticeRequest }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    window.addEventListener("focus", refresh);
    const interval = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener("focus", refresh); window.clearInterval(interval); };
  }, [router]);
  const { parts, unassignedFiles } = groupAdminRfqFiles(request);
  const [partIndex, setPartIndex] = useState(0);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const part = parts[partIndex];
  const file = part?.files.find(item => item.id === selectedFileId) ?? part?.files.find(item => rfqFileKind(item) === "cad") ?? part?.files[0];
  const details = part?.lineItem.manufacturingDetails;
  const base = `/admin/quotes?requestId=${encodeURIComponent(request.id)}&view=quote`;
  const canQuote = !request.isArchived && ["SUBMITTED", "NEEDS_INFO", "READY_FOR_SUPPLIER_RFQ", "QUOTED"].includes(request.status);
  const intendedUse = { prototype: "Prototype", commercial: "Commercial", mixed: "Mixed (legacy declaration)", "": "Not declared" };

  return <div className={styles.detail}>
    <header className={styles.header}>
      <div><Link className={styles.back} href="/admin/quotes"><ArrowLeft size={15} aria-hidden="true" />Quote submissions</Link>
        <p className={styles.eyebrow}>RFQ review · {statuses[request.status]}</p><h1>{request.title}</h1>
        <p>{request.buyerCompanyId ? request.buyerCompany : "Unassigned company"} · {parts.length} {parts.length === 1 ? "part" : "parts"} · Submitted {timestamp(request.createdAt)}</p>
      </div>
      <div className={styles.actions}><button type="button" onClick={() => router.refresh()}><RefreshCw size={15} aria-hidden="true" />Refresh</button>
        {canQuote ? <Link className={styles.primary} href={base}>{request.customerQuotes.length ? "View customer quote" : "Prepare customer quote"}</Link> : null}
      </div>
    </header>
    <section className={styles.requestSummary} aria-label="Submitted RFQ context">
      <dl><Field label="Request ID" value={request.id} /><Field label="Requester" value={request.requesterName} /><Field label="Email" value={request.requesterEmail} />
        <Field label="Intended use" value={request.intakeDeclaration ? intendedUse[request.intakeDeclaration.endUse] : "Not declared (legacy RFQ)"} />
        <Field label="Export restrictions" value={request.intakeDeclaration?.restrictionStatus || "Not declared (legacy RFQ)"} />
        <Field label="Pre-shipment quality approval" value={request.requiresQualityApproval ? "Customer Admin approval required" : "Not requested"} />
      </dl>
      {request.intakeDeclaration?.endUseNotes ? <p className={styles.notes}>{request.intakeDeclaration.endUseNotes}</p> : null}
    </section>
    <div className={styles.partLayout}>
      <nav className={styles.partNav} aria-label="RFQ parts"><h2>Parts</h2>{parts.map(({ lineItem, files }, index) => <button key={lineItem.id} type="button" aria-pressed={index === partIndex} onClick={() => { setPartIndex(index); setSelectedFileId(null); }}>
        <strong>{lineItem.partName || `Part ${index + 1}`}</strong><span>{processLabel(lineItem.manufacturingDetails?.process || request.process)}</span><span>Qty {lineItem.quantity} · {files.length} files</span>
      </button>)}</nav>
      {part ? <section className={styles.part} aria-label={`Submitted part: ${part.lineItem.partName}`}>
        <header><div><p className={styles.eyebrow}>Part {partIndex + 1} of {parts.length}</p><h2>{part.lineItem.partName}</h2></div><span className={styles.quantity}>Qty {part.lineItem.quantity}</span></header>
        <div className={styles.partBody}>
          <div className={styles.filePanel}><h3>CAD & drawings</h3>
            <div className={styles.fileTabs} aria-label="Part files">{part.files.map(item => <button type="button" aria-pressed={file?.id === item.id} key={item.id} onClick={() => setSelectedFileId(item.id)}>{rfqFileKind(item) === "cad" ? "CAD" : rfqFileKind(item) === "drawing" ? "Drawing" : "File"} · {item.name}</button>)}</div>
            {file ? <><SavedFilePreview key={file.id} file={file} request={request} /><div className={styles.download}><FileLink file={file} /><span>{new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(file.sizeBytes / 1024)} KB</span></div></> : <p className={styles.empty}>No files have a saved association with this part. Check the shared files below.</p>}
            <p className={styles.caption}>Original uploaded files and saved customer requirements.</p>
          </div>
          <div className={styles.specs}><h3>Manufacturing requirements</h3><dl>
            <Field label="Process" value={processLabel(details?.process || request.process)} /><Field label="Material" value={part.lineItem.material} />
            <Field label="Surface finish" value={part.lineItem.surfaceFinish} /><Field label="General tolerance" value={part.lineItem.generalTolerance} />
            <Field label="Quality documentation" value={part.lineItem.qualityDocumentation?.join(", ")} /><Field label="Target delivery date (customer preference)" value={readTargetDeliveryDate(details)} />
            {details?.cadMetadata ? <><Field label="CAD envelope (mm)" value={details.cadMetadata.dimensionsMm.map(value => value.toFixed(2)).join(" × ")} /><Field label="Original model units" value={details.cadMetadata.sourceUnit} /></> : null}
            {details?.customerPartNumber ? <Field label="Customer part number (legacy)" value={details.customerPartNumber} /> : null}
            {details?.cadRevision ? <Field label="CAD revision (legacy)" value={details.cadRevision} /> : null}
            {details?.drawingRevision ? <Field label="Drawing revision (legacy)" value={details.drawingRevision} /> : null}
          </dl><h3 className={styles.noteHeading}>Manufacturing notes & special requirements</h3><p className={styles.notes}>{part.lineItem.notes || "No additional requirements supplied."}</p></div>
        </div>
      </section> : <p>No parts were saved with this RFQ.</p>}
    </div>
    {unassignedFiles.length ? <section className={styles.shared}><h2>Shared RFQ files</h2><p>These files have no valid saved part association. Review the package before assigning them to a part.</p><div>{unassignedFiles.map(item => <FileLink key={item.id} file={item} />)}</div></section> : null}
    <section className={styles.operations} aria-label="RFQ operations"><div><h2>Operator review</h2><dl><Field label="Review status" value={request.operatorReview.completeness.replaceAll("_", " ")} /></dl>
      {request.operatorReview.internalNotes ? <p className={styles.notes}>{request.operatorReview.internalNotes}</p> : null}{request.operatorReview.supplierPackageNotes ? <p className={styles.notes}>{request.operatorReview.supplierPackageNotes}</p> : null}
      {canQuote ? <div className={styles.actions}><Link href={`${base}&decision=NEEDS_INFO`}>Request information</Link><Link href={`${base}&decision=CLOSED`}>No quote</Link></div> : null}
    </div><div><h2>Supplier evidence</h2>{request.supplierQuoteFiles.length ? <div className={styles.fileList}>{request.supplierQuoteFiles.map(item => <FileLink key={item.id} file={item} />)}</div> : <p>No supplier quote files attached.</p>}
      {request.supplierQuotes.map(item => <p key={item.id}>{item.shopName} · {item.country} · {item.status.replaceAll("_", " ")}</p>)}
    </div></section>
    <details className={styles.audit}><summary>Submission & delivery details</summary><dl><Field label="Last updated" value={timestamp(request.updatedAt)} /><Field label="Submission origin" value={request.requestOrigin} /><Field label="Requester phone" value={request.requesterPhone} /><Field label="Ship-to contact" value={request.shipToName} /><Field label="Ship-to company" value={request.shipToCompany} /><Field label="Ship-to address" value={[request.shipToAddress1, request.shipToAddress2, request.shipToCity, request.shipToState, request.shipToZipCode].filter(Boolean).join(", ")} /><Field label="Restriction policy version" value={request.intakeDeclaration?.policyVersion} /></dl></details>
  </div>;
}
