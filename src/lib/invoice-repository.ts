import { getPrismaClient } from "./prisma";
import type { LatticeRequest } from "./request-model";
import { requestShipToLines } from "./request-model";
import { getRequestById } from "./request-repository";

const defaultPaymentTerms = "100% Payment in Advance";
const defaultSalesTaxRate = 0.0825;

/** @public Retained for future durable invoice lifecycle records. */
export type IssuedInvoiceStatus = "ISSUED" | "PAID" | "VOID";

/** @public Retained for future durable invoice lifecycle records. */
export type IssuedInvoice = {
  id: string;
  invoiceNumber: string;
  sequenceYear: number;
  sequenceValue: number;
  status: IssuedInvoiceStatus;
  requestId: string | null;
  customerCompany: string;
  customerContact: string;
  customerPo: string;
  quoteNumber: string;
  paymentTerms: string;
  shippingTerms: string;
  subtotalCents: number;
  shippingCents: number;
  salesTaxCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  issuedAt: string;
  dueDate: string;
};

type StoredInvoice = {
  id: string;
  invoiceNumber: string;
  sequenceYear: number;
  sequenceValue: number;
  status: IssuedInvoiceStatus;
  requestId: string | null;
  customerCompany: string;
  customerContact: string;
  customerPo: string;
  quoteNumber: string;
  paymentTerms: string;
  shippingTerms: string;
  subtotalCents: number;
  shippingCents: number;
  salesTaxCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  issuedAt: Date;
  dueDate: Date | null;
};

type InvoiceTransactionClient = {
  invoiceSequence: {
    upsert: (args: unknown) => Promise<{ nextValue: number; year: number }>;
  };
  invoice: {
    create: (args: unknown) => Promise<StoredInvoice>;
  };
};

type InvoicePrismaClient = {
  $transaction: <T>(operation: (tx: InvoiceTransactionClient) => Promise<T>) => Promise<T>;
};

export function formatInvoiceNumber(year: number, sequenceValue: number) {
  if (!Number.isInteger(year) || year < 2000) {
    throw new Error("Invoice year must be a valid four-digit year");
  }

  if (!Number.isInteger(sequenceValue) || sequenceValue < 1) {
    throw new Error("Invoice sequence value must be a positive integer");
  }

  return `INV-${year}-${String(sequenceValue).padStart(6, "0")}`;
}

function cents(value: number) {
  return Math.round(value * 100);
}

function issueYear(issuedAt: Date) {
  return issuedAt.getFullYear();
}

function serializeDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function mapStoredInvoice(invoice: StoredInvoice): IssuedInvoice {
  return {
    amountDueCents: invoice.amountDueCents,
    amountPaidCents: invoice.amountPaidCents,
    customerCompany: invoice.customerCompany,
    customerContact: invoice.customerContact,
    customerPo: invoice.customerPo,
    dueDate: serializeDate(invoice.dueDate),
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt.toISOString(),
    paymentTerms: invoice.paymentTerms,
    quoteNumber: invoice.quoteNumber,
    requestId: invoice.requestId,
    salesTaxCents: invoice.salesTaxCents,
    sequenceValue: invoice.sequenceValue,
    sequenceYear: invoice.sequenceYear,
    shippingCents: invoice.shippingCents,
    shippingTerms: invoice.shippingTerms,
    status: invoice.status,
    subtotalCents: invoice.subtotalCents,
  };
}

function invoiceLineItems(request: LatticeRequest) {
  const latestQuote = request.customerQuotes.at(-1);
  const quotedLines = latestQuote?.lineItems ?? [];

  if (quotedLines.length) {
    return quotedLines.map((line) => {
      const quantity = line.quantity || 0;
      const amountCents = cents(quantity * line.unitPrice);

      return {
        amountCents,
        description: line.description,
        item: line.description,
        material: line.material,
        process: line.process,
        quantity,
        unitPriceCents: cents(line.unitPrice),
      };
    });
  }

  return request.lineItems.map((line) => ({
    amountCents: 0,
    description: line.partName,
    item: line.partName,
    material: line.material,
    process: request.process,
    quantity: line.quantity,
    unitPriceCents: 0,
  }));
}

function invoiceSnapshotForRequest(request: LatticeRequest) {
  const latestQuote = request.customerQuotes.at(-1);
  const lineItems = invoiceLineItems(request);
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.amountCents, 0);
  const shippingCents = request.quote.shippingCostCents ?? 0;
  const salesTaxCents = Math.round(subtotalCents * defaultSalesTaxRate);
  const amountPaidCents = 0;
  const amountDueCents = subtotalCents + shippingCents + salesTaxCents - amountPaidCents;

  return {
    amountDueCents,
    amountPaidCents,
    billToSnapshot: [request.requesterName, request.buyerCompany, request.requesterEmail, request.requesterPhone].filter(Boolean),
    customerCompany: request.buyerCompany,
    customerContact: request.requesterName,
    quoteNumber: latestQuote?.quoteNumber ?? "",
    lineItemsSnapshot: lineItems,
    paymentTerms: defaultPaymentTerms,
    salesTaxCents,
    shipToSnapshot: requestShipToLines({
      shipToAddress1: request.shipToAddress1,
      shipToAddress2: request.shipToAddress2,
      shipToCity: request.shipToCity,
      shipToCompany: request.shipToCompany || request.buyerCompany,
      shipToName: request.shipToName || request.requesterName,
      shipToPhone: request.shipToPhone || request.requesterPhone,
      shipToState: request.shipToState,
      shipToZipCode: request.shipToZipCode,
    }),
    shippingCents,
    shippingTerms: request.quote.shippingTerms,
    subtotalCents,
  };
}

async function prisma() {
  return (await getPrismaClient()) as InvoicePrismaClient;
}

/** @public Issues a durable invoice snapshot for a purchased request. */
export async function issueInvoiceForRequest(
  requestId: string,
  input: {
    customerPo?: string;
    dueDate?: string;
    issuedAt?: Date;
    quoteNumber?: string;
    shippingTerms?: string;
  } = {},
) {
  const request = await getRequestById(requestId);

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== "PURCHASED") {
    throw new Error("Invoices can only be issued for purchased orders");
  }

  const issuedAt = input.issuedAt ?? new Date();
  const sequenceYear = issueYear(issuedAt);
  const dueDate = input.dueDate ? new Date(`${input.dueDate}T00:00:00.000Z`) : issuedAt;
  const snapshot = invoiceSnapshotForRequest(request);
  const client = await prisma();

  const invoice = await client.$transaction(async (tx) => {
    const sequence = await tx.invoiceSequence.upsert({
      create: {
        nextValue: 2,
        year: sequenceYear,
      },
      update: {
        nextValue: {
          increment: 1,
        },
      },
      where: {
        year: sequenceYear,
      },
    });
    const sequenceValue = sequence.nextValue - 1;

    return tx.invoice.create({
      data: {
        ...snapshot,
        customerPo: input.customerPo?.trim() ?? "",
        dueDate,
        invoiceNumber: formatInvoiceNumber(sequenceYear, sequenceValue),
        issuedAt,
        quoteNumber: input.quoteNumber?.trim() ?? snapshot.quoteNumber,
        requestId,
        sequenceValue,
        sequenceYear,
        shippingTerms: input.shippingTerms?.trim() ?? snapshot.shippingTerms,
        status: "ISSUED",
      },
    });
  });

  return mapStoredInvoice(invoice);
}
