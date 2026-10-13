import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPrismaClient: vi.fn(), getRequestById: vi.fn() }));
vi.mock("./prisma", () => ({ getPrismaClient: mocks.getPrismaClient }));
vi.mock("./request-repository", () => ({ getRequestById: mocks.getRequestById }));

import type { LatticeRequest } from "./request-model";
import { formatInvoiceNumber, issueInvoiceForRequest } from "./invoice-repository";

const purchasedRequest = {
  id: "req_invoice_test",
  status: "PURCHASED",
  buyerCompany: "Lattice Test Co",
  requesterName: "Test Buyer",
  requesterEmail: "will@latticeos.co",
  requesterPhone: "",
  shipToAddress1: "1 Test St",
  shipToAddress2: "",
  shipToCity: "New York",
  shipToCompany: "Lattice Test Co",
  shipToName: "Test Buyer",
  shipToPhone: "",
  shipToState: "NY",
  shipToZipCode: "10016",
  lineItems: [],
  customerQuotes: [{ quoteNumber: "LQ-TEST", lineItems: [] }],
  quote: { shippingCostCents: 1000, shippingTerms: "DDP" },
  purchasePayment: { status: "PAID", customerPoNumber: "QA-PO-1047", stripe: { amountCents: 11000, paidAt: "2026-10-10T12:00:00.000Z" } },
} as unknown as LatticeRequest;

describe("invoice repository", () => {
  beforeEach(() => {
    mocks.getRequestById.mockReset().mockResolvedValue(purchasedRequest);
  });
  it("formats annual sequential invoice IDs", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-000001");
    expect(formatInvoiceNumber(2026, 42)).toBe("INV-2026-000042");
    expect(formatInvoiceNumber(2027, 1000000)).toBe("INV-2027-1000000");
  });

  it("rejects invalid invoice sequence inputs", () => {
    expect(() => formatInvoiceNumber(1999, 1)).toThrow("Invoice year");
    expect(() => formatInvoiceNumber(2026, 0)).toThrow("Invoice sequence");
  });

  it("copies the card-paid order's PO reference into the issued invoice snapshot", async () => {
    const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      ...data,
      id: "invoice_test",
      invoiceNumber: "INV-2026-000001",
      sequenceYear: 2026,
      sequenceValue: 1,
      status: "PAID" as const,
      requestId: "req_invoice_test",
      issuedAt: new Date("2026-10-10T12:00:00.000Z"),
      dueDate: new Date("2026-10-10T12:00:00.000Z"),
    }));
    mocks.getPrismaClient.mockResolvedValue({
      $transaction: async (operation: (tx: unknown) => Promise<unknown>) => operation({
        invoiceSequence: { upsert: vi.fn().mockResolvedValue({ nextValue: 2, year: 2026 }) },
        invoice: { create },
      }),
    });

    const invoice = await issueInvoiceForRequest("req_invoice_test", { issuedAt: new Date("2026-10-10T12:00:00.000Z") });

    expect(create.mock.calls[0][0].data.customerPo).toBe("QA-PO-1047");
    expect(invoice.customerPo).toBe("QA-PO-1047");
  });
});
