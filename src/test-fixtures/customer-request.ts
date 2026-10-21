import { quoteTimingPreviewRequest } from "@/lib/quote-timing-preview-fixture";
import type { LatticeRequest } from "@/lib/request-model";

export const privateMarker = "PRIVATE_SUPPLIER_CANARY_20261020";

/** Populated internal records, including unexpected fields on every nested object. */
export function privateRequestFixture(): LatticeRequest {
  const request = quoteTimingPreviewRequest(2, new Date("2026-10-20T12:00:00Z"));
  request.id = "req_privacy";
  request.buyerCompanyId = "company_a";
  request.guestAccessTokenHash = `${privateMarker}_guest_hash`;
  request.qualityApprovedBy = `${privateMarker}_approver`;
  request.complianceReviewedAt = `${privateMarker}_review`;
  request.quote.shippingTerms = "DDP";
  request.quote.quoteValidUntil = "2099-12-31";
  request.customerQuotes[0].validUntil = "2099-12-31";
  request.lineItems[0].notes = "Customer drawing Rev B controls.";
  request.lineItems[0].manufacturingDetails = {
    process: "cnc_milling", customerPartNumber: "CUSTOMER-PART-1", cadRevision: "B", drawingRevision: "B",
    targetDeliveryDate: "2026-12-01", materialKey: "al_6061_t6", finishKey: "as_machined_ra_3_2",
    fileHistory: [{ kind: "drawing", name: "previous-revision.pdf", sizeBytes: 100, type: "application/pdf", storageKey: "rfq/previous-revision.pdf", revision: "A", replacedAt: request.createdAt }],
    cadMetadata: { dimensionsMm: [20, 30, 40], sourceUnit: "mm" }, drawingRequirements: { threads: true },
  };
  request.files[0].storageKey = "rfq/customer-part.step";
  request.operatorReview = { completeness: "COMPLETE", assignedOwner: `${privateMarker}_operator`, internalNotes: `${privateMarker}_internal_note`, supplierPackageNotes: `${privateMarker}_supplier_package` };
  request.supplierQuotes = [{
    id: `${privateMarker}_quote`, shopName: `${privateMarker}_shop`, contactName: `${privateMarker}_contact`, country: `${privateMarker}_country`, status: "SELECTED", isSelected: true,
    priceCents: 123456789, leadTimeDays: 12, notes: `${privateMarker}_supplier_note`, quotedAt: request.createdAt,
    lineItems: [{ id: request.lineItems[0].id, description: `${privateMarker}_description`, drawingRevision: "B", finish: "As machined", inspection: "Inspection report", leadTimeDays: 12, material: "Aluminum", process: "Milling", quantity: 1, supplierNotes: `${privateMarker}_nested_note`, unitPrice: 9876.54321 }],
  }];
  request.supplierQuoteFiles = [{ id: `${privateMarker}_attachment`, name: `${privateMarker}_pricing.pdf`, storageKey: `${privateMarker}/pricing.pdf`, sizeBytes: 400, type: "application/pdf", uploadedAt: request.createdAt }];
  request.supplierOrder = {
    ...request.supplierOrder, status: "SHIPPED", shopName: `${privateMarker}_shop`, contactName: `${privateMarker}_contact`, notes: `${privateMarker}_production_note`,
    trackingNumber: "1Z999AA10123456784", nextMilestone: "Delivery confirmation", nextMilestoneDate: "2026-12-01", responsibleParty: "Lattice",
    documents: [{ id: "quality_doc", name: `${privateMarker}_inspection.pdf`, category: "INSPECTION_REPORT", storageKey: "orders/quality/inspection.pdf", sizeBytes: 200, type: "application/pdf", uploadedAt: request.createdAt }],
    updates: [{ id: "progress_1", status: "SHIPPED", note: `${privateMarker}_update`, trackingNumber: "1Z999AA10123456784", actor: "operator", createdAt: request.createdAt }],
  };
  request.purchasePayment = {
    method: "CARD", status: "PAID", customerPoNumber: "CUSTOMER-PO-1", accountsPayableEmail: "ap@example.test", buyerCheckoutNotes: "Use the receiving entrance.",
    card: { id: `${privateMarker}_card`, brand: "visa", last4: "4242", holder: "Buyer", expires: "12/2030" },
    stripe: { amountCents: 444000, currency: "usd", paidAt: request.createdAt, checkoutSessionId: `${privateMarker}_checkout`, paymentIntentId: `${privateMarker}_payment` },
  };
  request.checkoutDetails = { refundedAmountCents: "1000", pendingRefundAmountCents: "200", failedRefundAmountCents: "0", refundChargeId: `${privateMarker}_charge`, checkoutQuoteVersion: `${privateMarker}_checkout_version` };
  request.billingSnapshot = { address: { name: "Buyer", company: "Preview Manufacturing", address1: "10 Test St", address2: "", city: "New York", state: "NY", zipCode: "10001", phone: "2125550100" }, contact: { email: "ap@example.test", invoiceRoutingNotes: "Include customer PO." } };

  const addUnexpectedFields = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(addUnexpectedFields);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries([...Object.entries(value).map(([key, nested]) => [key, addUnexpectedFields(nested)]), ["futureInternalField", privateMarker]]);
  };
  return addUnexpectedFields(request) as LatticeRequest;
}
