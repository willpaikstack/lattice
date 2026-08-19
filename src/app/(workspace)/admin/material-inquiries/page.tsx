import Link from "next/link";

import { listMaterialInquiries, type MaterialInquiryStatus } from "@/lib/material-inquiries";
import { updateMaterialInquiryAction } from "./actions";

export const dynamic = "force-dynamic";

const statusLabels: Record<MaterialInquiryStatus, string> = {
  NEW: "New",
  REVIEWING: "Reviewing",
  RESOLVED: "Resolved",
};

const statusStyles: Record<MaterialInquiryStatus, string> = {
  NEW: "border-[#f2c8cb] bg-[#fff1f2] text-[#9f2f39]",
  REVIEWING: "border-[#d9cfae] bg-[#fff9e8] text-[#765f19]",
  RESOLVED: "border-[#cbdccb] bg-[#f1f7f1] text-[#43644a]",
};

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminMaterialInquiriesPage() {
  const inquiries = await listMaterialInquiries();
  const openCount = inquiries.filter((inquiry) => inquiry.status !== "RESOLVED").length;

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-[#e6e6e6] bg-[#f8fafc] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Admin</p>
            <h1 className="mt-2 text-[34px] font-semibold leading-tight tracking-tight text-[#171717]">Material inquiries</h1>
            <p className="mt-2 max-w-3xl text-[15px] leading-6 text-[#5f6673]">
              Review customer requests for materials that are not yet represented in the catalog, capture sourcing notes, and close the loop after supplier validation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-[#e6e6e6] bg-white px-3 py-2 text-[13px] font-medium text-[#555b65]">{openCount} open</span>
            <Link className="rounded-md bg-[#171717] px-4 py-2 text-center text-sm font-semibold text-white" href="/materials">
              View catalog
            </Link>
          </div>
        </div>
      </section>

      {inquiries.length === 0 ? (
        <section className="rounded-md border border-dashed border-[#d8d8d8] bg-white px-6 py-14 text-center">
          <h2 className="text-[18px] font-semibold text-[#292929]">No material inquiries yet</h2>
          <p className="mt-2 text-[14px] text-[#70757d]">New submissions from the materials catalog will appear here.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const updateAction = updateMaterialInquiryAction.bind(null, inquiry.id);

            return (
              <article className="rounded-md border border-[#e5e5e5] bg-white p-5" key={inquiry.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[20px] font-semibold text-[#232323]">{inquiry.materialName}</h2>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[inquiry.status]}`}>{statusLabels[inquiry.status]}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#6b7078]">{inquiry.specification || "No specification provided"}</p>
                    <p className="mt-3 text-[13px] text-[#4e535b]">{inquiry.requesterName} · {inquiry.company} · {inquiry.requesterEmail}</p>
                    <p className="mt-1 text-[12px] text-[#8a8e95]">Submitted {dateFormatter.format(new Date(inquiry.createdAt))}</p>
                  </div>

                  <dl className="grid min-w-0 gap-3 text-[13px] sm:grid-cols-2 lg:min-w-[360px]">
                    <div><dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8e95]">Stock form</dt><dd className="mt-1 text-[#454950]">{inquiry.stockForm || "Not specified"}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8e95]">Quantity</dt><dd className="mt-1 text-[#454950]">{inquiry.quantity || "Not specified"}</dd></div>
                  </dl>
                </div>

                <div className="mt-5 grid gap-4 border-t border-[#ececec] pt-4 lg:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8e95]">Application and requirements</p>
                    <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#4f545c]">{inquiry.intendedUse}</p>
                    {inquiry.notes ? <><p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8a8e95]">Additional notes</p><p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-[#4f545c]">{inquiry.notes}</p></> : null}
                  </div>

                  <form action={updateAction} className="rounded-md border border-[#e4e4e4] bg-[#fafafa] p-4" key={`${inquiry.id}-${inquiry.status}-${inquiry.updatedAt}`}>
                    <label className="text-[12px] font-semibold text-[#555b65]" htmlFor={`status-${inquiry.id}`}>Workflow status</label>
                    <select className="mt-2 h-10 w-full rounded-md border border-[#d8d8d8] bg-white px-3 text-[13px] text-[#33363b]" defaultValue={inquiry.status} id={`status-${inquiry.id}`} name="status">
                      <option value="NEW">New</option>
                      <option value="REVIEWING">Reviewing</option>
                      <option value="RESOLVED">Resolved</option>
                    </select>

                    <label className="mt-4 block text-[12px] font-semibold text-[#555b65]" htmlFor={`notes-${inquiry.id}`}>Internal sourcing notes</label>
                    <textarea className="mt-2 min-h-24 w-full resize-y rounded-md border border-[#d8d8d8] bg-white px-3 py-2 text-[13px] text-[#33363b]" defaultValue={inquiry.operatorNotes} id={`notes-${inquiry.id}`} name="operatorNotes" placeholder="Supplier checks, alternatives, documentation requirements, and follow-up." />

                    <button className="mt-4 h-10 rounded-md bg-[#171717] px-4 text-[13px] font-semibold text-white" type="submit">Save review</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
