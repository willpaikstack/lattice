import { describe, expect, it } from "vitest";
import { getEquipmentExplorerData } from "./equipment-explorer-data";
import { filterExplorerEquipment, millingAxis } from "./equipment-explorer";
import { vendorEquipment } from "./vendor-equipment";

const equipment = getEquipmentExplorerData();
const filters = { process: "all", query: "", axis: "all", documentedEnvelope: false, publicReference: false };

describe("equipment explorer source projection", () => {
  it("counts only browsable records and exposes no private provenance", () => {
    expect(equipment).toHaveLength(150);
    expect(new Set(equipment.map(item => item.id)).size).toBe(150);
    expect(equipment.filter(item => item.process === "CNC Milling")).toHaveLength(76);
    expect(JSON.stringify(equipment)).not.toMatch(/jucheng|zintilon|best prototypes|best parts|vendor-sources|sourceDocumentId|repositoryPath|calibration/i);
    expect(equipment.every(item => /^EQ-[A-F0-9]{8}$/.test(item.id))).toBe(true);
  });

  it("uses the original document basis without inventing a third dimension", () => {
    const afming = equipment.find(item => item.model === "AFMING GMU-600")!;
    expect(afming.envelopes).toEqual([{ label: "Operation size", value: "600 × 910 mm" }]);
    expect(afming.precision).toEqual([{ label: "Listed tolerance", value: "0.01 mm" }]);
    expect(afming.axis).toBe("5-axis");
    const baoling = equipment.find(item => item.model === "Baoling PMD-850")!;
    expect(baoling.envelopes[0].label).toBe("X/Y/Z axis travel");
    expect(baoling.precision[0].label).toBe("Positioning accuracy");
  });

  it("corrects sampled configuration labels only in the new projection", () => {
    expect(equipment.find(item => item.model === "Haas 650")?.axis).toBe("5-axis");
    expect(vendorEquipment.find(item => item.slug === "jucheng-haas-650")?.name).toContain("3-axis");
    expect(equipment.find(item => item.model.includes("Taichuan 640"))?.axis).toBeNull();
    expect(equipment.find(item => item.model.includes("JDHGT400T"))?.axis).toBe("3-axis");
    expect(millingAxis({ section: "CNC Milling", name: "Machining center", details: [{ label: "Axis count", value: "3 axes" }] })).toBe("3-axis");
  });

  it("combines search terms, process, configuration and evidence filters", () => {
    const result = filterExplorerEquipment(equipment, { ...filters, process: "CNC Milling", query: "hermle c400", axis: "5-axis", documentedEnvelope: true, publicReference: true });
    expect(result).toHaveLength(1);
    expect(result[0].model).toContain("C400");
    expect(result[0].envelopes.length).toBeGreaterThan(1);
    expect(filterExplorerEquipment(equipment, { ...filters, query: "not-a-real-model" })).toEqual([]);
    expect(filterExplorerEquipment(equipment, { ...filters, process: "EDM" })).toHaveLength(2);
  });
});
