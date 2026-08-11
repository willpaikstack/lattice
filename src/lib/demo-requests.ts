import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion, type LatticeRequest, type SupplierDocument } from "./request-model";

const customer = {
  company: "Amogy Manufacturing",
  email: "will@latticeos.co",
  name: "William Paik",
  phone: "+1 (617) 555-0142",
};

const address = {
  shipToAddress1: "18 Harbor Park Drive",
  shipToCity: "Boston",
  shipToCompany: customer.company,
  shipToName: customer.name,
  shipToPhone: customer.phone,
  shipToState: "MA",
  shipToZipCode: "02128",
};

type DemoRequestOptions = {
  dueDate: string;
  id: string;
  material?: string;
  process?: string;
  quantity?: number;
  title: string;
};

function submittedRequest({ dueDate, id, material = "6061-T6 Aluminum", process = "CNC milling", quantity = 24, title }: DemoRequestOptions) {
  const request = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: customer.company,
      contact: { ...address, requesterEmail: customer.email, requesterPhone: customer.phone },
      dueDate,
      files: [{ name: `${id.replace("demo_", "").replaceAll("_", "-")}.step`, sizeBytes: 2048, type: "model/step" }],
      lineItems: [
        {
          generalTolerance: "ISO 2768 Medium (m)",
          material,
          partName: title,
          quantity,
          surfaceFinish: "As machined",
        },
      ],
      process,
      requesterName: customer.name,
      title,
    }),
  );

  return stampRequest({ ...request, id }, "2026-06-01T12:00:00.000Z", "2026-06-01T12:00:00.000Z");
}

function stampRequest(request: LatticeRequest, createdAt: string, updatedAt: string) {
  return {
    ...request,
    createdAt,
    requesterEmail: customer.email,
    requesterPhone: customer.phone,
    shipToAddress1: address.shipToAddress1,
    shipToCity: address.shipToCity,
    shipToCompany: address.shipToCompany,
    shipToName: address.shipToName,
    shipToPhone: address.shipToPhone,
    shipToState: address.shipToState,
    shipToZipCode: address.shipToZipCode,
    statusEvents: request.statusEvents.map((event, index) => ({
      ...event,
      at: index === 0 ? createdAt : updatedAt,
    })),
    updatedAt,
  };
}

function quoteVersion({
  issuedAt,
  leadTime,
  quoteNumber,
  totalCents,
  validUntil,
  projectName,
  lineItem,
}: {
  issuedAt: string;
  leadTime: string;
  lineItem: string;
  projectName: string;
  quoteNumber: string;
  totalCents: number;
  validUntil: string;
}): CustomerQuoteVersion {
  return {
    assumptions: "Pricing assumes the supplied CAD package is the released revision. Standard packaging is included.",
    clarifications: "",
    customerCompany: customer.company,
    customerContact: customer.name,
    filesReviewed: `${lineItem}.step`,
    id: `customer_quote_${quoteNumber}`,
    issuedAt,
    leadTime,
    lineItems: [
      {
        description: lineItem,
        finish: "As machined",
        material: "6061-T6 Aluminum",
        process: "CNC milling",
        quantity: 24,
        unitPrice: totalCents / 100 / 24,
        id: `quoted_line_${quoteNumber}`,
      },
    ],
    markdown: `# Quote ${quoteNumber}`,
    notes: "Lattice will coordinate supplier production, inspection, and delivery follow-up.",
    preparedBy: "Lattice",
    projectName,
    quoteDate: issuedAt.slice(0, 10),
    quoteNumber,
    tax: "Not included",
    totalCents,
    validUntil,
    versionNumber: 1,
    shipping: "Billed at actual",
  };
}

function applyStatus(request: LatticeRequest, status: Parameters<typeof applyOperatorStatusUpdate>[1]["status"], updatedAt: string, input: Partial<Parameters<typeof applyOperatorStatusUpdate>[1]> = {}) {
  const updated = applyOperatorStatusUpdate(request, { ...input, status });
  return stampRequest(updated, request.createdAt, updatedAt);
}

function withCustomerQuote(request: LatticeRequest, quote: CustomerQuoteVersion) {
  return {
    ...request,
    customerQuotes: [quote],
    quote: {
      ...request.quote,
      estimatedDeliveryDate: "2026-08-28",
      estimatedPriceCents: quote.totalCents,
      leadTimeDays: 15,
      quoteCreatedDate: quote.quoteDate,
      quoteValidUntil: quote.validUntil,
      shippingMethod: "International air freight",
      shippingTerms: "Delivered duty unpaid",
      summary: quote.notes,
    },
  };
}

function supplierDocument(id: string, name: string, category: SupplierDocument["category"], uploadedAt: string): SupplierDocument {
  return { category, id, name, sizeBytes: 842_000, type: category === "PHOTO" ? "image/jpeg" : "application/pdf", uploadedAt };
}

