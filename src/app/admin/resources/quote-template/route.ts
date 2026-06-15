import { buildRequestQuotePdf } from "@/lib/quote-pdf";
import type { LatticeRequest } from "@/lib/request-model";
import { requireRouteRole } from "@/lib/route-authorization";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function quoteTemplateRequest(): LatticeRequest {
  const quoteDate = "2026-04-27";

  return {
    buyerCompany: "Customer company",
    createdAt: `${quoteDate}T12:00:00.000Z`,
    customerQuotes: [
      {
        assumptions: "",
        clarifications: "",
        customerCompany: "Customer company",
        customerContact: "Customer contact",
        filesReviewed: "aluminum_plate.step\nAluminum Plate Hole Call Out.pdf",
        id: "quote_template_v1",
        issuedAt: `${quoteDate}T12:00:00.000Z`,
        leadTime: "5 days (Overseas)",
        lineItems: [
          {
            description: "Aluminum Plate",
            finish: "No finish (as machined)",
            id: "line_template_1",
            material: "6061 Aluminum (T6 / T651 / T6511)",
            process: "CNC Milling",
            quantity: 8,
            unitPrice: 208.24,
          },
          {
            description: "Tubesheet Retainer Plate",
            finish: "No finish (as machined)",
            id: "line_template_2",
            material: "6061 Aluminum (T6 / T651 / T6511)",
            process: "CNC Milling",
            quantity: 4,
            unitPrice: 171.78,
          },
        ],
        markdown: "",
        notes: "Pricing includes manufacturing coordination, production, and standard inspection for the listed line items.",
        preparedBy: "Lattice OS",
        projectName: "Customer quote template",
        quoteDate,
        quoteNumber: "LQ-TEMPLATE",
        shipping: "International / Determined at Checkout",
        tax: "Excluded unless explicitly listed",
        totalCents: 235304,
        validUntil: "2026-05-27",
        versionNumber: 1,
      },
    ],
    customerPurchaseOrderAttachment: null,
    dueDate: "2026-05-13",
    files: [
      { id: "file_template_1", name: "aluminum_plate.step", sizeBytes: 0, type: "application/octet-stream" },
      { id: "file_template_2", name: "Aluminum Plate Hole Call Out.pdf", sizeBytes: 0, type: "application/pdf" },
      { id: "file_template_3", name: "tubesheet_retainer_plate.step", sizeBytes: 0, type: "application/octet-stream" },
      { id: "file_template_4", name: "Tubesheet Retainer Plate Threaded Hole Callout.pdf", sizeBytes: 0, type: "application/pdf" },
    ],
    guestAccessTokenExpiresAt: null,
    guestAccessTokenHash: "",
    id: "req_template",
    lineItems: [
      {
        generalTolerance: "ISO Grade N7: Ra 1.6um / 63uin",
        id: "line_template_1",
        material: "6061 Aluminum (T6 / T651 / T6511)",
        notes: "",
        partName: "Aluminum Plate",
        qualityDocumentation: ["Standard Inspection"],
        quantity: 8,
        surfaceFinish: "No finish (as machined)",
      },
      {
        generalTolerance: "ISO Grade N7: Ra 1.6um / 63uin",
        id: "line_template_2",
        material: "6061 Aluminum (T6 / T651 / T6511)",
        notes: "",
        partName: "Tubesheet Retainer Plate",
        qualityDocumentation: ["Standard Inspection"],
        quantity: 4,
        surfaceFinish: "No finish (as machined)",
      },
    ],
    isArchived: false,
    operatorReview: {
      assignedOwner: "William Paik",
      completeness: "READY_FOR_REVIEW",
      internalNotes: "",
      supplierPackageNotes: "",
    },
    process: "CNC Milling",
    purchasePayment: {
      method: null,
      status: null,
      customerPoNumber: "",
      accountsPayableEmail: "",
      buyerCheckoutNotes: "",
      card: null,
      stripe: {
        amountCents: null,
        checkoutSessionId: "",
        currency: "",
        paidAt: null,
        paymentIntentId: "",
      },
    },
    quote: {
      estimatedDeliveryDate: "2026-05-13",
      estimatedPriceCents: null,
      leadTimeDays: 5,
      quoteCreatedDate: quoteDate,
      quoteValidUntil: "2026-05-27",
      shippingCostCents: 0,
      shippingMethod: "International",
      shippingTerms: "Determined at Checkout",
      summary: "Pricing includes manufacturing coordination, production, and standard inspection for the listed line items.",
    },
    revisionChangeLog: [],
    revisionNumber: 1,
    revisionOfRequestId: null,
    requestOrigin: "ACCOUNT",
    requesterEmail: "customer@example.com",
    requesterName: "Customer contact",
    requesterPhone: "+1 (555) 010-0000",
    shipToAddress1: "19 Morris Ave",
    shipToAddress2: "",
    shipToCity: "Brooklyn",
    shipToCompany: "Customer company",
    shipToName: "Customer contact",
    shipToPhone: "+1 (555) 010-0000",
    shipToState: "NY",
    shipToZipCode: "11205",
    status: "QUOTED",
    statusEvents: [],
    supplierOrder: {
      contactName: "",
      documents: [],
      notes: "",
      shopName: "",
      status: "AWAITING_ACKNOWLEDGMENT",
      trackingNumber: "",
      updates: [],
    },
    supplierQuoteFiles: [],
    supplierQuotes: [],
    title: "Customer quote template",
    updatedAt: `${quoteDate}T12:00:00.000Z`,
  };
}

export async function GET(request: Request) {
  const unauthorized = await requireRouteRole(["admin"]);
  if (unauthorized) {
    return unauthorized;
  }

  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const pdf = await buildRequestQuotePdf(quoteTemplateRequest());
  const body = new ArrayBuffer(pdf.byteLength);
  new Uint8Array(body).set(pdf);

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="lattice-os-customer-quote-template-rev-1.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
