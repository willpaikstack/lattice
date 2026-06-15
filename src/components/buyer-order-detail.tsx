import Link from "next/link";
import { ArrowLeft, CalendarDays, Download, FileText, HelpCircle, ImageIcon, PackageCheck, ReceiptText, RotateCcw, Truck, User } from "lucide-react";
import type { ReactNode } from "react";

import { quotedLineForRequestItem, type LatticeRequest, type RequestLineItem, type SupplierDocumentCategory, type SupplierOrderStatus } from "@/lib/request-model";
import { SupplierQuoteFiles } from "./supplier-quote-files";

type OrderDetailRouteConfig = {
  backHref: string;
  backLabel: string;
  helpHref: string | null;
  invoiceHref: string;
  invoicePreviewHref: string;
  reorderHref: string | null;
  showSupplierQuoteFiles: boolean;
  supplierPurchaseOrderHref: string | null;
  supplierPurchaseOrderPreviewHref: string | null;
  supplierQuoteReturnTo: string;
};

const supplierStatusLabels: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "Awaiting supplier acknowledgment",
  IN_PRODUCTION: "In production",
  QC_IN_PROGRESS: "QC in progress",
  DOCUMENTS_UPLOADED: "Quality documents uploaded",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
};

const supplierStatusTone: Record<SupplierOrderStatus, string> = {
  AWAITING_ACKNOWLEDGMENT: "border-[#cfe0ff] bg-[#eff5ff] text-[#315f9b]",
  IN_PRODUCTION: "border-[#d5d9ff] bg-[#f1f2ff] text-[#4d55a8]",
  QC_IN_PROGRESS: "border-[#f1d8a5] bg-[#fff7e8] text-[#8a5b08]",
  DOCUMENTS_UPLOADED: "border-[#b7ead8] bg-[#ecfbf4] text-[#126448]",
  READY_TO_SHIP: "border-[#b8e5f2] bg-[#effbff] text-[#236477]",
  SHIPPED: "border-[#d7d7d7] bg-[#f4f4f4] text-[#242424]",
};

const documentCategoryLabels: Record<SupplierDocumentCategory, string> = {
  CERTIFICATE_OF_CONFORMANCE: "Certificate of conformance",
  INSPECTION_REPORT: "Inspection report",
  MATERIAL_CERT: "Material cert",
  OTHER: "Other",
  PACKING_SLIP: "Packing slip",
  PHOTO: "Photo",
};

function localDate(value: string | null) {
  if (!value) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return dateOnlyMatch ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])) : new Date(value);
}

function formatDate(value: string | null) {
  const date = localDate(value);

  if (!date || Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    minimumFractionDigits: 2,
    style: "currency",
  }).format(cents / 100);
}

