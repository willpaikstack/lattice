import Link from "next/link";

import type { LatticeRequest, SupplierDocumentCategory, SupplierOrderStatus } from "@/lib/request-model";

import { CadFilePreview } from "./cad-file-preview";

const supplierStatusLabels: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "Awaiting supplier acknowledgment",
  IN_PRODUCTION: "In production",
  QC_IN_PROGRESS: "QC in progress",
  DOCUMENTS_UPLOADED: "Quality documents uploaded",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
};

const documentCategoryLabels: Record<SupplierDocumentCategory, string> = {
  INSPECTION_REPORT: "Inspection report",
  MATERIAL_CERT: "Material cert",
  CERTIFICATE_OF_CONFORMANCE: "Certificate of conformance",
  PHOTO: "Photo",
  PACKING_SLIP: "Packing slip",
  OTHER: "Other",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

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

function formatPrice(cents: number | null) {
  if (cents === null) {
    return "Price not recorded";
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function BuyerOrderDetail({ order }: { order: LatticeRequest }) {
  const primaryLine = order.lineItems[0];
  const selectedSupplier = order.supplierQuotes.find((quote) => quote.isSelected) ?? null;

  return (
    <div className="space-y-6">
      <Link className="inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-950" href="/orders">
        Back to orders
      </Link>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Buyer order detail</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{order.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Track supplier fulfillment, shipment readiness, quality documents, and the original RFQ package behind this purchased order.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 lg:min-w-80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Current order state</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{supplierStatusLabels[order.supplierOrder.status]}</p>
            <dl className="mt-4 space-y-2">
              <div className="flex justify-between gap-4">
                <dt>Order value</dt>
                <dd className="font-medium text-slate-950">{formatPrice(order.quote.estimatedPriceCents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Lead time</dt>
                <dd className="font-medium text-slate-950">{order.quote.leadTimeDays ? `${order.quote.leadTimeDays} days` : "Pending"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Due date</dt>
                <dd className="font-medium text-slate-950">{order.dueDate || "TBD"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Fulfillment</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Supplier</dt>
              <dd className="mt-2 font-semibold text-slate-950">{order.supplierOrder.shopName || selectedSupplier?.shopName || "Pending assignment"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Contact</dt>
              <dd className="mt-2 font-semibold text-slate-950">{order.supplierOrder.contactName || selectedSupplier?.contactName || "Not recorded"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Tracking</dt>
              <dd className="mt-2 font-semibold text-slate-950">{order.supplierOrder.trackingNumber || "Pending shipment"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Quality docs</dt>
              <dd className="mt-2 font-semibold text-slate-950">{order.supplierOrder.documents.length}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {order.supplierOrder.notes || order.operatorReview.supplierPackageNotes || "Supplier progress notes will appear here as the order moves through production."}
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Order package</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Buyer</dt>
              <dd className="mt-2 font-semibold text-slate-950">{order.buyerCompany}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Process</dt>
              <dd className="mt-2 font-semibold text-slate-950">{order.process}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Primary part</dt>
              <dd className="mt-2 font-semibold text-slate-950">{primaryLine?.partName ?? "No line item"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Purchased</dt>
              <dd className="mt-2 font-semibold text-slate-950">{formatDate(order.updatedAt)}</dd>
            </div>
          </dl>
          <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {order.quote.summary || "Quote summary will appear here when pricing details are recorded."}
          </p>
        </section>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Line items</p>
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
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">CAD files</p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {order.files.map((file) => (
              <CadFilePreview file={file} key={file.id} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Quality documents</p>
          <div className="mt-5 space-y-3">
            {order.supplierOrder.documents.length ? order.supplierOrder.documents.map((document) => (
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4" key={document.id}>
                <div>
                  <p className="font-semibold text-slate-950">{document.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{documentCategoryLabels[document.category]} - {formatDateTime(document.uploadedAt)}</p>
                </div>
                <p className="text-sm font-medium text-slate-600">{formatFileSize(document.sizeBytes)}</p>
              </div>
            )) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Quality documents will appear here after supplier upload.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Order timeline</p>
        <ol className="mt-5 space-y-4">
          {order.supplierOrder.updates.length ? order.supplierOrder.updates.map((update) => (
            <li className="rounded-2xl bg-slate-50 p-4" key={update.id}>
              <p className="font-semibold text-slate-950">{supplierStatusLabels[update.status]}</p>
              {update.note ? <p className="mt-1 text-sm leading-6 text-slate-600">{update.note}</p> : null}
              <p className="mt-2 text-xs text-slate-500">{formatDateTime(update.createdAt)}{update.trackingNumber ? ` - Tracking ${update.trackingNumber}` : ""}</p>
            </li>
          )) : (
            <li className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">No supplier timeline updates have been posted yet.</li>
          )}
        </ol>
      </section>
    </div>
  );
}