function purchasedOrder(
  request: LatticeRequest,
  updatedAt: string,
  supplierOrder: Partial<LatticeRequest["supplierOrder"]>,
) {
  const purchaseEvent = {
    actor: "buyer" as const,
    at: updatedAt,
    from: "QUOTED" as const,
    id: `${request.id}_purchased`,
    to: "PURCHASED" as const,
  };

  return stampRequest(
    {
      ...request,
      purchasePayment: {
        ...request.purchasePayment,
        card: { brand: "Visa", expires: "09/28", holder: customer.name, id: "card_demo_1", last4: "4242" },
        method: "CARD",
        status: "PAID",
        stripe: { ...request.purchasePayment.stripe, amountCents: request.customerQuotes.at(-1)?.totalCents ?? request.quote.estimatedPriceCents, currency: "usd", paidAt: updatedAt, paymentIntentId: `pi_demo_${request.id}` },
      },
      status: "PURCHASED",
      statusEvents: [...request.statusEvents, purchaseEvent],
      supplierOrder: { ...request.supplierOrder, ...supplierOrder },
    },
    request.createdAt,
    updatedAt,
  );
}

function draftRequest() {
  const request = buildDraftRequest({
    buyerCompany: customer.company,
    contact: { ...address, requesterEmail: customer.email, requesterPhone: customer.phone },
    dueDate: "2026-09-18",
    files: [{ name: "pump-cover-rev-c.step", sizeBytes: 1840, type: "model/step" }],
    lineItems: [{ material: "316L Stainless Steel", notes: "Please confirm whether electropolishing is required.", partName: "Pump cover", quantity: 12 }],
    process: "CNC milling",
    requesterName: customer.name,
    title: "Pump cover revision C",
  });

  return stampRequest({ ...request, id: "demo_draft_pump_cover" }, "2026-07-30T14:20:00.000Z", "2026-08-04T10:15:00.000Z");
}

function needsInfoRequest() {
  const request = applyStatus(
    submittedRequest({ dueDate: "2026-09-05", id: "demo_needs_info_valve", material: "17-4 PH Stainless Steel", quantity: 8, title: "Valve body prototype" }),
    "NEEDS_INFO",
    "2026-08-01T15:30:00.000Z",
    { assignedOwner: "Maya", internalNotes: "Please confirm the thread callout and whether the sealing surface requires a specified finish." },
  );
  return request;
}

function quotedRequest(id: string, title: string, quoteNumber: string, totalCents: number, validUntil: string, issuedAt: string) {
  const request = applyStatus(
    submittedRequest({ dueDate: "2026-09-12", id, quantity: 48, title }),
    "QUOTED",
    issuedAt,
    { assignedOwner: "Adam", estimatedPriceCents: totalCents, leadTimeDays: 15, quoteCreatedDate: issuedAt.slice(0, 10), quoteValidUntil: validUntil, quoteSummary: "Pricing is ready for review." },
  );
  return withCustomerQuote(request, quoteVersion({ issuedAt, leadTime: "15 business days", lineItem: title, projectName: title, quoteNumber, totalCents, validUntil }));
}

function activeOrder(request: LatticeRequest, updatedAt: string, status: LatticeRequest["supplierOrder"]["status"], nextMilestone: string, nextMilestoneDate: string) {
  return purchasedOrder(request, updatedAt, {
    contactName: "Li Wei",
    nextMilestone,
    nextMilestoneDate,
    notes: "Supplier has confirmed the production plan and is sending progress updates through Lattice.",
    responsibleParty: "Supplier",
    shopName: "Shenzhen Precision Manufacturing",
    status,
  });
}

