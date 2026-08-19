import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { vendorEquipment } from "@/lib/vendor-equipment";
import { customerEquipment } from "@/lib/customer-equipment";

import EquipmentPage from "./page";

describe("EquipmentPage", () => {
  it("renders the vendor equipment list with customer-facing machine details", () => {
    render(<EquipmentPage />);

    expect(screen.getByRole("heading", { name: "Equipment" })).toBeInTheDocument();
    expect(screen.getByText("Your Resources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Equipment catalog" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Vendor equipment comparison" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search make or model")).toBeInTheDocument();
    expect(screen.getByLabelText("Process category")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Equipment type" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lathes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manual equipment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "QC equipment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sheet metal fabrication" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Wire EDM" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Photo status")).not.toBeInTheDocument();
    expect(screen.getByText("Hermle C650")).toBeInTheDocument();
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.getByText("Middle Wire EDM")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finishing" })).not.toBeInTheDocument();
    expect(screen.getAllByText("±0.02 mm").length).toBeGreaterThan(0);
    expect(screen.queryByText(/common X\/Y\/Z value/)).not.toBeInTheDocument();

    const manualTable = screen.getByRole("region", { name: "Manual Machines" });
    expect(within(manualTable).queryByText("Positional accuracy (X/Y/Z)")).not.toBeInTheDocument();
    expect(within(manualTable).queryByText("Work envelope (X × Y × Z)")).not.toBeInTheDocument();

    const qcTable = screen.getByRole("region", { name: "QC & Inspection" });
    expect(within(qcTable).queryByText("Positional accuracy (X/Y/Z)")).not.toBeInTheDocument();
    expect(within(qcTable).queryByText("Work envelope (X × Y × Z)")).not.toBeInTheDocument();

    const sheetMetalTable = screen.getByRole("region", { name: "Sheet Metal" });
    expect(within(sheetMetalTable).queryByText("Positional accuracy (X/Y/Z)")).not.toBeInTheDocument();
    expect(within(sheetMetalTable).queryByText("Work envelope (X × Y × Z)")).not.toBeInTheDocument();

    const millingTable = screen.getByRole("region", { name: "CNC Milling" });
    expect(within(millingTable).getByText("Positional accuracy (X/Y/Z)")).toBeInTheDocument();
    expect(within(millingTable).getByText("Work envelope (X × Y × Z)")).toBeInTheDocument();
  });

  it("labels every equipment photo with its verification state", () => {
    expect(vendorEquipment).toHaveLength(170);
    expect(vendorEquipment.every((equipment) => equipment.imageKind === "actual" || equipment.imageKind === "same-model" || equipment.imageKind === "representative")).toBe(true);
    expect(vendorEquipment.find((equipment) => equipment.slug === "shengyu-850")).toMatchObject({
      imageKind: "representative",
      imagePath: "/equipment/generic-vmc850-uniontech.png",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "hermle-c400")).toMatchObject({
      imageKind: "same-model",
      imagePath: "/equipment/hermle-c400.jpg",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "fanuc-31i-model-b-plus")).toBeUndefined();
    expect(vendorEquipment.find((equipment) => equipment.slug === "best-prototypes-three-axis-vmc-fleet")).toBeUndefined();
    expect(vendorEquipment.find((equipment) => equipment.slug === "best-prototypes-smartcnc500-drtd")).toMatchObject({ quantity: "5 sets" });
    expect(vendorEquipment.find((equipment) => equipment.slug === "best-prototypes-jdgr400-a13s")).toMatchObject({ quantity: "5 sets" });
    expect(vendorEquipment.find((equipment) => equipment.slug === "best-prototypes-jdct800t")).toMatchObject({ quantity: "1 set" });
    expect(vendorEquipment.find((equipment) => equipment.slug === "best-prototypes-siemens-ht710")?.details).toContainEqual({
      label: "Positional accuracy",
      value: "±0.005 / ±0.005 / ±0.005 mm per 300 mm",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "shuofang-sz-325f1")?.details).toContainEqual({
      label: "Work envelope",
      value: "Dia. 32 mm",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "shuofang-sz-255e1")?.details).toContainEqual({
      label: "Work envelope",
      value: "Dia. 25 mm",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "shuofang-sz-206f")?.details).toContainEqual({
      label: "Work envelope",
      value: "Dia. 20 mm",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "shuofang-sc-46yd")?.details).toContainEqual({
      label: "Work envelope",
      value: "Dia. 45 mm",
    });
    expect(vendorEquipment.find((equipment) => equipment.slug === "best-parts-dmg-mu50")).toMatchObject({ quantity: "2 sets" });
    expect(vendorEquipment.find((equipment) => equipment.slug.startsWith("yijin-"))).toBeUndefined();
    expect(vendorEquipment.find((equipment) => equipment.slug === "jucheng-mikron-mill-e700u")).toMatchObject({
      quantity: "1 set",
      source: expect.objectContaining({ sourceDocumentId: "jucheng-precision-equipment-list-20260414" }),
    });
  });

  it("only exposes online specifications when the source names the exact model", () => {
    render(<EquipmentPage />);

    fireEvent.click(screen.getByRole("button", { name: "View specifications for Beijing Jingdiao JDGR400-A13S" }));
    expect(screen.queryByRole("link", { name: "View online specifications" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View specifications for Beijing Jingdiao JDCT800T" }));
    expect(screen.getByRole("link", { name: "View online specifications" })).toHaveAttribute(
      "href",
      "https://en.jingdiao.com/machines/cnc-machining-centers/jdct-series/jdct800t-a15sh-jdct800th-a15sh",
    );
  });

  it("keeps primary-table capacity values out of expanded CNC specifications", () => {
    render(<EquipmentPage />);

    fireEvent.click(screen.getByRole("button", { name: "View specifications for Baoling PMD-850" }));
    const specifications = screen.getByRole("region", { name: "Baoling PMD-850 specifications" });

    expect(within(specifications).getByText("3-axis engraving and milling machine documented.")).toBeInTheDocument();
    expect(within(specifications).queryByText(/Lattice manufacturing network/i)).not.toBeInTheDocument();
    expect(within(specifications).getByText("Max RPM")).toBeInTheDocument();
    expect(within(specifications).getByText("20,000 RPM")).toBeInTheDocument();
    expect(within(specifications).queryByText("Work envelope")).not.toBeInTheDocument();
    expect(within(specifications).queryByText("Positional accuracy (X/Y/Z)")).not.toBeInTheDocument();
    expect(within(specifications).queryByText("620 × 780 × 340 mm")).not.toBeInTheDocument();
    expect(within(specifications).queryByText("±0.02 mm common X/Y/Z value")).not.toBeInTheDocument();
  });

  it("includes an equipment specification in every expanded row", () => {
    render(<EquipmentPage />);

    fireEvent.click(screen.getByRole("button", { name: "View specifications for MHRS-150" }));
    const specifications = screen.getByRole("region", { name: "MHRS-150 specifications" });

    expect(within(specifications).getByText("Equipment specification")).toBeInTheDocument();
    expect(within(specifications).getByText("HRC hardness tester documented in the QC inventory.")).toBeInTheDocument();
    expect(within(specifications).queryByText("Next listed calibration")).not.toBeInTheDocument();
    expect(within(specifications).queryByText("2026-03-10")).not.toBeInTheDocument();
  });

  it("does not expose guidance rows or internal manufacturing partner names", () => {
    render(<EquipmentPage />);

    fireEvent.click(screen.getByRole("button", { name: "View specifications for Coating, roughness, concentricity, and Rockwell testing tools" }));

    expect(screen.queryByText("Best for")).not.toBeInTheDocument();
    expect(screen.queryByText("Limitation")).not.toBeInTheDocument();
    expect(screen.queryByText(/Best Prototypes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Best Parts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zintilon/i)).not.toBeInTheDocument();
    expect(screen.getByText("Documented coating-thickness, surface-roughness, concentricity, and Rockwell-hardness instruments.")).toBeInTheDocument();
  });

  it("redacts every record's supplier and source-document identity from customer equipment copy", () => {
    const swissTurning = vendorEquipment.find((equipment) => equipment.slug === "best-parts-tsugami-swiss");
    const juchengMikron = vendorEquipment.find((equipment) => equipment.slug === "jucheng-mikron-mill-e700u");

    expect(swissTurning).toBeDefined();
    const customerSwissTurning = customerEquipment.find((equipment) => equipment.makeModel === "Tsugami Swiss Turning");
    expect(customerSwissTurning?.summary).toBe("Swiss turning machines documented.");
    expect(JSON.stringify(customerSwissTurning)).not.toMatch(/Best Parts|equipment list/i);
    expect(juchengMikron).toBeDefined();
    const customerJuchengMikron = customerEquipment.find((equipment) => equipment.makeModel === "Mikron MILL E 700 U");
    expect(JSON.stringify(customerJuchengMikron)).not.toMatch(/Jucheng|equipment list/i);

    render(<EquipmentPage />);
    fireEvent.click(screen.getByRole("button", { name: "View specifications for Tsugami Swiss Turning" }));

    const specifications = screen.getByRole("region", { name: "Tsugami Swiss Turning specifications" });
    expect(within(specifications).getByText("Swiss turning machines documented.")).toBeInTheDocument();
    expect(within(specifications).queryByText(/Best Parts/i)).not.toBeInTheDocument();
  });

  it("filters the catalog by process and search text", () => {
    render(<EquipmentPage />);

    fireEvent.change(screen.getByLabelText("Process category"), { target: { value: "Sheet Metal" } });
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.queryByText("Hermle C650")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Search make or model"), { target: { value: "MPS3015" } });
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.queryByText("Ermak Power-Bend Falcon")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Process category"), { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText("Search make or model"), { target: { value: "" } });
    fireEvent.click(within(screen.getByRole("group", { name: "Equipment type" })).getByRole("button", { name: "CNC Mill" }));
    expect(screen.getByText("Beijing Jingdiao JDCT800T")).toBeInTheDocument();
    expect(screen.queryByText("Dazu MPS3015C 6000W")).not.toBeInTheDocument();
    expect(screen.queryByText("Shenzhen Shuofang SZ-325F1")).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("group", { name: "Equipment type" })).getByRole("button", { name: "Lathes" }));
    expect(screen.getByText("Shenzhen Shuofang SZ-325F1")).toBeInTheDocument();
    expect(screen.getByText("Doosan Turning-Milling Composite")).toBeInTheDocument();
    expect(screen.queryByText("Beijing Jingdiao JDCT800T")).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("group", { name: "Equipment type" })).getByRole("button", { name: "Manual equipment" }));
    expect(screen.getByText("Bench tapping machine")).toBeInTheDocument();
    expect(screen.queryByText("Doosan Turning-Milling Composite")).not.toBeInTheDocument();
    expect(screen.queryByText("Positional accuracy (X/Y/Z)")).not.toBeInTheDocument();
    expect(screen.queryByText("Work envelope (X × Y × Z)")).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("group", { name: "Equipment type" })).getByRole("button", { name: "QC equipment" }));
    expect(screen.getByText("Hexagon CROMA Plus 08.10.06")).toBeInTheDocument();
    expect(screen.queryByText("Beijing Jingdiao JDCT800T")).not.toBeInTheDocument();
    expect(screen.queryByText("Positional accuracy (X/Y/Z)")).not.toBeInTheDocument();
    expect(screen.queryByText("Work envelope (X × Y × Z)")).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByRole("group", { name: "Equipment type" })).getByRole("button", { name: "Sheet metal fabrication" }));
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.getByText("EKO ES3512")).toBeInTheDocument();
    expect(screen.getByText("Han's Laser 3015 6000W")).toBeInTheDocument();
    expect(screen.getByText("Meike 3015 3000W")).toBeInTheDocument();
    expect(screen.getByText("EKO ES1003")).toBeInTheDocument();
    expect(screen.getByText("Hai Ji EG6520")).toBeInTheDocument();
    expect(screen.getByText("Yi Ke EHC2203")).toBeInTheDocument();
    expect(screen.queryByText("HTES-300SSB")).not.toBeInTheDocument();
    expect(screen.queryByText("Hai Ji H618")).not.toBeInTheDocument();
    expect(screen.queryByText("Hexagon CROMA Plus 08.10.06")).not.toBeInTheDocument();
  });
});
