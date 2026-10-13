import "server-only";

import { createHash } from "node:crypto";
import { customerEquipment } from "./customer-equipment";
import { vendorEquipment } from "./vendor-equipment";
import { isExplorerEquipment, millingAxis, visibleEquipmentSpecifications, type ExplorerEquipment, type ExplorerProcess } from "./equipment-explorer";

// Both projections originate from the same record array. Only this explicit DTO
// crosses the RSC boundary; supplier/archive identities never enter the client.
export function getEquipmentExplorerData(): ExplorerEquipment[] {
  return customerEquipment.flatMap((item, index) => {
    if (!isExplorerEquipment(item)) return [];
    const record = vendorEquipment[index];
    const isOperationSizeList = record.source.sourceDocumentId === "jucheng-precision-equipment-list-20260414";
    const isAxisTravelList = record.source.sourceDocumentId === "best-prototypes-equipment-list";
    // Original PDFs were inspected for this new view. Corrections are scoped to
    // this projection; the legacy page and its source records remain intact.
    const axisOverrides: Record<string, string> = {
      "jucheng-haas-650": "5-axis",
      "jucheng-mazak-700": "5-axis",
      "tongzhen-taizhen-850": "3-axis",
      "jingdiao-jdhgt400t": "3-axis",
    };
    const mixedAxes = record.slug === "taichuan-640";
    const axisOverride = axisOverrides[record.slug];
    const specifications = visibleEquipmentSpecifications(item).map(detail => {
      if (axisOverride && /axis count|axis configuration/i.test(detail.label)) return { ...detail, value: axisOverride };

      if (isOperationSizeList && /accuracy|precision/i.test(detail.label)) return { ...detail, label: "Listed tolerance" };
      if (isOperationSizeList && /work envelope|measurement range/i.test(detail.label)) return { ...detail, label: "Operation size" };
      if (isAxisTravelList && /^(Envelope|Work envelope)$/.test(detail.label)) return { ...detail, label: item.section === "CNC Milling" ? "X/Y/Z axis travel" : "Listed dimensions" };
      if (isAxisTravelList && detail.label === "Machining accuracy") return { ...detail, label: "Positioning accuracy" };
      return detail;
    });
    const references = [...(item.dataSheets ?? []), ...(item.onlineSpecificationUrl ? [{ label: "Online model specifications", url: item.onlineSpecificationUrl }] : [])]
      .filter((reference, position, all) => /^https:\/\//i.test(reference.url) && all.findIndex(other => other.url === reference.url) === position);
    return [{
      id: `EQ-${createHash("sha256").update(vendorEquipment[index].slug).digest("hex").slice(0, 8).toUpperCase()}`,
      model: item.makeModel,
      type: mixedAxes ? "CNC milling · mixed 3-axis / 4-axis fleet" : axisOverride ? `${axisOverride} CNC machining center` : item.name,
      process: item.section as ExplorerProcess,
      quantity: item.customerQuantityLabel ?? item.quantity,
      summary: mixedAxes ? "The equipment list includes eight 3-axis and two 4-axis machines in this combined model record. Confirm the required configuration during RFQ." : axisOverride ? `${axisOverride} machining centers documented in the network equipment list.` : item.summary,
      sourceNote: isOperationSizeList
        ? "The equipment list reports tolerance and operation size. It does not establish X/Y/Z positioning accuracy or identify each size dimension. Confirm the applicable working envelope during RFQ."
        : isAxisTravelList ? "The equipment list separates axis travel, positioning accuracy and repeatability. Travel alone does not establish usable part size or rotary clearance." : null,
      axis: mixedAxes ? null : axisOverride ?? millingAxis(item),
      specifications,
      envelopes: specifications.filter(detail => /envelope|axis travel|operation size|processing range|measurement range|documented range|listed range|forming length|tapping capacity|bar capacity|^ranges$/i.test(detail.label)),
      precision: specifications.filter(detail => /accuracy|precision|tolerance|repeatability/i.test(detail.label)),
      operating: specifications.filter(detail => /rpm|spindle|control|power|material capacity/i.test(detail.label)),
      references,
    }];
  }).sort((a, b) => a.model.localeCompare(b.model));
}