export function getDemoRequests(): LatticeRequest[] {
  const quotedBracket = quotedRequest("demo_quoted_brackets", "CNC mounting bracket set", "LQ-4107", 324000, "2026-08-10", "2026-08-03T09:30:00.000Z");
  const quotedManifold = quotedRequest("demo_quoted_manifold", "Fluid manifold production run", "LQ-4108", 685000, "2026-08-29", "2026-07-28T13:00:00.000Z");

  const productionOrder = activeOrder(
    withCustomerQuote(submittedRequest({ dueDate: "2026-08-01", id: "demo_order_production", quantity: 36, title: "Battery tray fixture" }), quoteVersion({ issuedAt: "2026-07-08T12:00:00.000Z", leadTime: "20 business days", lineItem: "Battery tray fixture", projectName: "Battery tray fixture", quoteNumber: "LQ-4089", totalCents: 455000, validUntil: "2026-07-22" })),
    "2026-07-22T16:30:00.000Z",
    "IN_PRODUCTION",
    "First article inspection",
    "2026-08-12",
  );

  const qualityOrder = purchasedOrder(
    withCustomerQuote(submittedRequest({ dueDate: "2026-07-20", id: "demo_order_quality", material: "7075-T6 Aluminum", quantity: 18, title: "Robotic end-effector plates" }), quoteVersion({ issuedAt: "2026-06-24T12:00:00.000Z", leadTime: "18 business days", lineItem: "Robotic end-effector plates", projectName: "Robotic end-effector plates", quoteNumber: "LQ-4051", totalCents: 298000, validUntil: "2026-07-08" })),
    "2026-07-30T11:45:00.000Z",
    {
      contactName: "Chen Rui",
      documents: [supplierDocument("demo_doc_inspection", "Inspection report.pdf", "INSPECTION_REPORT", "2026-07-30T11:30:00.000Z"), supplierDocument("demo_doc_material", "Material certificate.pdf", "MATERIAL_CERT", "2026-07-30T11:30:00.000Z")],
      nextMilestone: "Customer document review",
      nextMilestoneDate: "2026-08-08",
      notes: "Parts completed final inspection. Quality documents are ready for your review.",
      responsibleParty: "Customer",
      shopName: "Dongguan Axis CNC",
      status: "DOCUMENTS_UPLOADED",
    },
  );

  const shippedOrder = purchasedOrder(
    withCustomerQuote(submittedRequest({ dueDate: "2026-07-01", id: "demo_order_shipped", material: "6061-T6 Aluminum", quantity: 60, title: "Sensor enclosure panels" }), quoteVersion({ issuedAt: "2026-06-02T12:00:00.000Z", leadTime: "15 business days", lineItem: "Sensor enclosure panels", projectName: "Sensor enclosure panels", quoteNumber: "LQ-3974", totalCents: 512000, validUntil: "2026-06-16" })),
    "2026-07-18T09:10:00.000Z",
    {
      contactName: "Maria Chen",
      nextMilestone: "Delivery",
      nextMilestoneDate: "2026-08-09",
      notes: "Shipment is in transit to Boston.",
      responsibleParty: "Supplier",
      shopName: "Pacific Fabrication",
      status: "SHIPPED",
      trackingNumber: "1Z999AA10123456784",
      updates: [{ actor: "supplier", createdAt: "2026-07-18T09:10:00.000Z", id: "demo_update_shipped", note: "Shipment handed to UPS. Tracking is now active.", status: "SHIPPED", trackingNumber: "1Z999AA10123456784" }],
    },
  );

  const deliveredOrder = purchasedOrder(
    withCustomerQuote(submittedRequest({ dueDate: "2026-06-15", id: "demo_order_delivered", quantity: 24, title: "Cooling manifold brackets" }), quoteVersion({ issuedAt: "2026-05-12T12:00:00.000Z", leadTime: "12 business days", lineItem: "Cooling manifold brackets", projectName: "Cooling manifold brackets", quoteNumber: "LQ-3822", totalCents: 186500, validUntil: "2026-05-26" })),
    "2026-06-12T15:00:00.000Z",
    {
      contactName: "Li Wei",
      notes: "Delivered and accepted by the receiving team.",
      responsibleParty: "Supplier",
      shopName: "Shenzhen Precision Manufacturing",
      status: "DELIVERED",
      trackingNumber: "1Z999AA10111213141",
      updates: [{ actor: "supplier", createdAt: "2026-06-12T15:00:00.000Z", id: "demo_update_delivered", note: "Delivery confirmed by the receiving team.", status: "DELIVERED", trackingNumber: "1Z999AA10111213141" }],
    },
  );

  return [
    draftRequest(),
    needsInfoRequest(),
    applyStatus(submittedRequest({ dueDate: "2026-09-22", id: "demo_submitted_gearbox", material: "4140 Steel", quantity: 10, title: "Gearbox mounting plate" }), "READY_FOR_SUPPLIER_RFQ", "2026-08-02T14:10:00.000Z", { assignedOwner: "Maya", supplierPackageNotes: "Send to CNC milling suppliers with mill-turn capability." }),
    quotedBracket,
    quotedManifold,
    productionOrder,
    qualityOrder,
    shippedOrder,
    deliveredOrder,
    activeOrder(withCustomerQuote(submittedRequest({ dueDate: "2026-08-18", id: "demo_order_ack", quantity: 12, title: "Test stand alignment pins" }), quoteVersion({ issuedAt: "2026-07-31T12:00:00.000Z", leadTime: "10 business days", lineItem: "Test stand alignment pins", projectName: "Test stand alignment pins", quoteNumber: "LQ-4102", totalCents: 84500, validUntil: "2026-08-14" })), "2026-08-04T12:00:00.000Z", "AWAITING_ACKNOWLEDGMENT", "Supplier acknowledgment", "2026-08-07"),
  ];
}
