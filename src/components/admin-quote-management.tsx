import Link from "next/link";

import type { LatticeRequest, SupplierQuoteStatus } from "@/lib/request-model";

const statusLabels: Record<LatticeRequest["status"], string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  NEEDS_INFO: "Needs info",
  READY_FOR_SUPPLIER_RFQ: "Supplier ready",
  QUOTED: "Quoted",
  PURCHASED: "Purchased",
};

const supplierQuoteLabels: Record<SupplierQuoteStatus, string> = {
  INVITED: "Invited",
  QUOTE_RECEIVED: "Quote received",
  DECLINED: "Declined",
  SELECTED: "Selected",
};

function formatCurrency(cents: number | null) {
  if (cents === null) {
    return "Pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(cents / 100);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function quoteStage(request: LatticeRequest) {
  if (request.status === "QUOTED" || request.status === "PURCHASED") {
    return "Buyer quote issued";
  }

  if (request.status === "READY_FOR_SUPPLIER_RFQ") {
    return "Ready for shop outreach";
  }

  if (request.status === "NEEDS_INFO") {
    return "Blocked on customer info";
  }

  return "Internal review";
}

function receivedSupplierQuotes(request: LatticeRequest) {
  return request.supplierQuotes.filter((quote) => quote.status === "QUOTE_RECEIVED" || quote.status === "SELECTED");
}

export function AdminQuoteManagement({ requests }: { requests: LatticeRequest[] }) {
  const quoteRequests = requests.filter((request) => request.status !== "DRAFT" && request.status !== "PURCHASED");
  const activeSupplierQuotes = quoteRequests.reduce((count, request) => count + receivedSupplierQuotes(request).length, 0);
  const quotedValueCents = quoteRequests.reduce((sum, request) => sum + (request.quote.estimatedPriceCents ?? 0), 0);
  const blockedRequests = quoteRequests.filter((request) => request.status === "NEEDS_INFO").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Active submissions</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{quoteRequests.length}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Shop quotes</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{activeSupplierQuotes}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Blocked</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{blockedRequests}</p>
        </article>
        <article className="rounded-md border border-[#e7e7e7] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Quoted value</p>
          <p className="mt-3 text-[30px] font-semibold leading-none text-[#171717]">{formatCurrency(quotedValueCents)}</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-md border border-[#e6e6e6] bg-white">
        <div className="border-b border-[#eeeeee] px-5 py-4">
          <h2 className="text-[19px] font-semibold tracking-tight text-[#202020]">Quote submissions</h2>
          <p className="mt-1 text-[14px] leading-5 text-[#707782]">
            Each row ties the customer request to the overseas shops being asked to quote it.
          </p>
        </div>
        {quoteRequests.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[15px] font-semibold text-[#202020]">No active quote submissions</p>
            <p className="mt-2 text-[14px] text-[#707782]">Submitted RFQs will appear here once customers request quotes.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#eeeeee]">
            {quoteRequests.map((request) => {
              const primaryLine = request.lineItems[0];
              const supplierQuotes = request.supplierQuotes;

              return (
                <article className="grid gap-5 p-5 xl:grid-cols-[1fr_1fr_0.72fr]" key={request.id}>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-semibold text-slate-700">
                        {statusLabels[request.status]}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-700">
                        {quoteStage(request)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[17px] font-semibold text-[#202020]">
                      <Link className="transition hover:text-blue-700" href={`/operator/requests/${request.id}`}>
                        {request.title}
                      </Link>
                    </h3>
                    <p className="mt-1 text-[14px] text-[#4b5563]">
                      Customer: <span className="font-semibold text-[#202020]">{request.buyerCompany}</span>
                    </p>
                    <p className="mt-1 text-[13px] text-[#707782]">
                      {request.requesterName} - {primaryLine?.partName ?? "No line item"} - {request.process}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {supplierQuotes.length ? (
                      supplierQuotes.map((quote) => (
                        <div className="rounded-md border border-[#eeeeee] bg-[#f8fafc] p-3" key={quote.id}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-[14px] font-semibold text-[#202020]">{quote.shopName}</p>
                              <p className="mt-1 text-[12px] text-[#707782]">
                                {quote.country} - {quote.contactName || "No contact yet"}
                              </p>
                            </div>
                            <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[#4b5563]">
                              {supplierQuoteLabels[quote.status]}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-[13px] text-[#4b5563] sm:grid-cols-3">
                            <span>{formatCurrency(quote.priceCents)}</span>
                            <span>{quote.leadTimeDays ? `${quote.leadTimeDays} days` : "Lead time pending"}</span>
                            <span>{formatDate(quote.quotedAt)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-md border border-dashed border-[#d7d7d7] bg-[#fafafa] p-3 text-[14px] leading-6 text-[#707782]">
                        No overseas shop quotes recorded yet.
                      </p>
                    )}
                  </div>

                  <div className="rounded-md border border-[#eeeeee] bg-white p-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#737b86]">Buyer quote</p>
                    <p className="mt-3 text-[22px] font-semibold text-[#171717]">{formatCurrency(request.quote.estimatedPriceCents)}</p>
                    <p className="mt-1 text-[13px] text-[#707782]">
                      {request.quote.leadTimeDays ? `${request.quote.leadTimeDays} day lead time` : "Lead time pending"}
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <Link className="rounded-md bg-[#171717] px-3 py-2 text-center text-sm font-semibold text-white" href={`/operator/requests/${request.id}`}>
                        Manage RFQ
                      </Link>
                      <Link className="rounded-md border border-[#d7d7d7] bg-white px-3 py-2 text-center text-sm font-semibold text-[#262626]" href={`/quotes/${request.id}`}>
                        Buyer quote
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
