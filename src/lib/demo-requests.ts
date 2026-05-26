import { applyOperatorStatusUpdate, buildDraftRequest, submitDraftRequest, type LatticeRequest } from "./request-model";

function overseasQuotes(requestId: string, selectedShopName?: string): LatticeRequest["supplierQuotes"] {
  return [
    {
      id: `${requestId}_quote_shenzhen`,
      shopName: "Shenzhen Precision Manufacturing",
      country: "China",
      contactName: "Li Wei",
      status: selectedShopName === "Shenzhen Precision Manufacturing" ? "SELECTED" : "QUOTE_RECEIVED",
      priceCents: 148500,
      leadTimeDays: 18,
      notes: "Strong CNC capacity; includes dimensional inspection report.",
      quotedAt: "2026-05-23T09:15:00.000Z",
      isSelected: selectedShopName === "Shenzhen Precision Manufacturing",
    },
    {
      id: `${requestId}_quote_dongguan`,
      shopName: "Dongguan Axis CNC",
      country: "China",
      contactName: "Chen Rui",
      status: "QUOTE_RECEIVED",
      priceCents: 156200,
      leadTimeDays: 14,
      notes: "Faster delivery window; material cert available on request.",
      quotedAt: "2026-05-23T11:40:00.000Z",
      isSelected: false,
    },
    {
      id: `${requestId}_quote_tainan`,
      shopName: "Tainan Advanced Machining",
      country: "Taiwan",
      contactName: "Mei Lin",
      status: "INVITED",
      priceCents: null,
      leadTimeDays: null,
      notes: "Awaiting quote response.",
      quotedAt: null,
      isSelected: false,
    },
  ];
}

function submittedRequest(id: string, title: string, buyerCompany: string, dueDate: string) {
  const request = submitDraftRequest(
    buildDraftRequest({
      buyerCompany,
      requesterName: "William Paik",
      title,
      process: "CNC milling",
      dueDate,
      lineItems: [
        {
          partName: "Mounting bracket",
          quantity: 24,
          material: "6061-T6 Aluminum",
          generalTolerance: "ISO 2768 Medium (m)",
          surfaceFinish: "As machined",
        },
      ],
      files: [{ name: "mounting-bracket.step", sizeBytes: 2048, type: "model/step" }],
    }),
  );

  return {
    ...request,
    id,
    updatedAt: `${dueDate}T14:00:00.000Z`,
  };
}

export function getDemoRequests(): LatticeRequest[] {
  const needsInfo = applyOperatorStatusUpdate(
    submittedRequest("demo_needs_info", "Hydrogen skid bracket RFQ", "Amogy Manufacturing", "2026-05-20"),
    {
      status: "NEEDS_INFO",
      assignedOwner: "Adam",
      internalNotes: "Missing tolerance callout before supplier outreach.",
    },
  );
  const supplierReady = applyOperatorStatusUpdate(
    submittedRequest("demo_supplier_ready", "Pump housing prototype", "Northstar Labs", "2026-06-02"),
    {
      status: "READY_FOR_SUPPLIER_RFQ",
      assignedOwner: "Maya",
      supplierPackageNotes: "Send to vetted CNC milling suppliers.",
    },
  );
  const quoted = applyOperatorStatusUpdate(
    submittedRequest("demo_quoted", "Sensor enclosure production run", "Relay Robotics", "2026-06-12"),
    {
      status: "QUOTED",
      assignedOwner: "Adam",
      estimatedPriceCents: 148500,
      leadTimeDays: 18,
      quoteSummary: "Quoted and waiting for buyer approval.",
    },
  );
  const quotedWithSupplierQuotes: LatticeRequest = {
    ...quoted,
    supplierQuotes: overseasQuotes("demo_quoted"),
  };
  const purchased: LatticeRequest = {
    ...quotedWithSupplierQuotes,
    id: "demo_purchased",
    title: "Valve manifold order",
    buyerCompany: "Apex Fluidics",
    status: "PURCHASED",
    updatedAt: "2026-05-24T16:30:00.000Z",
    supplierQuotes: overseasQuotes("demo_purchased", "Shenzhen Precision Manufacturing"),
    supplierOrder: {
      ...quotedWithSupplierQuotes.supplierOrder,
      status: "IN_PRODUCTION",
      shopName: "Shenzhen Precision Manufacturing",
      contactName: "Li Wei",
      notes: "Material ordered and machining scheduled.",
    },
  };

  return [
    needsInfo,
    supplierReady,
    quotedWithSupplierQuotes,
    purchased,
    submittedRequest("demo_submitted", "Battery tray fixture", "Vector Mobility", "2026-06-18"),
  ];
}
