import Link from "next/link";

import type { LatticeRequest, SupplierDocumentCategory, SupplierOrderStatus } from "@/lib/request-model";

const statusOptions: Array<{ value: SupplierOrderStatus; label: string; selectLabel?: string }> = [
  { value: "AWAITING_ACKNOWLEDGMENT", label: "Awaiting acknowledgment", selectLabel: "Awaiting ack" },
  { value: "IN_PRODUCTION", label: "In production" },
  { value: "QC_IN_PROGRESS", label: "QC in progress" },
  { value: "DOCUMENTS_UPLOADED", label: "Documents uploaded" },
  { value: "READY_TO_SHIP", label: "Ready to ship" },
  { value: "SHIPPED", label: "Shipped" },
];

const documentCategoryOptions: Array<{ value: SupplierDocumentCategory; label: string }> = [
  { value: "INSPECTION_REPORT", label: "Inspection report" },
  { value: "MATERIAL_CERT", label: "Material cert" },
  { value: "CERTIFICATE_OF_CONFORMANCE", label: "Certificate of conformance" },
  { value: "PHOTO", label: "Photo" },
  { value: "PACKING_SLIP", label: "Packing slip" },
  { value: "OTHER", label: "Other" },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatCategory(value: SupplierDocumentCategory) {
  return documentCategoryOptions.find((option) => option.value === value)?.label ?? "Other";
}

function formatStatus(value: SupplierOrderStatus) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

export function SupplierOrderDetail({
  order,
  updateAction,
}: {
  order: LatticeRequest;
  updateAction?: (formData: FormData) => void | Promise<void>;
}) {
  const primaryLine = order.lineItems[0];

  return (
    <div className="space-y-6">
      <Link className="inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-950" href="/supplier/orders">
        Back to supplier orders
      </Link>

      <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Supplier portal</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{order.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Receive the production package, keep Lattice updated on manufacturing progress, and upload quality documents before shipment.
            </p>
          </div>
          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600 xl:min-w-80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Order status</p>
            <p className="mt-3 text-xl font-semibold text-slate-950">{formatStatus(order.supplierOrder.status)}</p>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between gap-4">
                <dt>Due date</dt>
                <dd className="font-medium text-slate-950">{order.dueDate || "TBD"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Tracking</dt>
                <dd className="font-medium text-slate-950">{order.supplierOrder.trackingNumber || "Pending"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Documents</dt>
                <dd className="font-medium text-slate-950">{order.supplierOrder.documents.length}</dd>
              </div>
            </dl>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100" href={`/supplier/orders/${order.id}/invoice.pdf?preview=1`}>
                View invoice
              </Link>
              <Link className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800" href={`/supplier/orders/${order.id}/invoice.pdf`}>
                Download invoice
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Update production</p>
          <form action={updateAction} className="mt-5 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Shop name
                <input className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={order.supplierOrder.shopName} name="shopName" />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Contact name
                <input className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={order.supplierOrder.contactName} name="contactName" placeholder="Production contact" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Production status
                <select className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={order.supplierOrder.status} name="status">
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.selectLabel ?? option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Tracking number
                <input className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={order.supplierOrder.trackingNumber} name="trackingNumber" placeholder="Add once shipped" />
              </label>
            </div>
            <label className="block space-y-2 text-sm font-semibold text-slate-700">
              Status note
              <textarea className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue={order.supplierOrder.notes} name="notes" placeholder="Production progress, QC findings, shipment timing, or issues requiring Lattice review." />
            </label>
            <div className="grid gap-4 md:grid-cols-[0.7fr_1fr]">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Document type
                <select className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" defaultValue="INSPECTION_REPORT" name="documentCategory">
                  {documentCategoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Upload files
                <input className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" multiple name="documents" type="file" />
              </label>
            </div>
            <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={!updateAction} type="submit">
              Save supplier update
            </button>
          </form>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Order package</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Buyer</p>
              <p className="mt-2 font-semibold text-slate-950">{order.buyerCompany}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Process</p>
              <p className="mt-2 font-semibold text-slate-950">{order.process}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Primary part</p>
              <p className="mt-2 font-semibold text-slate-950">{primaryLine?.partName ?? "No line item"}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Quantity</p>
              <p className="mt-2 font-semibold text-slate-950">{primaryLine?.quantity ?? 0}</p>
            </div>
          </div>
          <div className="mt-5 rounded-md bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Lattice package notes</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{order.operatorReview.supplierPackageNotes || "No supplier package notes have been added yet."}</p>
          </div>
          <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Customer invoice</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Render the placed-order invoice from the accepted quote, line items, shipping, tax, bill-to, and ship-to snapshot.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="inline-flex min-h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" href={`/supplier/orders/${order.id}/invoice.pdf?preview=1`}>
                Preview PDF
              </Link>
              <Link className="inline-flex min-h-9 items-center justify-center rounded-md bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800" href={`/supplier/orders/${order.id}/invoice.pdf`}>
                Download PDF
              </Link>
            </div>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Line items</p>
        </div>
        <div className="divide-y divide-slate-100">
          {order.lineItems.map((item) => (
            <article className="grid gap-3 p-5 md:grid-cols-[1fr_0.35fr_0.7fr_0.7fr_0.8fr] md:items-center" key={item.id}>
              <div>
                <p className="font-semibold text-slate-950">{item.partName}</p>
                {item.notes ? <p className="mt-1 text-sm text-slate-500">{item.notes}</p> : null}
                {item.qualityDocumentation?.length ? <p className="mt-1 text-xs text-slate-500">Required docs: {item.qualityDocumentation.join(", ")}</p> : null}
              </div>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Qty:</span> {item.quantity}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Material:</span> {item.material}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Tolerance:</span> {item.generalTolerance || "Not specified"}</p>
              <p className="text-sm text-slate-600"><span className="font-medium text-slate-950">Finish:</span> {item.surfaceFinish || "Not specified"}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Quality documents</p>
          <div className="mt-5 space-y-3">
            {order.supplierOrder.documents.length ? order.supplierOrder.documents.map((document) => (
              <div className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-4" key={document.id}>
                <div>
                  <p className="font-semibold text-slate-950">{document.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatCategory(document.category)} - {formatDateTime(document.uploadedAt)}</p>
                </div>
                <p className="text-sm font-medium text-slate-600">{formatFileSize(document.sizeBytes)}</p>
              </div>
            )) : (
              <p className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">No quality documents uploaded yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Supplier timeline</p>
          <ol className="mt-5 space-y-4">
            {order.supplierOrder.updates.length ? order.supplierOrder.updates.map((update) => (
              <li className="rounded-md bg-slate-50 p-4" key={update.id}>
                <p className="font-semibold text-slate-950">{formatStatus(update.status)}</p>
                {update.note ? <p className="mt-1 text-sm leading-6 text-slate-600">{update.note}</p> : null}
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(update.createdAt)}{update.trackingNumber ? ` - Tracking ${update.trackingNumber}` : ""}</p>
              </li>
            )) : (
              <li className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">No supplier updates recorded yet.</li>
            )}
          </ol>
        </section>
      </div>
    </div>
  );
}
