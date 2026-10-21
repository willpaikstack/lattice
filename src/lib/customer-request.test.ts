import { describe, expect, it } from "vitest";
import { privateMarker, privateRequestFixture } from "@/test-fixtures/customer-request";
import { customerSafeRequest } from "./customer-request";

describe("customer request payload contract", () => {
  it("excludes supplier pricing, notes, attachments, credentials and unapproved nested fields", () => {
    const source = privateRequestFixture();
    const before = JSON.stringify(source);
    const customer = customerSafeRequest(source);

    expect(JSON.stringify(customer)).not.toContain(privateMarker);
    expect(customer).not.toHaveProperty("supplierQuotes");
    expect(customer).not.toHaveProperty("supplierQuoteFiles");
    expect(customer).not.toHaveProperty("guestAccessTokenHash");
    expect(customer).not.toHaveProperty("guestAccessTokenExpiresAt");
    expect(customer).not.toHaveProperty("qualityApprovedBy");
    expect(customer.operatorReview).not.toHaveProperty("assignedOwner");
    expect(customer.operatorReview).not.toHaveProperty("supplierPackageNotes");
    expect(customer.purchasePayment.stripe).not.toHaveProperty("checkoutSessionId");
    expect(customer.purchasePayment.stripe).not.toHaveProperty("paymentIntentId");
    expect(customer.purchasePayment.card).not.toHaveProperty("id");
    expect(JSON.stringify(customer)).not.toContain("123456789");
    expect(JSON.stringify(customer)).not.toContain("9876.54321");
    expect(JSON.stringify(source)).toBe(before);
    expect(source.supplierQuotes[0].lineItems[0].supplierNotes).toContain(privateMarker);
  });

  it("preserves customer commercial values, files, revisions, billing, refunds and quality downloads", () => {
    const source = privateRequestFixture();
    const customer = customerSafeRequest(source);
    expect(customer.customerQuotes[0].lineItems[0].unitPrice).toBe(source.customerQuotes[0].lineItems[0].unitPrice);
    expect(customer.customerQuotes[0].totalCents).toBe(source.customerQuotes[0].totalCents);
    expect(customer.files[0].storageKey).toBe("rfq/customer-part.step");
    expect(customer.lineItems[0].manufacturingDetails).toMatchObject({ customerPartNumber: "CUSTOMER-PART-1", cadRevision: "B", drawingRevision: "B", drawingRequirements: { threads: true }, cadMetadata: { dimensionsMm: [20, 30, 40] } });
    expect(customer.billingSnapshot?.contact.email).toBe("ap@example.test");
    expect(customer.purchasePayment).toMatchObject({ customerPoNumber: "CUSTOMER-PO-1", stripe: { amountCents: 444000 }, card: { last4: "4242" } });
    expect(customer.checkoutDetails).toEqual({ refundedAmountCents: "1000", pendingRefundAmountCents: "200", failedRefundAmountCents: "0" });
    expect(customer.supplierOrder.documents[0]).toMatchObject({ name: "Inspection report", storageKey: "orders/quality/inspection.pdf", sizeBytes: 200 });
    expect(customer.supplierOrder.trackingNumber).toBe("1Z999AA10123456784");
  });

  it.each(["NEEDS_INFO", "CLOSED"] as const)("retains the explicit customer-facing decision for %s", status => {
    const source = privateRequestFixture();
    source.status = status;
    source.operatorReview.internalNotes = "Please confirm the drawing revision.";
    expect(customerSafeRequest(source).operatorReview.internalNotes).toBe("Please confirm the drawing revision.");
  });

  it.each(["DRAFT", "SUBMITTED", "READY_FOR_SUPPLIER_RFQ", "QUOTED", "PURCHASED"] as const)("withholds operator notes for %s", status => {
    const source = privateRequestFixture();
    source.status = status;
    expect(customerSafeRequest(source).operatorReview.internalNotes).toBe("");
  });
});
