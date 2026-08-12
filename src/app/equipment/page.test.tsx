import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { vendorEquipment } from "@/lib/vendor-equipment";

import EquipmentPage from "./page";

describe("EquipmentPage", () => {
  it("renders the vendor equipment list with customer-facing machine details", () => {
    render(<EquipmentPage />);

    expect(screen.getByRole("heading", { name: "Vendor Equipment" })).toBeInTheDocument();
    expect(screen.getByText("Your Resources")).toBeInTheDocument();
    expect(screen.queryByText("Production machines")).not.toBeInTheDocument();
    expect(screen.queryByText("Sheet metal equipment")).not.toBeInTheDocument();
    expect(screen.queryByText("ZEISS CMMs")).not.toBeInTheDocument();
    expect(screen.queryByText("Unique equipment cards")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "CNC Milling" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "CNC Lathe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "QC & Inspection" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Manual Machines" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sheet Metal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Finishing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "EDM" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Die Casting" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Additive Manufacturing" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sort")).not.toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Equipment sections" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CNC Milling" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sheet Metal" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Manual Machines" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finishing" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "EDM" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Die Casting" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Additive Manufacturing" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5-axis" })).toBeInTheDocument();
    expect(screen.getByText("Hermle C650")).toBeInTheDocument();
    expect(screen.queryByText("Dazu MPS3015C 6000W")).not.toBeInTheDocument();
    expect(screen.queryByText("ZEISS ACCURA 9/16/8")).not.toBeInTheDocument();
    expect(screen.queryByText("SLA450 / SLA600 / SLA800 / SLA1400 / SLA9400 fleet")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sheet Metal" }));

    expect(screen.getByRole("button", { name: "CNC Milling" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Sheet Metal" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Sheet Metal" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "CNC Milling" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Laser cutting" })).toBeInTheDocument();
    expect(screen.getByText("Dazu MPS3015C 6000W")).toBeInTheDocument();
    expect(screen.queryByText("Hermle C650")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "CNC Milling" }));

    expect(screen.queryByRole("heading", { name: "Coverage notes" })).not.toBeInTheDocument();
    const jingdiaoCardElement = screen.getByRole("button", { name: "Hide Beijing Jingdiao JDGR200T details" }).closest("article");
    expect(jingdiaoCardElement).not.toBeNull();
    const jingdiaoCard = within(jingdiaoCardElement!);
    expect(jingdiaoCard.queryByText("Same-model image")).not.toBeInTheDocument();
    expect(jingdiaoCard.getByAltText("Same-model image: Beijing Jingdiao JDGR200T")).toBeInTheDocument();
    const shengyuCardElement = screen.getByRole("button", { name: "View Shandong Shengyu 850 details" }).closest("article");
    expect(shengyuCardElement).not.toBeNull();
    expect(within(shengyuCardElement!).queryByText("Photo pending verification")).not.toBeInTheDocument();
    expect(within(shengyuCardElement!).getByAltText("Photo pending verification: Shandong Shengyu 850")).toBeInTheDocument();
    expect(jingdiaoCard.getByText("Supplier-reported capability")).toBeInTheDocument();
    expect(jingdiaoCard.getByText("±0.005 mm")).toBeInTheDocument();
    expect(jingdiaoCard.getByText("Fine features, multi-face geometry, and small precision components.")).toBeInTheDocument();
    expect(jingdiaoCard.getByText("Small work envelope; orientation and fixturing require review.")).toBeInTheDocument();
    expect(jingdiaoCard.queryByText("Qualification note")).not.toBeInTheDocument();
    expect(screen.queryByText("Verified Machine")).not.toBeInTheDocument();
    expect(screen.queryByText("Source / Provenance")).not.toBeInTheDocument();
    expect(screen.queryByText("Zintilon")).not.toBeInTheDocument();
    expect(jingdiaoCard.getByRole("link", { name: "View technical data sheet" })).toHaveAttribute("href", "https://en.jingdiao.com/resource/JDGR/JDGR200T.pdf");
    fireEvent.click(within(shengyuCardElement!).getByRole("button", { name: "View Shandong Shengyu 850 details" }));
    expect(within(shengyuCardElement!).queryByRole("link", { name: "View online specifications" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Evaluate my part" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Need a process match?" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Start an RFQ" })).not.toBeInTheDocument();
  });

  it("labels every equipment photo with its verification state", () => {
    expect(vendorEquipment).toHaveLength(104);
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
  });

  it("only exposes online specifications when the source names the exact model", () => {
    render(<EquipmentPage />);

    const jdgr400CardElement = screen.getByRole("button", { name: "View Beijing Jingdiao JDGR400-A13S details" }).closest("article");
    expect(jdgr400CardElement).not.toBeNull();
    fireEvent.click(within(jdgr400CardElement!).getByRole("button", { name: "View Beijing Jingdiao JDGR400-A13S details" }));
    expect(within(jdgr400CardElement!).queryByRole("link", { name: "View online specifications" })).not.toBeInTheDocument();

    const jdct800CardElement = screen.getByRole("button", { name: "View Beijing Jingdiao JDCT800T details" }).closest("article");
    expect(jdct800CardElement).not.toBeNull();
    fireEvent.click(within(jdct800CardElement!).getByRole("button", { name: "View Beijing Jingdiao JDCT800T details" }));
    expect(within(jdct800CardElement!).getByRole("link", { name: "View online specifications" })).toHaveAttribute(
      "href",
      "https://en.jingdiao.com/machines/cnc-machining-centers/jdct-series/jdct800t-a15sh-jdct800th-a15sh",
    );
  });

  it("does not expose internal manufacturing partner names in customer guidance", () => {
    render(<EquipmentPage />);

    const jdgr400CardElement = screen.getByRole("button", { name: "View Beijing Jingdiao JDGR400-A13S details" }).closest("article");
    expect(jdgr400CardElement).not.toBeNull();
    fireEvent.click(within(jdgr400CardElement!).getByRole("button", { name: "View Beijing Jingdiao JDGR400-A13S details" }));

    expect(within(jdgr400CardElement!).getByText("Beijing Jingdiao 5-axis machining center available through the Lattice manufacturing network.")).toBeInTheDocument();
    expect(within(jdgr400CardElement!).queryByText(/Best Prototypes/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zintilon/i)).not.toBeInTheDocument();
  });

  it("filters equipment within each section", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });

    fireEvent.click(within(millingSection).getByRole("button", { name: "Large envelope" }));

    expect(within(millingSection).getByText("KMC KMC1250")).toBeInTheDocument();
    expect(within(millingSection).queryByText("Hermle C250")).not.toBeInTheDocument();
  });

  it("keeps equipment alphabetized by make and model", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });
    const displayedModels = within(millingSection)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent ?? "");

    expect(displayedModels).toEqual([...displayedModels].sort((a, b) => a.localeCompare(b)));
  });

  it("toggles machine details inside a compact equipment row", () => {
    render(<EquipmentPage />);

    const millingSection = screen.getByRole("region", { name: "CNC Milling" });

    expect(within(millingSection).getByText("Hermle C650")).toBeInTheDocument();

    fireEvent.click(within(millingSection).getByRole("button", { name: "View Hermle C650 details" }));

    const hermleCardElement = within(millingSection).getByRole("button", { name: "Hide Hermle C650 details" }).closest("article");
    expect(hermleCardElement).not.toBeNull();
    expect(within(hermleCardElement!).getByText("Supplier-reported capability")).toBeInTheDocument();
    expect(within(hermleCardElement!).getByRole("button", { name: "Hide Hermle C650 details" })).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(within(hermleCardElement!).getByRole("button", { name: "Hide Hermle C650 details" }));

    expect(within(millingSection).getByRole("button", { name: "View Hermle C650 details" })).toHaveAttribute("aria-expanded", "false");
  });
});
