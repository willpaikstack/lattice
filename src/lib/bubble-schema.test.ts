import { describe, expect, it } from "vitest";

import { bubbleDataTypes, bubbleOptionSets, bubbleSchema } from "./bubble-schema";

describe("Bubble schema reference", () => {
  it("captures the Bubble app data types needed for local emulation", () => {
    expect(bubbleSchema.appId).toBe("nexus-77465");
    expect(Object.keys(bubbleDataTypes)).toEqual([
      "user",
      "quote",
      "orders",
      "cadfile",
      "material",
      "transaction",
      "notification",
      "quotecounter",
      "order_line_items",
      "quote_line_items",
      "company_information",
    ]);
  });

  it("captures active material and RFQ option sets", () => {
    expect(bubbleOptionSets.materials.values.map((value) => value.display)).toEqual([
      "PVC",
      "IN 625",
      "SS 303",
      "SS 304",
      "SS 316",
      "SS 300",
    ]);
    expect(
      bubbleOptionSets.quote_status.values
        .filter((value) => !("deleted" in value && value.deleted))
        .map((value) => value.dbValue),
    ).toEqual(["draft", "requested", "in_review", "purchased"]);
    expect(bubbleOptionSets.fabrication_capability.values.map((value) => value.dbValue)).toContain("cnc_milling");
  });

  it("preserves key Bubble field relationships for quote line items and materials", () => {
    expect(bubbleDataTypes.quote_line_items.fields.materials__option_set__option_materials.valueType).toBe("option.materials");
    expect(bubbleDataTypes.quote_line_items.fields.material_custom_material.valueType).toBe("custom.material");
    expect(bubbleDataTypes.material.fields.material_type__option_material_category.valueType).toBe("option.material_category");
    expect(bubbleDataTypes.material.fields.machining_difficulty_option_machining_difficulty.defaultValue).toBe("medium");
  });
});
