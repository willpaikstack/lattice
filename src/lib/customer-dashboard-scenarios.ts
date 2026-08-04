import { buildDraftRequest, submitDraftRequest, type CustomerQuoteVersion, type LatticeRequest, type RequestStatus } from "./request-model";

export const customerDashboardScenarioNames = ["empty", "needs-attention", "active-order", "shipped", "full"] as const;

export type CustomerDashboardScenario = (typeof customerDashboardScenarioNames)[number];

export type CustomerDashboardScenarioData = {
  orders: LatticeRequest[];
  quotes: LatticeRequest[];
};

const scenarioDate = "2026-08-04T12:00:00.000Z";

function customerQuote({ quoteNumber, totalCents, validUntil }: { quoteNumber: string; totalCents: number; validUntil: string }): CustomerQuoteVersion {
  return {
    assumptions: "CAD is latest revision.",
    clarifications: "",
    customerCompany: "Amogy Manufacturing",
    customerContact: "William Paik",
    filesReviewed: "part.step",
    id: `customer_quote_${quoteNumber}`,
    issuedAt: "2026-08-02T12:00:00.000Z",
    leadTime: "15 business days",
    lineItems: [],
    markdown: `# Quote ${quoteNumber}`,
    notes: "Ready for review.",
    preparedBy: "Lattice",
    projectName: "Manufacturing component",
    quoteDate: "2026-08-02",
    quoteNumber,
    shipping: "Billed at actual",
    tax: "Not included",
    totalCents,
    validUntil,
    versionNumber: 1,
  };
}

function scenarioRequest({
  customerQuotes = [],
  id,
  status,
  supplierOrder,
  title,
}: {
  customerQuotes?: CustomerQuoteVersion[];
  id: string;
  status: Exclude<RequestStatus, "DRAFT">;
  supplierOrder?: Partial<LatticeRequest["supplierOrder"]>;
  title: string;
}) {
  const request = submitDraftRequest(
    buildDraftRequest({
      buyerCompany: "Amogy Manufacturing",
      contact: { requesterEmail: "will@latticeos.co" },
      dueDate: "2026-08-20",
      files: [{ name: "part.step", sizeBytes: 2048, type: "model/step" }],
      lineItems: [{ material: "6061-T6 Aluminum", partName: title, quantity: 24 }],
      process: "CNC milling",
      requesterName: "William Paik",
      title,
    }),
  );

  return {
    ...request,
    customerQuotes,
    id,
    status,
    statusEvents: [
      ...request.statusEvents,
      {
        actor: status === "PURCHASED" ? "buyer" : "operator",
        at: scenarioDate,
        from: "SUBMITTED",
        id: `event_${id}_${status.toLowerCase()}`,
        to: status,
      },
    ],
    supplierOrder: {
      ...request.supplierOrder,
      ...supplierOrder,
    },
    updatedAt: scenarioDate,
  } satisfies LatticeRequest;
}

function quoteReady() {
  return scenarioRequest({
    customerQuotes: [customerQuote({ quoteNumber: "LQ-3104", totalCents: 182500, validUntil: "2026-08-16" })],
    id: "req_scenario_quoted",
    status: "QUOTED",
    title: "CNC aluminum bracket package",
  });
}

function needsInfo() {
  const request = scenarioRequest({ id: "req_scenario_needs_info", status: "NEEDS_INFO", title: "Drawing clarification request" });

  return {
    ...request,
    operatorReview: {
      ...request.operatorReview,
      completeness: "MISSING_INFO" as const,
      internalNotes: "Please confirm the thread callout before supplier pricing can continue.",
    },
  } satisfies LatticeRequest;
}

function activeOrder() {
  return scenarioRequest({
    customerQuotes: [customerQuote({ quoteNumber: "LQ-3105", totalCents: 240000, validUntil: "2026-08-22" })],
    id: "req_scenario_active_order",
    status: "PURCHASED",
    supplierOrder: {
      contactName: "Li Wei",
      nextMilestone: "First article inspection",
      nextMilestoneDate: "2026-08-12",
      responsibleParty: "Supplier",
      shopName: "Shenzhen Precision",
      status: "IN_PRODUCTION",
    },
    title: "Production manifold order",
  });
}

function shippedOrder() {
  return scenarioRequest({
    customerQuotes: [customerQuote({ quoteNumber: "LQ-3106", totalCents: 97500, validUntil: "2026-08-18" })],
    id: "req_scenario_shipped",
    status: "PURCHASED",
    supplierOrder: {
      contactName: "Maria Chen",
      responsibleParty: "Supplier",
      shopName: "Pacific Fabrication",
      status: "SHIPPED",
      trackingNumber: "1Z999AA10123456784",
    },
    title: "Shipped enclosure panels",
  });
}

export function isCustomerDashboardScenario(value: string | undefined): value is CustomerDashboardScenario {
  return Boolean(value && customerDashboardScenarioNames.includes(value as CustomerDashboardScenario));
}

export function getCustomerDashboardScenario(scenario: CustomerDashboardScenario): CustomerDashboardScenarioData {
  switch (scenario) {
    case "empty":
      return { orders: [], quotes: [] };
    case "needs-attention":
      return { orders: [], quotes: [needsInfo(), quoteReady()] };
    case "active-order":
      return { orders: [activeOrder()], quotes: [quoteReady()] };
    case "shipped":
      return { orders: [shippedOrder()], quotes: [] };
    case "full":
      return { orders: [activeOrder(), shippedOrder()], quotes: [needsInfo(), quoteReady()] };
  }
}
