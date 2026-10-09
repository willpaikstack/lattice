"use client";
import { useState, useTransition } from "react";
import { approveOrderQuality } from "@/app/(workspace)/orders/[requestId]/quality-actions";
export function CustomerQualityApproval({ requestId, approvedAt, canApprove }: { requestId: string; approvedAt?: string | null; canApprove: boolean }) {
  const [pending, startTransition] = useTransition(); const [error, setError] = useState("");
  return <section className="rounded-lg border border-blue-200 bg-blue-50 p-5"><h2 className="font-semibold">Quality approval before shipment</h2><p className="my-2 text-sm">{approvedAt ? `Approved ${new Date(approvedAt).toLocaleDateString()}.` : "Shipment is on hold until your Customer Admin reviews the downloadable quality documents and approves them."}</p>{!approvedAt && canApprove && <button disabled={pending} className="rounded-lg bg-stone-950 px-4 py-2 text-sm text-white" onClick={() => startTransition(async () => { setError(""); try { await approveOrderQuality(requestId); } catch (caught) { setError(caught instanceof Error ? caught.message : "Approval could not be saved."); } })}>{pending ? "Saving…" : "Approve reviewed quality documents"}</button>}{error && <p className="mt-2 text-sm text-red-800" role="alert">{error}</p>}</section>;
}