function orderReference(order: LatticeRequest) {
  return `PO-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function paymentMethodLabel(order: LatticeRequest) {
  if (order.purchasePayment.method === "CARD") {
    return "Credit card";
  }

  if (order.purchasePayment.method === "PURCHASE_ORDER") {
    return "Purchase order";
  }

  return "Pending review";
}

function cardPaymentLabel(order: LatticeRequest) {
  const card = order.purchasePayment.card;
  return card ? `${card.brand || "Card"} ending in ${card.last4}` : "Saved card pending";
}

function customerPoReference(order: LatticeRequest) {
  return order.purchasePayment.customerPoNumber || orderReference(order);
}

function supplierQuoteTotalLabel(order: LatticeRequest, selectedSupplier: LatticeRequest["supplierQuotes"][number] | null) {
  if (selectedSupplier?.priceCents !== null && selectedSupplier?.priceCents !== undefined) {
    return formatPrice(selectedSupplier.priceCents);
  }

  const lineTotal = (selectedSupplier?.lineItems ?? []).reduce((sum, item) => sum + item.quantity * item.unitPrice * 100, 0);
  return lineTotal > 0 ? formatPrice(Math.round(lineTotal)) : "Pending";
}

function hasPricedSupplierQuoteLines(selectedSupplier: LatticeRequest["supplierQuotes"][number] | null) {
  const lineItems = selectedSupplier?.lineItems ?? [];
  return lineItems.length > 0 && lineItems.every((item) => item.quantity > 0 && item.unitPrice > 0);
}

function localFileHref(storageKey: string | undefined, name: string) {
  return storageKey ? `/api/local-files/${storageKey.split("/").map(encodeURIComponent).join("/")}?name=${encodeURIComponent(name)}` : null;
}

function CustomerPurchaseOrderFile({ order }: { order: LatticeRequest }) {
  const attachment = order.customerPurchaseOrderAttachment;

  if (order.purchasePayment.method !== "PURCHASE_ORDER") {
    return null;
  }

  if (!attachment) {
    return (
      <p className="rounded-md border border-[#f1d8a5] bg-[#fff7e8] p-4 text-[13px] leading-6 text-[#8a5b08]">
        This order was placed by purchase order, but no PO file is attached yet.
      </p>
    );
  }

  const href = localFileHref(attachment.storageKey, attachment.name);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-[#7b8088]">
          <FileText aria-hidden="true" className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[#202020]">{attachment.name}</p>
          <p className="mt-1 text-[11px] text-[#7b8088]">
            Customer PO {order.purchasePayment.customerPoNumber ? `#${order.purchasePayment.customerPoNumber}` : ""} - {formatFileSize(attachment.sizeBytes)}
          </p>
        </div>
      </div>
      {href ? (
        <Link className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-[#30343a] transition hover:bg-white" href={href}>
          <Download aria-hidden="true" className="h-3.5 w-3.5" />
          Download PO
        </Link>
      ) : null}
    </div>
  );
}

function quoteReference(order: LatticeRequest) {
  return order.customerQuotes.at(-1)?.quoteNumber ?? `LQ-${order.id.replace(/^req_/, "").slice(0, 8).toUpperCase()}`;
}

function lineItemTotalCents(order: LatticeRequest, item: RequestLineItem) {
  const quotedLine = quotedLineForRequestItem(order.customerQuotes.at(-1)?.lineItems, item);

  if (quotedLine) {
    return Math.round(quotedLine.unitPrice * quotedLine.quantity * 100);
  }

  if (order.lineItems.length === 1) {
    return order.customerQuotes.at(-1)?.totalCents ?? order.quote.estimatedPriceCents;
  }

  return null;
}

function deliveryDate(order: LatticeRequest) {
  const date = new Date(order.updatedAt);
  date.setDate(date.getDate() + (order.quote.leadTimeDays ?? 18) + 5);
  return formatDate(date.toISOString());
}

function moneyBreakdown(order: LatticeRequest) {
  const subtotalCents = order.customerQuotes.at(-1)?.totalCents ?? order.quote.estimatedPriceCents;
  const shippingCents = order.quote.shippingCostCents;
  const taxCents = subtotalCents === null ? null : 0;
  const totalCents = subtotalCents === null ? null : subtotalCents + (shippingCents ?? 0) + (taxCents ?? 0);

  return { shippingCents, subtotalCents, taxCents, totalCents };
}

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-[#eeeeee] px-6 py-5">
        <h2 className="text-[16px] font-semibold text-[#202020]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DefinitionRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#6f737a]">{label}</dt>
      <dd className="text-right font-semibold text-[#202020]">{value}</dd>
    </div>
  );
}

