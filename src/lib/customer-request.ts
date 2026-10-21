import "server-only";

import { customerDocumentName, customerPartnerPrivacy } from "./customer-partner-privacy";
import { readRequestBillingSnapshot } from "./request-billing";
import { readIntakeDeclaration, readManufacturingDetails } from "./rfq-manufacturing";
import type { LatticeRequest, PurchasePaymentSnapshot, UploadedFile } from "./request-model";

/** The customer browser contract. Internal request fields are deliberately absent. */
export type CustomerRequest = Pick<LatticeRequest,
  | "id" | "buyerCompany" | "buyerCompanyId" | "billingSnapshot" | "requestOrigin"
  | "requesterEmail" | "requesterName" | "requesterPhone"
  | "shipToAddress1" | "shipToAddress2" | "shipToCity" | "shipToCompany" | "shipToName" | "shipToPhone" | "shipToState" | "shipToZipCode"
  | "title" | "intakeDeclaration" | "process" | "dueDate" | "status"
  | "requiresQualityApproval" | "qualityApprovedAt" | "complianceReviewRequired"
  | "lineItems" | "files" | "supplierOrder" | "customerPurchaseOrderAttachment" | "customerQuotes"
  | "checkoutDetails" | "isArchived" | "quote" | "revisionOfRequestId" | "revisionNumber" | "revisionChangeLog"
  | "statusEvents" | "createdAt" | "updatedAt"
> & {
  // The legacy internalNotes field also holds the explicitly customer-facing
  // request-info/no-quote message. Other operator review fields stay server-side.
  operatorReview: Pick<LatticeRequest["operatorReview"], "completeness" | "internalNotes">;
  purchasePayment: Pick<PurchasePaymentSnapshot, "method" | "status" | "customerPoNumber" | "accountsPayableEmail" | "buyerCheckoutNotes"> & {
    card: Omit<NonNullable<PurchasePaymentSnapshot["card"]>, "id"> | null;
    stripe: Pick<PurchasePaymentSnapshot["stripe"], "amountCents" | "currency" | "paidAt">;
  };
};

function customerFile(file: UploadedFile): UploadedFile {
  return { id: file.id, name: file.name, sizeBytes: file.sizeBytes, type: file.type,
    storageKey: file.storageKey, cadPreviewUrn: file.cadPreviewUrn, lineItemIndex: file.lineItemIndex };
}

/**
 * Project only approved fields before serializing RSC props or customer JSON.
 * Never spread a stored request or its nested objects: new internal fields must
 * remain private by default. Authorization must run before this projection.
 */