export function BuyerOrderDetail({
  order,
  routeConfig,
}: {
  order: LatticeRequest;
  routeConfig?: Partial<OrderDetailRouteConfig>;
}) {
  const routes: OrderDetailRouteConfig = {
    backHref: "/orders",
    backLabel: "Back to orders",
    helpHref: `/orders/${order.id}/help`,
    invoiceHref: `/orders/${order.id}/invoice.pdf`,
    invoicePreviewHref: `/orders/${order.id}/invoice.pdf?preview=1`,
    reorderHref: `/requests/new?reorder=${order.id}`,
    showSupplierQuoteFiles: false,
    supplierPurchaseOrderHref: null,
    supplierPurchaseOrderPreviewHref: null,
    supplierQuoteReturnTo: `/orders/${encodeURIComponent(order.id)}`,
    ...routeConfig,
  };
  const selectedSupplier = order.supplierQuotes.find((quote) => quote.isSelected) ?? order.supplierQuotes.find((quote) => quote.status === "SELECTED") ?? null;
  const structuredSupplierQuoteReady = hasPricedSupplierQuoteLines(selectedSupplier);
  const status = supplierStatusLabels[order.supplierOrder.status];
  const { shippingCents, subtotalCents, taxCents, totalCents } = moneyBreakdown(order);
  const latestQuote = order.customerQuotes.at(-1);
  const trackingNumber = order.supplierOrder.trackingNumber || "Pending shipment";
  const supplierName = order.supplierOrder.shopName || selectedSupplier?.shopName || "Supplier pending";
  const supplierContact = order.supplierOrder.contactName || selectedSupplier?.contactName || "Not recorded";

  return (
    <div className="mx-auto w-full max-w-[1480px] px-2 pb-10">
      <div className="mb-7">
        <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6f737a] transition hover:text-[#171717]" href={routes.backHref}>
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
          {routes.backLabel}
        </Link>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#7a7f87]">{orderReference(order)}</p>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${supplierStatusTone[order.supplierOrder.status]}`}>{status}</span>
              <span className="text-[13px] text-[#7b8088]">Ordered: {formatDate(order.updatedAt)}</span>
            </div>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-normal text-[#171717]">{order.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={routes.invoicePreviewHref}>
              <ReceiptText aria-hidden="true" className="h-4 w-4" />
              View invoice
            </Link>
            <Link className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#171717] px-3 text-[13px] font-semibold text-white transition hover:bg-[#2b2b2b]" href={routes.invoiceHref}>
              <Download aria-hidden="true" className="h-4 w-4" />
              Download invoice
            </Link>
            {routes.supplierPurchaseOrderPreviewHref && structuredSupplierQuoteReady ? (
              <Link className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={routes.supplierPurchaseOrderPreviewHref}>
                <ReceiptText aria-hidden="true" className="h-4 w-4" />
                View supplier PO
              </Link>
            ) : null}
            {routes.supplierPurchaseOrderHref && structuredSupplierQuoteReady ? (
              <Link className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[#171717] px-3 text-[13px] font-semibold text-white transition hover:bg-[#2b2b2b]" href={routes.supplierPurchaseOrderHref}>
                <Download aria-hidden="true" className="h-4 w-4" />
                Download supplier PO
              </Link>
            ) : null}
            {routes.helpHref ? (
              <Link className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={routes.helpHref}>
                <HelpCircle aria-hidden="true" className="h-4 w-4" />
                Help with order
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <main className="space-y-5 xl:col-span-8">
          <section className="rounded-md border border-[#e7e7e7] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { icon: PackageCheck, label: "Order status", value: order.supplierOrder.status === "IN_PRODUCTION" ? "Supplier work underway" : status },
                { icon: CalendarDays, label: "Estimated delivery", value: deliveryDate(order) },
                { icon: Truck, label: "Tracking", value: order.supplierOrder.trackingNumber ? "Tracking assigned" : "Pending shipment" },
                { icon: ReceiptText, label: "Reference quote", value: quoteReference(order) },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4" key={item.label}>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className="mt-3 text-[14px] font-semibold text-[#202020]">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <Section title="Shipment">
            <div className="grid gap-5 p-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98]">Ship to</p>
                <p className="mt-3 text-[14px] font-semibold text-[#202020]">{order.requesterName}</p>
                <p className="mt-1 text-[13px] leading-5 text-[#5f6670]">{order.buyerCompany}<br />123 Main Street<br />Brooklyn, NY 11201</p>
              </div>
              <dl className="space-y-3 text-[13px]">
                <DefinitionRow label="Shipping method" value="Lattice managed landed delivery" />
                <DefinitionRow label="Import terms" value="DDP - Lattice coordinates import" />
                <DefinitionRow label="Carrier" value={order.supplierOrder.status === "SHIPPED" ? "UPS International Priority" : "Pending booking"} />
                <DefinitionRow label="Tracking number" value={trackingNumber} />
                <DefinitionRow label="Supplier" value={supplierName} />
              </dl>
            </div>
          </Section>

          <Section title="Parts and specifications">
            <div className="grid grid-cols-[1.35fr_1.3fr_0.45fr_0.65fr] gap-5 border-b border-[#eeeeee] bg-[#fafafa] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#80858d] max-lg:hidden">
              <span>Name</span>
              <span>Specifications</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
            </div>
            <div className="divide-y divide-[#eeeeee]">
              {order.lineItems.map((item, index) => {
                const file = order.files[index] ?? order.files[0];
                const lineTotal = lineItemTotalCents(order, item);

                return (
                  <article className="grid gap-5 px-6 py-5 lg:grid-cols-[1.35fr_1.3fr_0.45fr_0.65fr] lg:items-start" key={item.id}>
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-[#e7e7e7] bg-[#f7f8fa] text-[#a2a8b0]">
                        <ImageIcon aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-[14px] font-semibold leading-5 text-[#202020]">{item.partName}</h2>
                        <p className="mt-1 truncate text-[12px] font-medium text-[#2f73c8]">{file ? "CAD file reviewed" : "File pending"}</p>
                        {item.qualityDocumentation?.length ? <p className="mt-2 text-[12px] leading-5 text-[#6f737a]">Required docs: {item.qualityDocumentation.join(", ")}</p> : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Specifications</p>
                      <p className="mt-1 text-[13px] leading-5 text-[#30343a] lg:mt-0">
                        {order.process} / {item.material} / {item.generalTolerance || "Tolerance not specified"} / {item.surfaceFinish || "Finish not specified"}
                      </p>
                      {item.notes ? <p className="mt-2 text-[12px] leading-5 text-[#6f737a]">{item.notes}</p> : null}
                    </div>
                    <div className="lg:text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Quantity</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#202020] lg:mt-0">{item.quantity}</p>
                    </div>
                    <div className="lg:text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8f98] lg:hidden">Price</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#202020] lg:mt-0">{formatPrice(lineTotal)}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            {order.purchasePayment.method === "PURCHASE_ORDER" ? (
              <Section title="Customer purchase order">
                <div className="p-5">
                  <CustomerPurchaseOrderFile order={order} />
                </div>
              </Section>
            ) : null}

            <Section title="Order files">
              <div className="space-y-3 p-5">
                {order.files.map((file) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={file.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e5e5e5] bg-white text-[#7b8088]">
                        <FileText aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#202020]">{file.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8f98]">{file.type || "CAD file"}</p>
                      </div>
                    </div>
                    <Download aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8a8f98]" />
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Quality documents and photos">
              <div className="space-y-3 p-5">
                {order.supplierOrder.documents.length ? (
                  order.supplierOrder.documents.map((document) => (
                    <div className="flex items-center justify-between gap-4 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3" key={document.id}>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#202020]">{document.name}</p>
                        <p className="mt-1 text-[11px] text-[#7b8088]">{documentCategoryLabels[document.category]} - {formatDateTime(document.uploadedAt)}</p>
                      </div>
                      <p className="text-[12px] font-semibold text-[#6f737a]">{formatFileSize(document.sizeBytes)}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 text-[13px] leading-6 text-[#6f737a]">Quality documents will appear here after supplier upload.</p>
                )}
              </div>
            </Section>
          </div>

          {routes.showSupplierQuoteFiles ? (
            <SupplierQuoteFiles
              request={order}
              returnTo={routes.supplierQuoteReturnTo}
              uploadHref="/api/supplier-quote-files"
            />
          ) : null}

          <Section title="Order activity">
            <ol className="space-y-3 p-5">
              {order.supplierOrder.updates.length ? (
                order.supplierOrder.updates.map((update) => (
                  <li className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4" key={update.id}>
                    <p className="text-[13px] font-semibold text-[#202020]">{supplierStatusLabels[update.status]}</p>
                    {update.note ? <p className="mt-1 text-[12px] leading-5 text-[#6f737a]">{update.note}</p> : null}
                    <p className="mt-2 text-[11px] text-[#8a8f98]">{formatDateTime(update.createdAt)}{update.trackingNumber ? ` - Tracking ${update.trackingNumber}` : ""}</p>
                  </li>
                ))
              ) : (
                <li className="rounded-md border border-[#eeeeee] bg-[#fafafa] p-4 text-[13px] leading-6 text-[#6f737a]">
                  Material ordered and machining scheduled.
                </li>
              )}
            </ol>
          </Section>
        </main>

        <aside className="space-y-5 xl:col-span-4">
          <section className="rounded-md border border-[#e7e7e7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] xl:sticky xl:top-6">
            <div className="border-b border-[#eeeeee] px-6 py-5">
              <h2 className="text-[16px] font-semibold text-[#202020]">Order summary</h2>
              <p className="mt-1 text-[12px] text-[#7b8088]">{quoteReference(order)} / {customerPoReference(order)}</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              <dl className="space-y-3 text-[13px]">
                <DefinitionRow label="Subtotal" value={formatPrice(subtotalCents)} />
                <DefinitionRow label={`Shipping${order.quote.shippingMethod ? ` (${order.quote.shippingMethod})` : ""}`} value={formatPrice(shippingCents)} />
                <DefinitionRow label="Tax" value={formatPrice(taxCents)} />
                <DefinitionRow label="Duties / tariffs" value="Included" />
              </dl>
              <div className="border-t border-[#eeeeee] pt-4">
                <div className="flex justify-between gap-4">
                  <p className="text-[14px] font-semibold text-[#202020]">Total</p>
                  <p className="text-[22px] font-semibold text-[#171717]">{formatPrice(totalCents)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Link className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-4 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={routes.invoicePreviewHref}>
                  <ReceiptText aria-hidden="true" className="h-4 w-4" />
                  View invoice
                </Link>
                {routes.reorderHref ? (
                  <Link className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#171717] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2b2b2b]" href={routes.reorderHref}>
                    <RotateCcw aria-hidden="true" className="h-4 w-4" />
                    Reorder parts
                  </Link>
                ) : null}
                {routes.helpHref ? (
                  <Link className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-4 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={routes.helpHref}>
                    <HelpCircle aria-hidden="true" className="h-4 w-4" />
                    Help with order
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Billing and payment</p>
              <dl className="mt-4 space-y-3 text-[13px]">
                <DefinitionRow label="Payment method" value={paymentMethodLabel(order)} />
                {order.purchasePayment.method === "CARD" ? <DefinitionRow label="Card" value={cardPaymentLabel(order)} /> : null}
                {order.purchasePayment.method === "PURCHASE_ORDER" ? (
                  <>
                    <DefinitionRow label="PO number" value={customerPoReference(order)} />
                    <DefinitionRow label="AP email" value={order.purchasePayment.accountsPayableEmail || "Pending"} />
                  </>
                ) : null}
                <DefinitionRow label="Ordered by" value={order.requesterName} />
                <DefinitionRow label="Billing address" value={<span>{order.buyerCompany}<br />Brooklyn, NY 11201</span>} />
              </dl>
              {order.customerPurchaseOrderAttachment ? (
                <div className="mt-4 rounded-md border border-[#eeeeee] bg-[#fafafa] p-3">
                  <p className="text-[12px] font-semibold text-[#202020]">{order.customerPurchaseOrderAttachment.name}</p>
                  <p className="mt-1 text-[11px] text-[#7b8088]">{formatFileSize(order.customerPurchaseOrderAttachment.sizeBytes)} - uploaded PO</p>
                  {localFileHref(order.customerPurchaseOrderAttachment.storageKey, order.customerPurchaseOrderAttachment.name) ? (
                    <Link
                      className="mt-3 inline-flex min-h-8 items-center gap-2 rounded-md border border-[#dedede] bg-white px-3 text-[12px] font-semibold text-[#30343a] transition hover:bg-white"
                      href={localFileHref(order.customerPurchaseOrderAttachment.storageKey, order.customerPurchaseOrderAttachment.name) ?? "#"}
                    >
                      <Download aria-hidden="true" className="h-3.5 w-3.5" />
                      Download PO
                    </Link>
                  ) : null}
                </div>
              ) : null}
              {order.purchasePayment.buyerCheckoutNotes ? <p className="mt-4 rounded-md bg-[#fafafa] p-3 text-[12px] leading-5 text-[#5f6670]">{order.purchasePayment.buyerCheckoutNotes}</p> : null}
            </div>

            {routes.supplierPurchaseOrderHref || routes.supplierPurchaseOrderPreviewHref ? (
              <div className="border-t border-[#eeeeee] px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Supplier purchase order</p>
                {structuredSupplierQuoteReady ? (
                  <div className="mt-4 space-y-4">
                    <dl className="space-y-3 text-[13px]">
                      <DefinitionRow label="Selected shop" value={selectedSupplier?.shopName || supplierName} />
                      <DefinitionRow label="Supplier quote total" value={supplierQuoteTotalLabel(order, selectedSupplier)} />
                      <DefinitionRow label="Structured lines" value={`${selectedSupplier?.lineItems.length ?? 0} ready`} />
                    </dl>
                    <div className="grid gap-2">
                      {routes.supplierPurchaseOrderPreviewHref ? (
                        <Link className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-[#dedede] bg-white px-4 text-[13px] font-semibold text-[#30343a] transition hover:bg-[#fafafa]" href={routes.supplierPurchaseOrderPreviewHref}>
                          <ReceiptText aria-hidden="true" className="h-4 w-4" />
                          View supplier PO
                        </Link>
                      ) : null}
                      {routes.supplierPurchaseOrderHref ? (
                        <Link className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#171717] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2b2b2b]" href={routes.supplierPurchaseOrderHref}>
                          <Download aria-hidden="true" className="h-4 w-4" />
                          Download supplier PO
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-[#f1d8a5] bg-[#fff7e8] p-4 text-[13px] leading-6 text-[#8a5b08]">
                    Supplier PO pending structured shop quote. Enter supplier line pricing and lead times before issuing this document.
                  </p>
                )}
              </div>
            ) : null}

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Supplier contact</p>
              <div className="mt-4 flex gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1f2ff] text-[#4d55a8]">
                  <User aria-hidden="true" className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[#202020]">{supplierContact}</p>
                  <p className="mt-1 text-[12px] leading-5 text-[#6f737a]">Selected manufacturing partner</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#6f737a]">{order.supplierOrder.notes || latestQuote?.notes || "Production updates will appear here as the supplier posts progress."}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#eeeeee] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9aa0a9]">Lattice account manager</p>
              <div className="mt-4 rounded-md bg-[#fafafa] p-4 text-[13px] leading-5 text-[#5f6670]">
                <p className="font-semibold text-[#202020]">Erik Mast</p>
                <p className="mt-1">Order help, quality documents, shipping coordination, and supplier follow-up.</p>
                <p className="mt-2 text-[#2f73c8]">erik.mast@latticeos.com</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