export function customerSafeRequest(request: LatticeRequest): CustomerRequest {
  const payment = request.purchasePayment;
  const order = request.supplierOrder;
  const quote = request.quote;
  const checkoutDetails: Record<string, string> = {};
  for (const key of ["refundedAmountCents", "pendingRefundAmountCents", "failedRefundAmountCents"] as const) {
    const value = request.checkoutDetails?.[key];
    if (typeof value === "string") checkoutDetails[key] = value;
  }
  return {
    id: request.id, buyerCompany: request.buyerCompany, buyerCompanyId: request.buyerCompanyId,
    billingSnapshot: readRequestBillingSnapshot(request.billingSnapshot), requestOrigin: request.requestOrigin,
    requesterEmail: request.requesterEmail, requesterName: request.requesterName, requesterPhone: request.requesterPhone,
    shipToAddress1: request.shipToAddress1, shipToAddress2: request.shipToAddress2, shipToCity: request.shipToCity,
    shipToCompany: request.shipToCompany, shipToName: request.shipToName, shipToPhone: request.shipToPhone,
    shipToState: request.shipToState, shipToZipCode: request.shipToZipCode,
    title: request.title, intakeDeclaration: readIntakeDeclaration(request.intakeDeclaration), process: request.process, dueDate: request.dueDate,
    status: request.status, requiresQualityApproval: request.requiresQualityApproval, qualityApprovedAt: request.qualityApprovedAt,
    complianceReviewRequired: request.complianceReviewRequired,
    lineItems: request.lineItems.map(item => ({
      id: item.id, partName: item.partName, quantity: item.quantity, material: item.material,
      generalTolerance: item.generalTolerance, surfaceFinish: item.surfaceFinish,
      qualityDocumentation: item.qualityDocumentation?.map(value => value), notes: item.notes,
      manufacturingDetails: readManufacturingDetails(item.manufacturingDetails),
    })),
    files: request.files.map(customerFile),
    operatorReview: {
      completeness: request.operatorReview.completeness,
      internalNotes: ["NEEDS_INFO", "CLOSED"].includes(request.status) ? request.operatorReview.internalNotes : "",
    },
    supplierOrder: {
      status: order.status, shopName: customerPartnerPrivacy.networkLabel, contactName: customerPartnerPrivacy.partnerLabel,
      notes: customerPartnerPrivacy.progressUpdate, trackingNumber: order.trackingNumber,
      nextMilestone: order.nextMilestone, nextMilestoneDate: order.nextMilestoneDate, responsibleParty: order.responsibleParty,
      documents: order.documents.map(document => ({
        id: document.id, name: customerDocumentName(document.category), category: document.category,
        sizeBytes: document.sizeBytes, type: document.type, storageKey: document.storageKey, uploadedAt: document.uploadedAt,
      })),
      updates: order.updates.map(update => ({
        id: update.id, status: update.status, note: customerPartnerPrivacy.progressUpdate,
        trackingNumber: update.trackingNumber, actor: update.actor, createdAt: update.createdAt,
      })),
    },
    customerPurchaseOrderAttachment: request.customerPurchaseOrderAttachment
      ? { ...customerFile(request.customerPurchaseOrderAttachment), uploadedAt: request.customerPurchaseOrderAttachment.uploadedAt } : null,
    customerQuotes: request.customerQuotes.map(version => ({
      id: version.id, versionNumber: version.versionNumber, quoteNumber: version.quoteNumber, quoteDate: version.quoteDate,
      validUntil: version.validUntil, customerCompany: version.customerCompany, customerContact: version.customerContact,
      projectName: version.projectName, preparedBy: version.preparedBy, leadTime: version.leadTime, shipping: version.shipping,
      tax: version.tax, notes: version.notes, assumptions: version.assumptions, clarifications: version.clarifications,
      filesReviewed: version.filesReviewed, totalCents: version.totalCents, markdown: version.markdown, issuedAt: version.issuedAt,
      lineItems: version.lineItems.map(item => ({
        id: item.id, description: item.description, process: item.process, material: item.material, finish: item.finish,
        quantity: item.quantity, unitPrice: item.unitPrice, leadTimeDays: item.leadTimeDays,
      })),
    })),
    purchasePayment: {
      method: payment.method, status: payment.status, customerPoNumber: payment.customerPoNumber,
      accountsPayableEmail: payment.accountsPayableEmail, buyerCheckoutNotes: payment.buyerCheckoutNotes,
      card: payment.card ? { brand: payment.card.brand, last4: payment.card.last4, holder: payment.card.holder, expires: payment.card.expires } : null,
      stripe: { amountCents: payment.stripe.amountCents, currency: payment.stripe.currency, paidAt: payment.stripe.paidAt },
    },
    checkoutDetails: request.checkoutDetails ? checkoutDetails : null,
    isArchived: request.isArchived,
    quote: {
      estimatedPriceCents: quote.estimatedPriceCents, leadTimeDays: quote.leadTimeDays, shippingCostCents: quote.shippingCostCents,
      shippingMethod: quote.shippingMethod, shippingTerms: quote.shippingTerms, estimatedDeliveryDate: quote.estimatedDeliveryDate,
      quoteCreatedDate: quote.quoteCreatedDate, quoteValidUntil: quote.quoteValidUntil, summary: quote.summary,
    },
    revisionOfRequestId: request.revisionOfRequestId, revisionNumber: request.revisionNumber,
    revisionChangeLog: request.revisionChangeLog.map(value => value),
    statusEvents: request.statusEvents.map(event => ({ id: event.id, from: event.from, to: event.to, actor: event.actor, at: event.at })),
    createdAt: request.createdAt, updatedAt: request.updatedAt,
  };
}
